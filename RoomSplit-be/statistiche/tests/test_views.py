import pytest
from unittest.mock import patch  # <--- IMPORT AGGIUNTO
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from gruppi.models import Gruppo, Membro
from spese.models import Categoria, GruppoSpesa, Spesa
from decimal import Decimal

User = get_user_model()

# ==========================================
# FIXTURES E SETUP INIZIALE
# ==========================================

@pytest.fixture
def api_client():
    return APIClient()

# --- FIXTURE UTENTI AGGIUNTE ---
@pytest.fixture
def user1(db):
    return User.objects.create(username="mario_test", email="mario@roomsplit.com", nome="Mario")

@pytest.fixture
def user2(db):
    return User.objects.create(username="luigi_test", email="luigi@roomsplit.com", nome="Luigi")
# -------------------------------

@pytest.fixture
def gruppo_casa(db, user1, user2):
    gruppo = Gruppo.objects.create(nome="Appartamento Studenti")
    Membro.objects.create(user=user1, gruppo=gruppo, ruolo="admin")
    Membro.objects.create(user=user2, gruppo=gruppo, ruolo="membro")
    return gruppo

@pytest.fixture
def categoria_utenze(db):
    cat, _ = Categoria.objects.get_or_create(nome="Utenze", defaults={"icona": "🔌", "colore": "#FF9800"})
    return cat

@pytest.fixture
def categoria_spesa_alimentare(db):
    cat, _ = Categoria.objects.get_or_create(nome="Spesa alimentare", defaults={"icona": "🛒", "colore": "#4CAF50"})
    return cat

@pytest.fixture
def popola_spese(db, user1, user2, gruppo_casa, categoria_utenze, categoria_spesa_alimentare):
    """
    Popola il database con dati noti per testare la matematica delle statistiche.
    Tutte le spese avranno come data il mese/anno corrente (auto_now_add).
    """
    # Spesa di Gruppo: Luce 100€ (Pagata da Mario, Divisa a metà)
    spesa_luce = GruppoSpesa.objects.create(
        nome="Bolletta Luce", user=user1, pagatore=user1, gruppo=gruppo_casa, 
        categoria=categoria_utenze, importo=Decimal("100.00"), is_personale=False
    )
    Spesa.objects.create(gruppo_spesa=spesa_luce, debitore=user1, importo_dovuto=Decimal("50.00"))
    Spesa.objects.create(gruppo_spesa=spesa_luce, debitore=user2, importo_dovuto=Decimal("50.00"))

    # Spesa di Gruppo: Spesa Coop 50€ (Pagata da Luigi, Divisa a metà)
    spesa_coop = GruppoSpesa.objects.create(
        nome="Spesa Coop", user=user2, pagatore=user2, gruppo=gruppo_casa, 
        categoria=categoria_spesa_alimentare, importo=Decimal("50.00"), is_personale=False
    )
    Spesa.objects.create(gruppo_spesa=spesa_coop, debitore=user1, importo_dovuto=Decimal("25.00"))
    Spesa.objects.create(gruppo_spesa=spesa_coop, debitore=user2, importo_dovuto=Decimal("25.00"))

    # Spesa Personale di Mario: 30€
    GruppoSpesa.objects.create(
        nome="Abbonamento Palestra", user=user1, pagatore=user1, 
        importo=Decimal("30.00"), is_personale=True
    )


# ==========================================
# TEST DELLE API (VIEWS)
# ==========================================

