from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Estrae l'URL di Cloudinary (se l'avatar è presente)
        avatar_url = user.avatar.url if user.avatar else None

        return Response({
            "id": user.id,
            "email": user.email,
            "nome": getattr(user, 'nome', ''),
            "cognome": getattr(user, 'cognome', ''),
            "avatar": avatar_url
        })