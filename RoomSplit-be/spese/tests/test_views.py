from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from gruppi.models import Gruppo, Membro
from spese.models import Categoria, GruppoSpesa, Spesa, ListaSpesa, Articolo, Rimborso
from documenti.models import Documento

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

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
def user3(db):
    return User.objects.create_user(
        username="anna@test.com", email="anna@test.com", password="pwd", nome="Anna", cognome="Neri"
    )

@pytest.fixture
def gruppo_test(db, user1, user2, user3):
    gruppo = Gruppo.objects.create(nome="Appartamento 10")
    Membro.objects.create(user=user1, gruppo=gruppo, ruolo="admin")
    Membro.objects.create(user=user2, gruppo=gruppo, ruolo="membro")
    Membro.objects.create(user=user3, gruppo=gruppo, ruolo="membro")
    return gruppo

@pytest.fixture
def categoria_utenze(db):
    cat, _ = Categoria.objects.get_or_create(
        nome="Utenze", 
        defaults={"icona": "🔌", "colore": "#FF9800"}
    )
    return cat

@pytest.fixture
def documento_mock(db, user1):
    return Documento.objects.create(
        caricato_da=user1,
        nome_file="bolletta.pdf",
        file="bollette/bolletta.pdf",
        tipo_file="application/pdf",
        status_ocr=Documento.StatoOCR.IN_ATTESA
    )


@pytest.mark.django_db
class TestSpeseAPI:

    def test_creazione_spesa_personale(self, api_client, user1, categoria_utenze):
        api_client.force_authenticate(user=user1)
        url = reverse('gruppospesa-list')
        
        payload = {
            "nome": "Spesa Personale Amazon",
            "importo": "25.90",
            "categoria": categoria_utenze.nome,
            "is_personale": True
        }
        
        response = api_client.post(url, payload, format='json')
        assert response.status_code == 201, response.data
        assert response.data["nome"] == "Spesa Personale Amazon"

    def test_creazione_spesa_di_gruppo_con_divisione_e_resto(self, api_client, user1, user2, user3, gruppo_test, categoria_utenze):
        api_client.force_authenticate(user=user1)
        url = reverse('gruppospesa-list')
        
        payload = {
            "nome": "Cena di Casa",
            "importo": "10.00",
            "categoria": categoria_utenze.nome,
            "gruppo": str(gruppo_test.id),
            "is_personale": False,
            "debitori": [str(user1.id), str(user2.id), str(user3.id)]
        }
        
        response = api_client.post(url, payload, format='json')
        assert response.status_code == 201, response.data
        
        gruppo_spesa_id = response.data["id"]
        quote = Spesa.objects.filter(gruppo_spesa_id=gruppo_spesa_id)
        
        assert quote.count() == 3
        assert quote[0].importo_dovuto == Decimal("3.33")
        assert quote[1].importo_dovuto == Decimal("3.33")
        assert quote[2].importo_dovuto == Decimal("3.34")

    def test_creazione_spesa_con_associazione_documento_successo(self, api_client, user1, documento_mock, categoria_utenze):
        api_client.force_authenticate(user=user1)
        url = reverse('gruppospesa-list')
        
        payload = {
            "nome": "Bolletta Luce",
            "importo": "85.00",
            "categoria": categoria_utenze.nome,
            "is_personale": True,
            "documento_id": str(documento_mock.id)
        }
        
        response = api_client.post(url, payload, format='json')
        assert response.status_code == 201, response.data
        
        documento_mock.refresh_from_db()
        assert str(documento_mock.gruppo_spesa_id) == response.data["id"]
        assert documento_mock.status_ocr == Documento.StatoOCR.COMPLETATO

    def test_creazione_spesa_con_documento_gia_associato_errore(self, api_client, user1, documento_mock, categoria_utenze):
        api_client.force_authenticate(user=user1)
        
        spesa_esistente = GruppoSpesa.objects.create(nome="Spesa Vecchia", user=user1, importo=50.00)
        documento_mock.gruppo_spesa = spesa_esistente
        documento_mock.save()
        
        url = reverse('gruppospesa-list')
        payload = {
            "nome": "Nuova Spesa Duplicata",
            "importo": "30.00",
            "categoria": categoria_utenze.nome,
            "is_personale": True,
            "documento_id": str(documento_mock.id)
        }
        
        response = api_client.post(url, payload, format='json')
        assert response.status_code == 400
        assert response.data["errore"] == "Questo documento è già stato associato a un'altra spesa."

    def test_svuota_articoli_presi_azione(self, api_client, user1, gruppo_test):
        api_client.force_authenticate(user=user1)
        
        lista = ListaSpesa.objects.create(user=user1, gruppo=gruppo_test, titolo="Spesa Settimanale")
        articolo_libero = Articolo.objects.create(lista_spesa=lista, inserito_da=user1, nome="Pane")
        articolo_preso = Articolo.objects.create(lista_spesa=lista, inserito_da=user1, preso_da=user1, nome="Acqua")
        
        url = reverse('listaspesa-svuota-presi', kwargs={'pk': lista.id})
        response = api_client.post(url, format='json')
        
        assert response.status_code == 200
        assert Articolo.objects.filter(lista_spesa=lista).count() == 1
        assert Articolo.objects.filter(id=articolo_libero.id).exists()
        assert not Articolo.objects.filter(id=articolo_preso.id).exists()

    def test_articolo_toggle_check_completato(self, api_client, user1, gruppo_test):
        api_client.force_authenticate(user=user1)
        lista = ListaSpesa.objects.create(user=user1, gruppo=gruppo_test, titolo="Lista")
        articolo = Articolo.objects.create(lista_spesa=lista, inserito_da=user1, nome="Latte")
        
        url = reverse('articolo-toggle-check', kwargs={'pk': articolo.id})
        
        response = api_client.post(url, {"segna_come_preso": True}, format='json')
        assert response.status_code == 200
        assert response.data["preso_da"]["id"] == str(user1.id)  # L'ID sarà una stringa
        
        response = api_client.post(url, {"segna_come_preso": False}, format='json')
        assert response.status_code == 200
        assert response.data["preso_da"] is None

    def test_categorie_lista_sola_lettura(self, api_client, user1, categoria_utenze):
        api_client.force_authenticate(user=user1)
        url = reverse('categoria-list')
        
        response = api_client.get(url)
        assert response.status_code == 200
        assert len(response.data) >= 1
        
        response = api_client.post(url, {"nome": "Nuova Categoria Forzata"}, format='json')
        assert response.status_code == 405