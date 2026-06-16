import pytest
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