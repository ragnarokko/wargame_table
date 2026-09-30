import { useState } from 'react';
import { ricaricaDatiCsv } from './csvUnitaImport';
import { ricaricaDatiArmi } from './csvArmiImport';
import styles from './PulsanteAggiornaDati.module.css';

const ETICHETTE = {
  inattivo: '⟳ Aggiorna dati',
  corso: 'Aggiornamento…',
  ok: '✓ Dati aggiornati',
  errore: '⚠ Errore, riprova',
};

// Ricarica manualmente public/info.csv e public/Datasheets_wargear.csv (vedi csvUnitaImport.js e
// csvArmiImport.js): utile dopo averli modificati a mano, sia in sviluppo che in produzione, dato
// che i file vengono sempre letti via fetch a runtime e mai incorporati nel bundle a build time.
// Non serve rebuild né riavviare nulla.
function PulsanteAggiornaDati() {
  const [stato, setStato] = useState('inattivo');

  const handleClick = async () => {
    setStato('corso');
    try {
      await Promise.all([ricaricaDatiCsv(), ricaricaDatiArmi()]);
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
        title="Ricarica info.csv e Datasheets_wargear.csv dopo averli modificati a mano (funziona anche in produzione, senza bisogno di rebuild)"
      >
        {ETICHETTE[stato]}
      </button>
    </div>
  );
}

export default PulsanteAggiornaDati;
