FROM python:3.13-slim

# Evita che Python scriva file .pyc su disco e forza l'output su stdout (utile per i log Docker)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Installa dipendenze di sistema per PostgreSQL e l'OCR
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Installa le dipendenze Python
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copia tutto il codice del progetto nel container
COPY . /app/