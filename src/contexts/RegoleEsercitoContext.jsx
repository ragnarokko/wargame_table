import { capitoloDistaccamento } from '../config/capitoliDistaccamenti';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const RegoleEsercitoContext = createContext(null);

const CHIAVE_LOCALSTORAGE = 'tavolo-regole-esercito';
const GIOCATORI = ['blu', 'rosso'];

// Per ogni esercito: fazione scelta a mano (codice `fac`, vuota = quella delle unità create), sottofazione
// (capitolo degli Space Marines, vuota = tutti) e id dei distaccamenti selezionati.
const esercitoIniziale = () => ({ fazione: '', sottofazione: '', distaccamenti: [] });

export const REGOLE_ESERCITO_INIZIALI = { blu: esercitoIniziale(), rosso: esercitoIniziale() };

// Unisce uno stato letto da localStorage/salvataggio con quello iniziale (campi mancanti o formati vecchi).
function unisciConIniziale(dati) {
  const stato = {};
  for (const g of GIOCATORI) {
    const letto = dati?.[g];
    stato[g] = {
      fazione: typeof letto?.fazione === 'string' ? letto.fazione : '',
      sottofazione: typeof letto?.sottofazione === 'string' ? letto.sottofazione : '',
      distaccamenti: Array.isArray(letto?.distaccamenti) ? letto.distaccamenti.map(String) : [],
    };
  }
  return stato;
}

function caricaIniziale() {
  try {
    const grezzo = localStorage.getItem(CHIAVE_LOCALSTORAGE);
    return grezzo ? unisciConIniziale(JSON.parse(grezzo)) : REGOLE_ESERCITO_INIZIALI;
  } catch {
    return REGOLE_ESERCITO_INIZIALI;
  }
}

// Scelte del pannello "Eserciti": fazione e distaccamenti dei due eserciti. Salvate in localStorage e
// nel salvataggio partita (`regoleEsercito`). I dati di regole/stratagemmi stanno in RegoleEsercito/csvRegoleEsercito.js.
export function RegoleEsercitoProvider({ children }) {
  const [stato, setStato] = useState(caricaIniziale);

  useEffect(() => {
    try {
      localStorage.setItem(CHIAVE_LOCALSTORAGE, JSON.stringify(stato));
    } catch {
      // localStorage non disponibile: le scelte valgono solo per questa sessione.
    }
  }, [stato]);

  // Cambiare fazione toglie sottofazione e distaccamenti scelti (appartengono alla fazione precedente).
  const impostaFazione = useCallback(
    (giocatore, fazione) => setStato((prev) => ({ ...prev, [giocatore]: { fazione, sottofazione: '', distaccamenti: [] } })),
    [],
  );

  // Scegliere un capitolo toglie i distaccamenti già scelti di altri capitoli (restano i generici).
  const impostaSottofazione = useCallback(
    (giocatore, sottofazione) =>
      setStato((prev) => {
        const distaccamenti = prev[giocatore].distaccamenti.filter((id) => {
          const capitolo = capitoloDistaccamento(id);
          return !sottofazione || !capitolo || capitolo === sottofazione;
        });
        return { ...prev, [giocatore]: { ...prev[giocatore], sottofazione, distaccamenti } };
      }),
    [],
  );

  const impostaDistaccamento = useCallback(
    (giocatore, id, selezionato) =>
      setStato((prev) => {
        const attuali = prev[giocatore].distaccamenti;
        const nuovi = selezionato ? (attuali.includes(id) ? attuali : [...attuali, id]) : attuali.filter((d) => d !== id);
        return { ...prev, [giocatore]: { ...prev[giocatore], distaccamenti: nuovi } };
      }),
    [],
  );

  const ripristinaRegoleEsercito = useCallback((dati) => setStato(unisciConIniziale(dati)), []);

  const value = useMemo(
    () => ({ stato, impostaFazione, impostaSottofazione, impostaDistaccamento, ripristinaRegoleEsercito }),
    [stato, impostaFazione, impostaSottofazione, impostaDistaccamento, ripristinaRegoleEsercito],
  );

  return <RegoleEsercitoContext.Provider value={value}>{children}</RegoleEsercitoContext.Provider>;
}

export function useRegoleEsercito() {
  const ctx = useContext(RegoleEsercitoContext);
  if (!ctx) throw new Error('useRegoleEsercito deve essere usato dentro RegoleEsercitoProvider');
  return ctx;
}
