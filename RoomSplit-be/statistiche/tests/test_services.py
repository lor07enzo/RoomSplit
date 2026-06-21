import pytest
import json
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.utils import timezone
from django.contrib.auth import get_user_model

from gruppi.models import Gruppo
from spese.models import Categoria, GruppoSpesa
from statistiche.services import get_historical_context, generate_ai_expense_forecast

User = get_user_model()

@pytest.fixture
def setup_dati_statistiche():
    """Crea un set di dati controllato per testare le aggregazioni storiche."""
    # 1. Popoliamo 'nome' e 'cognome' per evitare che le logiche di stringa (o del bot) falliscano
    user = User.objects.create(
        username="test_stat", 
        email="stat@roomsplit.com", 
        nome="Mario", 
        cognome="Rossi"
    )
    gruppo = Gruppo.objects.create(nome="Gruppo Statistiche")
    
    # 2. Aggiungiamo eventuali campi testuali obbligatori per le categorie
    cat_bollette = Categoria.objects.create(nome="Bollette", icona="💡", colore="#FFD700")
    cat_spesa = Categoria.objects.create(nome="Spesa Alimentare", icona="🛒", colore="#00FF00")
    
    oggi = timezone.now()
    
    # 3. Assegniamo SEMPRE pagatore=user per soddisfare i signal delle notifiche
    spesa_recente = GruppoSpesa.objects.create(
        nome="Luce", importo=50.00, user=user, pagatore=user, gruppo=gruppo, 
        categoria=cat_bollette, is_personale=False, is_ricorrente=False
    )
    
    GruppoSpesa.objects.create(
        nome="Gas", importo=20.00, user=user, pagatore=user, gruppo=gruppo, 
        categoria=cat_bollette, is_personale=False, is_ricorrente=False
    )
    
    GruppoSpesa.objects.create(
        nome="Videogioco", importo=60.00, user=user, pagatore=user, gruppo=gruppo, 
        categoria=cat_spesa, is_personale=True, is_ricorrente=False
    )
    
    spesa_vecchia = GruppoSpesa.objects.create(
        nome="Spesa Vecchia", importo=100.00, user=user, pagatore=user, gruppo=gruppo, 
        categoria=cat_spesa, is_personale=False, is_ricorrente=False
    )
    # Retrodatazione forzata della spesa vecchia
    GruppoSpesa.objects.filter(id=spesa_vecchia.id).update(created_at=oggi - timedelta(days=200))
    
    GruppoSpesa.objects.create(
        nome="Abbonamento Internet", importo=29.99, user=user, pagatore=user, gruppo=gruppo, 
        categoria=cat_bollette, is_personale=False, is_ricorrente=True,
        frequenza_numero=1, frequenza_tipo='mesi'
    )
    
    return {
        "gruppo": gruppo,
        "mese_corrente": oggi.strftime('%Y-%m')
    }

@pytest.mark.django_db
class TestStatisticheServices:

    def test_get_historical_context(self, setup_dati_statistiche):
        """Verifica che il contesto estragga i dati corretti, raggruppi le somme e filtri l'immondizia."""
        gruppo = setup_dati_statistiche["gruppo"]
        mese_corrente = setup_dati_statistiche["mese_corrente"]
        
        context = get_historical_context(gruppo.id)
        
        # --- VERIFICA STORICO ---
        history = context["history"]
        # Ci aspettiamo 1 solo record per 'Bollette' nel mese corrente (Luce 50 + Gas 20)
        assert len(history) == 1
        assert history[0]["category"] == "Bollette"
        assert history[0]["total"] == 70.00  # Somma calcolata correttamente
        assert history[0]["month"] == mese_corrente
        
        # --- VERIFICA RICORRENTI ---
        recurring = context["recurring_expenses"]
        assert len(recurring) == 1
        assert recurring[0]["name"] == "Abbonamento Internet"
        assert recurring[0]["amount"] == 29.99
        assert recurring[0]["frequency"] == "Ogni 1 mesi"

    @patch('statistiche.services.OpenAI')
    def test_generate_ai_expense_forecast(self, mock_openai_class, setup_dati_statistiche, settings):
        """Simula la chiamata API a OpenAI e verifica il parsing del JSON."""
        
        # Iniettiamo una chiave finta nei settings di Django per superare il controllo
        settings.OPENAI_API_KEY = "chiave-finta-di-test"
        
        gruppo = setup_dati_statistiche["gruppo"]
        
        # Configurazione del finto JSON in risposta da OpenAI
        finta_risposta_ai = {
            "forecast_month": "Luglio 2026",
            "total_estimated": 99.99,
            "categories": [
                {"category": "Bollette", "estimated_amount": 99.99, "confidence_level": "High"}
            ],
            "ai_insight": "Trend stabile."
        }
        
        # Addestramento del Mock
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.choices[0].message.content = json.dumps(finta_risposta_ai)
        mock_client.chat.completions.create.return_value = mock_response
        
        # Esecuzione reale del servizio
        risultato = generate_ai_expense_forecast(gruppo.id)
        
        # Asserzioni
        mock_client.chat.completions.create.assert_called_once()
        kwargs_chiamata = mock_client.chat.completions.create.call_args.kwargs
        assert kwargs_chiamata["model"] == "gpt-4o-mini"
        assert kwargs_chiamata["response_format"] == {"type": "json_object"}
        
        assert isinstance(risultato, dict)
        assert risultato["total_estimated"] == 99.99
        assert risultato["forecast_month"] == "Luglio 2026"