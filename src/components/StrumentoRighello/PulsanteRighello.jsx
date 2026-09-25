import styles from './PulsanteRighello.module.css';

function PulsanteRighello({ attivo, onToggle }) {
  return (
    <div className={styles.pannello}>
      <button
        type="button"
        className={`${styles.pulsante} ${attivo ? styles.attivo : ''}`}
        onClick={onToggle}
        title="Strumento righello: misura la distanza tra due punti qualsiasi del tavolo"
        aria-pressed={attivo}
      >
        <span className={styles.icona}>📏</span>
        Strumento righello
      </button>
    </div>
  );
}

export default PulsanteRighello;
