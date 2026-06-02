import pytest
from unittest.mock import patch
from users.serializers import User


@pytest.fixture
def user1(db):
    return User.objects.create_user(
        username="doc1@test.com", email="doc1@test.com", password="pwd", nome="Mario", cognome="Rossi"
    )

@pytest.fixture
def user2(db):
    return User.objects.create_user(
        username="doc2@test.com", email="doc2@test.com", password="pwd", nome="Luigi", cognome="Bianchi"
    )

# Questo fixture intercetta (mocka) la funzione di invio per TUTTI i test
@pytest.fixture(autouse=True)
def disabilita_notifiche_telegram():
    with patch('notifiche.services.send_telegram_notification') as mock_send:
        mock_send.return_value = True 
        yield mock_send