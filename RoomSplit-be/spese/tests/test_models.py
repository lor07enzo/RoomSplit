from decimal import Decimal

import pytest
from spese.models import Categoria, GruppoSpesa, Spesa, ListaSpesa, Articolo, Rimborso
from gruppi.models import Membro

@pytest.mark.django_db
class TestSpeseModels:

    def test_creazione_categoria(self, categoria_spesa):
        assert str(categoria_spesa) == "Alimentari"
        assert categoria_spesa.colore == "#FF0000"

    def test_creazione_gruppo_spesa(self, user1, gruppo_test, categoria_spesa):
        spesa = GruppoSpesa.objects.create(
            nome="Spesa Esselunga",
            user=user1,
            gruppo=gruppo_test,
            pagatore=user1,
            categoria=categoria_spesa,
            importo=120.50
        )
        assert str(spesa) == "Spesa Esselunga"
        assert spesa.saldata is False
        assert spesa.is_ricorrente is False
        assert spesa.frequenza_tipo == "mesi"

    def test_creazione_spesa(self, user1, user2, gruppo_test):
        gruppo_spesa = GruppoSpesa.objects.create(
            nome="Bolletta Luce", user=user1, gruppo=gruppo_test, importo=100.00
        )
        quota_dovuta = Spesa.objects.create(
            gruppo_spesa=gruppo_spesa,
            debitore=user2,
            importo_dovuto=50.00
        )
        assert quota_dovuta.importo_dovuto == 50.00
        assert quota_dovuta.debitore == user2

    def test_creazione_lista_spesa_e_articolo(self, user1, gruppo_test):
        lista = ListaSpesa.objects.create(
            user=user1, gruppo=gruppo_test, titolo="Spesa di Natale"
        )
        assert str(lista) == "Spesa di Natale"

        articolo = Articolo.objects.create(
            lista_spesa=lista, inserito_da=user1, nome="Panettone"
        )
        assert str(articolo) == "Panettone"
        assert articolo.quantita == 1 
        assert articolo.preso_da is None

    def test_creazione_rimborso(self, user1, user2, gruppo_test):
        membro1 = Membro.objects.get(user=user1, gruppo=gruppo_test)
        membro2 = Membro.objects.get(user=user2, gruppo=gruppo_test)
        
        rimborso = Rimborso.objects.create(
            from_membro=membro2,
            to_membro=membro1,
            tipologia=Rimborso.MetodoPagamento.BONIFICO,
            importo=Decimal("35.00")
        )
        # Verifica la stringa formattata definita nel metodo __str__
        assert str(rimborso) == f"{membro2} rimborsa {membro1} di 35.00€ tramite Bonifico Bancario"