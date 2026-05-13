import os
from celery import Celery

# Imposta il modulo settings di default per Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

app = Celery('project')

# Carica le configurazioni dal file settings.py usando il prefisso 'CELERY_'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Cerca automaticamente i file tasks.py in tutte le app registrate
app.autodiscover_tasks()