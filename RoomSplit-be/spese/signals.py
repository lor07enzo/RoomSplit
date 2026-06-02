from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import GruppoSpesa, Rimborso
from .services import notifica_nuova_spesa_telegram, notifica_nuovo_rimborso_telegram

@receiver(post_save, sender=GruppoSpesa)
def trigger_notifica_spesa(sender, instance, created, **kwargs):
    if created:
        notifica_nuova_spesa_telegram(instance)

@receiver(post_save, sender=Rimborso)
def trigger_notifica_rimborso(sender, instance, created, **kwargs):
    if created:
        notifica_nuovo_rimborso_telegram(instance)