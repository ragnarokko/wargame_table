import { useState } from 'react';
import { LIMITI_VP } from '../../config/missioni';
import { useTracker } from '../../contexts/TrackerContext';
import Modale from '../Modale/Modale';
import PannelloDestro from '../PannelloDestro/PannelloDestro';
import SchedaGiocatore, { NOME_GIOCATORE } from './SchedaGiocatore';
import SetupTracker from './SetupTracker';
import StatisticheTracker from './StatisticheTracker';
import styles from './TrackerPartita.module.css';

// Pannello laterale destro, a tutta altezza, per tracciare la partita: setup guidato (disposizioni,
// secondarie, attaccante, primo turno), poi round/turni (riportati negli indicatori sul tavolo) e punti
// di primarie e secondarie per giocatore. Chiuso si riduce a una linguetta verticale (vedi PannelloDestro;
// aperto/chiuso è deciso da PannelliDestra). Stato in TrackerContext.
function TrackerPartita({ aperto, onApri, onChiudi }) {
  const { stato, avanzaTurno, tornaIndietro, nuovaPartita } = useTracker();
  const [confermaAperta, setConfermaAperta] = useState(false);
  const inPartita = stato.fase === 'partita';
  const ultimoTurno = stato.round === LIMITI_VP.round && stato.turnoDi !== stato.primo;

  return (
    <PannelloDestro
      titolo="Tracker partita"
      aperto={aperto}
      onApri={onApri}
      onChiudi={onChiudi}
      piede={inPartita ? <StatisticheTracker /> : null}
    >
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
    </PannelloDestro>
  );
}

export default TrackerPartita;
