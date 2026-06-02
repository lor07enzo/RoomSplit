import requests
from django.conf import settings

def send_telegram_notification(user, message):
    """
    Invia una notifica Telegram all'utente sfruttando la relazione OneToOne.
    """
    # Controlla in modo sicuro se esiste la relazione e se c'è un chat_id valido
    if not hasattr(user, 'profilo_telegram') or not user.profilo_telegram.chat_id:
        return False

    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    if not bot_token:
        print("TELEGRAM_BOT_TOKEN non configurato.")
        return False

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": user.profilo_telegram.chat_id,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return True
    
    except requests.exceptions.HTTPError as e:
        if response.status_code == 403:
            user.profilo_telegram.chat_id = None
            user.profilo_telegram.save()
            print(f"L'utente {user.email} ha bloccato il bot. Scollegato.")
        return False