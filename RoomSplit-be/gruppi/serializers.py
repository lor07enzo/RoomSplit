from rest_framework import serializers
from gruppi.models import Gruppo, Membro


class GruppoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gruppo
        fields = ("id", "nome", "codice_invito", "created_at")

class MembroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membro
        fields = ("id", "user", "gruppo", "ruolo", "created_at")
        