import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { generaId } from '../utils/id';

const TavoloStateContext = createContext(null);

export function TavoloStateProvider({ children }) {
  const [istanze, setIstanze] = useState([]);
  const [elementiScenici, setElementiScenici] = useState([]);

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
    setIstanze((prev) =>
      prev.map((ist) => (ist.id === id ? { ...ist, x, y, zona, ultimaDistanza: distanza } : ist)),
    );
  }, []);

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

  const rimuoviIstanza = useCallback((id) => {
    setIstanze((prev) => prev.filter((ist) => ist.id !== id));
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
      rimuoviIstanza,
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
      rimuoviIstanza,
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
