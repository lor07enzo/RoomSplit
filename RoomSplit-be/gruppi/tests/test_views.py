from django.urls import reverse
import pytest

from gruppi.models import Gruppo, Membro


@pytest.mark.django_db
class TestGruppiAPI:

    def test_creazione_gruppo_api(self, api_client, user1):
        api_client.force_authenticate(user=user1)
        url = reverse('gruppo-list') 
        response = api_client.post(url, {"nome": "Nuovo Gruppo API"})
        
        assert response.status_code == 201
        assert response.data["nome"] == "Nuovo Gruppo API"
        assert response.data["mio_ruolo"] == "admin"
        
        gruppo_id = response.data["id"]
        membro = Membro.objects.get(gruppo_id=gruppo_id, user=user1)
        assert membro.ruolo == "admin"

    def test_get_queryset_solo_miei_gruppi(self, api_client, user1, user2, gruppo_con_admin):
        gruppo_user2 = Gruppo.objects.create(nome="Gruppo Solo User 2")
        Membro.objects.create(user=user2, gruppo=gruppo_user2, ruolo="admin")

        api_client.force_authenticate(user=user1)
        url = reverse('gruppo-list')
        response = api_client.get(url)
        
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == str(gruppo_con_admin.id)

    def test_ottieni_membri(self, api_client, user1, user2, gruppo_con_admin):
        Membro.objects.create(user=user2, gruppo=gruppo_con_admin, ruolo="membro")
        
        api_client.force_authenticate(user=user1)
        # Risolve l'azione di dettaglio 'ottieni_membri'
        url = reverse('gruppo-ottieni-membri', kwargs={'pk': gruppo_con_admin.id})
        response = api_client.get(url)
        
        assert response.status_code == 200
        assert len(response.data) == 2
        ruoli = [m["ruolo"] for m in response.data]
        assert "admin" in ruoli
        assert "membro" in ruoli

    def test_join_group_successo(self, api_client, user2, gruppo_con_admin):
        api_client.force_authenticate(user=user2)
        # Risolve l'azione globale 'join_group'
        url = reverse('gruppo-join-group')
        response = api_client.post(url, {
            "codice_invito": gruppo_con_admin.codice_invito
        })

    def test_join_group_codice_invalido(self, api_client, user2):
        api_client.force_authenticate(user=user2)
        url = reverse('gruppo-join-group')
        response = api_client.post(url, {
            "codice_invito": "FALSO1"
        })
        
        assert response.status_code == 404
        assert response.data["errore"] == "Codice invito non valido."

    def test_join_group_gia_membro(self, api_client, user1, gruppo_con_admin):
        api_client.force_authenticate(user=user1)
        url = reverse('gruppo-join-group')
        response = api_client.post(url, {
            "codice_invito": gruppo_con_admin.codice_invito
        })
        
        assert response.status_code == 400
        assert response.data["errore"] == "Sei già membro di questo gruppo."

    def test_remove_member_da_admin(self, api_client, user1, user2, gruppo_con_admin):
        Membro.objects.create(user=user2, gruppo=gruppo_con_admin, ruolo="membro")
        api_client.force_authenticate(user=user1)
        
        url = reverse('gruppo-remove-member', kwargs={'pk': gruppo_con_admin.id})
        response = api_client.post(url, {
            "user_id": str(user2.id)
        })
        
        assert response.status_code == 200
        assert not Membro.objects.filter(user=user2, gruppo=gruppo_con_admin).exists()

    def test_remove_member_da_non_admin_errore(self, api_client, user1, user2, gruppo_con_admin):
        Membro.objects.create(user=user2, gruppo=gruppo_con_admin, ruolo="membro")
        api_client.force_authenticate(user=user2)
        
        url = reverse('gruppo-remove-member', kwargs={'pk': gruppo_con_admin.id})
        response = api_client.post(url, {
            "user_id": str(user1.id)
        })
        
        assert response.status_code == 403
        assert response.data["errore"] == "Solo l'amministratore può rimuovere altri membri."

    def test_remove_member_self_removal(self, api_client, user2, gruppo_con_admin):
        Membro.objects.create(user=user2, gruppo=gruppo_con_admin, ruolo="membro")
        api_client.force_authenticate(user=user2)
        
        url = reverse('gruppo-remove-member', kwargs={'pk': gruppo_con_admin.id})
        response = api_client.post(url, {
            "user_id": str(user2.id)
        })
        
        assert response.status_code == 200
        assert not Membro.objects.filter(user=user2, gruppo=gruppo_con_admin).exists()