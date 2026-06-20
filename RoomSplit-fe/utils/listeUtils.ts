import { Gruppo, ListaSpesa } from '@/types/types';

export const raggruppaPerGruppo = (listeGruppo: ListaSpesa[]) => {
  const raggruppamento = listeGruppo.reduce((acc, item) => {
    if (!item.gruppo) return acc;
    
    const gruppoId = typeof item.gruppo === 'object' ? item.gruppo.id : item.gruppo;
    if (!gruppoId) return acc;

    if (!acc[gruppoId]) {
      acc[gruppoId] = { 
        gruppo: typeof item.gruppo === 'object' 
          ? item.gruppo 
          : { id: gruppoId, nome: `Gruppo ${gruppoId}`, codice_invito: '', created_at: '' }, 
        items: [] 
      };
    }
    acc[gruppoId].items.push(item);
    return acc;
  }, {} as Record<string, { gruppo: Gruppo; items: ListaSpesa[] }>);

  return Object.values(raggruppamento);
};