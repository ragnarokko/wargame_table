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

  const spostaIstanza = useCallback((id, x, y, zona, distanza) => {
    setIstanze((prev) =>
      prev.map((ist) => (ist.id === id ? { ...ist, x, y, zona, ultimaDistanza: distanza } : ist)),
    );
  }, []);

  const rimuoviIstanza = useCallback((id) => {
    setIstanze((prev) => prev.filter((ist) => ist.id !== id));
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
      spostaIstanza,
      rimuoviIstanza,
      elementiScenici,
      aggiungiElementoScenico,
      modificaElementoScenico,
      rimuoviElementoScenico,
    }),
    [
      istanze,
      schieraBasetta,
      spostaIstanza,
      rimuoviIstanza,
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
