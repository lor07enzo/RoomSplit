import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from gruppi.models import Gruppo, Membro

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user1(db):
    # Assegniamo esplicitamente lo username uguale all'email per soddisfare il vincolo
    return User.objects.create_user(
        username="user1@test.com",
        email="user1@test.com",
        password="password123",
        nome="Mario",
        cognome="Rossi"
    )

@pytest.fixture
def user2(db):
    return User.objects.create_user(
        username="user2@test.com",
        email="user2@test.com",
        password="password123",
        nome="Luigi",
        cognome="Verdi"
    )

@pytest.fixture
def gruppo_con_admin(db, user1):
    gruppo = Gruppo.objects.create(nome="Coinquilini Milano")
    Membro.objects.create(user=user1, gruppo=gruppo, ruolo="admin")
    return gruppo