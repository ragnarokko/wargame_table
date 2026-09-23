import { useRef } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { useLibreria } from '../../contexts/LibreriaContext';
import Staging from '../Staging/Staging';
import Tavolo from '../Tavolo/Tavolo';
import Basetta from '../Basetta/Basetta';
import ElementoScenico from '../ElementoScenico/ElementoScenico';
import styles from './AreaLavoro.module.css';

function AreaLavoro() {
  const { campoGiocoPx } = useTavolo();
  const { istanze, elementiScenici } = useTavoloState();
  const { basette } = useLibreria();
  const containerRef = useRef(null);

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={styles.campoGioco}
        style={{ width: campoGiocoPx.larghezza, height: campoGiocoPx.altezza }}
      >
        <Staging />
        <Tavolo />

        <div className={styles.livelloInterattivo}>
          {elementiScenici.map((elemento) => (
            <ElementoScenico key={elemento.id} elemento={elemento} containerRef={containerRef} />
          ))}
          {istanze.map((istanza) => {
            const template = basette.find((b) => b.id === istanza.templateId);
            if (!template) return null;
            return <Basetta key={istanza.id} istanza={istanza} template={template} containerRef={containerRef} />;
          })}
        </div>
      </div>
    </div>
  );
}

export default AreaLavoro;
