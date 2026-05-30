import pytest
from documenti.models import Documento

@pytest.mark.django_db
class TestDocumentiModels:

    def test_creazione_documento_default(self, user1, spesa_test, mock_file):
        doc = Documento.objects.create(
            gruppo_spesa=spesa_test,
            caricato_da=user1,
            nome_file="bolletta.pdf",
            file=mock_file,
            tipo_file="application/pdf"
        )
        
        # Verifica lo stato iniziale e il __str__
        assert doc.status_ocr == Documento.StatoOCR.IN_ATTESA
        assert doc.importo_estratto is None
        assert str(doc) == "Doc: bolletta.pdf - In Attesa"