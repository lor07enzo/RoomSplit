#!/bin/bash
# entrypoint-cron.sh

# Esporta le variabili d'ambiente per cron
printenv | grep -v "no_proxy" >> /etc/environment

# CREA LA CARTELLA DI SISTEMA SE NON ESISTE
mkdir -p /etc/cron.d

# Crea il crontab che esegue il comando ogni giorno a mezzanotte (00:00)
# e redireziona l'output verso il log standard di Docker
echo "0 0 * * * /usr/local/bin/python /app/manage.py genera_spese > /proc/1/fd/1 2>/proc/1/fd/2" > /etc/cron.d/django-cron

# Dai i permessi
chmod 0644 /etc/cron.d/django-cron
crontab /etc/cron.d/django-cron

# Avvia il demone cron in foreground perché il container resti in vita
cron -f