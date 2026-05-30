import pytest
from django.urls import reverse
from unittest.mock import patch
from documenti.models import Documento
from django.core.files.uploadedfile import SimpleUploadedFile

@pytest.mark.django_db
class TestDocumentiAPI:

    def test_lista_documenti_visibilita(self, api_client, user1, spesa_test, mock_file):
        # user1 crea un documento associato al suo gruppo
        Documento.objects.create(
            caricato_da=user1, gruppo_spesa=spesa_test, nome_file="mio_doc.pdf", 
            file=mock_file, tipo_file="application/pdf"
        )
        
        api_client.force_authenticate(user=user1)
        url = reverse('documento-list')
        response = api_client.get(url)
        
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["nome_file"] == "mio_doc.pdf"

    @patch('documenti.views.task_estrai_dati_bolletta')
    def test_upload_documento_e_lancio_task(self, mock_task, api_client, user1):
        api_client.force_authenticate(user=user1)
        url = reverse('documento-list')
        
        file_upload = SimpleUploadedFile("scontrino.png", b"finta_immagine", content_type="image/png")
        
        payload = {
            "file": file_upload,
            "nome_file": "Scontrino Supermercato",
            "tipo_file": "image/png"
        }
        
        response = api_client.post(url, payload, format='multipart')
        
        assert response.status_code == 201
        assert response.data["status_ocr"] == "in_attesa"
        assert response.data["nome_file"] == "Scontrino Supermercato"
        
        doc_id = response.data["id"]
        
        mock_task.assert_called_once_with(str(doc_id))