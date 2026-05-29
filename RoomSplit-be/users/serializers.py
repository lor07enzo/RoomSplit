import requests
from django.core.files.base import ContentFile
from rest_framework import serializers
from django.contrib.auth import get_user_model


User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'nome', 'cognome', 'avatar', 'created_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'password', 'nome', 'cognome', 'username']
        extra_kwargs = {'username': {'required': False}}

    def create(self, validated_data):
        username = validated_data.get('username', validated_data['email'])
        nome = validated_data.get('nome', '')
        cognome = validated_data.get('cognome', '')
        
        user = User.objects.create_user(
            username=username,
            email=validated_data['email'],
            password=validated_data['password'],
            nome=nome,
            cognome=cognome
        )
        
        # Generazione automatica dell'avatar con le iniziali
        nome_avatar = f"{nome}+{cognome}".strip('+')
        if not nome_avatar:
            nome_avatar = username 
            
        # Costruiamo l'URL per generare l'immagine (sfondo casuale, dimensione 256x256)
        avatar_url = f"https://ui-avatars.com/api/?name={nome_avatar}&background=random&size=256"
        
        try:
            # Scarica l'immagine in memoria
            response = requests.get(avatar_url)
            if response.status_code == 200:
                file_name = f"{user.id}_avatar.png"
                user.avatar.save(file_name, ContentFile(response.content), save=True)
        except Exception as e:
            print(f"Errore durante la generazione dell'avatar: {e}")
            
        return user