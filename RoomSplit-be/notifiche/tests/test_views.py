import pytest
from unittest.mock import patch
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from notifiche.models import ProfiloTelegram

User = get_user_model()

@pytest.mark.django_db
class TestTelegramWebhook:
    
    def setup_method(self):
        """Prepara i dati di base prima di ogni test"""
        self.client = APIClient()
        self.user = User.objects.create(email="test@roomsplit.com", nome="Mario")
        self.profilo = ProfiloTelegram.objects.create(
            user=self.user,
            connect_token="RS-123456"
        )
        self.webhook_url = reverse('telegram_webhook')

    @patch('notifiche.views.requests.post')
    def test_collegamento_telegram_successo(self, mock_post):
        """Testa se il webhook associa correttamente il chat_id quando riceve il token giusto"""
        
        # Simula il JSON che Telegram invierebbe a Ngrok
        payload_telegram = {
            "message": {
                "chat": {"id": 987654321},
                "text": "/start RS-123456"
            }
        }
        
        response = self.client.post(self.webhook_url, payload_telegram, format='json')
        
        assert response.status_code == 200
        self.profilo.refresh_from_db()
        assert self.profilo.chat_id == "987654321"
        assert self.profilo.connect_token is None
        # Verifica che il bot abbia inviato un messaggio di conferma
        assert mock_post.called

    @patch('notifiche.views.requests.post')
    def test_collegamento_telegram_token_errato(self, mock_post):
        """Testa il comportamento del webhook con un token inventato"""
        
        payload_telegram = {
            "message": {
                "chat": {"id": 987654321},
                "text": "/start RS-FALSO"
            }
        }
        
        response = self.client.post(self.webhook_url, payload_telegram, format='json')
        
        assert response.status_code == 200
        
        # Il database NON deve essersi aggiornato
        self.profilo.refresh_from_db()
        assert self.profilo.chat_id is None
        assert self.profilo.connect_token == "RS-123456"
        
        # Verifica che il bot abbia inviato il messaggio di errore all'utente
        assert mock_post.called
        args, kwargs = mock_post.call_args
        assert "non valido" in kwargs['json']['text']