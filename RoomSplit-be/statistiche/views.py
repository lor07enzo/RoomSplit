from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models.functions import ExtractMonth
from django.db.models import Sum, F
from django.utils import timezone
from spese.models import GruppoSpesa
import uuid 

class StatisticheMensiliView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        gruppo_id = request.query_params.get('gruppo_id')
        
        if not gruppo_id:
            return Response({"errore": "gruppo_id è obbligatorio"}, status=400)

        # Fallback al mese/anno corrente se non vengono passati dall'app
        mese = int(request.query_params.get('mese', timezone.now().month))
        anno = int(request.query_params.get('anno', timezone.now().year))

        # Filtra le spese condivise del gruppo per quel mese/anno
        spese_mese = GruppoSpesa.objects.filter(
            gruppo_id=gruppo_id,
            created_at__year=anno,
            created_at__month=mese,
            is_personale=False
        )

        # Calcolo Totale Speso (aggregate restituisce un dizionario)
        totale_mese = spese_mese.aggregate(totale=Sum('importo'))['totale'] or 0

        # Raggruppamento per Categoria (PERFETTO per il grafico a torta)
        # annotate raggruppa i risultati(per categoria)
        spese_per_categoria = spese_mese.values(
            nome_categoria=F('categoria__nome'),
            colore_categoria=F('categoria__colore')
        ).annotate(
            totale_speso=Sum('importo')
        ).order_by('-totale_speso')

        # Trova la Spesa Maggiore del mese
        spesa_maggiore = spese_mese.order_by('-importo').first()
        spesa_maggiore_data = {
            "descrizione": spesa_maggiore.descrizione,
            "importo": spesa_maggiore.importo,
            "pagatore": f"{spesa_maggiore.pagatore.nome} {spesa_maggiore.pagatore.cognome}"
        } if spesa_maggiore else None

        # JSON formattato per il Frontend
        return Response({
            "periodo": f"{mese:02d}/{anno}",
            "totale_speso": totale_mese,
            "spese_per_categoria": spese_per_categoria,
            "spesa_maggiore": spesa_maggiore_data
        })
    

class StatisticheAnnualiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        gruppo_id_str = request.query_params.get('gruppo_id')
        
        if not gruppo_id_str:
            return Response({"errore": "gruppo_id è obbligatorio"}, status=400)

        try:
            gruppo_id = uuid.UUID(gruppo_id_str)
        except ValueError:
            return Response({"errore": "gruppo_id non è un UUID valido"}, status=400)

        anno = int(request.query_params.get('anno', timezone.now().year))

        # Filtriamo tutte le spese del gruppo per l'anno richiesto
        spese_anno = GruppoSpesa.objects.filter(
            gruppo_id=gruppo_id,
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

        # Formattiamo i dati per assicurarci che ci siano tutti i mesi, anche quelli a zero
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
    