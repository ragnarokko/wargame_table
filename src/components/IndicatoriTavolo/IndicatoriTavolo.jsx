import { useIndicatori } from '../../contexts/IndicatoriContext';
import styles from './IndicatoriTavolo.module.css';

function Indicatore({ chiave }) {
  const { indicatori, incrementaIndicatore, decrementaIndicatore, rinominaIndicatore } = useIndicatori();
  const { titolo, valore, titoloModificabile } = indicatori[chiave];

  return (
    <div className={styles.indicatore}>
      {titoloModificabile ? (
        <input
          type="text"
          className={styles.titoloInput}
          value={titolo}
          onChange={(e) => rinominaIndicatore(chiave, e.target.value)}
        />
      ) : (
        <span className={styles.titolo}>{titolo}</span>
      )}
      <div className={styles.stepper}>
        <button type="button" className={styles.stepBtn} onClick={() => decrementaIndicatore(chiave)}>
          −
        </button>
        <span className={styles.valore}>{valore}</span>
        <button type="button" className={styles.stepBtn} onClick={() => incrementaIndicatore(chiave)}>
          +
        </button>
      </div>
    </div>
  );
}

// Riga di indicatori in alto nell'area di staging: CP Blu + un extra a sinistra, Turno al
// centro, un extra + CP Rosso a destra (vedi IndicatoriContext per il significato delle
// chiavi). Renderizzata come ultimo figlio di .campoGioco (dopo .livelloInterattivo, vedi
// AreaLavoro) così i suoi pulsanti restano sempre cliccabili sopra l'overlay di selezione
// multipla; `pointer-events` è disattivato sulla fascia e riattivato solo sui singoli
// riquadri, per non intercettare i click/drag sul resto del tavolo.
function IndicatoriTavolo() {
  return (
    <div className={styles.fascia}>
      <div className={styles.gruppoSinistra}>
        <Indicatore chiave="cpBlu" />
        <Indicatore chiave="extraBlu" />
      </div>
      <div className={styles.centro}>
        <Indicatore chiave="turno" />
      </div>
      <div className={styles.gruppoDestra}>
        <Indicatore chiave="extraRosso" />
        <Indicatore chiave="cpRosso" />
      </div>
    </div>
  );
}

export default IndicatoriTavolo;
