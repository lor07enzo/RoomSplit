from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q
from django.db import transaction
from spese.models import GruppoSpesa, Rimborso, ListaSpesa, Articolo
from spese.serializers import GruppoSpesaSerializer, RimborsoSerializer, ListaSpesaSerializer, ArticoloSerializer


class GruppoSpesaViewSet(viewsets.ModelViewSet):
    serializer_class = GruppoSpesaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return GruppoSpesa.objects.filter(
            Q(user=user, is_personale=True) | 
            Q(gruppo__membri__user=user)
        ).distinct().order_by('-created_at')

    # Gestisce la validazione delle quote e la creazione atomica della spesa con le relative quote
    @transaction.atomic 
    def create(self, request, *args, **kwargs):
        quote_data = request.data.pop('quote', [])

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        gruppo_spesa = serializer.save(user=request.user)

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

            if abs(somma_quote - float(gruppo_spesa.importo)) > 0.01:
                return Response(
                    {"errore": f"La somma delle quote ({somma_quote}€) non coincide con l'importo totale ({gruppo_spesa.importo}€)."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


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
    """
    Gestisce le liste della spesa condivise.
    """
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
        # L'utente vede solo gli articoli delle liste a cui ha accesso
        user = self.request.user
        return Articolo.objects.filter(
            Q(lista__user=user) | 
            Q(lista__gruppo__membri__user=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(inserito_da=self.request.user)

    # AZIONE CUSTOM: "Spuntare" un articolo dal carrello
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
        return Response({"messaggio": messaggio, "preso_da": articolo.preso_da.id if articolo.preso_da else None})