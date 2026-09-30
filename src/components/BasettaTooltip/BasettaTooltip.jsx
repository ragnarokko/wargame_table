import { nomeEsercito } from '../../config/eserciti';
import { armiPerTemplate, useVersioneDatiArmi } from '../CreazioneEsercito/csvArmiImport';
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
  // eUnita non conosce ancora le armi al render (il caricamento CSV, vedi csvArmiImport.js, è
  // asincrono): useVersioneDatiArmi() forza un re-render quando i dati arrivano, così il popup
  // le mostra senza bisogno di chiudere/riaprire.
  useVersioneDatiArmi();
  const armi = eUnita ? armiPerTemplate(template) : [];

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
        {armi.length > 0 && (
          <div className={styles.armi}>
            <div className={styles.armiTitolo}>ARMI</div>
            {armi.map((arma, i) => (
              <div key={`${arma.arma}-${i}`} className={styles.arma}>
                <div className={styles.armaNome}>{arma.arma}</div>
                <div className={styles.grigliaStatistiche}>
                  <div className={styles.cellaStatistica}>
                    <span className={styles.etichettaStatistica}>A</span>
                    <span>{arma.attGrezzo || '-'}</span>
                  </div>
                  <div className={styles.cellaStatistica}>
                    <span className={styles.etichettaStatistica}>BS/WS</span>
                    <span>{arma.bsWsGrezzo || '-'}</span>
                  </div>
                  <div className={styles.cellaStatistica}>
                    <span className={styles.etichettaStatistica}>S</span>
                    <span>{arma.forzaGrezzo || '-'}</span>
                  </div>
                  <div className={styles.cellaStatistica}>
                    <span className={styles.etichettaStatistica}>AP</span>
                    <span>{arma.apGrezzo || '-'}</span>
                  </div>
                  <div className={styles.cellaStatistica}>
                    <span className={styles.etichettaStatistica}>D</span>
                    <span>{arma.danniGrezzo || '-'}</span>
                  </div>
                  <div className={styles.cellaStatistica}>
                    <span className={styles.etichettaStatistica}>RANGE</span>
                    <span>{arma.range ? `${arma.range}${arma.tipo === 'Melee' ? '' : '"'}` : '-'}</span>
                  </div>
                </div>
                {arma.descrizione && <div className={styles.armaDescrizione}>{arma.descrizione}</div>}
              </div>
            ))}
          </div>
        )}
        {template.statistiche && <pre className={styles.statistiche}>{template.statistiche}</pre>}
        {!haDati && <div className={styles.vuoto}>Nessun dato aggiuntivo</div>}
      </div>
    </div>
  );
}

export default BasettaTooltip;
