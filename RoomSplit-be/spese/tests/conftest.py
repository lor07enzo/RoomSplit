import pytest
from django.contrib.auth import get_user_model
from gruppi.models import Gruppo, Membro
from spese.models import Categoria

User = get_user_model()

@pytest.fixture
def user1(db):
    return User.objects.create_user(
        username="mario@test.com", email="mario@test.com", password="pwd", nome="Mario", cognome="Rossi"
    )

@pytest.fixture
def user2(db):
    return User.objects.create_user(
        username="luigi@test.com", email="luigi@test.com", password="pwd", nome="Luigi", cognome="Verdi"
    )

@pytest.fixture
def gruppo_test(db, user1, user2):
    gruppo = Gruppo.objects.create(nome="Casa Test")
    Membro.objects.create(user=user1, gruppo=gruppo, ruolo="admin")
    Membro.objects.create(user=user2, gruppo=gruppo, ruolo="membro")
    return gruppo

@pytest.fixture
def categoria_spesa(db):
    return Categoria.objects.create(nome="Alimentari", icona="icon-food", colore="#FF0000")