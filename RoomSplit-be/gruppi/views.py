from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Gruppo, Membro
from .serializers import GruppoSerializer

class GruppoViewSet(viewsets.ModelViewSet):
    serializer_class = GruppoSerializer
    permission_classes = [IsAuthenticated]

    # Metodo per filtrare i gruppi a cui l'utente appartiene
    def get_queryset(self):
        return Gruppo.objects.filter(membri__user=self.request.user)
    
    # Metodo per creare un nuovo gruppo e assegnare l'utente come amministratore
    def perform_create(self, serializer):
        gruppo = serializer.save()
        Membro.objects.create(user=self.request.user, gruppo=gruppo, ruolo='admin')

    # Recupera i membri del gruppo corrente
    @action(detail=True, methods=['get'], url_path='membri')
    def ottieni_membri(self, request, pk=None):
        gruppo = self.get_object()
        membri = gruppo.membri.all()
        
        dati_membri = []
        for m in membri:
            dati_membri.append({
                "id": m.id,
                "ruolo": m.ruolo,
                "user": {
                    "id": m.user.id,
                    "email": m.user.email,
                    "nome": m.user.nome,
                    "cognome": m.user.cognome if hasattr(m.user, 'cognome') else ""
                }
            })
        return Response(dati_membri, status=status.HTTP_200_OK)

    # Metodo per aggiungere un membro al gruppo tramite codice invito
    @action(detail=False, methods=['post'], url_path='join')
    def join_group(self, request):
        codice = request.data.get('codice_invito')
        if not codice:
            return Response({"errore": "Codice invito mancante."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            gruppo = Gruppo.objects.get(codice_invito=codice)
        except Gruppo.DoesNotExist:
            return Response({"errore": "Codice invito non valido."}, status=status.HTTP_404_NOT_FOUND)
        
        if Membro.objects.filter(user=request.user, gruppo=gruppo).exists():
            return Response({"errore": "Sei già membro di questo gruppo."}, status=status.HTTP_400_BAD_REQUEST)

        Membro.objects.create(user=request.user, gruppo=gruppo, ruolo='membro')

        return Response({
            "messaggio": f"Sei entrato con successo nel gruppo '{gruppo.nome}'",
            "gruppo_id": gruppo.id
        }, status=status.HTTP_201_CREATED)
    
    
    # Metodo per rimuovere un membro o lasciare il gruppo
    @action(detail=True, methods=['post'], url_path='remove-member')
    def remove_member(self, request, pk=None):
        gruppo = self.get_object() 
        user_id_to_remove = request.data.get('user_id')

        if not user_id_to_remove:
             return Response({"errore": "Devi specificare l'ID dell'utente da rimuovere."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            current_member = Membro.objects.get(user=request.user, gruppo=gruppo)
        except Membro.DoesNotExist:
            return Response({"errore": "Non fai parte di questo gruppo."}, status=status.HTTP_403_FORBIDDEN)

        is_self_removal = str(request.user.id) == str(user_id_to_remove)
        if not is_self_removal and current_member.ruolo != 'admin':
            return Response({"errore": "Solo l'amministratore può rimuovere altri membri."}, status=status.HTTP_403_FORBIDDEN)

        try:
            member_to_remove = Membro.objects.get(user_id=user_id_to_remove, gruppo=gruppo)
            member_to_remove._utente_esecutore = request.user 
            member_to_remove.delete()

            return Response({"messaggio": "Membro rimosso con successo."}, status=status.HTTP_200_OK)
        except Membro.DoesNotExist:
            return Response({"errore": "Utente non trovato nel gruppo."}, status=status.HTTP_404_NOT_FOUND)