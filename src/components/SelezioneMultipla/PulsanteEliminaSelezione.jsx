import { useEffect, useState } from 'react';
import { EVENTO_SELEZIONE_MULTIPLA } from '../../utils/selezioneEventi';
import { useEliminaSelezione } from './useEliminaSelezione';
import styles from './PulsanteEliminaSelezione.module.css';

// Pulsante nel pannello laterale, visibile solo quando c'è almeno una basetta selezionata:
// stesso effetto della scorciatoia Canc/Backspace gestita da SelezioneMultipla.
function PulsanteEliminaSelezione() {
  const [selezione, setSelezione] = useState([]);
  const eliminaSelezione = useEliminaSelezione();

  useEffect(() => {
    const onSelezione = (e) => setSelezione(e.detail.ids);
    window.addEventListener(EVENTO_SELEZIONE_MULTIPLA, onSelezione);
    return () => window.removeEventListener(EVENTO_SELEZIONE_MULTIPLA, onSelezione);
  }, []);

  if (selezione.length === 0) return null;

  return (
    <div className={styles.pannello}>
      <button type="button" className={styles.pulsante} onClick={() => eliminaSelezione(selezione)}>
        🗑 Elimina selezionate ({selezione.length})
      </button>
    </div>
  );
}

export default PulsanteEliminaSelezione;
