import { useState } from 'react';
import styles from './LancioDado.module.css';

// Glifi Unicode delle sei facce di un D6 (U+2680-U+2685): mostrano il dado come su un dado
// vero (pallini), non solo la cifra. '🎲' è la faccia di riposo prima del primo lancio.
const FACCE_D6 = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// Piccola finestrella fissa in basso a sinistra sullo schermo (non nell'area di gioco: non
// segue pan/zoom/rotazione del tavolo, sempre visibile). Stato solo locale: il tiro non ha
// bisogno di essere salvato nella partita (a differenza degli indicatori CP/Turno).
function LancioDado() {
  const [valore, setValore] = useState(null);

  const lancia = () => {
    setValore(Math.floor(Math.random() * 6) + 1);
  };

  return (
    <div className={styles.finestra}>
      <button
        type="button"
        className={styles.dado}
        onClick={lancia}
        title="Lancia un dado (D6)"
        aria-label="Lancia un dado a 6 facce"
      >
        <span className={styles.faccia}>{valore ? FACCE_D6[valore - 1] : '🎲'}</span>
      </button>
    </div>
  );
}

export default LancioDado;
