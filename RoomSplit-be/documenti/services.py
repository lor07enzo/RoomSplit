# documenti/services.py
import os
import io
import requests
import pdfplumber
import pytesseract
from PIL import Image, ImageEnhance, ImageOps
import re
from decimal import Decimal
from .models import Documento

# TODO: Per il deploy su Railway/Render, dovremo installare Tesseract tramite apt-get e rimuovere questa configurazione hardcoded.
# Posizione locale della cartella Tesseract
# Serve per eseguire OCR su immagini (JPEG/PNG)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
os.environ['TESSDATA_PREFIX'] = r'C:\Program Files\Tesseract-OCR\tessdata'

def estrai_dati_bolletta(documento_id):
    try:
        doc = Documento.objects.get(id=documento_id)
        
        doc.status_ocr = Documento.StatoOCR.ELABORAZIONE
        doc.save()

        # Serve a ottenere l'url di Cloudinary
        file_url = doc.file.url
        testo_estratto = ""

        # Scarica il file nella Ram
        risposta = requests.get(file_url)
        risposta.raise_for_status() 
        
        # Trasforma il contenuto in un "file virtuale" in memoria
        file_stream = io.BytesIO(risposta.content)

        # Estrazione testo dal PDF
        if doc.tipo_file == 'application/pdf':
            with pdfplumber.open(file_stream) as pdf:
                for page in pdf.pages:
                    testo = page.extract_text()
                    if testo:
                        testo_estratto += testo + "\n"

        # Estrazione testo dalle immagini (JPEG/PNG)                
        elif doc.tipo_file in ['image/jpeg', 'image/png', 'image/jpg']:
            immagine = Image.open(file_stream)
            immagine = ImageOps.grayscale(immagine)
            
            # Spara il contrasto al 250% per uccidere le ombre e far risaltare l'inchiostro nero sullo sfondo bianco
            enhancer = ImageEnhance.Contrast(immagine)
            immagine = enhancer.enhance(2.5)

            # PSM 6: Diciamo a Tesseract di trattare l'immagine come un blocco unico di testo
            config_ocr = r'--psm 6'
            testo_estratto = pytesseract.image_to_string(immagine, lang='ita', config=config_ocr)
            
        else:
            doc.status_ocr = Documento.StatoOCR.FALLITO
            doc.save()
            return False
        
        file_stream.close()

        importo_definitivo = None
        
        # Livello 1 
        pattern_forte = r'(?:totale iva inclusa|quanto pago per questa fattura\??|totale da pagare|importo totale|totale bolletta|importo pagato)[\s\S]{0,30}?(\d{1,4}[.,]\s?\d{2})'
        match_forte = re.search(pattern_forte, testo_estratto, re.IGNORECASE)
        
        if match_forte:
            importo_definitivo = match_forte.group(1)
        else:
            # Livello 2
            pattern_debole = r'(?:totale|importo|da pagare|complessivo|pagato)[\s\S]{0,40}?(\d{1,4}[.,]\s?\d{2})'
            matches_deboli = re.finditer(pattern_debole, testo_estratto, re.IGNORECASE)
            
            importi_trovati = []
            for match in matches_deboli:
                val_pulito = match.group(1).replace(',', '.').replace(' ', '')
                try:
                    importi_trovati.append(Decimal(val_pulito))
                except:
                    pass
            
            if importi_trovati:
                # Il totale finale è quasi sempre il numero più alto del documento
                importo_definitivo = str(max(importi_trovati))

        if importo_definitivo:
            valore_finale = importo_definitivo.replace(',', '.').replace(' ', '')
            doc.importo_estratto = Decimal(valore_finale)
            doc.status_ocr = Documento.StatoOCR.COMPLETATO
        else:
            doc.status_ocr = Documento.StatoOCR.FALLITO

        doc.save()
        return True

    except Exception as e:
        print(f"Errore OCR critico: {e}")
        Documento.objects.filter(id=documento_id).update(status_ocr=Documento.StatoOCR.FALLITO)
        return False