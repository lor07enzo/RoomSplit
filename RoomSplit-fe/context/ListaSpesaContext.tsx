import React, { createContext, useContext, useState, useCallback } from 'react';
import { ListaSpesa, Gruppo, Articolo } from '@/types/types';
import { ListaSpesaService } from '@/services/listaSpesa';
import { GruppiService } from '@/services/gruppi';

interface ListaSpesaContextType {
    liste: ListaSpesa[];
    gruppi: Gruppo[];
    articoli: Articolo[] | [];
    currentLista: ListaSpesa | null;
    loading: boolean;
    loadingArticoli: boolean;
    error: string | null;
    fetchListeEGruppi: () => Promise<void>;
    creaNuovaLista: (titolo: string, gruppoId: string | null) => Promise<void>;
    fetchDettaglioLista: (id: string) => Promise<void>;
    aggiungiArticolo: (listaId: string, nome: string, quantita: number) => Promise<void>;
    toggleArticolo: (articoloId: string, isPreso: boolean) => Promise<void>;
    cancellaLista: (listaId: string) => Promise<void>;
    cancellaArticolo: (articoloId: string) => Promise<void>;
    svuotaArticoliPresi: (listaId: string) => Promise<void>;
}

const ListaSpesaContext = createContext<ListaSpesaContextType | undefined>(undefined);

export function ListaSpesaProvider({ children }: { children: React.ReactNode }) {
    const [liste, setListe] = useState<ListaSpesa[]>([]);
    const [gruppi, setGruppi] = useState<Gruppo[]>([]);
    const [articoli, setArticoli] = useState<Articolo[] | []>([]);
    const [currentLista, setCurrentLista] = useState<ListaSpesa | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingArticoli, setLoadingArticoli] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchListeEGruppi = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
        const [listeData, gruppiData] = await Promise.all([
            ListaSpesaService.getListe(),
            GruppiService.getGruppi()
        ]);
            setListe(listeData);
            setGruppi(gruppiData);
        } catch (err) {
            console.error(err);
            setError('Errore nel caricamento dei dati.');
        } finally {
        setLoading(false);
        }
    }, []);

    const creaNuovaLista = async (titolo: string, gruppoId: string | null) => {
        try {
            const nuovaLista = await ListaSpesaService.createLista(titolo, gruppoId);
            setListe((prev) => [nuovaLista, ...prev]);
        } catch (err) {
            console.error(err);
            throw new Error('Impossibile creare la lista della spesa.');
        }
    };

    // Carica il dettaglio di una lista e i suoi articoli
    const fetchDettaglioLista = useCallback(async (id: string) => {
        try {
            setLoadingArticoli(true);
            const data = await ListaSpesaService.getDettaglioLista(id);
            setCurrentLista(data);
            setArticoli(data.articoli || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingArticoli(false);
        }
    }, []);

    // Aggiunge un articolo allo stato globale
    const aggiungiArticolo = async (listaId: string, nome: string, quantita: number) => {
        try {
            const nuovoArticolo = await ListaSpesaService.addArticolo(listaId, nome, quantita);
            setArticoli((prev) => [nuovoArticolo, ...prev]);
        } catch (err) {
            console.error(err);
            throw new Error('Impossibile aggiungere l\'articolo.');
        }
    };

    // Modifica lo stato preso/non preso dell'articolo
    const toggleArticolo = async (articoloId: string, isPreso: boolean) => {
        if (!articoloId) return;
        try {
            const updatedArt = await ListaSpesaService.toggleArticolo(articoloId, !isPreso);
            setArticoli((prev) =>
                prev.map((art) => 
                    art.id === articoloId ? { ...art, ...updatedArt } : art
                )
            );
        } catch (err) {
            console.error(err);
            throw new Error('Impossibile aggiornare lo stato dell\'articolo.');
        }
    };

    const cancellaLista = async (listaId: string) => {
        try {
            await ListaSpesaService.deleteLista(listaId);
            setListe((prev) => prev.filter((l) => l.id !== listaId));
        } catch (err) {
            console.error("Errore durante la rimozione della lista:", err);
            throw err;
        }
    }

    const cancellaArticolo = async (articoloId: string) => {
        try {
            await ListaSpesaService.deleteArticolo(articoloId);
            setArticoli((prev) => prev.filter((art) => art.id !== articoloId));
        } catch (err) {
            console.error("Errore durante la rimozione dell'articolo:", err);
            throw err;
        }
    };

    const svuotaArticoliPresi = async (listaId: string) => {
        try {
            await ListaSpesaService.svuotaArticoliPresi(listaId);
            setArticoli((prev) => prev.filter((art) => !art.preso_da));
        } catch (err) {
            console.error("Errore durante lo svuotamento degli articoli presi:", err);
            throw err;
        }
    };

    return (
        <ListaSpesaContext.Provider value={{ 
            liste, gruppi, articoli, currentLista, loading, loadingArticoli, error, 
            fetchListeEGruppi, creaNuovaLista, fetchDettaglioLista, aggiungiArticolo, toggleArticolo, cancellaArticolo, svuotaArticoliPresi, cancellaLista
        }}>
            {children}
        </ListaSpesaContext.Provider>
    );
}

export function useListaSpesa() {
    const context = useContext(ListaSpesaContext);
    if (context === undefined) {
        throw new Error("useListaSpesa deve essere usato all'interno di uno ListaSpesaProvider");
    }
    return context;
}