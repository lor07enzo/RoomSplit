from time import timezone
import uuid

from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import APIView, action
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q, Sum
from django.db import transaction
from gruppi.models import Membro
from spese.models import Categoria, GruppoSpesa, Spesa, Rimborso, ListaSpesa, Articolo 
from documenti.models import Documento
from spese.serializers import CategoriaSerializer, GruppoSpesaSerializer, RimborsoSerializer, ListaSpesaSerializer, ArticoloSerializer


class GruppoSpesaViewSet(viewsets.ModelViewSet):
    serializer_class = GruppoSpesaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return GruppoSpesa.objects.filter(
            Q(user=user, is_personale=True) | 
            Q(gruppo__membri__user=user)
        ).distinct().order_by('-created_at')

    # Helper metod per pulire l'ID del documento proveniente dal Frontend
    def _get_clean_documento_id(self, data):
        val = data.get('documento_id', None)
        if isinstance(val, list):
            val = val[0] if val else None
        if val in [None, "", "null", "undefined"]:
            return None
        return val

    @transaction.atomic 
    def create(self, request, *args, **kwargs):
        gruppo_id = request.data.get('gruppo', None)
        debitori_ids = request.data.pop('debitori', []) 
        documento_id = request.data.pop('documento_id', None)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        gruppo_spesa = serializer.save(
            user=request.user, 
            pagatore=request.user,
            gruppo_id=gruppo_id
        )

        # Gestione Divisione automatica lato Django
        if not gruppo_spesa.is_personale and debitori_ids:
            totale_spesa = float(gruppo_spesa.importo)
            numero_partecipanti = len(debitori_ids)
            
            # Quota base arrotondata
            quota_singola = round(totale_spesa / numero_partecipanti, 2)
            somma_calcolata = quota_singola * numero_partecipanti
            differenza_arrotondamento = round(totale_spesa - somma_calcolata, 2)

            for index, debitore_id in enumerate(debitori_ids):
                quota_effettiva = quota_singola
                
                # L'ultimo partecipante della lista si fa carico del centesimo residuo
                if index == numero_partecipanti - 1:
                    quota_effettiva = round(quota_singola + differenza_arrotondamento, 2)

                Spesa.objects.create(
                    gruppo_spesa=gruppo_spesa,
                    debitore_id=debitore_id,
                    importo_dovuto=quota_effettiva
                )

        # Gestione Associazione Documento Sicura
        if documento_id:
            try:
                documento = Documento.objects.get(id=documento_id)
                if documento.gruppo_spesa is not None:
                     return Response(
                        {"errore": "Questo documento è già stato associato a un'altra spesa."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                documento.gruppo_spesa = gruppo_spesa
                documento.status_ocr = Documento.StatoOCR.COMPLETATO 
                documento.save()
            except Documento.DoesNotExist:
                return Response(
                    {"errore": "Il documento specificato non esiste."}, 
                    status=status.HTTP_404_NOT_FOUND
                )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        documento_id = self._get_clean_documento_id(data)
        
        if 'documento_id' in data:
            data.pop('documento_id')

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        vecchi_documenti = Documento.objects.filter(gruppo_spesa=instance)

        if documento_id:
            try:
                documento_nuovo = Documento.objects.get(id=documento_id)
                
                if documento_nuovo.gruppo_spesa is not None and documento_nuovo.gruppo_spesa != instance:
                    return Response(
                        {"errore": "Questo documento è già associato a un'altra spesa."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                vecchi_documenti.exclude(id=documento_id).delete()
                
                documento_nuovo.gruppo_spesa = instance
                documento_nuovo.status_ocr = Documento.StatoOCR.COMPLETATO
                documento_nuovo.save()
                
            except Documento.DoesNotExist:
                return Response(
                    {"errore": "Il documento configurato non esiste."},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            if 'documento_id' in request.data:
                vecchi_documenti.delete()

        return Response(serializer.data)


class RimborsoViewSet(viewsets.ModelViewSet):
    serializer_class = RimborsoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Rimborso.objects.filter(
            Q(from_membro__user=user) | 
            Q(to_membro__user=user)
        ).distinct().order_by('-created_at')
    
    def perform_create(self, serializer):
        from_membro = serializer.validated_data.get('from_membro')
        
        # Controllo di sicurezza: l'utente loggato deve corrispondere all'utente del membro
        if from_membro.user != self.request.user:
            raise PermissionDenied("Non puoi registrare un rimborso a nome di un altro utente.")
        
        serializer.save()

    def perform_update(self, serializer):
        # Controllo di sicurezza per le modifiche
        istanza_rimborso = self.get_object()
        if istanza_rimborso.from_membro.user != self.request.user:
             raise PermissionDenied("Non sei autorizzato a modificare questo rimborso.")
        
        serializer.save()
    

class ListaSpesaViewSet(viewsets.ModelViewSet):
    serializer_class = ListaSpesaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ListaSpesa.objects.filter(
            Q(user=user) | 
            Q(gruppo__membri__user=user)
        ).distinct().order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    # Azione personalizzata per svuotare gli articoli "presi" da una lista spesa
    @action(detail=True, methods=['post'], url_path='svuota-presi')
    def svuota_presi(self, request, pk=None):
        lista = self.get_object()
        lista.articoli.filter(preso_da__isnull=False).delete()
        
        return Response({"detail": "Articoli acquistati rimossi dalla lista."}, status=status.HTTP_200_OK)


class ArticoloViewSet(viewsets.ModelViewSet):
    serializer_class = ArticoloSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Articolo.objects.filter(
            Q(lista_spesa__user=user) | 
            Q(lista_spesa__gruppo__membri__user=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(inserito_da=self.request.user)

    @action(detail=True, methods=['post'], url_path='toggle-check')
    def toggle_check(self, request, pk=None):
        articolo = self.get_object()
        segna_come_preso = request.data.get('segna_come_preso', False)
        
        if segna_come_preso:
            articolo.preso_da = request.user
        else:
            articolo.preso_da = None
        articolo.save()

        serializer = self.get_serializer(articolo)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
# ReadOnly perché l'app mobile deve solo leggerle
class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    pagination_class = None
    
class SaldiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        gruppo_id_str = request.query_params.get('gruppo_id')
        
        if not gruppo_id_str:
            return Response({"errore": "gruppo_id è obbligatorio"}, status=400)

        try:
            gruppo_id = uuid.UUID(gruppo_id_str)
        except ValueError:
            return Response({"errore": "gruppo_id non è un UUID valido"}, status=400)

        # Recupera tutti i membri del gruppo precaricando l'utente per evitare query N+1
        membri = Membro.objects.filter(gruppo_id=gruppo_id).select_related('user')
        
        saldi = []

        for membro in membri:
            utente = membro.user

            # Somma le spese anticipate da questo utente nel gruppo
            pagato = GruppoSpesa.objects.filter(
                gruppo_id=gruppo_id,
                pagatore=utente,
                is_personale=False
            ).aggregate(tot=Sum('importo'))['tot'] or 0

            # Somma le quote che questo utente deve ad altri nel gruppo
            dovuto = Spesa.objects.filter(
                gruppo_spesa__gruppo_id=gruppo_id,
                debitore=utente
            ).aggregate(tot=Sum('importo_dovuto'))['tot'] or 0

            # Somma i rimborsi inviati da questo membro (riduce il suo debito globale)
            rimborsi_inviati = Rimborso.objects.filter(
                from_membro=membro
            ).aggregate(tot=Sum('importo'))['tot'] or 0

            # Somma i rimborsi ricevuti da questo membro (riduce il suo credito globale)
            rimborsi_ricevuti = Rimborso.objects.filter(
                to_membro=membro
            ).aggregate(tot=Sum('importo'))['tot'] or 0

            # Calcolo del bilancio netto finale aggiornato
            bilancio_netto = pagato - dovuto + rimborsi_inviati - rimborsi_ricevuti

            saldi.append({
                "membro_id": str(membro.id),
                "utente_id": str(utente.id),
                "nome": f"{utente.nome} {utente.cognome or ''}".strip(),
                "pagato_totale": float(pagato),
                "quota_dovuta": float(dovuto),
                "rimborsi_inviati": float(rimborsi_inviati),
                "rimborsi_ricevuti": float(rimborsi_ricevuti),
                "bilancio": float(bilancio_netto)
            })

        # Ordina i saldi dal creditore massimo al debitore massimo
        saldi = sorted(saldi, key=lambda x: x['bilancio'], reverse=True)

        return Response({
            "gruppo_id": gruppo_id,
            "saldi": saldi
        })
    
# Restituisce il riepilogo delle spese TOTALI di un utente (Private + Quote Gruppo)
class StatistichePersonaliView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        mese = int(request.query_params.get('mese', timezone.now().month))
        anno = int(request.query_params.get('anno', timezone.now().year))

        # Spese puramente personali
        totale_personale = GruppoSpesa.objects.filter(
            user=user,
            is_personale=True,
            created_at__year=anno,
            created_at__month=mese
        ).aggregate(tot=Sum('importo'))['tot'] or 0

        # Quote dovute nelle spese di gruppo (Tabella Spesa)
        totale_quote_gruppo = Spesa.objects.filter(
            debitore=user,
            gruppo_spesa__is_personale=False,
            gruppo_spesa__created_at__year=anno,
            gruppo_spesa__created_at__month=mese
        ).aggregate(tot=Sum('importo_dovuto'))['tot'] or 0

        return Response({
            "mese": mese,
            "spese_private_pure": totale_personale,
            "tua_parte_spese_gruppo": totale_quote_gruppo,
            "totale_uscita_mensile": totale_personale + totale_quote_gruppo
        })