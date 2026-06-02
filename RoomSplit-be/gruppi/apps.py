from django.apps import AppConfig


class GruppiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'gruppi'

    def ready(self):
        import gruppi.signals

