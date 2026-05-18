from django.core.management.base import BaseCommand
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from spese.models import GruppoSpesa 

class Command(BaseCommand):
    help = 'Cerca le spese ricorrenti scadute e ne genera una nuova copia'

    def handle(self, *args, **kwargs):
        oggi = timezone.now().date()
        
        # Prende solo le spese che hanno la ricorrenza attiva
        spese_ricorrenti = GruppoSpesa.objects.filter(is_ricorrente=True)
        spese_generate = 0

        for spesa in spese_ricorrenti:
            data_creazione = spesa.created_at.date() 
            numero = spesa.frequenza_numero or 1
            tipo = spesa.frequenza_tipo or 'mesi'

            # Calcola la data in cui dovrebbe essere generata la prossima spesa
            if tipo == 'giorni':
                delta = relativedelta(days=numero)
            elif tipo == 'settimane':
                delta = relativedelta(weeks=numero)
            elif tipo == 'mesi':
                delta = relativedelta(months=numero)
            elif tipo == 'anni':
                delta = relativedelta(years=numero)
            else:
                continue

            data_scadenza = data_creazione + delta

            # Clona la spesa se la data attuale è uguale o maggiore della data di scadenza
            if oggi >= data_scadenza:
                
                spesa.is_ricorrente = False
                spesa.save()

                spesa.pk = None 
                
                spesa.saldata = False 
                spesa.is_ricorrente = True
                
                # Salva il clone. (I documenti allegati della vecchia spesa 
                # non vengono copiati automaticamente)
                spesa.save() 
                
                spese_generate += 1
                self.stdout.write(self.style.SUCCESS(f'Generata nuova spesa per: {spesa.nome}'))

        if spese_generate == 0:
            self.stdout.write(self.style.WARNING('Nessuna spesa ricorrente da generare oggi.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\nOperazione completata! Totale spese generate: {spese_generate}'))