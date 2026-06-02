import pytest
from django.contrib.auth import get_user_model
from gruppi.models import Gruppo, Membro
from spese.models import Categoria

User = get_user_model()

@pytest.fixture
def gruppo_test(db, user1, user2):
    gruppo = Gruppo.objects.create(nome="Casa Test")
    Membro.objects.create(user=user1, gruppo=gruppo, ruolo="admin")
    Membro.objects.create(user=user2, gruppo=gruppo, ruolo="membro")
    return gruppo

@pytest.fixture
def categoria_spesa(db):
    return Categoria.objects.create(nome="Alimentari", icona="icon-food", colore="#FF0000")