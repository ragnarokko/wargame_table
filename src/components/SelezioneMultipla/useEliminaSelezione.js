import { useCallback } from 'react';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { EVENTO_SELEZIONE_MULTIPLA } from '../../utils/selezioneEventi';

// Rimuove dal tavolo/staging le basette con gli id indicati e svuota la selezione corrente,
// così tutte le istanze di Basetta (che ascoltano EVENTO_SELEZIONE_MULTIPLA) si deselezionano.
export function useEliminaSelezione() {
  const { rimuoviIstanze } = useTavoloState();

  return useCallback(
    (ids) => {
      if (ids.length === 0) return;
      rimuoviIstanze(ids);
      window.dispatchEvent(new CustomEvent(EVENTO_SELEZIONE_MULTIPLA, { detail: { ids: [] } }));
    },
    [rimuoviIstanze],
  );
}
