import { useState } from 'react';
import { ricaricaDatiCsv } from './csvUnitaImport';
import { ricaricaDatiArmi } from './csvArmiImport';
import { ricaricaDatiArmyBuilder } from './csvArmyBuilderImport';
import { ricaricaFinestreCalcolatore } from '../../utils/finestreCalcolatore';
import styles from './PulsanteAggiornaDati.module.css';

const ETICHETTE = {
  inattivo: '⟳ Aggiorna dati',
  corso: 'Aggiornamento…',
  ok: '✓ Dati aggiornati',
  errore: '⚠ Errore, riprova',
};

// Ricarica manualmente info.csv e Datasheets_wargear.csv dal sito del calcolatore (vedi csvUnitaImport.js e
// csvArmiImport.js): utile dopo averli modificati a mano, sia in sviluppo che in produzione, dato
// che i file vengono sempre letti via fetch a runtime e mai incorporati nel bundle a build time.
// Non serve rebuild né riavviare nulla. Inoltra la richiesta anche alle finestre "Botte!" ancora
// aperte (finestreCalcolatore.js), che rileggono i CSV a loro volta.
function PulsanteAggiornaDati() {
  const [stato, setStato] = useState('inattivo');

  const handleClick = async () => {
    setStato('corso');
    try {
      // I file dei punti (army_builder/) sono facoltativi: se mancano, l'aggiornamento di unità e armi riesce lo stesso.
      await Promise.all([ricaricaDatiCsv(), ricaricaDatiArmi(), ricaricaDatiArmyBuilder().catch(() => {})]);
      ricaricaFinestreCalcolatore();
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
        title="Ricarica info.csv e Datasheets_wargear.csv dopo averli aggiornati nel repo del calcolatore, anche nelle finestre Botte! aperte (nessun rebuild necessario)"
      >
        {ETICHETTE[stato]}
      </button>
    </div>
  );
}

export default PulsanteAggiornaDati;
