from rest_framework import serializers
from django.contrib.auth import get_user_model
from gruppi.serializers import MembroSerializer
from spese.models import Categoria, GruppoSpesa, Spesa, ListaSpesa, Articolo, Rimborso


User = get_user_model()

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ("id", "nome", "icona", "colore")

# Serializer per l'utente semplificato, usato in GruppoSpesaSerializer
class UserSempliceSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'nome', 'cognome', 'avatar']

class GruppoSpesaSerializer(serializers.ModelSerializer):
    categoria = serializers.SlugRelatedField( slug_field='nome', queryset=Categoria.objects.all())
    user = UserSempliceSerializer(read_only=True)
    pagatore = UserSempliceSerializer(read_only=True)

    class Meta:
        model = GruppoSpesa
        fields = ("id", "nome", "user", "gruppo", "pagatore", "categoria", "importo", "descrizione", "is_personale", "is_ricorrente", "frequenza_numero", "frequenza_tipo", "created_at", "prossimo_pagamento")
        read_only_fields = ("user", "gruppo", "pagatore", "created_at")

class SpesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Spesa
        fields = ("id", "gruppo_spesa", "debitore", "importo_dovuto")

# Serializer per dettaglio utente semplificato, usato in ArticoloSerializer
class UserDettaglioSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "nome", "cognome")

class ArticoloSerializer(serializers.ModelSerializer):
    inserito_da = UserDettaglioSerializer(read_only=True)
    preso_da = UserDettaglioSerializer(read_only=True)

    class Meta:
        model = Articolo
        fields = ("id", "lista_spesa", "inserito_da", "preso_da", "nome", "quantita", "created_at")
        read_only_fields = ("inserito_da", "preso_da", "created_at")

class ListaSpesaSerializer(serializers.ModelSerializer):
    articoli = ArticoloSerializer(many=True, read_only=True)

    class Meta:
        model = ListaSpesa
        fields = ("id", "user", "gruppo", "gruppo_spesa", "titolo", "created_at", "updated_at", "articoli")
        read_only_fields = ("user", "created_at", "updated_at")

    # Override per includere dettagli del gruppo se presente
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.gruppo:
            representation['gruppo'] = {
                "id": str(instance.gruppo.id),
                "nome": instance.gruppo.nome,
                "codice_invito": instance.gruppo.codice_invito,
                "created_at": instance.gruppo.created_at.isoformat(),
            }
        return representation

class RimborsoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rimborso
        fields = ("id", "from_membro", "to_membro", "tipologia", "importo", "nota", "created_at")

    def to_representation(self, instance):
        response = super().to_representation(instance)
        
        # Sovrascrive gli ID con gli oggetti serializzati quando viene restituita la risposta
        response['from_membro'] = MembroSerializer(instance.from_membro).data
        response['to_membro'] = MembroSerializer(instance.to_membro).data
        
        return response