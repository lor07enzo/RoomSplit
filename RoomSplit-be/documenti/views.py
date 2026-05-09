from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Documento
from spese.models import GruppoSpesa
from .serializers import DocumentoSerializer
from .services import estrai_dati_bolletta
import threading

class DocumentoViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentoSerializer
    permission_classes = [IsAuthenticated]
    # Permette di accettare l'upload di file e form-data
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user
        return Documento.objects.filter(
            Q(caricato_da=user) | 
            Q(gruppo_spesa__gruppo__membri__user=user)
        ).distinct().order_by('-uploaded_at')

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        nome_file_frontend = self.request.data.get('nome_file')
        tipo_file_frontend = self.request.data.get('tipo_file')

        nome_definitivo = nome_file_frontend if nome_file_frontend else (file_obj.name if file_obj else "documento_sconosciuto")
        tipo_definitivo = tipo_file_frontend if tipo_file_frontend else (file_obj.content_type if file_obj else "application/octet-stream")

        documento = serializer.save(
            caricato_da=self.request.user,
            nome_file=nome_definitivo,
            tipo_file=tipo_definitivo
        )

        # Avvia l'estrazione OCR in background!
        thread = threading.Thread(target=estrai_dati_bolletta, args=(documento.id,))
        thread.start()
