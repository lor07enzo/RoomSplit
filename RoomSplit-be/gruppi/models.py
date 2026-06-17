import string
import uuid
import secrets
from django.db import models
from project.settings import AUTH_USER_MODEL

# Funzione per generare un codice univoco di 6 caratteri alfanumerici sicuri
def genera_codice_invito():
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))

class Gruppo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=50, null=False, blank=False)
    codice_invito = models.CharField(max_length=6, unique=True, default=genera_codice_invito)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__ (self):
        return self.nome
    
class Membro(models.Model):

    RUOLO_CHOICES = [
        ('admin', 'Amministratore'),
        ('membro', 'Membro'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='appartenenze_gruppi')
    gruppo = models.ForeignKey(Gruppo, on_delete=models.CASCADE, related_name='membri')
    ruolo = models.CharField(max_length=15, choices=RUOLO_CHOICES, default='membro')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'gruppo')

    def __str__(self):
        return f"{self.user.nome} - {self.gruppo.nome} ({self.get_ruolo_display()})"