from django.urls import path
from .views import GenerateTelegramTokenView, TelegramStatusView, TelegramWebhookView

urlpatterns = [
    path('telegram/generate-token/', GenerateTelegramTokenView.as_view(), name='generate_telegram_token'),
    # Rotta che va in pasto a Telegram
    path('telegram/webhook/', TelegramWebhookView.as_view(), name='telegram_webhook'),
    path('telegram/status/', TelegramStatusView.as_view(), name='telegram-status'),
]