import json
from datetime import datetime, timedelta
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.conf import settings
from openai import OpenAI

# Importa il modello dalla tua app spese (assicurati che l'app si chiami 'spese')
from spese.models import GruppoSpesa

def get_historical_context(group_id):
    """Estrae lo storico degli ultimi 6 mesi e le spese ricorrenti dai modelli reali"""
    six_months_ago = datetime.now() - timedelta(days=180)
    
    # Aggrega le spese singole passate (non ricorrenti e non personali)
    historical_query = (
        GruppoSpesa.objects.filter(
            gruppo_id=group_id, 
            is_personale=False,
            is_ricorrente=False, # Escludiamo le ricorrenti per gestirle a parte
            created_at__gte=six_months_ago
        )
        .annotate(month=TruncMonth('created_at'))
        .values('month', 'categoria__nome')
        .annotate(total=Sum('importo'))
        .order_by('-month')
    )
    
    # Recupera le spese ricorrenti attive del gruppo
    recurring_query = (
        GruppoSpesa.objects.filter(
            gruppo_id=group_id, 
            is_ricorrente=True, 
            is_personale=False
        )
        .values('categoria__nome', 'importo', 'frequenza_numero', 'frequenza_tipo', 'nome')
    )
    
    # Formatta i dati per il prompt dell'Intelligenza Artificiale
    context = {
        "history": [
            {
                "month": item['month'].strftime('%Y-%m'),
                "category": item['categoria__nome'] if item['categoria__nome'] else 'Altro',
                "total": float(item['total'])
            } for item in historical_query
        ],
        "recurring_expenses": [
            {
                "name": item['nome'],
                "category": item['categoria__nome'] if item['categoria__nome'] else 'Altro',
                "amount": float(item['importo']),
                "frequency": f"Ogni {item['frequenza_numero']} {item['frequenza_tipo']}"
            } for item in recurring_query
        ]
    }
    return context

def generate_ai_expense_forecast(group_id):
    """Invia i dati all'AI e restituisce la predizione in formato JSON"""
    data_context = get_historical_context(group_id)
    
    # Inizializzazione client OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    prompt = f"""
    Analizza lo storico delle spese e i costi ricorrenti di questo gruppo di coinquilini:
    {json.dumps(data_context, indent=2)}
    
    Prevedi le spese totali per il mese prossimo. Rispondi ESCLUSIVAMENTE con un oggetto JSON valido con questa struttura:
    {{
        "forecast_month": "NomeMese Anno",
        "total_estimated": 0.0,
        "categories": [
            {{"category": "nome_categoria", "estimated_amount": 0.0, "confidence_level": "High" | "Medium" | "Low"}}
        ],
        "ai_insight": "Breve consiglio (max 15 parole) sui trend di spesa individuati."
    }}
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Sei un analista finanziario per app di bilancio domestico condiviso. Genera solo JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)