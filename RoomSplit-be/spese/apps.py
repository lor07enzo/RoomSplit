# spese/apps.py
from django.apps import AppConfig
from django.db.models.signals import post_migrate

def crea_categorie_default(sender, **kwargs):
    from .models import Categoria

    categorie_default = [
        {"nome": "Utenze", "icona": "🔌", "colore": "#FF9800"},
        {"nome": "Trasporti", "icona": "🚌", "colore": "#2196F3"},
        {"nome": "Spesa alimentare", "icona": "🛒", "colore": "#4CAF50"},
        {"nome": "Uscite", "icona": "🍕", "colore": "#E91E63"},
        {"nome": "Affitto", "icona": "🏠", "colore": "#9C27B0"},
        {"nome": "Altro", "icona": "📦", "colore": "#607D8B"},
    ]

    for cat_data in categorie_default:
        Categoria.objects.get_or_create(
            nome=cat_data["nome"],
            defaults={
                "icona": cat_data["icona"],
                "colore": cat_data["colore"]
            }
        )

class SpeseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'spese'

    def ready(self):
        import spese.signals
        post_migrate.connect(crea_categorie_default, sender=self)
