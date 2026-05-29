import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from gruppi.models import Gruppo, Membro

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user1(db):
    return User.objects.create_user(email="user1@test.com", password="password123", nome="Mario", cognome="Rossi")

@pytest.fixture
def user2(db):
    return User.objects.create_user(email="user2@test.com", password="password123", nome="Luigi", cognome="Verdi")

@pytest.fixture
def gruppo_con_admin(db, user1):
    gruppo = Gruppo.objects.create(nome="Coinquilini Milano")
    Membro.objects.create(user=user1, gruppo=gruppo, ruolo="admin")
    return gruppo