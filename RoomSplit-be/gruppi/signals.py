from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from gruppi.models import Membro
from .services import notifica_nuovo_membro_telegram, notifica_membro_rimosso_telegram

@receiver(post_save, sender=Membro)
def trigger_notifica_nuovo_membro(sender, instance, created, **kwargs):
    if created:
        notifica_nuovo_membro_telegram(instance.gruppo, instance.user)

@receiver(post_delete, sender=Membro)
def trigger_notifica_rimosso_membro(sender, instance, **kwargs):
    esecutore = getattr(instance, '_utente_esecutore', instance.user)
    
    notifica_membro_rimosso_telegram(instance.gruppo, instance.user, esecutore)