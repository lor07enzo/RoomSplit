from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from .models import Documento
from .serializers import DocumentoSerializer
from .tasks import task_estrai_dati_bolletta


class DocumentoViewSet(viewsets.ModelViewSet):
    queryset = Documento.objects.none()
    serializer_class = DocumentoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user
        queryset = Documento.objects.filter(
            Q(caricato_da=user) | 
            Q(gruppo_spesa__gruppo__membri__user=user)
        ).distinct().order_by('-uploaded_at')

        gruppo_spesa_id = self.request.query_params.get('gruppo_spesa', None)
        if gruppo_spesa_id:
            queryset = queryset.filter(gruppo_spesa_id=gruppo_spesa_id)

        return queryset

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

        #Accoda il task nel database per l'esecuzione asincrona
        task_estrai_dati_bolletta(str(documento.id))
