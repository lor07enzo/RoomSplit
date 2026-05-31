from rest_framework import serializers
from gruppi.models import Gruppo, Membro
from users.serializers import User


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
    
# Classe che permette di estrarre l'avatar dell'utente collegato al membro, se presente
class UserMembroSerializer(serializers.ModelSerializer):
    # Dichiara esplicitamente un campo calcolato per l'avatar
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'nome', 'cognome', 'avatar']

    # Metodo che estrae la stringa URL di Cloudinary
    def get_avatar(self, obj):
        if obj.avatar and hasattr(obj.avatar, 'url'):
            url = obj.avatar.url
            request = self.context.get('request')
            
            if url.startswith('/') and request is not None:
                return request.build_absolute_uri(url)
            
            return url
        return None            

class MembroSerializer(serializers.ModelSerializer):
    user = UserMembroSerializer(read_only=True)

    class Meta:
        model = Membro
        fields = ("id", "user", "gruppo", "ruolo", "created_at")
        