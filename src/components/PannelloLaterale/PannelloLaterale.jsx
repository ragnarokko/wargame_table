import { useState } from 'react';
import PulsanteCalcolatore from '../Calcolatore/PulsanteCalcolatore';
import SalvataggioPartita from '../SalvataggioPartita/SalvataggioPartita';
import CaricaSfondo from '../CaricaSfondo/CaricaSfondo';
import LibreriaBasette from '../LibreriaBasette/LibreriaBasette';
import GestioneElementiScenici from '../ElementoScenico/GestioneElementiScenici';
import PulsanteRighello from '../StrumentoRighello/PulsanteRighello';
import SelettoreLayout from '../SelettoreLayout/SelettoreLayout';
import CreazioneEsercito from '../CreazioneEsercito/CreazioneEsercito';
import PulsanteAggiornaDati from '../CreazioneEsercito/PulsanteAggiornaDati';
import Aiuto from '../Aiuto/Aiuto';
import Impostazioni from '../Impostazioni/Impostazioni';
import LinkUtili from '../LinkUtili/LinkUtili';
import Regole from '../Regole/Regole';
import Reset from '../Reset/Reset';
import styles from './PannelloLaterale.module.css';

const CHIAVE_APERTO = 'tavolo-pannello-sinistro';

function leggiAperto() {
  try {
    return localStorage.getItem(CHIAVE_APERTO) !== 'no';
  } catch {
    return true;
  }
}

// Barra sinistra chiudibile come i pannelli di destra: da chiusa resta una linguetta verticale. Il contenuto
// resta montato anche da chiuso (solo nascosto), perché alcuni moduli ascoltano eventi della pagina (es. il
// doppio click su una basetta apre l'unità nella lista eserciti) e tengono il proprio stato. La scelta è ricordata.
function PannelloLaterale({ righelloAttivo, onToggleRighello }) {
  const [aperto, setApertoState] = useState(leggiAperto);

  const imposta = (valore) => {
    setApertoState(valore);
    try {
      localStorage.setItem(CHIAVE_APERTO, valore ? 'si' : 'no');
    } catch {
      // localStorage non disponibile: la scelta vale solo per questa sessione.
    }
  };

  return (
    <>
      <aside className={`${styles.pannello} ${aperto ? '' : styles.chiuso}`}>
        <div className={styles.titolo}>
          <Impostazioni />
          <span>Tavolo da Gioco</span>
          <Reset />
          <button
            type="button"
            className={styles.chiudi}
            onClick={() => imposta(false)}
            title="Chiudi il pannello"
            aria-label="Chiudi il pannello"
          >
            «
          </button>
        </div>
        <PulsanteCalcolatore />
        <SalvataggioPartita />
        <CaricaSfondo />
        <SelettoreLayout />
        <PulsanteRighello attivo={righelloAttivo} onToggle={onToggleRighello} />
        <CreazioneEsercito />
        <LibreriaBasette />
        <GestioneElementiScenici />
        <Aiuto />
        <Regole />
        <LinkUtili />
        <PulsanteAggiornaDati />
      </aside>
      {!aperto && (
        <button type="button" className={styles.linguetta} onClick={() => imposta(true)} title="Apri: Tavolo da Gioco">
          Tavolo da Gioco
        </button>
      )}
    </>
  );
}

export default PannelloLaterale;
