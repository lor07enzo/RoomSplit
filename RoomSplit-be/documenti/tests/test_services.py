import pytest
import uuid
from decimal import Decimal, InvalidOperation
from unittest.mock import MagicMock
from django.contrib.auth import get_user_model
import requests
from documenti.models import Documento
from documenti.services import estrai_dati_bolletta

User = get_user_model()

# --- FIXTURES (Dati preparatori per i test) ---

@pytest.fixture
def utente_test(db):
    """Crea un utente finto obbligatorio per la relazione caricato_da"""
    return User.objects.create_user(
        username='test@example.com',
        email='test@example.com', 
        password='password123'
    )

@pytest.fixture
def documento_pdf(db, utente_test):
    """Crea un documento PDF finto nel database"""
    return Documento.objects.create(
        nome_file='bolletta.pdf',
        tipo_file='application/pdf',
        file='bollette/bolletta_finta.pdf',
        status_ocr=Documento.StatoOCR.IN_ATTESA,
        caricato_da=utente_test
    )

@pytest.fixture
def documento_immagine(db, utente_test):
    """Crea un documento immagine finto nel database"""
    return Documento.objects.create(
        nome_file='bolletta.jpg',
        tipo_file='image/jpeg',
        file='bollette/bolletta_finta.jpg',
        status_ocr=Documento.StatoOCR.IN_ATTESA,
        caricato_da=utente_test
    )

# --- TEST DELLA SUITE ---

# TEST: Formato file non supportato
def test_estrai_dati_formato_non_supportato(db, utente_test, mocker):
    doc = Documento.objects.create(
        nome_file='test.txt',
        tipo_file='text/plain',
        file='bollette/test.txt',
        status_ocr=Documento.StatoOCR.IN_ATTESA,
        caricato_da=utente_test
    )
    
    # Mock della risposta di download per non far fallire requests
    mock_resp = mocker.Mock()
    mock_resp.content = b"Contenuto finto"
    mock_resp.raise_for_status.return_value = None
    
    # Intercettiamo la chiamata senza usare variabili vietate
    mocker.patch('documenti.services.requests.get', return_value=mock_resp)

    result = estrai_dati_bolletta(doc.id)
    
    assert result is False
    doc.refresh_from_db()
    assert doc.status_ocr == Documento.StatoOCR.FALLITO


# TEST: Errore Critico / Eccezione 
def test_estrai_dati_id_inesistente(db):
    id_finto = uuid.uuid4()
    result = estrai_dati_bolletta(id_finto)
    
    assert result is False


# TEST: Estrazione PDF con Match di Livello 1 (Pattern Forte)
def test_estrai_dati_pdf_livello1(documento_pdf, mocker):
    mock_resp = mocker.Mock()
    mock_resp.content = b"Finto PDF"
    mocker.patch('documenti.services.requests.get', return_value=mock_resp)
    
    mock_page = mocker.Mock()
    mock_page.extract_text.return_value = "Gentile cliente, l'importo totale bolletta è di 125,50 € da pagare."
    mock_pdf = mocker.Mock()
    mock_pdf.pages = [mock_page]
    
    mocker.patch('pdfplumber.open', return_value=mocker.MagicMock(__enter__=mocker.Mock(return_value=mock_pdf)))

    result = estrai_dati_bolletta(documento_pdf.id)
    
    assert result is True
    documento_pdf.refresh_from_db()
    assert documento_pdf.status_ocr == Documento.StatoOCR.COMPLETATO
    assert documento_pdf.importo_estratto == Decimal('125.50')


# TEST: Estrazione PDF con Match di Livello 2 (Pattern Debole - Prende il massimo)
def test_estrai_dati_pdf_livello2(documento_pdf, mocker):
    mock_resp = mocker.Mock()
    mock_resp.content = b"Finto PDF"
    mocker.patch('documenti.services.requests.get', return_value=mock_resp)
    
    mock_page = mocker.Mock()
    mock_page.extract_text.return_value = "Dettaglio importo: 45,00. Totale parziale: 12,10. Consumo complessivo: 89,90"
    mock_pdf = mocker.Mock()
    mock_pdf.pages = [mock_page]
    mocker.patch('pdfplumber.open', return_value=mocker.MagicMock(__enter__=mocker.Mock(return_value=mock_pdf)))

    result = estrai_dati_bolletta(documento_pdf.id)
    
    assert result is True
    documento_pdf.refresh_from_db()
    assert documento_pdf.status_ocr == Documento.StatoOCR.COMPLETATO
    assert documento_pdf.importo_estratto == Decimal('89.90')


# TEST: Copertura eccezione InvalidOperation nel blocco del Livello 2
def test_estrai_dati_pdf_livello2_invalid_operation(documento_pdf, mocker):
    mock_resp = mocker.Mock()
    mock_resp.content = b"Finto PDF"
    mocker.patch('documenti.services.requests.get', return_value=mock_resp)
    
    mock_page = mocker.Mock()
    mock_page.extract_text.return_value = "importo: 50,00" 
    mock_pdf = mocker.Mock()
    mock_pdf.pages = [mock_page]
    mocker.patch('pdfplumber.open', return_value=mocker.MagicMock(__enter__=mocker.Mock(return_value=mock_pdf)))

    mocker.patch('documenti.services.Decimal', side_effect=[InvalidOperation(), Decimal('50.00')])

    result = estrai_dati_bolletta(documento_pdf.id)
    assert result is True


# TEST: Estrazione da Immagine tramite OCR (Pytesseract)
def test_estrai_dati_immagine_ocr(documento_immagine, mocker):
    mock_resp = mocker.Mock()
    mock_resp.content = b"Finta Immagine"
    mocker.patch('documenti.services.requests.get', return_value=mock_resp)
    
    mocker.patch('PIL.Image.open', return_value=mocker.MagicMock())
    mocker.patch('PIL.ImageOps.grayscale', return_value=mocker.MagicMock())
    mocker.patch('PIL.ImageEnhance.Contrast', return_value=mocker.MagicMock())
    
    mocker.patch('pytesseract.image_to_string', return_value="FATTURA - IMPORTO TOTALE 78,40 EURO")

    result = estrai_dati_bolletta(documento_immagine.id)
    
    assert result is True
    documento_immagine.refresh_from_db()
    assert documento_immagine.status_ocr == Documento.StatoOCR.COMPLETATO
    assert documento_immagine.importo_estratto == Decimal('78.40')


# TEST: Elaborazione completata ma nessun importo trovato
def test_estrai_dati_nessun_importo_trovato(documento_pdf, mocker):
    mock_resp = mocker.Mock()
    mock_resp.content = b"Finto PDF"
    mocker.patch('documenti.services.requests.get', return_value=mock_resp)
    
    mock_page = mocker.Mock()
    mock_page.extract_text.return_value = "Questa è una pagina di testo senza numeri di fatture o totali da pagare."
    mock_pdf = mocker.Mock()
    mock_pdf.pages = [mock_page]
    
    mocker.patch('pdfplumber.open', return_value=mocker.MagicMock(__enter__=mocker.Mock(return_value=mock_pdf)))
    result = estrai_dati_bolletta(documento_pdf.id)
    
    # Verifiche
    assert result is True
    documento_pdf.refresh_from_db()
    assert documento_pdf.status_ocr == Documento.StatoOCR.FALLITO
    assert documento_pdf.importo_estratto is None