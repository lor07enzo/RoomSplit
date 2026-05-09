from rest_framework import serializers
from documenti.models import Documento


class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ('id', 'gruppo_spesa', 'caricato_da', 'nome_file', 'file', 'tipo_file', 'status_ocr', 'importo_estratto', 'uploaded_at')
        read_only_fields = ( 'caricato_da', 'status_ocr', 'importo_estratto', 'uploaded_at')

        # Rende i campi opzionali per il frontend durante la POST
        extra_kwargs = {
            'nome_file': {'required': False},
            'tipo_file': {'required': False},
        }