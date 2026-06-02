import pytest
from spese.serializers import (
    CategoriaSerializer, 
    GruppoSpesaSerializer, 
    ArticoloSerializer, 
    ListaSpesaSerializer
)
from spese.models import ListaSpesa

@pytest.mark.django_db
class TestSpeseSerializers:

    def test_categoria_serializer(self, categoria_spesa):
        serializer = CategoriaSerializer(categoria_spesa)
        data = serializer.data
        assert data["nome"] == "Alimentari"
        assert data["colore"] == "#FF0000"

    def test_gruppo_spesa_serializer_scrittura(self, user1, gruppo_test, categoria_spesa):
        # Nel GruppoSpesaSerializer, categoria è uno SlugRelatedField sul campo 'nome'
        data = {
            "nome": "Cena Sushi",
            "importo": "80.00",
            "categoria": "Alimentari"
        }
        serializer = GruppoSpesaSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        
        spesa = serializer.save(user=user1, pagatore=user1, gruppo=gruppo_test)

        assert spesa.nome == "Cena Sushi"
        assert spesa.categoria == categoria_spesa
        assert spesa.user == user1
        assert spesa.gruppo == gruppo_test

    def test_articolo_serializer_read_only_fields(self, user1, gruppo_test):
        lista = ListaSpesa.objects.create(
            user=user1, gruppo=gruppo_test, titolo="Spesa Base"
        )

        data = {
            "lista_spesa": lista.id,
            "nome": "Latte",
            "quantita": 2,
            "inserito_da": "utente_falso",
        }
        serializer = ArticoloSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        
        validated_data = serializer.validated_data
        assert "inserito_da" not in validated_data

    def test_lista_spesa_to_representation(self, user1, gruppo_test):
        # Questo test verifica l'override del metodo to_representation nel serializer
        lista = ListaSpesa.objects.create(
            user=user1, gruppo=gruppo_test, titolo="Spesa per la festa"
        )
        serializer = ListaSpesaSerializer(lista)
        data = serializer.data
        
        assert data["titolo"] == "Spesa per la festa"
        assert "gruppo" in data
        assert isinstance(data["gruppo"], dict)
        assert data["gruppo"]["nome"] == "Casa Test"
        assert "codice_invito" in data["gruppo"]