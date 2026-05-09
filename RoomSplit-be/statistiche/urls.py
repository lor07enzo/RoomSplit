from django.urls import path
from .views import StatisticheMensiliView, StatisticheAnnualiView, SaldiView, StatistichePersonaliView


urlpatterns = [
    path('gruppo/mensili/', StatisticheMensiliView.as_view(), name='stats-gruppo-mensili'),
    path('gruppo/annuali/', StatisticheAnnualiView.as_view(), name='stats-gruppo-annuali'),
    path('gruppo/saldi/', SaldiView.as_view(), name='stats-gruppo-saldi'),
    path('personali/', StatistichePersonaliView.as_view(), name='stats-personali'),
]