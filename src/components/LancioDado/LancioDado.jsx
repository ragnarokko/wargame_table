import { useEffect, useState } from 'react';
import styles from './LancioDado.module.css';

// Glifi Unicode delle sei facce di un D6 (U+2680-U+2685): mostrano il dado come su un dado
// vero (pallini), non solo la cifra. '🎲' è la faccia di riposo prima del primo lancio.
const FACCE_D6 = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// Finestrella del dado: nascosta di default (non più un elemento fisso sul tavolo), si
// apre/chiude con il tasto L — ignorato se il focus è su un campo di input/textarea/select/
// contentEditable, come le altre scorciatoie globali dell'app — o con Esc quando è aperta.
// Stato solo locale: il tiro non viene salvato nella partita (a differenza degli indicatori
// CP/Turno).
function LancioDado() {
  const [aperto, setAperto] = useState(false);
  const [valore, setValore] = useState(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setAperto((a) => !a);
      } else if (e.key === 'Escape') {
        setAperto(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!aperto) return null;

  const lancia = () => {
    setValore(Math.floor(Math.random() * 6) + 1);
  };

  return (
    <div className={styles.finestra}>
      <div className={styles.intestazione}>
        <span>Dado (D6)</span>
        <button type="button" className={styles.chiudiBtn} onClick={() => setAperto(false)} title="Chiudi (Esc)">
          ✕
        </button>
      </div>
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
