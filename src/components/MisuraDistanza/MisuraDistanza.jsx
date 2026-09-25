import styles from './MisuraDistanza.module.css';

function MisuraDistanza({ origine, destinazione, dimensionePx, forma, colore, pollici, rotazione = 0 }) {
  const fantasmaStyle = {
    left: origine.x - dimensionePx.larghezza / 2,
    top: origine.y - dimensionePx.altezza / 2,
    width: dimensionePx.larghezza,
    height: dimensionePx.altezza,
    backgroundColor: colore,
    borderRadius: forma === 'rettangolare' ? 4 : '50%',
    transform: `rotate(${rotazione}deg)`,
  };

  const etichettaStyle = {
    left: (origine.x + destinazione.x) / 2,
    top: (origine.y + destinazione.y) / 2,
  };

  return (
    <>
      <div className={styles.fantasma} style={fantasmaStyle} />
      <svg className={styles.lineaSvg}>
        <line x1={origine.x} y1={origine.y} x2={destinazione.x} y2={destinazione.y} className={styles.linea} />
      </svg>
      <div className={styles.etichetta} style={etichettaStyle}>
        {pollici.toFixed(1)}&quot;
      </div>
    </>
  );
}

export default MisuraDistanza;
