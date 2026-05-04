from django.utils import timezone
import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=50, default='')
    cognome = models.CharField(max_length=50, default='')
    email = models.EmailField(max_length=100, unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "nome", "cognome"]

    def __str__(self):
        return f"{self.nome} {self.cognome} ({self.email})"
