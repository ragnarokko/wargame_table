import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { generaId } from '../utils/id';

const TavoloStateContext = createContext(null);

// Quanti spostamenti si possono annullare con Ctrl+Z.
const LIMITE_ANNULLA = 5;

export function TavoloStateProvider({ children }) {
  const [istanze, setIstanze] = useState([]);
  const [elementiScenici, setElementiScenici] = useState([]);

  // Cronologia degli spostamenti per Ctrl+Z. Ogni voce è un "lotto": tutte le basette mosse dalla stessa azione
  // (un trascinamento di gruppo, una pressione di freccia con più basette selezionate, una formazione 1/2/3...)
  // con la posizione che avevano prima. Le chiamate di spostaIstanza dello stesso evento finiscono nello stesso
  // lotto, che si chiude al macrotask successivo (i listener di un evento girano tutti prima).
  const istanzeRef = useRef(istanze);
  istanzeRef.current = istanze;
  const pilaAnnullaRef = useRef([]);
  const lottoRef = useRef(null);

  const registraPosizionePrecedente = useCallback((id, x, y) => {
    const ist = istanzeRef.current.find((i) => i.id === id);
    if (!ist || (ist.x === x && ist.y === y)) return;
    if (!lottoRef.current) {
      const lotto = new Map();
      lottoRef.current = lotto;
      const pila = pilaAnnullaRef.current;
      pila.push(lotto);
      if (pila.length > LIMITE_ANNULLA) pila.shift();
      setTimeout(() => {
        if (lottoRef.current === lotto) lottoRef.current = null;
      }, 0);
    }
    if (!lottoRef.current.has(id)) {
      lottoRef.current.set(id, { x: ist.x, y: ist.y, zona: ist.zona, ultimaDistanza: ist.ultimaDistanza ?? null });
    }
  }, []);

  const schieraBasetta = useCallback((templateId, x, y, zona = 'staging') => {
    const nuova = { id: generaId(), templateId, x, y, zona, ultimaDistanza: null, rotazione: 0 };
    setIstanze((prev) => [...prev, nuova]);
    return nuova;
  }, []);

  // Schiera più basette dello stesso template in un'unica operazione (es. tutti i modelli di un'unità).
  const schieraBasette = useCallback((templateId, posizioni, zona = 'staging') => {
    const nuove = posizioni.map((p) => ({
      id: generaId(),
      templateId,
      x: p.x,
      y: p.y,
      zona,
      ultimaDistanza: null,
      rotazione: 0,
    }));
    setIstanze((prev) => [...prev, ...nuove]);
    return nuove;
  }, []);

  const spostaIstanza = useCallback((id, x, y, zona, distanza) => {
    registraPosizionePrecedente(id, x, y);
    setIstanze((prev) =>
      prev.map((ist) => (ist.id === id ? { ...ist, x, y, zona, ultimaDistanza: distanza } : ist)),
    );
  }, [registraPosizionePrecedente]);

  // Ctrl+Z: riporta le basette dell'ultimo spostamento dov'erano prima (le già rimosse si saltano).
  const annullaSpostamento = useCallback(() => {
    const pila = pilaAnnullaRef.current;
    lottoRef.current = null;
    while (pila.length > 0) {
      const lotto = pila.pop();
      if (!istanzeRef.current.some((ist) => lotto.has(ist.id))) continue;
      setIstanze((prev) => prev.map((ist) => (lotto.has(ist.id) ? { ...ist, ...lotto.get(ist.id) } : ist)));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || (e.key !== 'z' && e.key !== 'Z')) return;
      e.preventDefault();
      annullaSpostamento();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [annullaSpostamento]);

  // Orientamento (Q/W) della singola basetta: persistito qui (anziché come stato locale del
  // componente Basetta) così da poter essere letto da un salvataggio completo della partita.
  const ruotaIstanza = useCallback((id, rotazione) => {
    setIstanze((prev) => prev.map((ist) => (ist.id === id ? { ...ist, rotazione } : ist)));
  }, []);

  // Ferite correnti della singola basetta: persistite qui (come rotazione) così un salvataggio
  // completo della partita può leggerle e ripristinarle correttamente al Load.
  const impostaFeriteIstanza = useCallback((id, ferite) => {
    setIstanze((prev) => prev.map((ist) => (ist.id === id ? { ...ist, ferite } : ist)));
  }, []);

  // Offset (in pollici) dell'aura della singola basetta, 0 = nessuna aura attiva. Persistito qui
  // (come rotazione e ferite) così un salvataggio completo della partita può ripristinarlo.
  const impostaAuraIstanza = useCallback((id, auraOffset) => {
    setIstanze((prev) => prev.map((ist) => (ist.id === id ? { ...ist, auraOffset } : ist)));
  }, []);

  // Modello eliminato (tasto R): la basetta resta sul campo, in grigio, ma non conta più tra i modelli attivi.
  // Persistito sull'istanza (come ferite e aura) per finire nei salvataggi.
  const impostaMortaIstanze = useCallback((ids, morta) => {
    setIstanze((prev) => prev.map((ist) => (ids.includes(ist.id) ? { ...ist, morta } : ist)));
  }, []);

  const rimuoviIstanza = useCallback((id) => {
    setIstanze((prev) => prev.filter((ist) => ist.id !== id));
  }, []);

  // Rimuove più istanze in un'unica operazione (es. cancellazione della selezione multipla).
  const rimuoviIstanze = useCallback((ids) => {
    setIstanze((prev) => prev.filter((ist) => !ids.includes(ist.id)));
  }, []);

  const rimuoviIstanzePerTemplate = useCallback((templateId) => {
    setIstanze((prev) => prev.filter((ist) => ist.templateId !== templateId));
  }, []);

  // Sostituisce le istanze dei template indicati con quelle fornite (usato dall'import degli eserciti):
  // rimuove le istanze correnti di quei template e aggiunge quelle nuove, senza toccare il resto del tavolo.
  const impostaIstanzePerTemplates = useCallback((templateIds, nuoveIstanze) => {
    setIstanze((prev) => [...prev.filter((ist) => !templateIds.includes(ist.templateId)), ...nuoveIstanze]);
  }, []);

  // Sostituisce interamente istanze ed elementi scenici (usato dal ripristino di un salvataggio
  // completo della partita, a differenza di impostaIstanzePerTemplates che è mirato per template).
  const ripristinaTavolo = useCallback((nuoveIstanze, nuoviElementiScenici) => {
    pilaAnnullaRef.current = [];
    lottoRef.current = null;
    setIstanze(nuoveIstanze);
    setElementiScenici(nuoviElementiScenici);
  }, []);

  const aggiungiElementoScenico = useCallback((dati) => {
    const nuovo = {
      id: generaId(),
      nome: 'Terreno',
      forma: 'rettangolare',
      larghezzaPollici: 6,
      altezzaPollici: 4,
      x: 0,
      y: 0,
      colore: '#6b8f71',
      ...dati,
    };
    setElementiScenici((prev) => [...prev, nuovo]);
    return nuovo;
  }, []);

  const modificaElementoScenico = useCallback((id, dati) => {
    setElementiScenici((prev) => prev.map((el) => (el.id === id ? { ...el, ...dati } : el)));
  }, []);

  const rimuoviElementoScenico = useCallback((id) => {
    setElementiScenici((prev) => prev.filter((el) => el.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      istanze,
      schieraBasetta,
      schieraBasette,
      spostaIstanza,
      ruotaIstanza,
      impostaFeriteIstanza,
      impostaAuraIstanza,
      impostaMortaIstanze,
      rimuoviIstanza,
      rimuoviIstanze,
      rimuoviIstanzePerTemplate,
      impostaIstanzePerTemplates,
      ripristinaTavolo,
      elementiScenici,
      aggiungiElementoScenico,
      modificaElementoScenico,
      rimuoviElementoScenico,
    }),
    [
      istanze,
      schieraBasetta,
      schieraBasette,
      spostaIstanza,
      ruotaIstanza,
      impostaFeriteIstanza,
      impostaAuraIstanza,
      impostaMortaIstanze,
      rimuoviIstanza,
      rimuoviIstanze,
      rimuoviIstanzePerTemplate,
      impostaIstanzePerTemplates,
      ripristinaTavolo,
      elementiScenici,
      aggiungiElementoScenico,
      modificaElementoScenico,
      rimuoviElementoScenico,
    ],
  );

  return <TavoloStateContext.Provider value={value}>{children}</TavoloStateContext.Provider>;
}

export function useTavoloState() {
  const ctx = useContext(TavoloStateContext);
  if (!ctx) throw new Error('useTavoloState deve essere usato dentro TavoloStateProvider');
  return ctx;
}
