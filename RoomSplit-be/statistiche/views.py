from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models.functions import ExtractMonth
from django.db.models import Sum, F
from django.utils import timezone
from gruppi.models import Membro
from spese.models import GruppoSpesa, Spesa
import uuid 

from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers as drf_serializers

class StatisticheMensiliView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Statistiche Mensili di Gruppo",
        description="Restituisce le statistiche mensili delle spese di gruppo, incluse le spese per categoria e la spesa maggiore del mese.",
        parameters=[
            OpenApiParameter('gruppo_id', OpenApiTypes.STR, description="UUID del gruppo oppure 'all'", required=False, location=OpenApiParameter.QUERY),
            OpenApiParameter('mese', OpenApiTypes.INT, description="Mese (1-12)", required=False, location=OpenApiParameter.QUERY),
            OpenApiParameter('anno', OpenApiTypes.INT, description="Anno (es. 2026)", required=False, location=OpenApiParameter.QUERY),
        ],
        responses={
            200: inline_serializer(
                name='StatisticheMensiliResponse',
                fields={
                    'periodo': drf_serializers.CharField(),
                    'totale_speso': drf_serializers.FloatField(),
                    'spese_per_categoria': inline_serializer(
                        name='SpesaCategoria',
                        many=True,
                        fields={
                            'nome_categoria': drf_serializers.CharField(),
                            'colore_categoria': drf_serializers.CharField(),
                            'totale_speso': drf_serializers.FloatField(),
                        }
                    ),
                    'spesa_maggiore': inline_serializer(
                        name='SpesaMaggiore',
                        allow_null=True,
                        fields={
                            'descrizione': drf_serializers.CharField(),
                            'importo': drf_serializers.FloatField(),
                            'pagatore': drf_serializers.CharField(),
                        }
                    )
                }
            ),
            400: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        }
    )
    def get(self, request, *args, **kwargs):
        gruppo_id = request.query_params.get('gruppo_id')
        mese = int(request.query_params.get('mese', timezone.now().month))
        anno = int(request.query_params.get('anno', timezone.now().year))

        # Recupera gli ID di tutti i gruppi a cui appartiene l'utente loggato
        gruppi_utente_ids = Membro.objects.filter(user=request.user).values_list('gruppo_id', flat=True)

        if not gruppi_utente_ids:
            return Response({"errore": "L'utente non appartiene ad alcun gruppo"}, status=404)

        # Se viene passato un ID specifico
        if gruppo_id and gruppo_id != 'all':
            try:
                gruppo_uuid = uuid.UUID(gruppo_id)
            except ValueError:
                return Response({"errore": "gruppo_id non è un UUID valido"}, status=400)
                
            # Sicurezza: l'utente fa parte di questo gruppo specifico
            if gruppo_uuid not in gruppi_utente_ids:
                return Response({"errore": "Non hai accesso alle statistiche di questo gruppo"}, status=403)
            
            filtro_gruppi = [gruppo_uuid]
        else:
            # Se gruppo_id è vuoto o "all", calcola le statistiche su TUTTI i suoi gruppi
            filtro_gruppi = gruppi_utente_ids

        spese_mese = GruppoSpesa.objects.filter(
            gruppo_id__in=filtro_gruppi,
            created_at__year=anno,
            created_at__month=mese,
            is_personale=False
        )

        totale_mese = spese_mese.aggregate(totale=Sum('importo'))['totale'] or 0

        spese_per_categoria = spese_mese.values(
            nome_categoria=F('categoria__nome'),
            colore_categoria=F('categoria__colore')
        ).annotate(
            totale_speso=Sum('importo')
        ).order_by('-totale_speso')

        spesa_maggiore = spese_mese.order_by('-importo').first()
        spesa_maggiore_data = {
            "descrizione": spesa_maggiore.descrizione,
            "importo": spesa_maggiore.importo,
            "pagatore": f"{spesa_maggiore.pagatore.nome} {spesa_maggiore.pagatore.cognome}"
        } if spesa_maggiore else None

        return Response({
            "periodo": f"{mese:02d}/{anno}",
            "totale_speso": totale_mese,
            "spese_per_categoria": spese_per_categoria,
            "spesa_maggiore": spesa_maggiore_data
        })
    

