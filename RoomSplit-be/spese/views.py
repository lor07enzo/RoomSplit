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

    @transaction.atomic 
    def create(self, request, *args, **kwargs):
        quote_data = request.data.pop('quote', [])
        documento_id = request.data.pop('documento_id', None)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        gruppo_spesa = serializer.save(
            user=request.user,
            pagatore=request.user
        )

        # Gestione delle Quote
        if not gruppo_spesa.is_personale and quote_data:
            somma_quote = 0

            for quota in quote_data:
                importo_dovuto = float(quota.get('importo_dovuto', 0))
                somma_quote += importo_dovuto
                
                Spesa.objects.create(
                    gruppo_spesa=gruppo_spesa,
                    debitore_id=quota.get('debitore'),
                    importo_dovuto=importo_dovuto
                )

            # Controllo quadratura importi
            if abs(somma_quote - float(gruppo_spesa.importo)) > 0.01:
                # Se i conti non tornano, il transaction.atomic annullerà tutto automaticamente
                return Response(
                    {"errore": f"La somma delle quote ({somma_quote}€) non coincide con l'importo totale ({gruppo_spesa.importo}€)."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Gestione Associazione Documento (Scontrino/Bolletta OCR)
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
        
        documento_id = data.pop('documento_id', None)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if documento_id is not None:
            vecchi_documenti = Documento.objects.filter(gruppo_spesa=instance)

            if documento_id:
                vecchi_documenti = vecchi_documenti.exclude(id=documento_id)
            for doc in vecchi_documenti:
                doc.delete()

            if documento_id:
                Documento.objects.filter(id=documento_id).update(gruppo_spesa=instance)

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
    