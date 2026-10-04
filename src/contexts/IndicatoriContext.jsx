import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const IndicatoriContext = createContext(null);

// Indicatori fissi mostrati in alto nell'area di staging (vedi IndicatoriTavolo):
// CP Blu/CP Rosso e Turno hanno titolo fisso e partono da 1; i due "extra" (uno vicino a CP
// Blu, uno vicino a CP Rosso) hanno titolo modificabile dall'utente e partono da 0. Le chiavi
// dell'oggetto sono usate anche come id stabili per il salvataggio/ripristino della partita.
// `giocatoreAttivo` è l'eccezione: il suo `valore` non è un numero ma l'id dell'esercito di cui
// è il turno ('blu' | 'rosso'), e si cambia solo con `alternaGiocatoreAttivo`.
export const INDICATORI_INIZIALI = {
  cpBlu: { titolo: 'CP Blu', valore: 1, titoloModificabile: false },
  extraBlu: { titolo: 'Extra', valore: 0, titoloModificabile: true },
  turno: { titolo: 'Turno', valore: 1, titoloModificabile: false },
  extraRosso: { titolo: 'Extra', valore: 0, titoloModificabile: true },
  cpRosso: { titolo: 'CP Rosso', valore: 1, titoloModificabile: false },
  giocatoreAttivo: { titolo: 'Tocca a', valore: 'blu', titoloModificabile: false },
};

export function IndicatoriProvider({ children }) {
  const [indicatori, setIndicatori] = useState(INDICATORI_INIZIALI);

  const incrementaIndicatore = useCallback((chiave) => {
    setIndicatori((prev) => ({
      ...prev,
      [chiave]: { ...prev[chiave], valore: prev[chiave].valore + 1 },
    }));
  }, []);

  const decrementaIndicatore = useCallback((chiave) => {
    setIndicatori((prev) => ({
      ...prev,
      [chiave]: { ...prev[chiave], valore: Math.max(0, prev[chiave].valore - 1) },
    }));
  }, []);

  const alternaGiocatoreAttivo = useCallback(() => {
    setIndicatori((prev) => ({
      ...prev,
      giocatoreAttivo: {
        ...prev.giocatoreAttivo,
        valore: prev.giocatoreAttivo.valore === 'blu' ? 'rosso' : 'blu',
      },
    }));
  }, []);

  const rinominaIndicatore = useCallback((chiave, nuovoTitolo) => {
    setIndicatori((prev) => ({
      ...prev,
      [chiave]: { ...prev[chiave], titolo: nuovoTitolo },
    }));
  }, []);

  // Usato dal Load di SalvataggioPartita: riparte sempre dalle chiavi/proprietà attuali
  // (INDICATORI_INIZIALI) e sovrascrive solo titolo/valore presenti nel salvataggio, così un
  // file di salvataggio precedente a questa funzionalità (senza `indicatori`) o un file con
  // solo alcune chiavi non rompe nulla: i campi mancanti restano ai valori di default.
  const ripristinaIndicatori = useCallback((nuovoStato) => {
    setIndicatori((prev) => {
      const risultato = {};
      for (const chiave of Object.keys(INDICATORI_INIZIALI)) {
        risultato[chiave] = { ...INDICATORI_INIZIALI[chiave], ...(nuovoStato?.[chiave] ?? {}) };
      }
      if (risultato.giocatoreAttivo.valore !== 'blu' && risultato.giocatoreAttivo.valore !== 'rosso') {
        risultato.giocatoreAttivo.valore = INDICATORI_INIZIALI.giocatoreAttivo.valore;
      }
      return risultato;
    });
  }, []);

  const value = useMemo(
    () => ({
      indicatori,
      incrementaIndicatore,
      decrementaIndicatore,
      alternaGiocatoreAttivo,
      rinominaIndicatore,
      ripristinaIndicatori,
    }),
    [
      indicatori,
      incrementaIndicatore,
      decrementaIndicatore,
      alternaGiocatoreAttivo,
      rinominaIndicatore,
      ripristinaIndicatori,
    ],
  );

  return <IndicatoriContext.Provider value={value}>{children}</IndicatoriContext.Provider>;
}

export function useIndicatori() {
  const ctx = useContext(IndicatoriContext);
  if (!ctx) throw new Error('useIndicatori deve essere usato dentro IndicatoriProvider');
  return ctx;
}
