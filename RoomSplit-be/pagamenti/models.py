# from django.db import models
# from django.conf import settings
# from django.core.exceptions import ValidationError
# import re

# class ProfiloPagamento(models.Model):
#     """
#     Salva i dati di ricezione fondi di ciascun utente.
#     Ogni utente ha un solo profilo in cui specifica dove vuole ricevere i soldi.
#     """
#     utente = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profilo_pagamento')
#     iban = models.CharField(max_length=34, blank=True, null=True)
#     stripe_account_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
#     paypal_email = models.EmailField(blank=True, null=True)
#     data_aggiornamento = models.DateTimeField(auto_now=True)

#     def clean(self):
#         # Validazione per pulire l'IBAN da spazi inseriti per errore dall'utente
#         if self.iban:
#             self.iban = re.sub(r'\s+', '', self.iban).upper()
#             if not re.match(r'^[A-Z0-9]{14,34}$', self.iban):
#                 raise ValidationError({'iban': 'Formato IBAN non valido.'})

#     def save(self, *args, **kwargs):
#         self.full_clean()
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return f"Configurazione ricezione di {self.utente}"


# class Transazione(models.Model):
#     class StatoPagamento(models.TextChoices):
#         INIZIATO = 'PENDING', 'In attesa'
#         CONFERMATO = 'SUCCESS', 'Confermato'
#         FALLITO = 'FAILED', 'Fallito'

#     class ProviderPagamento(models.TextChoices):
#         STRIPE = 'STRIPE', 'Stripe Connect'
#         PAYPAL = 'PAYPAL', 'PayPal Sandbox'
#         MANUALE = 'MANUALE', 'Bonifico/Satispay'

#     debitore = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='pagamenti_effettuati')
#     creditore = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='pagamenti_ricevuti')
#     spesa = models.ForeignKey('spese.Spesa', on_delete=models.CASCADE, related_name='transazioni')
    
#     importo = models.DecimalField(max_digits=10, decimal_places=2)
#     provider = models.CharField(max_length=12, choices=ProviderPagamento.choices, default=ProviderPagamento.MANUALE)
#     stato = models.CharField(max_length=11, choices=StatoPagamento.choices, default=StatoPagamento.INIZIATO)
    
#     external_transaction_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    
#     data_creazione = models.DateTimeField(auto_now_add=True)
#     data_aggiornamento = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return f"{self.debitore} -> {self.creditore}: {self.importo}€ ({self.stato})"