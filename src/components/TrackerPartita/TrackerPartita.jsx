import { useState } from 'react';
import { LIMITI_VP } from '../../config/missioni';
import { useTracker } from '../../contexts/TrackerContext';
import Modale from '../Modale/Modale';
import SchedaGiocatore, { NOME_GIOCATORE } from './SchedaGiocatore';
import SetupTracker from './SetupTracker';
import StatisticheTracker from './StatisticheTracker';
import styles from './TrackerPartita.module.css';

const CHIAVE_APERTO = 'tavolo-tracker-aperto';

function leggiAperto() {
  try {
    return localStorage.getItem(CHIAVE_APERTO) !== '0';
  } catch {
    return true;
  }
}

// Pannello laterale destro, a tutta altezza, per tracciare la partita: setup guidato (disposizioni,
// secondarie, attaccante, primo turno), poi round/turni (riportati negli indicatori sul tavolo) e punti
// di primarie e secondarie per giocatore. Chiuso si riduce a una linguetta verticale. Stato in TrackerContext.
function TrackerPartita() {
  const { stato, avanzaTurno, tornaIndietro, nuovaPartita } = useTracker();
  const [aperto, setApertoState] = useState(leggiAperto);
  const [confermaAperta, setConfermaAperta] = useState(false);
  const inPartita = stato.fase === 'partita';
  const ultimoTurno = stato.round === LIMITI_VP.round && stato.turnoDi !== stato.primo;

  const setAperto = (valore) => {
    setApertoState(valore);
    try {
      localStorage.setItem(CHIAVE_APERTO, valore ? '1' : '0');
    } catch {
      // localStorage non disponibile: la scelta vale solo per questa sessione.
    }
  };

  if (!aperto) {
    return (
      <button type="button" className={styles.linguetta} onClick={() => setAperto(true)} title="Apri il tracker partita">
        Tracker partita
      </button>
    );
  }

  return (
    <aside className={styles.pannello}>
      <div className={styles.titoloPannello}>
        <span>Tracker partita</span>
        <button type="button" className={styles.chiudi} onClick={() => setAperto(false)} title="Chiudi il tracker">
          ✕
        </button>
      </div>
      <div className={styles.corpo}>
      {!inPartita ? (
        <SetupTracker />
      ) : (
        <div className={styles.partita}>
          <div className={styles.turni}>
            <button type="button" className={styles.piccolo} onClick={tornaIndietro} title="Turno precedente">
              ◀
            </button>
            <div className={styles.turnoInfo}>
              <div className={styles.round}>
                Round {stato.round} <small>di {LIMITI_VP.round}</small>
              </div>
              <div className={styles.chiTocca}>
                {stato.finita ? 'Partita finita' : `Turno ${NOME_GIOCATORE[stato.turnoDi]}`}
              </div>
            </div>
            <button
              type="button"
              className={styles.piccolo}
              onClick={avanzaTurno}
              disabled={stato.finita}
              title={ultimoTurno ? 'Termina la partita' : 'Turno successivo'}
            >
              {ultimoTurno ? '🏁' : '▶'}
            </button>
          </div>
          <SchedaGiocatore giocatore="blu" />
          <SchedaGiocatore giocatore="rosso" />
          <button type="button" className={`${styles.secondario} ${styles.nuova}`} onClick={() => setConfermaAperta(true)}>
            Nuova partita
          </button>
          <Modale titolo="Nuova partita" aperto={confermaAperta} onChiudi={() => setConfermaAperta(false)}>
            <p className={styles.testoConferma}>
              Azzera il tracker (disposizioni, round e tutti i punti) e torna al setup. Le basette sul campo e gli
              indicatori non cambiano.
            </p>
            <div className={styles.azioniDialogo}>
              <button
                type="button"
                onClick={() => {
                  nuovaPartita();
                  setConfermaAperta(false);
                }}
              >
                Azzera
              </button>
              <button type="button" className={styles.secondario} onClick={() => setConfermaAperta(false)}>
                Annulla
              </button>
            </div>
          </Modale>
        </div>
      )}
      </div>
      {inPartita && <StatisticheTracker />}
    </aside>
  );
}

export default TrackerPartita;
