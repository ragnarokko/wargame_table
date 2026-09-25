import styles from './PannelloEspandibile.module.css';

// Contenitore riutilizzabile: riga singola collassata con titolo + freccia,
// che si espande mostrando i children (tipicamente un form) senza toccarne la logica.
function PannelloEspandibile({ titolo, aperto, onToggle, children }) {
  return (
    <div className={styles.contenitore}>
      <button
        type="button"
        className={styles.intestazione}
        onClick={onToggle}
        aria-expanded={aperto}
      >
        <span className={styles.freccia}>{aperto ? '▼' : '▶'}</span>
        <span className={styles.titolo}>{titolo}</span>
      </button>

      {aperto && <div className={styles.contenuto}>{children}</div>}
    </div>
  );
}

export default PannelloEspandibile;
