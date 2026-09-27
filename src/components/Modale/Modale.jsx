import { useEffect } from 'react';
import styles from './Modale.module.css';

// Finestra modale generica riutilizzabile: overlay + riquadro centrale con titolo e
// pulsante di chiusura. Click sull'overlay, Esc o il pulsante la chiudono; il contenuto
// (children) resta a carico di chi la usa.
function Modale({ titolo, aperto, onChiudi, children }) {
  useEffect(() => {
    if (!aperto) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onChiudi();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aperto, onChiudi]);

  if (!aperto) return null;

  return (
    <div className={styles.overlay} onClick={onChiudi}>
      <div className={styles.finestra} onClick={(e) => e.stopPropagation()}>
        <div className={styles.intestazione}>
          <h3>{titolo}</h3>
          <button type="button" className={styles.chiudiBtn} onClick={onChiudi} title="Chiudi">
            ✕
          </button>
        </div>
        <div className={styles.contenuto}>{children}</div>
      </div>
    </div>
  );
}

export default Modale;
