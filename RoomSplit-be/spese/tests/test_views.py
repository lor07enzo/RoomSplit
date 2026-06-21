import pytest
import uuid
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from gruppi.models import Gruppo, Membro
from spese.models import Categoria, GruppoSpesa, Spesa, Rimborso, ListaSpesa, Articolo
from documenti.models import Documento

User = get_user_model()

@pytest.mark.django_db
class TestSpeseViews:
    
    def setup_method(self):
        self.client = APIClient()
        
        # Creazione Utenti
        self.user_loggato = User.objects.create(username="mario_test", email="mario@roomsplit.com", nome="Mario")
        self.user_coinquilino1 = User.objects.create(username="luigi_test", email="luigi@roomsplit.com", nome="Luigi")
        self.user_coinquilino2 = User.objects.create(username="peach_test", email="peach@roomsplit.com", nome="Peach")
        
        # Creazione Gruppo e Membri
        self.gruppo = Gruppo.objects.create(nome="Casa Test")
        self.membro_loggato = Membro.objects.create(user=self.user_loggato, gruppo=self.gruppo)
        self.membro_coinquilino1 = Membro.objects.create(user=self.user_coinquilino1, gruppo=self.gruppo)
        self.membro_coinquilino2 = Membro.objects.create(user=self.user_coinquilino2, gruppo=self.gruppo)
        
        self.categoria = Categoria.objects.create(nome="Bollette", colore="#FF0000")
        
        # Autenticazione del client
        self.client.force_authenticate(user=self.user_loggato)

    # --- MATEMATICA DELLA DIVISIONE ---
    def test_divisione_automatica_con_resto(self):
        """Testa l'algoritmo che spalma i centesimi residui sull'ultimo utente."""
        
        url = reverse('gruppospesa-list')
        
        payload = {
            "nome": "Bolletta Luce",
            "importo": "10.00",
            "categoria": self.categoria.nome,
            "gruppo": self.gruppo.id,
            "is_personale": False,
            "debitori": [self.user_loggato.id, self.user_coinquilino1.id, self.user_coinquilino2.id]
        }

        response = self.client.post(url, payload, format='json')
        assert response.status_code == 201

        spesa_creata = GruppoSpesa.objects.get(id=response.data['id'])
        quote = Spesa.objects.filter(gruppo_spesa=spesa_creata)
        
        assert quote.count() == 3
        # Estraiamo tutti gli importi, li convertiamo in float e li ordiniamo numericamente
        importi_calcolati = sorted([float(q.importo_dovuto) for q in quote])
        
        # Verifichiamo il contenuto esatto a prescindere dall'utente specifico
        assert importi_calcolati == [3.33, 3.33, 3.34]

    # --- ASSOCIAZIONE DOCUMENTO ---
    def test_creazione_spesa_con_documento_successo(self):
        """Verifica che il documento venga associato e cambi stato in COMPLETATO."""
        
        doc = Documento.objects.create(
            caricato_da=self.user_loggato,
            nome_file="scontrino.pdf",
            status_ocr=Documento.StatoOCR.IN_ATTESA
        )
        
        url = reverse('gruppospesa-list')
        payload = {
            "nome": "Spesa con Scontrino",
            "importo": "50.00",
            "categoria": self.categoria.nome,
            "gruppo": self.gruppo.id,
            "is_personale": False,
            "documento_id": doc.id,
            "debitori": [self.user_loggato.id]
        }

        response = self.client.post(url, payload, format='json')
        assert response.status_code == 201, response.data

        doc.refresh_from_db()
        assert str(doc.gruppo_spesa.id) == response.data['id']
        assert doc.status_ocr == Documento.StatoOCR.COMPLETATO

    def test_creazione_spesa_con_documento_gia_associato(self):
        """Verifica che non si possa associare uno scontrino già usato in un'altra spesa."""
        
        spesa_esistente = GruppoSpesa.objects.create(
            nome="Vecchia Spesa", importo=10.0, user=self.user_loggato, pagatore=self.user_loggato
        )
        doc = Documento.objects.create(
            caricato_da=self.user_loggato,
            nome_file="usato.pdf",
            gruppo_spesa=spesa_esistente
        )
        
        url = reverse('gruppospesa-list')
        payload = {
            "nome": "Spesa Nuova",
            "importo": "20.00",
            "categoria": self.categoria.nome,
            "documento_id": doc.id,
        }

        response = self.client.post(url, payload, format='json')
        assert response.status_code == 400
        assert "già stato associato" in response.data['errore']

    # --- SICUREZZA RIMBORSI ---
    def test_sicurezza_rimborso_vietato_per_altri(self):
        """Un utente non può registrare un rimborso a nome di un altro membro."""
        
        url = reverse('rimborso-list')
        payload = {
            "from_membro": self.membro_coinquilino1.id,
            "to_membro": self.membro_loggato.id,
            "importo": "15.00"
        }

        response = self.client.post(url, payload, format='json')
        
        assert response.status_code == 403
        assert "Non puoi registrare un rimborso a nome di un altro utente" in str(response.data)

    # --- AZIONI PERSONALIZZATE LISTA SPESA ---
    def test_azione_svuota_presi(self):
        """Testa l'endpoint custom per ripulire la lista dagli articoli acquistati."""
        
        lista = ListaSpesa.objects.create(titolo="Spesa Settimanale", user=self.user_loggato)
        
        Articolo.objects.create(lista_spesa=lista, nome="Latte", inserito_da=self.user_loggato)
        Articolo.objects.create(lista_spesa=lista, nome="Pane", inserito_da=self.user_loggato, preso_da=self.user_loggato)
        
        # Chiamata all'azione custom
        url = reverse('listaspesa-svuota-presi', args=[lista.id])
        response = self.client.post(url)
        
        assert response.status_code == 200
        assert Articolo.objects.filter(lista_spesa=lista).count() == 1
        assert Articolo.objects.filter(lista_spesa=lista).first().nome == "Latte"

    def test_creazione_spesa_documento_non_esiste(self):
        """Verifica il ramo except Documento.DoesNotExist in fase di creazione."""
        url = reverse('gruppospesa-list')
        payload = {
            "nome": "Spesa Errore",
            "importo": "10.00",
            "categoria": self.categoria.nome,
            "gruppo": self.gruppo.id,
            "documento_id": str(uuid.uuid4())  # Un ID inesistente
        }
        response = self.client.post(url, payload, format='json')
        assert response.status_code == 404
        assert "non esiste" in response.data['errore']

    def test_update_spesa_gestione_documenti(self):
        """Testa la modifica di una spesa: aggiunta, sostituzione e rimozione di un documento."""
        spesa = GruppoSpesa.objects.create(
            nome="Spesa Base", importo="20.00", user=self.user_loggato, pagatore=self.user_loggato, gruppo=self.gruppo
        )
        doc_nuovo = Documento.objects.create(caricato_da=self.user_loggato, nome_file="nuovo.pdf")
        
        url = reverse('gruppospesa-detail', args=[spesa.id])

        res = self.client.patch(url, {"documento_id": doc_nuovo.id}, format='json')
        assert res.status_code == 200
        doc_nuovo.refresh_from_db()
        assert doc_nuovo.gruppo_spesa == spesa
        
        altra_spesa = GruppoSpesa.objects.create(nome="Altra", importo="5.00", user=self.user_loggato)
        doc_occupato = Documento.objects.create(caricato_da=self.user_loggato, nome_file="occupato.pdf", gruppo_spesa=altra_spesa)
        
        res = self.client.patch(url, {"documento_id": doc_occupato.id}, format='json')
        assert res.status_code == 400
        assert "già associato" in res.data['errore']

        res = self.client.patch(url, {"documento_id": None}, format='json')
        assert res.status_code == 200
        assert not Documento.objects.filter(id=doc_nuovo.id).exists()

    def test_sicurezza_rimborso_update_vietato(self):
        """Un utente non può modificare un rimborso creato da qualcun altro."""
        # Il coinquilino 1 crea un rimborso verso il coinquilino 2
        rimborso = Rimborso.objects.create(
            from_membro=self.membro_coinquilino1, 
            to_membro=self.membro_loggato, 
            importo="10.00"
        )
        
        url = reverse('rimborso-detail', args=[rimborso.id])
        # L'utente loggato tenta di manipolare l'importo
        response = self.client.patch(url, {"importo": "50.00"}, format='json')
        
        assert response.status_code == 403
        assert "Non sei autorizzato a modificare" in str(response.data)

    def test_azione_toggle_check_articolo(self):
        """Testa la spunta (e rimozione) di un articolo dalla lista spesa."""
        lista = ListaSpesa.objects.create(titolo="Lista Test", user=self.user_loggato)
        articolo = Articolo.objects.create(lista_spesa=lista, nome="Uova", inserito_da=self.user_loggato)
        
        url = reverse('articolo-toggle-check', args=[articolo.id])

        res = self.client.post(url, {"segna_come_preso": True}, format='json')
        assert res.status_code == 200
        articolo.refresh_from_db()
        assert articolo.preso_da == self.user_loggato

        res = self.client.post(url, {"segna_come_preso": False}, format='json')
        assert res.status_code == 200
        articolo.refresh_from_db()
        assert articolo.preso_da is None

    def test_saldi_view_errori_request(self):
        """Testa le risposte 400 se manca il gruppo_id o se il formato è errato."""
        url = reverse('calcolo-saldi')
        
        res_mancante = self.client.get(url)
        assert res_mancante.status_code == 400
        
        res_invalido = self.client.get(f"{url}?gruppo_id=non-sono-un-uuid")
        assert res_invalido.status_code == 400

    def test_saldi_view_calcolo_corretto(self):
        """Simula spese e rimborsi per verificare l'esattezza del bilancio netto."""
        url = reverse('calcolo-saldi')
        
        # L'utente loggato paga 30€ per il gruppo
        spesa_madre = GruppoSpesa.objects.create(
            nome="Cena", importo="30.00", user=self.user_loggato, 
            pagatore=self.user_loggato, gruppo=self.gruppo
        )
        
        # La spesa è divisa in parti uguali (10€ a testa)
        Spesa.objects.create(gruppo_spesa=spesa_madre, debitore=self.user_loggato, importo_dovuto="10.00")
        Spesa.objects.create(gruppo_spesa=spesa_madre, debitore=self.user_coinquilino1, importo_dovuto="10.00")
        Spesa.objects.create(gruppo_spesa=spesa_madre, debitore=self.user_coinquilino2, importo_dovuto="10.00")
        
        # Il coinquilino 1 rimborsa 5€ all'utente loggato
        Rimborso.objects.create(
            from_membro=self.membro_coinquilino1, 
            to_membro=self.membro_loggato, 
            importo="5.00"
        )
        
        # CHIAMATA API
        response = self.client.get(f"{url}?gruppo_id={self.gruppo.id}")
        assert response.status_code == 200
        
        saldi = response.data['saldi']
        assert len(saldi) == 3
        
        # Estraiamo i bilanci per comodità di validazione
        bilancio_loggato = next(s for s in saldi if s['utente_id'] == str(self.user_loggato.id))
        bilancio_c1 = next(s for s in saldi if s['utente_id'] == str(self.user_coinquilino1.id))
        bilancio_c2 = next(s for s in saldi if s['utente_id'] == str(self.user_coinquilino2.id))
        
        # MATEMATICA ATTESA:
        assert bilancio_loggato['bilancio'] == 15.0
        assert bilancio_c1['bilancio'] == -5.0
        assert bilancio_c2['bilancio'] == -10.0