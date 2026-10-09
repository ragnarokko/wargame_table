import { useState } from 'react';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { EVENTO_SELEZIONE_MULTIPLA } from '../../utils/selezioneEventi';
import Modale from '../Modale/Modale';
import { CHIAVE_LOCALSTORAGE } from '../PersistenzaEserciti/PersistenzaEserciti';
import styles from './Reset.module.css';

// Pulsante "Reset" nell'intestazione della sidebar: dopo conferma toglie tutte le unità create (le
// basette della libreria e gli elementi scenici restano) e tutte le basette sul campo, staging
// compreso. Cancella anche la copia degli eserciti in localStorage (scritta da "Esporta eserciti"),
// altrimenti le unità tornerebbero al prossimo caricamento della pagina.
function Reset() {
  const [aperto, setAperto] = useState(false);
  const { sostituisciUnitaEserciti } = useLibreria();
  const { istanze, rimuoviIstanze } = useTavoloState();

  const conferma = () => {
    window.dispatchEvent(new CustomEvent(EVENTO_SELEZIONE_MULTIPLA, { detail: { ids: [] } }));
    rimuoviIstanze(istanze.map((i) => i.id));
    sostituisciUnitaEserciti([]);
    try {
      localStorage.removeItem(CHIAVE_LOCALSTORAGE);
    } catch {
      // localStorage non disponibile: niente da ripulire.
    }
    setAperto(false);
  };

  return (
    <>
      <button
        type="button"
        className={styles.reset}
        onClick={() => setAperto(true)}
        title="Toglie tutte le unità e libera il campo"
      >
        Reset
      </button>
      <Modale titolo="Reset" aperto={aperto} onChiudi={() => setAperto(false)}>
        <p className={styles.testo}>
          Vuoi togliere tutte le unità create (Blu e Rosso) e tutte le basette dal campo e dallo staging? Gli elementi
          scenici e la libreria delle basette restano. L'operazione non si può annullare.
        </p>
        <div className={styles.azioni}>
          <button type="button" className={styles.conferma} onClick={conferma} autoFocus>
            Reset
          </button>
          <button type="button" onClick={() => setAperto(false)}>
            Annulla
          </button>
        </div>
      </Modale>
    </>
  );
}

export default Reset;