class StatisticheAnnualiView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Statistiche Annuali di Gruppo",
        description="Restituisce l'andamento delle spese di gruppo mese per mese durante l'intero anno.",
        parameters=[
            OpenApiParameter('gruppo_id', OpenApiTypes.STR, description="UUID del gruppo oppure 'all'", required=False, location=OpenApiParameter.QUERY),
            OpenApiParameter('anno', OpenApiTypes.INT, description="Anno (es. 2026)", required=False, location=OpenApiParameter.QUERY),
        ],
        responses={
            200: inline_serializer(
                name='StatisticheAnnualiResponse',
                fields={
                    'anno': drf_serializers.IntegerField(),
                    'totale_anno': drf_serializers.FloatField(),
                    'andamento_mensile': inline_serializer(
                        name='AndamentoMensile',
                        many=True,
                        fields={
                            'mese': drf_serializers.IntegerField(),
                            'totale': drf_serializers.FloatField(),
                        }
                    )
                }
            ),
            400: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        }
    )
    def get(self, request, *args, **kwargs):
        gruppo_id_str = request.query_params.get('gruppo_id')
        
        gruppi_utente_ids = Membro.objects.filter(user=request.user).values_list('gruppo_id', flat=True)

        if not gruppi_utente_ids:
            return Response({"errore": "L'utente non appartiene ad alcun gruppo"}, status=404)

        # Se viene passato un ID specifico
        if gruppo_id_str and gruppo_id_str != 'all':
            try:
                gruppo_uuid = uuid.UUID(gruppo_id_str)
            except ValueError:
                return Response({"errore": "gruppo_id non è un UUID valido"}, status=400)
                
            # Sicurezza: l'utente fa parte di questo gruppo specifico
            if gruppo_uuid not in gruppi_utente_ids:
                return Response({"errore": "Non hai accesso alle statistiche di questo gruppo"}, status=403)
            
            filtro_gruppi = [gruppo_uuid]
        else:
            # Se gruppo_id è vuoto o "all", calcola le statistiche su TUTTI i suoi gruppi
            filtro_gruppi = gruppi_utente_ids

        anno = int(request.query_params.get('anno', timezone.now().year))

        spese_anno = GruppoSpesa.objects.filter(
            gruppo_id__in=filtro_gruppi,
            created_at__year=anno,
            is_personale=False
        )

        # Totale annuo
        totale_anno = spese_anno.aggregate(totale=Sum('importo'))['totale'] or 0

        # Raggruppamento per mese (Da Gennaio a Dicembre)
        andamento_mensile = spese_anno.annotate(
            mese=ExtractMonth('created_at')
        ).values('mese').annotate(
            totale_speso=Sum('importo')
        ).order_by('mese')

        dati_grafico = {mese: 0 for mese in range(1, 13)}
        for record in andamento_mensile:
            dati_grafico[record['mese']] = record['totale_speso']

        return Response({
            "anno": anno,
            "totale_anno": totale_anno,
            "andamento_mensile": [
                {"mese": mese, "totale": totale} 
                for mese, totale in dati_grafico.items()
            ]
        })
    
class StatistichePersonaliView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Statistiche Personali Utente",
        description="Restituisce il riepilogo delle uscite personali dell'utente (somma delle spese private e delle quote dovute nei gruppi) per il mese corrente e il trend annuale.",
        parameters=[
            OpenApiParameter('mese', OpenApiTypes.INT, description="Mese (1-12)", required=False, location=OpenApiParameter.QUERY),
            OpenApiParameter('anno', OpenApiTypes.INT, description="Anno (es. 2026)", required=False, location=OpenApiParameter.QUERY),
        ],
        responses={
            200: inline_serializer(
                name='StatistichePersonaliResponse',
                fields={
                    'mese': drf_serializers.IntegerField(),
                    'anno': drf_serializers.IntegerField(),
                    'spese_private_pure': drf_serializers.FloatField(),
                    'tua_parte_spese_gruppo': drf_serializers.FloatField(),
                    'totale_uscita_mensile': drf_serializers.FloatField(),
                    'totale_anno': drf_serializers.FloatField(),
                    'andamento_mensile': inline_serializer(
                        name='AndamentoPersonaleMensile',
                        many=True,
                        fields={
                            'mese': drf_serializers.IntegerField(),
                            'totale': drf_serializers.FloatField(),
                        }
                    )
                }
            )
        }
    )
    def get(self, request, *args, **kwargs):
        user = request.user
        mese = int(request.query_params.get('mese', timezone.now().month))
        anno = int(request.query_params.get('anno', timezone.now().year))

        # DATI MENSILI (Questo Mese)
        totale_personale = GruppoSpesa.objects.filter(
            user=user,
            is_personale=True,
            created_at__year=anno,
            created_at__month=mese
        ).aggregate(tot=Sum('importo'))['tot'] or 0

        # Quote dovute nelle spese di gruppo
        totale_quote_gruppo = Spesa.objects.filter(
            debitore=user,
            gruppo_spesa__is_personale=False,
            gruppo_spesa__created_at__year=anno,
            gruppo_spesa__created_at__month=mese
        ).aggregate(tot=Sum('importo_dovuto'))['tot'] or 0

        # DATI ANNUALI (Trend 12 Mesi)
        spese_private_anno = GruppoSpesa.objects.filter(
            user=user,
            is_personale=True,
            created_at__year=anno
        ).annotate(
            mese=ExtractMonth('created_at')
        ).values('mese').annotate(
            totale=Sum('importo')
        ).order_by('mese')

        quote_gruppo_anno = Spesa.objects.filter(
            debitore=user,
            gruppo_spesa__is_personale=False,
            gruppo_spesa__created_at__year=anno
        ).annotate(
            mese=ExtractMonth('gruppo_spesa__created_at')
        ).values('mese').annotate(
            totale=Sum('importo_dovuto')
        ).order_by('mese')

        # Dizionario di base per i 12 mesi
        dati_grafico_annuale = {m: 0 for m in range(1, 13)}

        for record in spese_private_anno:
            dati_grafico_annuale[record['mese']] += float(record['totale'])

        for record in quote_gruppo_anno:
            dati_grafico_annuale[record['mese']] += float(record['totale'])

        totale_anno = sum(dati_grafico_annuale.values())

        # RISPOSTA UNIFICATA
        return Response({
            # Dati Mensili
            "mese": mese,
            "anno": anno,
            "spese_private_pure": totale_personale,
            "tua_parte_spese_gruppo": totale_quote_gruppo,
            "totale_uscita_mensile": totale_personale + totale_quote_gruppo,
            
            # Dati Annuali
            "totale_anno": totale_anno,
            "andamento_mensile": [
                {"mese": m, "totale": tot} 
                for m, tot in dati_grafico_annuale.items()
            ]
        })
    