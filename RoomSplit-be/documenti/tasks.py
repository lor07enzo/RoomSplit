from background_task import background
from .services import estrai_dati_bolletta

# schedule=0 dice al database che il task va eseguito immediatamente (appena il worker è libero)
@background(schedule=0)
def task_estrai_dati_bolletta(documento_id_str):
    """
    Task asincrono per l'estrazione OCR della bolletta.
    """
    estrai_dati_bolletta(documento_id_str)