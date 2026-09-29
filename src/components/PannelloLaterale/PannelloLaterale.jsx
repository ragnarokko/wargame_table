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
import LinkUtili from '../LinkUtili/LinkUtili';
import styles from './PannelloLaterale.module.css';

function PannelloLaterale({ righelloAttivo, onToggleRighello }) {
  return (
    <aside className={styles.pannello}>
      <div className={styles.titolo}>Tavolo da Gioco</div>
      <PulsanteCalcolatore />
      <SalvataggioPartita />
      <CaricaSfondo />
      <SelettoreLayout />
      <PulsanteRighello attivo={righelloAttivo} onToggle={onToggleRighello} />
      <CreazioneEsercito />
      <LibreriaBasette />
      <GestioneElementiScenici />
      <Aiuto />
      <LinkUtili />
      <PulsanteAggiornaDati />
    </aside>
  );
}

export default PannelloLaterale;
