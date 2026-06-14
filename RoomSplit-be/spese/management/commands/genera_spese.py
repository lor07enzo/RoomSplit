from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.timezone import make_aware
from dateutil.relativedelta import relativedelta
from spese.models import GruppoSpesa 
import datetime

class Command(BaseCommand):
    help = 'Cerca le spese ricorrenti scadute, aggiorna il prossimo pagamento e ne genera una nuova copia'

    def handle(self, *args, **kwargs):
        oggi = timezone.now().date()
        
        # Prende solo le spese che hanno la ricorrenza attiva
        spese_ricorrenti = GruppoSpesa.objects.filter(is_ricorrente=True)
        spese_generate = 0

        for spesa in spese_ricorrenti:
            # DETERMINAZIONE DATA DI PARTENZA
            if spesa.prossimo_pagamento:
                data_riferimento = spesa.prossimo_pagamento
                if isinstance(data_riferimento, datetime.datetime):
                    data_riferimento = data_riferimento.date()
            else:
                data_riferimento = spesa.created_at.date() if spesa.created_at else oggi

            numero = spesa.frequenza_numero or 1
            try:
                numero = int(numero)
            except ValueError:
                numero = 1
                
            tipo = spesa.frequenza_tipo or 'mesi'

            # Calcola il delta per lo slittamento del periodo
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

            # INIZIALIZZAZIONE SE ASSENTE
            if not spesa.prossimo_pagamento:
                data_calcolata = data_riferimento + delta
                # Converte la data in datetime a mezzanotte e applica la timezone attiva
                naive_dt = datetime.datetime.combine(data_calcolata, datetime.time.min)
                spesa.prossimo_pagamento = make_aware(naive_dt)
                spesa.save()
                data_scadenza = data_calcolata
            else:
                data_scadenza = data_riferimento

            # VERIFICA SCADENZA E CLONAZIONE
            if oggi >= data_scadenza:
                
                # L'originale diventa lo storico statico
                spesa.is_ricorrente = False
                spesa.prossimo_pagamento = None
                spesa.save()

                # Genera l'istanza clone proiettata nel futuro
                spesa.pk = None 
                spesa.saldata = False 
                spesa.is_ricorrente = True
                
                # Calcola la nuova scadenza, la rende aware e la assegna al clone
                data_futura = data_scadenza + delta
                naive_dt_futura = datetime.datetime.combine(data_futura, datetime.time.min)
                spesa.prossimo_pagamento = make_aware(naive_dt_futura)
                
                spesa.save() 
                
                spese_generate += 1
                self.stdout.write(self.style.SUCCESS(f'Generata nuova spesa per: {spesa.nome} (Nuova scadenza: {spesa.prossimo_pagamento.date()})'))

        if spese_generate == 0:
            self.stdout.write(self.style.WARNING('Nessuna spesa ricorrente da generare oggi.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\nOperazione completata! Totale spese generate: {spese_generate}'))