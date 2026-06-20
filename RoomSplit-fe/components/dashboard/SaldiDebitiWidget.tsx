import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { useSpese } from '@/context/SpeseContext';
import { ArrowUpRight, ArrowDownRight, User, Wallet } from 'lucide-react-native';
import { TipologiaRimborso } from '@/types/types';
import { ModalSaldaDebito } from '../ModalSaldaDebito';

interface DettaglioGruppo {
    gruppo_id: string;
    mio_membro_id: string;
    suo_membro_id: string;
    suo_bilancio_nel_gruppo: number;
    mio_bilancio_nel_gruppo: number;
}

interface SaldoAggregato {
    utente_id: string;
    nome: string;
    bilancio_netto: number;
    dettagli_gruppi: DettaglioGruppo[];
}

interface SaldiDebitiWidgetProps {
    staCaricandoDati: boolean;
}

export function SaldiDebitiWidget({ staCaricandoDati }: SaldiDebitiWidgetProps) {
    const { user } = useAuth();
    const { saldiPerGruppo, inviaRimborso, isLoadingSaldi } = useSpese();
    const [isProcessing, setIsProcessing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [datiRimborsoCorrente, setDatiRimborsoCorrente] = useState<{
        utente: SaldoAggregato, 
        importo: number, 
        gruppo: any
    } | null>(null);

    // Calcolo del saldo globale netto dell'utente corrente
    const mioBilancioTotale = useMemo(() => {
        if (!user) return 0;
        let totale = 0;
        Object.values(saldiPerGruppo).forEach(saldi => {
            const mio = saldi.find(s => s.utente_id === user.id);
            if (mio) totale += mio.bilancio;
        });
        return totale;
    }, [saldiPerGruppo, user]);

    // Aggregazione e bilanciamento incrociato dei saldi degli altri utenti
    const saldiAggregati = useMemo(() => {
        if (!user) return [];
        const mappa = new Map<string, SaldoAggregato>();

        Object.entries(saldiPerGruppo).forEach(([gruppoId, saldi]) => {
            const mioSaldo = saldi.find(s => s.utente_id === user.id);
            
            if (!mioSaldo || Math.abs(mioSaldo.bilancio) < 0.01) return;

            saldi.forEach(suoSaldo => {
                if (suoSaldo.utente_id === user.id || Math.abs(suoSaldo.bilancio) < 0.01) return;

                const sonoInDebitoIo = mioSaldo.bilancio < 0;
                const eInDebitoLui = suoSaldo.bilancio < 0;

                if (sonoInDebitoIo === eInDebitoLui) return;

                const importoCompensabile = Math.min(
                    Math.abs(mioSaldo.bilancio),
                    Math.abs(suoSaldo.bilancio)
                );

                const deltaNetto = sonoInDebitoIo ? importoCompensabile : -importoCompensabile;

                const esistente = mappa.get(suoSaldo.utente_id);
                const dettaglio: DettaglioGruppo = {
                    gruppo_id: gruppoId,
                    mio_membro_id: mioSaldo.membro_id,
                    suo_membro_id: suoSaldo.membro_id,
                    suo_bilancio_nel_gruppo: suoSaldo.bilancio,
                    mio_bilancio_nel_gruppo: mioSaldo.bilancio,
                };

                if (esistente) {
                    esistente.bilancio_netto += deltaNetto;
                    esistente.dettagli_gruppi.push(dettaglio);
                } else {
                    mappa.set(suoSaldo.utente_id, {
                        utente_id: suoSaldo.utente_id,
                        nome: suoSaldo.nome,
                        bilancio_netto: deltaNetto,
                        dettagli_gruppi: [dettaglio]
                    });
                }
            });
        });

        return Array.from(mappa.values())
            .filter(u => Math.abs(u.bilancio_netto) > 0.01)
            .sort((a, b) => b.bilancio_netto - a.bilancio_netto);
    }, [saldiPerGruppo, user]);

    const handlePreparaSaldamento = (utenteTarget: SaldoAggregato) => {
        if (utenteTarget.bilancio_netto < 0) {
            Alert.alert(
                "Azione non consentita", 
                `Solo chi si trova in una posizione di debito può registrare il rimborso. Chiedi a ${utenteTarget.nome} di inserirlo dal suo dispositivo.`
            );
            return;
        }

        const gruppoDaSaldare = utenteTarget.dettagli_gruppi
            .filter(d => d.mio_bilancio_nel_gruppo < 0 && d.suo_bilancio_nel_gruppo > 0)
            .sort((a, b) => a.mio_bilancio_nel_gruppo - b.mio_bilancio_nel_gruppo)[0];

        if (!gruppoDaSaldare) {
            Alert.alert("Attenzione", "Non sono stati rilevati debiti diretti compensabili con questo utente nei gruppi correnti.");
            return;
        }

        const importoDaSaldare = Math.min(
            Math.abs(gruppoDaSaldare.mio_bilancio_nel_gruppo), 
            Math.abs(gruppoDaSaldare.suo_bilancio_nel_gruppo)
        );

        setDatiRimborsoCorrente({
            utente: utenteTarget,
            importo: importoDaSaldare,
            gruppo: gruppoDaSaldare
        });
        setModalVisible(true);
    };

    const eseguiRimborso = async (tipologia: TipologiaRimborso, notaFirma: string) => {
        if (!datiRimborsoCorrente) return;
        
        setIsProcessing(true);
        const { gruppo, importo } = datiRimborsoCorrente;

        const payload = {
            from_membro: gruppo.mio_membro_id,
            to_membro: gruppo.suo_membro_id,
            importo: importo,
            tipologia: tipologia,
            nota: notaFirma.trim() || `Saldato tramite ${tipologia}`
        };
        
        const esito = await inviaRimborso(payload, gruppo.gruppo_id);
        
        setIsProcessing(false);
        setModalVisible(false);

        if (esito) {
            Alert.alert("Operazione Completata", "Il rimborso è stato registrato con successo.");
        } else {
            Alert.alert("Errore", "Impossibile elaborare la richiesta di rimborso.");
        }
    };

    return (
        <View>
            {/* CARD SALDO NETTO TOTALE */}
            <View className={`${mioBilancioTotale >= 0 ? 'bg-blue-600 dark:bg-blue-700' : 'bg-red-500 dark:bg-red-600'} rounded-[24px] p-6 mb-6 shadow-md`}>
                <Text className="text-blue-100 text-sm font-medium mb-1">Saldo Netto Totale</Text>
                <View className="flex-row items-center mb-4">
                    <Text className="text-white text-4xl font-bold tracking-tight">
                        <Text className="text-2xl font-semibold mr-0.5">{mioBilancioTotale >= 0 ? '+' : '-'}</Text>
                        €{Math.abs(mioBilancioTotale).toFixed(2)}
                    </Text>
                    {staCaricandoDati && <ActivityIndicator className="ml-3" color="#ffffff" size="small" />}
                </View>
                <View className="flex-row gap-3">
                    <View className={`${mioBilancioTotale >= 0 ? 'bg-green-400/20' : 'bg-red-900/30'} px-3 py-1.5 rounded-full flex-row items-center`}>
                        {mioBilancioTotale >= 0 
                            ? <ArrowUpRight size={16} color="#4ade80" /> 
                            : <ArrowDownRight size={16} color="#fca5a5" />
                        }
                        <Text className={`${mioBilancioTotale >= 0 ? 'text-green-400' : 'text-red-200'} font-semibold text-xs ml-1`}>
                            {mioBilancioTotale >= 0 ? 'In Credito' : 'In Debito'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Lista di Riepilogo Debitori e Creditori */}
            <View className="bg-white dark:bg-slate-800 rounded-[24px] p-5 mb-6 shadow-sm border border-slate-100 dark:border-slate-700/60">
                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4 leading-tight">Riepilogo Saldi</Text>
                
                {staCaricandoDati ? (
                    <ActivityIndicator className="py-6" size="small" color="#2563eb" />
                ) : saldiAggregati.length === 0 ? (
                    <Text className="text-slate-400 dark:text-slate-500 text-sm italic py-2">
                        Nessun debito o credito attivo nei gruppi.
                    </Text>
                ) : (
                    <View className="gap-y-1">
                        {saldiAggregati.map((saldo, index) => (
                            <View 
                              key={saldo.utente_id} 
                              className={`flex-row items-center justify-between py-3.5 ${index !== saldiAggregati.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/30' : ''}`}
                            >
                                <View className="flex-row items-center flex-1 pr-2">
                                    <View className="bg-slate-50 dark:bg-slate-700/50 w-11 h-11 rounded-full items-center justify-center mr-3 border border-slate-100/60 dark:border-slate-700/20">
                                        <User size={18} className="text-slate-500 dark:text-slate-400" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-semibold text-base text-slate-900 dark:text-white" numberOfLines={1}>{saldo.nome}</Text>
                                        <Text className={`text-sm font-semibold mt-0.5 ${saldo.bilancio_netto > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {saldo.bilancio_netto > 0 ? `Devi €${saldo.bilancio_netto.toFixed(2)}` : `Ti deve €${Math.abs(saldo.bilancio_netto).toFixed(2)}`}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row gap-2 pl-1">
                                    {saldo.bilancio_netto > 0 && (
                                        <TouchableOpacity 
                                            onPress={() => handlePreparaSaldamento(saldo)}
                                            className="bg-slate-900 dark:bg-blue-600 px-4 py-2 rounded-lg flex-row items-center active:scale-95"
                                        >
                                            <Wallet size={14} color="white" className="mr-1.5" />
                                            <Text className="text-white font-bold text-xs">Salda</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Modal Rimborso */}
            <ModalSaldaDebito
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                nomeCreditore={datiRimborsoCorrente?.utente.nome || ''}
                importo={datiRimborsoCorrente?.importo || 0}
                isProcessing={isProcessing}
                onConfirm={eseguiRimborso}
            />
        </View>
    );
}