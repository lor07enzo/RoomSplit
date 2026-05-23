from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q
from django.db import transaction
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


class ArticoloViewSet(viewsets.ModelViewSet):
    serializer_class = ArticoloSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # NOTA: Assicurati che "lista_spesa" sia il nome corretto del related_name o del field
        return Articolo.objects.filter(
            Q(lista_spesa__user=user) | 
            Q(lista_spesa__gruppo__membri__user=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(inserito_da=self.request.user)

    @action(detail=True, methods=['post'], url_path='toggle-check')
    def toggle_check(self, request, pk=None):
        articolo = self.get_object()
        
        if articolo.preso_da:
            articolo.preso_da = None
            messaggio = "Articolo deselezionato."
        else:
            articolo.preso_da = request.user
            messaggio = "Articolo inserito nel carrello!"
            
        articolo.save()
        return Response({
            "messaggio": messaggio, 
            "preso_da": articolo.preso_da.id if articolo.preso_da else None
        }, status=status.HTTP_200_OK)
    
# ReadOnly perché l'app mobile deve solo leggerle
class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    pagination_class = None
    