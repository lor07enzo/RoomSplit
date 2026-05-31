import uuid

from django.db import models
from django.conf import settings
from gruppi.models import Gruppo, Membro

class Categoria(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=50)
    icona = models.CharField(max_length=200)
    colore = models.CharField(max_length=15)

    def __str__(self):
        return self.nome

class GruppoSpesa(models.Model):

    FREQUENZA_CHOICES = [
        ("giorni", "Giorni"),
        ("settimane", "Settimane"),
        ("mesi", "Mesi"),
        ("anni", "Anni")
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=50, null=False, blank=False)

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='spese_create')
    gruppo = models.ForeignKey(Gruppo, null=True, blank=True, on_delete=models.CASCADE, related_name='spese_gruppo')
    pagatore = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name='spese_pagate')
    categoria = models.ForeignKey(Categoria, null=True, blank=True, on_delete=models.SET_NULL)

    importo = models.DecimalField(max_digits=10, decimal_places=2)
    descrizione = models.TextField(blank=True)
    is_personale = models.BooleanField(default=False)
    is_ricorrente = models.BooleanField(default=False)
    frequenza_numero = models.IntegerField(default=1, null=True, blank=True)
    frequenza_tipo = models.CharField(choices=FREQUENZA_CHOICES, max_length=20, default="mesi", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    prossimo_pagamento = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.nome
    
class Spesa(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gruppo_spesa = models.ForeignKey(GruppoSpesa, on_delete=models.CASCADE, related_name='quote_divise')
    debitore = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quote_dovute')
    importo_dovuto = models.DecimalField(max_digits=10, decimal_places=2)

class ListaSpesa(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='liste_create')
    gruppo = models.ForeignKey(Gruppo, null=True, blank=True, on_delete=models.CASCADE, related_name='liste_spesa')
    gruppo_spesa = models.ForeignKey(GruppoSpesa, null=True, blank=True, on_delete=models.CASCADE, related_name='liste_collegate')

    titolo = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.titolo
    
class Articolo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lista_spesa = models.ForeignKey(ListaSpesa, on_delete=models.CASCADE, related_name='articoli')
    inserito_da = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='articoli_inseriti')
    preso_da = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='articoli_presi')
    nome = models.CharField(max_length=50)
    quantita = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome
    
class Rimborso(models.Model):

    class MetodoPagamento(models.TextChoices):
        CONTANTI = 'contanti', 'Contanti'
        BONIFICO = 'bonifico', 'Bonifico Bancario'
        PAYPAL = 'paypal', 'PayPal'
        SATISPAY = 'satispay', 'Satispay'
        STRIPE = 'stripe', 'Stripe / Carta'
        ALTRO = 'altro', 'Altro'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    from_membro = models.ForeignKey(Membro, on_delete=models.CASCADE, related_name='rimborsi_inviati')
    to_membro = models.ForeignKey(Membro, on_delete=models.CASCADE, related_name='rimborsi_ricevuti')
    
    tipologia = models.CharField(max_length=20, choices=MetodoPagamento.choices, default=MetodoPagamento.CONTANTI)
    importo = models.DecimalField(max_digits=10, decimal_places=2)
    nota = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.from_membro} rimborsa {self.to_membro} di {self.importo}€ tramite {self.get_tipologia_display()}"