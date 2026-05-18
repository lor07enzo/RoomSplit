from rest_framework import serializers

from spese.models import Categoria, GruppoSpesa, Spesa, ListaSpesa, Articolo, Rimborso


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ("id", "nome", "icona", "colore")

class GruppoSpesaSerializer(serializers.ModelSerializer):

    categoria = serializers.SlugRelatedField(
        slug_field='nome',
        queryset=Categoria.objects.all()
    )

    class Meta:
        model = GruppoSpesa
        fields = ("id", "nome", "user", "gruppo", "pagatore", "categoria", "importo", "descrizione", "is_personale", "saldata", "is_ricorrente", "frequenza_numero", "frequenza_tipo", "created_at", "prossimo_pagamento")
        read_only_fields = ("user", "gruppo", "pagatore", "created_at", "saldata")

class SpesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Spesa
        fields = ("id", "gruppo_spesa", "debitore", "importo_dovuto")

class ListaSpesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListaSpesa
        fields = ("id", "user", "gruppo", "gruppo_spesa", "titolo", "created_at", "updated_at")

class ArticoloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Articolo
        fields = ("id", "lista_spesa", "inserito_da", "preso_da", "nome", "quantita", "created_at")

class RimborsoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rimborso
        fields = ("id", "from_membro", "to_membro", "tipologia", "importo", "nota", "created_at")