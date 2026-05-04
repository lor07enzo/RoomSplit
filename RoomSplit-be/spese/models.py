import uuid

from django.db import models
from users.models import User
from gruppi.models import Gruppo

class Categoria(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=50, null=False, blank=False)
    icona = models.CharField(max_length=200)
    colore = models.CharField(max_length=15)

    def __str__(self):
        return self.nome

class GruppoSpesa(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=50, null=False, blank=False)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='')
    gruppo_id = models.ForeignKey(Gruppo, nullable=True, on_delete=models.CASCADE)
    pagatore_id = models.ForeignKey(User, nullable=True, on_delete=models.CASCADE, related_name='pagatore')
    categoria_id = models.ForeignKey(Categoria, nullable=True, on_delete=models.CASCADE)
    importo = models.DecimalField(max_digits=10, decimal_places=2)
    descrizione = models.TextField(blank=True)
    saldata = models.BooleanField(default=False)
    is_ricorrente = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    prossimo_pagamento = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.nome
    
class Spesa(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gruppo_spesa_id = models.ForeignKey(GruppoSpesa, on_delete=models.CASCADE)
    importo_dovuto = models.DecimalField(max_digits=10, decimal_places=2)

class ListaSpesa(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    gruppo_id = models.ForeignKey(Gruppo, nullable=True, on_delete=models.CASCADE)
    gruppo_spesa_id = models.ForeignKey(GruppoSpesa, nullable=True, on_delete=models.CASCADE, related_name='')
    titolo = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.titolo
    
class Articolo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lista_id = models.ForeignKey(ListaSpesa, on_delete=models.CASCADE)
    inserito_da = models.ForeignKey(User, on_delete=models.CASCADE)
    preso_da = models.ForeignKey(User, nullable=True, on_delete=models.SET_NULL)
    nome = models.CharField(max_length=50)
    quantita = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome