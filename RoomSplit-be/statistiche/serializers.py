from rest_framework import serializers

class CategoryForecastSerializer(serializers.Serializer):
    category = serializers.CharField(help_text="Nome della categoria di spesa")
    estimated_amount = serializers.FloatField(help_text="Importo stimato per il mese successivo")
    confidence_level = serializers.ChoiceField(choices=["High", "Medium", "Low"], help_text="Livello di affidabilità della stima")

class ExpenseForecastResponseSerializer(serializers.Serializer):
    forecast_month = serializers.CharField(help_text="Mese e anno di riferimento della previsione (es. 'Luglio 2026')")
    total_estimated = serializers.FloatField(help_text="Somma totale delle spese previste")
    categories = CategoryForecastSerializer(many=True, help_text="Dettaglio predittivo per singola categoria")
    ai_insight = serializers.CharField(help_text="Breve pillola di testo con un consiglio o analisi del trend")