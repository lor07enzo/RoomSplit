from notifiche.services import send_telegram_notification

def notifica_nuova_spesa_telegram(gruppo_spesa):
    """
    Invia una notifica Telegram a tutti i membri del gruppo coinvolti nella spesa,
    escludendo l'utente che ha effettuato l'acquisto.
    """
    # Non invia notifica se è personale
    if gruppo_spesa.is_personale or not gruppo_spesa.gruppo:
        return

    pagatore = gruppo_spesa.pagatore
    gruppo = gruppo_spesa.gruppo
    importo_formattato = f"{float(gruppo_spesa.importo):.2f}"

    messaggio = (
        f"💸 <b>Nuova Spesa in {gruppo.nome}</b>\n\n"
        f"👤 <b>{pagatore.nome}</b> ha aggiunto: <i>{gruppo_spesa.nome}</i>\n"
        f"💰 Totale: <b>{importo_formattato}€</b>\n\n"
        f"📱 Apri l'app RoomSplit per controllare la tua quota e i saldi aggiornati!"
    )

    membri_da_notificare = gruppo.membri.exclude(user=pagatore)

    for membro in membri_da_notificare:
        utente_destinatario = membro.user
        send_telegram_notification(utente_destinatario, messaggio)


def notifica_nuovo_rimborso_telegram(rimborso):
    """
    Invia una notifica Telegram all'utente che ha ricevuto un rimborso.
    """
    # Chi invia i soldi
    membro_mittente = rimborso.from_membro
    utente_mittente = membro_mittente.user
    # Chi riceve i soldi
    membro_ricevente = rimborso.to_membro
    utente_ricevente = membro_ricevente.user
    
    importo_formattato = f"{float(rimborso.importo):.2f}"

    messaggio = (
        f"✅ <b>Nuovo Rimborso Ricevuto!</b>\n\n"
        f"👤 <b>{utente_mittente.nome}</b> ti ha appena inviato <b>{importo_formattato}€</b>.\n\n"
        f"📱 Apri l'app RoomSplit per controllare i tuoi saldi aggiornati!"
    )

    # Inviamo la notifica SOLO a chi riceve i soldi
    send_telegram_notification(utente_ricevente, messaggio)