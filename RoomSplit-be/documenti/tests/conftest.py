import tempfile

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from gruppi.models import Gruppo, Membro
from spese.models import GruppoSpesa

User = get_user_model()

@pytest.fixture(autouse=True)
def disable_cloudinary(settings):
    """
    Disabilita Cloudinary durante i test e usa lo storage locale.
    Questo evita chiamate API reali e l'errore sui file mockati.
    """
    # Override per Django 4.2+
    settings.STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
    # Override per versioni di Django precedenti
    settings.DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
    
    # Salva i file fittizi in una cartella temporanea del sistema operativo
    settings.MEDIA_ROOT = tempfile.mkdtemp()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def gruppo_condiviso(db, user1):
    gruppo = Gruppo.objects.create(nome="Gruppo Documenti")
    Membro.objects.create(user=user1, gruppo=gruppo, ruolo="admin")
    return gruppo

@pytest.fixture
def spesa_test(db, user1, gruppo_condiviso):
    return GruppoSpesa.objects.create(
        nome="Spesa Test Documento", user=user1, pagatore=user1, gruppo=gruppo_condiviso, importo=10.0
    )

@pytest.fixture
def mock_file():
    # Simula un file PDF fittizio
    return SimpleUploadedFile("test_file.pdf", b"contenuto_finto_del_file", content_type="application/pdf")