@pytest.mark.django_db
class TestStatisticheAPI:

    def test_statistiche_mensili_successo(self, api_client, user1, gruppo_casa, popola_spese):
        api_client.force_authenticate(user=user1)
        url = reverse('stats-gruppo-mensili')
        
        response = api_client.get(url, {"gruppo_id": str(gruppo_casa.id)})
        
        assert response.status_code == 200
        # Totale del gruppo nel mese: 100 (Luce) + 50 (Coop) = 150
        assert response.data["totale_speso"] == 150.00
        
        # Spesa maggiore deve essere la Luce (100€)
        assert response.data["spesa_maggiore"]["importo"] == 100.00
        assert "Mario" in response.data["spesa_maggiore"]["pagatore"]
        
        # Verifica raggruppamento categorie
        categorie = response.data["spese_per_categoria"]
        assert len(categorie) == 2
        # La query ordina per '-totale_speso', quindi 'Utenze' (100€) deve essere la prima
        assert categorie[0]["nome_categoria"] == "Utenze"
        assert categorie[0]["totale_speso"] == 100.00

    def test_statistiche_mensili_senza_gruppo(self, api_client, user1, gruppo_casa):
        api_client.force_authenticate(user=user1)
        url = reverse('stats-gruppo-mensili')
        
        response = api_client.get(url)
        
        # Ora ci aspettiamo 200, perché la view raggruppa tutti i gruppi
        assert response.status_code == 200
        assert "totale_speso" in response.data

    def test_statistiche_annuali_formattazione(self, api_client, user1, gruppo_casa, popola_spese):
        api_client.force_authenticate(user=user1)
        url = reverse('stats-gruppo-annuali')
        
        response = api_client.get(url, {"gruppo_id": str(gruppo_casa.id)})
        
        assert response.status_code == 200
        assert response.data["totale_anno"] == 150.00
        
        # Verifica che il dizionario mesi abbia esattamente 12 elementi (Gen-Dic)
        andamento = response.data["andamento_mensile"]
        assert len(andamento) == 12
        assert andamento[0]["mese"] == 1
        assert andamento[11]["mese"] == 12

    def test_statistiche_annuali_uuid_invalido(self, api_client, user1):
        api_client.force_authenticate(user=user1)
        url = reverse('stats-gruppo-annuali')
        
        response = api_client.get(url, {"gruppo_id": "testo-non-valido-come-uuid"})
        assert response.status_code == 400
        assert response.data["errore"] == "gruppo_id non è un UUID valido"

    def test_statistiche_personali(self, api_client, user1, popola_spese):
        """
        Mario ha 30€ di spesa privata e 75€ di quote dovute dal gruppo. 
        Il totale uscite deve essere 105€.
        """
        api_client.force_authenticate(user=user1)
        url = reverse('stats-personali')
        
        response = api_client.get(url)
        assert response.status_code == 200
        
        assert response.data["spese_private_pure"] == 30.00
        assert response.data["tua_parte_spese_gruppo"] == 75.00
        assert response.data["totale_uscita_mensile"] == 105.00

# ==========================================
# TEST PREVISIONI AI
# ==========================================

@pytest.mark.django_db  # <--- INDENTAZIONE CORRETTA
class TestExpenseForecastAPIView:
    
    def setup_method(self):
        self.client = APIClient()
        self.user_loggato = User.objects.create(
            username="mario_stat", 
            email="mario@roomsplit.com", 
            nome="Mario"
        )
        self.gruppo = Gruppo.objects.create(nome="Casa Previsioni")
        
        # Autenticazione del client per superare IsAuthenticated (se presente)
        self.client.force_authenticate(user=self.user_loggato)
        
        # assegnato a questa rotta nel tuo file urls.py delle statistiche
        self.url = reverse('ai-expense-forecast', args=[self.gruppo.id])

    # 1. TEST RAMO DI SUCCESSO (200 OK)
    @patch('statistiche.views.generate_ai_expense_forecast')
    def test_forecast_view_successo(self, mock_generate_forecast):
        """L'AI risponde correttamente e il Serializer valida i dati."""
        
        # Simuliamo un payload perfettamente compatibile col tuo Serializer
        mock_generate_forecast.return_value = {
            "forecast_month": "Agosto 2026",
            "total_estimated": 250.50,
            "categories": [
                {"category": "Bollette", "estimated_amount": 100.00, "confidence_level": "High"}
            ],
            "ai_insight": "Spese sotto controllo."
        }
        
        response = self.client.get(self.url)
        
        assert response.status_code == 200
        assert response.data["forecast_month"] == "Agosto 2026"
        assert response.data["total_estimated"] == 250.50

    # 2. TEST RAMO BAD GATEWAY (502 BAD GATEWAY)
    @patch('statistiche.views.generate_ai_expense_forecast')
    def test_forecast_view_dati_invalidi(self, mock_generate_forecast):
        """L'AI "allucina" e restituisce un JSON mancante di campi obbligatori."""
        
        # Simuliamo un payload incompleto (mancano total_estimated e categories)
        mock_generate_forecast.return_value = {
            "forecast_month": "Agosto 2026",
            "ai_insight": "Testo a caso."
        }
        
        response = self.client.get(self.url)
        
        assert response.status_code == 502
        assert "L'AI ha generato dati non conformi" in response.data["error"]
        # Verifica che il serializer abbia tracciato l'assenza del campo richiesto
        assert "details" in response.data

    # 3. TEST RAMO ECCEZIONE GENERICA (500 INTERNAL SERVER ERROR)
    @patch('statistiche.views.generate_ai_expense_forecast')
    def test_forecast_view_eccezione_interna(self, mock_generate_forecast):
        """Si verifica un'eccezione imprevista (es. OpenAI down, timeout, ecc.)."""
        
        # Forziamo il mock a lanciare un'eccezione Python reale
        mock_generate_forecast.side_effect = Exception("Connessione a OpenAI fallita per timeout.")
        
        response = self.client.get(self.url)
        
        assert response.status_code == 500
        assert "Errore durante la generazione del report predittivo" in response.data["error"]
        assert "Connessione a OpenAI fallita" in response.data["error"]