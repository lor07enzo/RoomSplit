import pytest
import datetime
from io import StringIO
from dateutil.relativedelta import relativedelta
from unittest.mock import patch, MagicMock

from django.core.management import call_command
from django.utils import timezone
from django.utils.timezone import make_aware
from django.contrib.auth import get_user_model

# Importa il tuo modello
from spese.models import GruppoSpesa

# Otteniamo il modello User corretto (utile se usi un Custom User Model)
User = get_user_model()

# --- FIXTURE ---
@pytest.fixture
def test_user():
    """Crea e restituisce un utente di test nel database isolato di pytest."""
    return User.objects.create_user(username='test_user_spese', password='password123')

@pytest.mark.django_db
class TestGeneraSpeseCommand:
    
    def test_nessuna_spesa_ricorrente(self):
        """Testa il caso in cui non ci sono spese o nessuna è ricorrente."""
        out = StringIO()
        call_command('genera_spese', stdout=out)
        assert 'Nessuna spesa ricorrente da generare oggi.' in out.getvalue()

    # Inseriamo 'test_user' come argomento per utilizzare la fixture
    def test_spesa_non_scaduta(self, test_user):
        """Testa che una spesa con scadenza futura non venga clonata."""
        futuro = timezone.now() + datetime.timedelta(days=10)
        spesa = GruppoSpesa.objects.create(
            user=test_user,  # <--- Risolve l'IntegrityError su user_id
            nome="Spesa Futura",
            is_ricorrente=True,
            frequenza_numero=1,
            frequenza_tipo='mesi',
            prossimo_pagamento=futuro,
            importo=10.00
        )
        
        out = StringIO()
        call_command('genera_spese', stdout=out)
        
        assert 'Nessuna spesa ricorrente da generare oggi.' in out.getvalue()
        spesa.refresh_from_db()
        assert spesa.is_ricorrente is True

    def test_inizializzazione_prossimo_pagamento(self, test_user):
        """Testa il blocco 'INIZIALIZZAZIONE SE ASSENTE'."""
        spesa = GruppoSpesa.objects.create(
            user=test_user,  # <--- Assegnazione utente
            nome="Spesa Senza Data",
            is_ricorrente=True,
            frequenza_numero=2,
            frequenza_tipo='settimane',
            prossimo_pagamento=None,
            importo=10.00
        )
        
        out = StringIO()
        call_command('genera_spese', stdout=out)
        
        spesa.refresh_from_db()
        assert spesa.prossimo_pagamento is not None
        assert spesa.is_ricorrente is True
        
    @patch('spese.management.commands.genera_spese.GruppoSpesa.objects.filter')
    def test_frequenza_numero_value_error(self, mock_filter):
        """Testa il blocco try-except con ValueError usando un Mock per aggirare l'ORM."""
        mock_spesa = MagicMock()
        mock_spesa.nome = "Spesa Errore Numero"
        mock_spesa.is_ricorrente = True
        mock_spesa.prossimo_pagamento = timezone.now().date() - datetime.timedelta(days=1)
        mock_spesa.frequenza_numero = "test_non_valido" 
        mock_spesa.frequenza_tipo = 'giorni'
        mock_spesa.created_at = timezone.now()
        
        mock_filter.return_value = [mock_spesa]
        
        out = StringIO()
        call_command('genera_spese', stdout=out)
        
        assert mock_spesa.save.called
        assert "Totale spese generate: 1" in out.getvalue()

    def test_frequenza_tipo_non_supportato(self, test_user):
        """Testa il ramo 'else: continue' se il tipo di frequenza è invalido."""
        ieri = timezone.now() - datetime.timedelta(days=1)
        GruppoSpesa.objects.create(
            user=test_user,  # <--- Assegnazione utente
            nome="Spesa Tipo Invalido",
            is_ricorrente=True,
            frequenza_numero=1,
            frequenza_tipo='secoli',
            prossimo_pagamento=ieri,
            importo=10.00
        )
        
        out = StringIO()
        call_command('genera_spese', stdout=out)
        
        assert 'Nessuna spesa ricorrente da generare oggi.' in out.getvalue()
        assert GruppoSpesa.objects.count() == 1

    @pytest.mark.parametrize("tipo, delta_kwargs", [
        ('giorni', {'days': 3}),
        ('settimane', {'weeks': 3}),
        ('mesi', {'months': 3}),
        ('anni', {'years': 3}),
    ])
    @patch('spese.management.commands.genera_spese.timezone.now')
    def test_clonazione_scadenza_per_tipi(self, mock_now, tipo, delta_kwargs, test_user):
        """Testa il processo completo di clonazione per tutti i tipi di frequenza."""
        fake_oggi = make_aware(datetime.datetime(2024, 1, 15, 12, 0, 0))
        mock_now.return_value = fake_oggi
        
        data_scadenza = make_aware(datetime.datetime(2024, 1, 10, 0, 0, 0))
        
        spesa_originale = GruppoSpesa.objects.create(
            user=test_user,  # <--- Assegnazione utente
            nome=f"Spesa {tipo}",
            is_ricorrente=True,
            frequenza_numero=3,
            frequenza_tipo=tipo,
            prossimo_pagamento=data_scadenza,
            importo=10.00
        )
        
        out = StringIO()
        call_command('genera_spese', stdout=out)
        
        spesa_originale.refresh_from_db()
        assert spesa_originale.is_ricorrente is False
        assert spesa_originale.prossimo_pagamento is None
        
        assert GruppoSpesa.objects.count() == 2
        clone = GruppoSpesa.objects.exclude(id=spesa_originale.id).first()
        
        assert clone.is_ricorrente is True
        
        nuova_data_attesa = data_scadenza.date() + relativedelta(**delta_kwargs)
        oggi_fittizio = fake_oggi.date()
        
        while nuova_data_attesa <= oggi_fittizio:
            nuova_data_attesa += relativedelta(**delta_kwargs)
            
        data_clone_locale = timezone.localtime(clone.prossimo_pagamento).date()
        assert data_clone_locale == nuova_data_attesa