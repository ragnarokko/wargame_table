import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const IndicatoriContext = createContext(null);

// Indicatori fissi mostrati in alto nell'area di staging (vedi IndicatoriTavolo):
// CP Blu/CP Rosso e Turno hanno titolo fisso e partono da 1; i due "extra" (uno vicino a CP
// Blu, uno vicino a CP Rosso) hanno titolo modificabile dall'utente e partono da 0. Le chiavi
// dell'oggetto sono usate anche come id stabili per il salvataggio/ripristino della partita.
// `giocatoreAttivo` è l'eccezione: il suo `valore` non è un numero ma l'id dell'esercito di cui
// è il turno ('blu' | 'rosso'), e lo imposta solo il tracker (`impostaGiocatoreAttivo`).
export const INDICATORI_INIZIALI = {
  cpBlu: { titolo: 'CP Blu', valore: 1, titoloModificabile: false },
  extraBlu: { titolo: 'Extra', valore: 0, titoloModificabile: true },
  turno: { titolo: 'Turno', valore: 1, titoloModificabile: false },
  extraRosso: { titolo: 'Extra', valore: 0, titoloModificabile: true },
  cpRosso: { titolo: 'CP Rosso', valore: 1, titoloModificabile: false },
  giocatoreAttivo: { titolo: 'Tocca a', valore: 'blu', titoloModificabile: false },
};

// Ogni cambio del Turno sposta di altrettanto i CP di Blu e Rosso (+1 al turno nuovo, -1 tornando indietro).
// È l'unico caso in cui un CP può scendere sotto 0: i pulsanti −1 dei CP si fermano a 0.
function conTurno(prev, nuovoTurno) {
  const delta = nuovoTurno - prev.turno.valore;
  if (delta === 0) return prev;
  return {
    ...prev,
    turno: { ...prev.turno, valore: nuovoTurno },
    cpBlu: { ...prev.cpBlu, valore: prev.cpBlu.valore + delta },
    cpRosso: { ...prev.cpRosso, valore: prev.cpRosso.valore + delta },
  };
}

export function IndicatoriProvider({ children }) {
  const [indicatori, setIndicatori] = useState(INDICATORI_INIZIALI);

  const incrementaIndicatore = useCallback((chiave) => {
    setIndicatori((prev) =>
      chiave === 'turno'
        ? conTurno(prev, prev.turno.valore + 1)
        : { ...prev, [chiave]: { ...prev[chiave], valore: prev[chiave].valore + 1 } },
    );
  }, []);

  const decrementaIndicatore = useCallback((chiave) => {
    setIndicatori((prev) =>
      chiave === 'turno'
        ? conTurno(prev, Math.max(0, prev.turno.valore - 1))
        : { ...prev, [chiave]: { ...prev[chiave], valore: Math.max(0, prev[chiave].valore - 1) } },
    );
  }, []);

  // Usati dal tracker di partita (TrackerContext) per tenere allineati Turno e "Tocca a".
  const impostaIndicatore = useCallback((chiave, valore) => {
    setIndicatori((prev) =>
      chiave === 'turno' ? conTurno(prev, valore) : { ...prev, [chiave]: { ...prev[chiave], valore } },
    );
  }, []);

  const impostaGiocatoreAttivo = useCallback((giocatore) => {
    if (giocatore !== 'blu' && giocatore !== 'rosso') return;
    setIndicatori((prev) => ({ ...prev, giocatoreAttivo: { ...prev.giocatoreAttivo, valore: giocatore } }));
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
      impostaIndicatore,
      impostaGiocatoreAttivo,
      rinominaIndicatore,
      ripristinaIndicatori,
    }),
    [
      indicatori,
      incrementaIndicatore,
      decrementaIndicatore,
      impostaIndicatore,
      impostaGiocatoreAttivo,
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
