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
        # Utilizziamo l'email come username di default per non generare errori
        username = validated_data.get('username', validated_data['email'])
        
        user = User.objects.create_user(
            username=username,
            email=validated_data['email'],
            password=validated_data['password'],
            nome=validated_data.get('nome', ''),
            cognome=validated_data.get('cognome', '')
        )
        return user