import requests
from django.conf import settings
from notifiche.services import send_telegram_notification


class MockProfiloTelegram:
    def __init__(self, chat_id):
        self.chat_id = chat_id
        self.saved = False

    def save(self):
        self.saved = True

class MockUser:
    def __init__(self, email, ha_profilo=True, chat_id="123456789"):
        self.email = email
        if ha_profilo:
            self.profilo_telegram = MockProfiloTelegram(chat_id)

# TEST: Utente senza relazione profilo_telegram
def test_send_telegram_notification_no_profile():
    user = MockUser(email="test@example.com", ha_profilo=False)
    result = send_telegram_notification(user, "Ciao")
    assert result is False

# TEST: Utente con profilo ma senza chat_id
def test_send_telegram_notification_no_chat_id():
    user = MockUser(email="test@example.com", ha_profilo=True, chat_id=None)
    result = send_telegram_notification(user, "Ciao")
    assert result is False

# TEST: Token di Telegram mancante nei settings di Django
def test_send_telegram_notification_missing_token(mocker):
    user = MockUser(email="test@example.com")
    
    mocker.patch.object(settings, 'TELEGRAM_BOT_TOKEN', None, create=True)
    
    result = send_telegram_notification(user, "Ciao")
    assert result is False

# TEST: Invio riuscito (Stato 200)
def test_send_telegram_notification_success(mocker):
    user = MockUser(email="test@example.com")
    mocker.patch.object(settings, 'TELEGRAM_BOT_TOKEN', 'finto_token', create=True)
    
    mock_post = mocker.patch('notifiche.services.requests.post')
    mock_response = mocker.Mock()
    mock_response.raise_for_status.return_value = None
    mock_post.return_value = mock_response

    result = send_telegram_notification(user, "Messaggio di prova")
    
    assert result is True
    mock_post.assert_called_once()

# TEST: Errore 403 (L'utente ha bloccato il bot - Rimozione del chat_id)
def test_send_telegram_notification_error_403(mocker):
    user = MockUser(email="blocked@example.com")
    mocker.patch.object(settings, 'TELEGRAM_BOT_TOKEN', 'finto_token', create=True)
    
    mock_post = mocker.patch('notifiche.services.requests.post')
    mock_response = mocker.Mock()
    mock_response.status_code = 403
    
    mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)
    mock_post.return_value = mock_response

    result = send_telegram_notification(user, "Messaggio")

    assert result is False
    assert user.profilo_telegram.chat_id is None
    assert user.profilo_telegram.saved is True

# TEST: Errore HTTP generico
def test_send_telegram_notification_generic_http_error(mocker):
    user = MockUser(email="error@example.com", chat_id="999999")
    mocker.patch.object(settings, 'TELEGRAM_BOT_TOKEN', 'finto_token', create=True)
    
    mock_post = mocker.patch('notifiche.services.requests.post')
    mock_response = mocker.Mock()
    mock_response.status_code = 500
    mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)
    mock_post.return_value = mock_response

    result = send_telegram_notification(user, "Messaggio")

    assert result is False
    # Il chat_id deve rimanere intatto perché non è un errore 403
    assert user.profilo_telegram.chat_id == "999999"
    assert user.profilo_telegram.saved is False