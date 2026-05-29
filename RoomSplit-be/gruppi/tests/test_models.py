import pytest

from gruppi.models import Gruppo, Membro


@pytest.mark.django_db
class TestGruppiModels:
    
    def test_creazione_gruppo(self):
        gruppo = Gruppo.objects.create(nome="Casa Vacanze")
        assert gruppo.nome == "Casa Vacanze"
        assert len(gruppo.codice_invito) == 6
        assert str(gruppo) == "Casa Vacanze"

    def test_creazione_membro(self, user1, gruppo_con_admin):
        membro = Membro.objects.get(user=user1, gruppo=gruppo_con_admin)
        assert membro.ruolo == "admin"
        assert str(membro) == f"{user1.nome} - {gruppo_con_admin.nome} (Amministratore)"
        
    def test_codice_invito_univoco(self):
        gruppo1 = Gruppo.objects.create(nome="Gruppo 1")
        gruppo2 = Gruppo.objects.create(nome="Gruppo 2")
        assert gruppo1.codice_invito != gruppo2.codice_invito