FROM python:3.13-slim

# Imposta le variabili d'ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Imposta la directory di lavoro
WORKDIR /app

# Installa le dipendenze di sistema
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia i requisiti e installa le librerie Python
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copia il resto del codice del progetto
COPY . /app/

# Crea un utente di sistema chiamato 'roomsplit_user' (senza password)
RUN adduser --disabled-password --no-create-home roomsplit_user

# Assegna a questo nuovo utente la proprietà della cartella /app
RUN chown -R roomsplit_user:roomsplit_user /app

# Istruisci Docker a usare questo utente per tutti i comandi successivi (es. il runserver)
USER roomsplit_user