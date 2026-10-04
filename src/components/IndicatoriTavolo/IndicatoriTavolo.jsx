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

// Pulsante accanto al Turno: a ogni click alterna tra "BLU" e "ROSSO" per ricordare di quale
// esercito è il turno in corso (stato in IndicatoriContext, salvato con la partita).
function GiocatoreAttivo() {
  const { indicatori, alternaGiocatoreAttivo } = useIndicatori();
  const { titolo, valore } = indicatori.giocatoreAttivo;

  return (
    <div className={styles.indicatore}>
      <span className={styles.titolo}>{titolo}</span>
      <button
        type="button"
        className={`${styles.giocatoreBtn} ${valore === 'blu' ? styles.blu : styles.rosso}`}
        onClick={alternaGiocatoreAttivo}
        title="Clic per passare il turno all'altro giocatore"
      >
        {valore === 'blu' ? 'Blu' : 'Rosso'}
      </button>
    </div>
  );
}

// Riga di indicatori in alto nell'area di staging: CP Blu + un extra a sinistra, Turno e
// giocatore attivo al centro, un extra + CP Rosso a destra (vedi IndicatoriContext per il significato delle
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
        <GiocatoreAttivo />
      </div>
      <div className={styles.gruppoDestra}>
        <Indicatore chiave="extraRosso" />
        <Indicatore chiave="cpRosso" />
      </div>
    </div>
  );
}

export default IndicatoriTavolo;
