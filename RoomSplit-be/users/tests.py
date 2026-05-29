import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()

# --- FIXTURES ---
# Le fixtures preparano l'ambiente prima dei test e vengono "iniettate" nelle funzioni

@pytest.fixture
def api_client():
    """Restituisce il client di test del Django Rest Framework"""
    return APIClient()

@pytest.fixture
def user_data():
    """Restituisce i dati base per la registrazione e creazione utente"""
    return {
        "username": "mario.rossi@example.com",
        "email": "mario.rossi@example.com",
        "password": "PasswordSicura123!",
        "nome": "Mario",
        "cognome": "Rossi"
    }

@pytest.fixture
def temp_media(settings, tmp_path):
    """Sovrascrive MEDIA_ROOT per usare una cartella temporanea creata da pytest"""
    settings.MEDIA_ROOT = tmp_path
    settings.DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
    return tmp_path


# --- TEST DEL MODELLO ---

@pytest.mark.django_db
def test_user_creation_and_str(user_data):
    """Testa la corretta creazione dell'utente e la rappresentazione in stringa"""
    user = User.objects.create_user(**user_data)
    
    # Con pytest si usa il comando base 'assert' di Python, molto più pulito
    assert user.email == "mario.rossi@example.com"
    assert user.nome == "Mario"
    assert user.cognome == "Rossi"
    assert user.check_password("PasswordSicura123!")
    
    expected_str = "Mario Rossi (mario.rossi@example.com)"
    assert str(user) == expected_str


# --- TEST DELLA REGISTRAZIONE ---

@pytest.mark.django_db
def test_user_registration_generates_avatar(api_client, user_data, temp_media, mocker):
    """Testa la registrazione e simula la generazione dell'avatar"""
    
    mock_requests_get = mocker.patch('users.serializers.requests.get')
    
    # Byte reali di un minuscolo file PNG 1x1 pixel valido
    tiny_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    # Prepariamo la finta risposta HTTP
    mock_response = mocker.Mock()
    mock_response.status_code = 200
    mock_response.content = tiny_png
    mock_requests_get.return_value = mock_response

    response = api_client.post('/api/v1/auth/register/', user_data)

    assert response.status_code == status.HTTP_201_CREATED
    
    user = User.objects.get(email=user_data['email'])
    assert user is not None
    
    # Verifichiamo che la funzione sia stata chiamata
    mock_requests_get.assert_called_once()
    
    # Verifichiamo che l'avatar sia stato salvato nel file system temporaneo
    assert bool(user.avatar) is True
    assert bool(user.avatar.name) is True


@pytest.mark.django_db
def test_user_registration_avatar_failure_does_not_block(api_client, mocker):
    """Testa che se l'API esterna è down, l'app non si blocchi"""
    
    mock_requests_get = mocker.patch('users.serializers.requests.get')
    mock_requests_get.side_effect = Exception("Connessione persa")

    data = {
        "username": "luigi.verdi@example.com",
        "email": "luigi.verdi@example.com",
        "password": "Password456!",
        "nome": "Luigi",
        "cognome": "Verdi"
    }

    response = api_client.post('/api/v1/auth/register/', data)

    assert response.status_code == status.HTTP_201_CREATED
    
    user = User.objects.get(email="luigi.verdi@example.com")
    assert bool(user.avatar) is False


# --- TEST DEL RECUPERO PROFILO ---

@pytest.mark.django_db
def test_get_user_profile_authenticated(api_client, user_data):
    """Testa che un utente autenticato possa recuperare i propri dati"""
    user = User.objects.create_user(**user_data)
    
    api_client.force_authenticate(user=user)
    response = api_client.get('/api/v1/auth/user/')
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data['email'] == user.email
    assert response.data['nome'] == user.nome
    assert response.data['cognome'] == user.cognome
    assert 'avatar' in response.data


@pytest.mark.django_db
def test_get_user_profile_unauthenticated(api_client):
    """Testa che un utente non autenticato riceva un errore 401"""
    response = api_client.get('/api/v1/auth/user/')
    assert response.status_code == status.HTTP_401_UNAUTHORIZED