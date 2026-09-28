import { useState } from 'react';
import { ricaricaDatiCsv } from './csvUnitaImport';
import styles from './PulsanteAggiornaDati.module.css';

const ETICHETTE = {
  inattivo: '⟳ Aggiorna dati',
  corso: 'Aggiornamento…',
  ok: '✓ Dati aggiornati',
  errore: '⚠ Errore, riprova',
};

// Ricarica manualmente public/info.csv (vedi csvUnitaImport.js): utile dopo averlo modificato a
// mano, sia in sviluppo che in produzione, dato che il file viene sempre letto via fetch a
// runtime e non più incorporato nel bundle a build time. Non serve rebuild né riavviare nulla.
function PulsanteAggiornaDati() {
  const [stato, setStato] = useState('inattivo');

  const handleClick = async () => {
    setStato('corso');
    try {
      await ricaricaDatiCsv();
      setStato('ok');
    } catch {
      setStato('errore');
    } finally {
      setTimeout(() => setStato('inattivo'), 2000);
    }
  };

  return (
    <div className={styles.pannello}>
      <button
        type="button"
        className={`${styles.pulsante} ${styles[stato] || ''}`}
        onClick={handleClick}
        disabled={stato === 'corso'}
        title="Ricarica info.csv dopo averlo modificato a mano (funziona anche in produzione, senza bisogno di rebuild)"
      >
        {ETICHETTE[stato]}
      </button>
    </div>
  );
}

export default PulsanteAggiornaDati;
