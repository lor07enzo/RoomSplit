from django.db import models
from django.conf import settings

class ProfiloTelegram(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profilo_telegram')
    chat_id = models.CharField(max_length=50, blank=True, null=True)
    connect_token = models.CharField(max_length=20, blank=True, null=True, unique=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Telegram - {self.user.email}"