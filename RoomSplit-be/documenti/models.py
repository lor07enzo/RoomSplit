import uuid
from django.conf import settings
from spese.models import GruppoSpesa
from django.db import models

class Documento(models.Model):

    class StatoOCR(models.TextChoices):
        IN_ATTESA = 'in_attesa', 'In Attesa'
        ELABORAZIONE = 'elaborazione', 'In Elaborazione'
        COMPLETATO = 'completato', 'Completato'
        FALLITO = 'fallito', 'Fallito'

    id = models.UUIDField(primary_key= True, default=uuid.uuid4, editable=False)
    gruppo_spesa = models.ForeignKey(GruppoSpesa, null=True, blank=True, on_delete=models.CASCADE, related_name='documenti')
    caricato_da = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documenti_caricati')
    nome_file = models.CharField(max_length=100)
    file = models.FileField(upload_to='bollette/')
    tipo_file = models.CharField(max_length=50)
    status_ocr = models.CharField(max_length=20, choices=StatoOCR.choices, default=StatoOCR.IN_ATTESA)
    importo_estratto = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Doc: {self.nome_file} - {self.get_status_ocr_display()}"