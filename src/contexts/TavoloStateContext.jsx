import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { generaId } from '../utils/id';

const TavoloStateContext = createContext(null);

export function TavoloStateProvider({ children }) {
  const [istanze, setIstanze] = useState([]);
  const [elementiScenici, setElementiScenici] = useState([]);

  const schieraBasetta = useCallback((templateId, x, y, zona = 'staging') => {
    const nuova = { id: generaId(), templateId, x, y, zona, ultimaDistanza: null };
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
    }));
    setIstanze((prev) => [...prev, ...nuove]);
    return nuove;
  }, []);

  const spostaIstanza = useCallback((id, x, y, zona, distanza) => {
    setIstanze((prev) =>
      prev.map((ist) => (ist.id === id ? { ...ist, x, y, zona, ultimaDistanza: distanza } : ist)),
    );
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
      rimuoviIstanza,
      rimuoviIstanzePerTemplate,
      impostaIstanzePerTemplates,
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
      rimuoviIstanza,
      rimuoviIstanzePerTemplate,
      impostaIstanzePerTemplates,
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
