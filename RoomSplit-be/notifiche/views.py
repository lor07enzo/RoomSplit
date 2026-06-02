import uuid
import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from notifiche.services import send_telegram_notification
from .models import ProfiloTelegram

class GenerateTelegramTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Recupera o crea il profilo Telegram collegato all'utente loggato
        profilo_tg, created = ProfiloTelegram.objects.get_or_create(user=request.user)
        
        # Genera il token univoco
        random_str = uuid.uuid4().hex[:6].upper()
        token = f"RS-{random_str}"
        
        # Salva il token
        profilo_tg.connect_token = token
        profilo_tg.save()
        
        return Response({
            "token": token,
            "bot_url": "https://t.me/RoomSplit_bot"
        })
    
class TelegramWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        
        if 'message' in data and 'text' in data['message']:
            chat_id = data['message']['chat']['id']
            text = str(data['message']['text']).strip()

            # Accetta sia "/start RS-XXX" che "RS-XXX" puro
            if text.startswith('/start RS-') or text.startswith('RS-'):
                # Estrae il token in base a come è stato inviato
                token_ricevuto = text.split(' ')[1] if text.startswith('/start') else text
                
                try:
                    profilo = ProfiloTelegram.objects.get(connect_token=token_ricevuto)
                    
                    profilo.chat_id = str(chat_id)
                    profilo.connect_token = None 
                    profilo.save()
                    
                    messaggio_conferma = (
                        f"<b>Perfetto {profilo.user.nome}!</b>\n\n"
                        "Il tuo account RoomSplit è stato ricollegato con successo.\n"
                        "Da ora in poi riceverai qui le notifiche importanti sulle spese."
                    )
                    self._send_raw_message(chat_id, messaggio_conferma)
                    
                except ProfiloTelegram.DoesNotExist:
                    self._send_raw_message(chat_id, "Codice non valido o già utilizzato. Generane uno nuovo dall'app RoomSplit.")
            
            elif text == '/start':
                messaggio_aiuto = (
                    "Ciao! Sembra che Telegram non abbia letto il tuo codice di collegamento in automatico.\n\n"
                    "Scrivi in questa chat il tuo codice personale (quello che inizia per <b>RS-</b>) che vedi nell'app RoomSplit per completare l'attivazione."
                )
                self._send_raw_message(chat_id, messaggio_aiuto)

        return Response({"status": "ok"}, status=200)

    def _send_raw_message(self, chat_id, text):
        """Metodo di supporto per inviare messaggi diretti a chat_id non ancora registrati"""
        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
        if bot_token:
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"})

# Gestisce il collegamento di Telegram (collegato/scollegato)
class TelegramStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Cerca se esiste un profilo per l'utente loggato
        try:
            profilo = ProfiloTelegram.objects.get(user=request.user)
            is_connected = profilo.chat_id is not None
            return Response({
                "connected": is_connected,
            })
        except ProfiloTelegram.DoesNotExist:
            return Response({"connected": False})

    def delete(self, request):
        # Endpoint per "Scollegare" l'account
        try:
            profilo = ProfiloTelegram.objects.get(user=request.user)
            profilo.chat_id = None
            profilo.save()
            return Response({"messaggio": "Account Telegram scollegato con successo."})
        except ProfiloTelegram.DoesNotExist:
            return Response({"errore": "Nessun account collegato trovato."}, status=404)