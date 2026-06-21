from django.urls import path
from .views import ExpenseForecastAPIView, StatisticheMensiliView, StatisticheAnnualiView, StatistichePersonaliView


urlpatterns = [
    path('gruppo/mensili/', StatisticheMensiliView.as_view(), name='stats-gruppo-mensili'),
    path('gruppo/annuali/', StatisticheAnnualiView.as_view(), name='stats-gruppo-annuali'),
    path('personali/', StatistichePersonaliView.as_view(), name='stats-personali'),
    path('gruppo/<uuid:group_id>/forecast/', ExpenseForecastAPIView.as_view(), name='ai-expense-forecast'),
]