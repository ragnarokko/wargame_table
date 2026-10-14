import { useEffect, useState } from 'react';
import { useTavolo } from '../contexts/TavoloContext';
import { caricaLayout, idLayout } from '../utils/layoutTavolo';

// Dati del layout scelto in "Force disposition" (vedi utils/layoutTavolo.js), o null se non c'è una
// scelta valida o i dati non sono ancora arrivati.
export function useLayoutCorrente() {
  const { selezioneLayout } = useTavolo();
  const id = idLayout(selezioneLayout.giocatore1, selezioneLayout.giocatore2, selezioneLayout.numeroLayout);
  const [caricato, setCaricato] = useState({ id: null, dati: null });

  useEffect(() => {
    if (!id) return undefined;
    let annullato = false;
    caricaLayout(id).then((dati) => {
      if (!annullato) setCaricato({ id, dati });
    });
    return () => {
      annullato = true;
    };
  }, [id]);

  return id && caricato.id === id ? caricato.dati : null;
}
