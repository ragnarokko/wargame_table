import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { generaId } from '../utils/id';

const LibreriaContext = createContext(null);

const LIBRERIA_INIZIALE = [
  {
    id: generaId(),
    nome: 'Sergente Volkov',
    colore: '#e63946',
    forma: 'tonda',
    diametroMm: 32,
    immagine: '',
    statistiche: 'Movimento 6"\nForza 4\nResistenza 4\nFerite 3',
  },
  {
    id: generaId(),
    nome: 'Grav-tank',
    colore: '#457b9d',
    forma: 'ovale',
    larghezzaMm: 90,
    lunghezzaMm: 130,
    immagine: '',
    statistiche: 'Movimento 12"\nGittata arma 24"\nFerite 12',
  },
];

export function LibreriaProvider({ children }) {
  const [basette, setBasette] = useState(LIBRERIA_INIZIALE);

  const aggiungiBasetta = useCallback((dati) => {
    const nuova = { id: generaId(), ...dati };
    setBasette((prev) => [...prev, nuova]);
    return nuova;
  }, []);

  const modificaBasetta = useCallback((id, dati) => {
    setBasette((prev) => prev.map((b) => (b.id === id ? { ...b, ...dati } : b)));
  }, []);

  const rimuoviBasetta = useCallback((id) => {
    setBasette((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Sostituisce tutte le unità esercito (basette con campo `esercito`) con quelle indicate,
  // preservando gli id originali (usato dall'import degli eserciti) e lasciando intatta la libreria generica.
  const sostituisciUnitaEserciti = useCallback((nuoveUnita) => {
    setBasette((prev) => [...prev.filter((b) => !b.esercito), ...nuoveUnita]);
  }, []);

  // Sostituisce l'intera libreria (usato dal ripristino di un salvataggio completo della partita).
  const impostaBasette = useCallback((nuoveBasette) => {
    setBasette(nuoveBasette);
  }, []);

  const esportaJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(basette, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'libreria-basette.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [basette]);

  const importaJSON = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const dati = JSON.parse(reader.result);
          if (!Array.isArray(dati)) throw new Error('atteso un array di basette');
          const normalizzate = dati.map((b) => ({
            ...b,
            id: b.id || generaId(),
            nome: b.nome || 'Senza nome',
            colore: b.colore || '#999999',
            forma: b.forma || 'tonda',
            diametroMm: b.diametroMm,
            larghezzaMm: b.larghezzaMm,
            lunghezzaMm: b.lunghezzaMm,
            immagine: b.immagine || '',
            statistiche: b.statistiche || '',
          }));
          setBasette(normalizzate);
          resolve(normalizzate);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }, []);

  const value = useMemo(
    () => ({
      basette,
      aggiungiBasetta,
      modificaBasetta,
      rimuoviBasetta,
      sostituisciUnitaEserciti,
      impostaBasette,
      esportaJSON,
      importaJSON,
    }),
    [
      basette,
      aggiungiBasetta,
      modificaBasetta,
      rimuoviBasetta,
      sostituisciUnitaEserciti,
      impostaBasette,
      esportaJSON,
      importaJSON,
    ],
  );

  return <LibreriaContext.Provider value={value}>{children}</LibreriaContext.Provider>;
}

export function useLibreria() {
  const ctx = useContext(LibreriaContext);
  if (!ctx) throw new Error('useLibreria deve essere usato dentro LibreriaProvider');
  return ctx;
}
