from notifiche.services import send_telegram_notification


def notifica_nuovo_membro_telegram(gruppo, nuovo_utente):
    """
    Avvisa gli attuali membri del gruppo che un nuovo utente si è unito.
    """
    messaggio = (
        f"👋 <b>Nuovo arrivo in casa!</b>\n\n"
        f"👤 <b>{nuovo_utente.nome} {nuovo_utente.cognome or ''}</b> si è appena unito a <i>{gruppo.nome}</i>.\n\n"
        f"📱 Aprite RoomSplit per iniziare a dividere le spese insieme."
    )

    membri_da_notificare = gruppo.membri.exclude(user=nuovo_utente)

    for membro in membri_da_notificare:
        send_telegram_notification(membro.user, messaggio)


def notifica_membro_rimosso_telegram(gruppo, utente_rimosso, utente_esecutore):
    """
    Avvisa i membri rimanenti che qualcuno ha lasciato il gruppo o è stato rimosso.
    """
    if utente_rimosso == utente_esecutore:
        azione = "ha deciso di lasciare"
    else:
        azione = "è stato rimosso da"

    messaggio = (
        f"🚪 <b>Aggiornamento Gruppo</b>\n\n"
        f"👤 <b>{utente_rimosso.nome}</b> {azione} <i>{gruppo.nome}</i>.\n"
        f"I saldi passati rimangono invariati, ma non parteciperà alle nuove spese."
    )

    # Notifica per i membri rimasti
    membri_rimanenti = gruppo.membri.exclude(user=utente_rimosso)

    for membro in membri_rimanenti:
        send_telegram_notification(membro.user, messaggio)