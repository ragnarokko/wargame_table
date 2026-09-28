import { nomeEsercito } from '../../config/eserciti';
import styles from './BasettaTooltip.module.css';

const CAMPI_STATISTICHE = [
  ['mov', 'MOV'],
  ['res', 'RES'],
  ['w', 'W'],
  ['ts', 'TS'],
  ['tsPiu', 'TS+'],
  ['oc', 'OC'],
  ['fnp', 'FNP'],
  ['range1', 'RANGE1'],
  ['range2', 'RANGE2'],
  ['range3', 'RANGE3'],
];

function BasettaTooltip({ template, rotazione = 0 }) {
  const eUnita = Boolean(template.esercito);
  const haDati = Boolean(template.immagine || template.statistiche || eUnita);

  // Il popup è figlio della basetta, che ha una propria rotazione (Q/W): senza contro-rotazione
  // erediterebbe quell'angolo e apparirebbe inclinato/rovesciato. Questo contenitore, stessa
  // dimensione/posizione della basetta e stesso transform-origin (centro), applica la rotazione
  // opposta: la somma delle due annulla esattamente l'effetto, tenendo il popup sempre verticale
  // e ancorato al centro della basetta indipendentemente dalla rotazione corrente.
  return (
    <div className={styles.controrotazione} style={{ transform: `rotate(${-rotazione}deg)` }}>
      <div className={styles.tooltip}>
        {template.immagine && <img src={template.immagine} alt={template.nome} className={styles.immagine} />}
        <div className={styles.nome}>{template.nome}</div>
        {eUnita && <div className={styles.esercito}>{nomeEsercito(template.esercito)}</div>}
        {eUnita && (
          <div className={styles.grigliaStatistiche}>
            {CAMPI_STATISTICHE.map(([campo, etichetta]) => (
              <div key={campo} className={styles.cellaStatistica}>
                <span className={styles.etichettaStatistica}>{etichetta}</span>
                <span>{template[campo] || '-'}</span>
              </div>
            ))}
          </div>
        )}
        {eUnita && <div className={styles.note}>NOTE: {template.note || '-'}</div>}
        {template.statistiche && <pre className={styles.statistiche}>{template.statistiche}</pre>}
        {!haDati && <div className={styles.vuoto}>Nessun dato aggiuntivo</div>}
      </div>
    </div>
  );
}

export default BasettaTooltip;
