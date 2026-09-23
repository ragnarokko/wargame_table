import CaricaSfondo from '../CaricaSfondo/CaricaSfondo';
import LibreriaBasette from '../LibreriaBasette/LibreriaBasette';
import GestioneElementiScenici from '../ElementoScenico/GestioneElementiScenici';
import styles from './PannelloLaterale.module.css';

function PannelloLaterale() {
  return (
    <aside className={styles.pannello}>
      <div className={styles.titolo}>Tavolo da Gioco</div>
      <CaricaSfondo />
      <LibreriaBasette />
      <GestioneElementiScenici />
    </aside>
  );
}

export default PannelloLaterale;
