import styles from './PannelloDestro.module.css';

// Guscio dei pannelli della colonna destra (Tracker partita, Eserciti): da aperto è una colonna a tutta
// altezza con titolo, ✕ e corpo scorrevole (più un `piede` fisso opzionale); da chiuso una linguetta
// verticale. Lo stato aperto/chiuso è deciso da fuori (vedi PannelliDestra).
function PannelloDestro({ titolo, aperto, onApri, onChiudi, larghezza = 330, piede = null, children }) {
  if (!aperto) {
    return (
      <button type="button" className={styles.linguetta} onClick={onApri} title={`Apri: ${titolo}`}>
        {titolo}
      </button>
    );
  }

  return (
    <aside className={styles.pannello} style={{ '--larghezza-pannello': `${larghezza}px` }}>
      <div className={styles.titolo}>
        <span>{titolo}</span>
        <button type="button" className={styles.chiudi} onClick={onChiudi} title="Chiudi il pannello">
          ✕
        </button>
      </div>
      <div className={styles.corpo}>{children}</div>
      {piede}
    </aside>
  );
}

export default PannelloDestro;
