import styles from './BasettaTooltip.module.css';

function BasettaTooltip({ template }) {
  const haDati = Boolean(template.immagine || template.statistiche);

  return (
    <div className={styles.tooltip}>
      {template.immagine && <img src={template.immagine} alt={template.nome} className={styles.immagine} />}
      <div className={styles.nome}>{template.nome}</div>
      {template.statistiche && <pre className={styles.statistiche}>{template.statistiche}</pre>}
      {!haDati && <div className={styles.vuoto}>Nessun dato aggiuntivo</div>}
    </div>
  );
}

export default BasettaTooltip;
