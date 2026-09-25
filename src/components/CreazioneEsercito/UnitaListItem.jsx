import { useState } from 'react';
import { EVENTO_EVIDENZIA_UNITA } from '../../utils/selezioneEventi';
import styles from './CreazioneEsercito.module.css';

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

// Voce dell'accordion per una singola unità: il nome, al passaggio del mouse, evidenzia
// tutte le basette sul campo appartenenti a questa unità (stesso templateId).
function UnitaListItem({ unita, numeroModelli, onRimuovi }) {
  const [dettagliAperti, setDettagliAperti] = useState(false);

  const evidenzia = () =>
    window.dispatchEvent(new CustomEvent(EVENTO_EVIDENZIA_UNITA, { detail: { templateId: unita.id } }));
  const spegniEvidenza = () =>
    window.dispatchEvent(new CustomEvent(EVENTO_EVIDENZIA_UNITA, { detail: { templateId: null } }));

  const statistiche = CAMPI_STATISTICHE.filter(([campo]) => unita[campo]);

  return (
    <li className={styles.unitaItem}>
      <div className={styles.riga}>
        <span className={styles.pallino} style={{ backgroundColor: unita.colore }} />
        <button
          type="button"
          className={styles.nomeUnita}
          onMouseEnter={evidenzia}
          onMouseLeave={spegniEvidenza}
          onClick={() => setDettagliAperti((v) => !v)}
          title="Passa il mouse per evidenziare sul tavolo, clicca per i dettagli"
        >
          <span className={styles.freccia}>{dettagliAperti ? '▼' : '▶'}</span>
          <span className={styles.nomeTesto}>{unita.nome}</span>
        </button>
        <span className={styles.contatore}>{numeroModelli} mod.</span>
        <div className={styles.azioni}>
          <button onClick={onRimuovi} title="Rimuovi unità">
            ✕
          </button>
        </div>
      </div>

      {dettagliAperti && (
        <div className={styles.dettagliUnita}>
          {statistiche.length > 0 && (
            <div className={styles.statGriglia}>
              {statistiche.map(([campo, etichetta]) => (
                <div key={campo} className={styles.statVoce}>
                  <span className={styles.statEtichetta}>{etichetta}</span>
                  <span>{unita[campo]}</span>
                </div>
              ))}
            </div>
          )}
          {unita.note && <div className={styles.note}>{unita.note}</div>}
          {statistiche.length === 0 && !unita.note && (
            <div className={styles.vuoto}>Nessun dettaglio disponibile</div>
          )}
        </div>
      )}
    </li>
  );
}

export default UnitaListItem;
