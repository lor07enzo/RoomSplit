from rest_framework import serializers
from gruppi.models import Gruppo, Membro


class GruppoSerializer(serializers.ModelSerializer):
    mio_ruolo = serializers.SerializerMethodField()

    class Meta:
        model = Gruppo
        fields = ("id", "nome", "codice_invito", "created_at", "mio_ruolo")
        read_only_fields = ("id", "codice_invito", "created_at")

    def get_mio_ruolo(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            try:
                membro = obj.membri.get(user=request.user)
                return membro.ruolo
            except Exception:
                return None
        return None
            

class MembroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membro
        fields = ("id", "user", "gruppo", "ruolo", "created_at")
        