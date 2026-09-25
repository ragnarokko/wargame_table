import { useEffect, useRef, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { useLibreria } from '../../contexts/LibreriaContext';
import Staging from '../Staging/Staging';
import Tavolo from '../Tavolo/Tavolo';
import Basetta from '../Basetta/Basetta';
import ElementoScenico from '../ElementoScenico/ElementoScenico';
import StrumentoRighello from '../StrumentoRighello/StrumentoRighello';
import SelezioneMultipla from '../SelezioneMultipla/SelezioneMultipla';
import styles from './AreaLavoro.module.css';

const INCREMENTO_ROTAZIONE_AREA = 90;

function AreaLavoro({ righelloAttivo }) {
  const { campoGiocoPx } = useTavolo();
  const { istanze, elementiScenici } = useTavoloState();
  const { basette } = useLibreria();
  const containerRef = useRef(null);
  const [rotazioneArea, setRotazioneArea] = useState(0);

  // A/S ruotano l'intera area di lavoro (tavolo + staging) di 45° per volta.
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setRotazioneArea((r) => (r - INCREMENTO_ROTAZIONE_AREA + 360) % 360);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setRotazioneArea((r) => (r + INCREMENTO_ROTAZIONE_AREA) % 360);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={styles.campoGioco}
        style={{
          width: campoGiocoPx.larghezza,
          height: campoGiocoPx.altezza,
          transform: `rotate(${rotazioneArea}deg)`,
        }}
      >
        <Staging />
        <Tavolo />

        <div className={styles.livelloInterattivo}>
          <SelezioneMultipla containerRef={containerRef} attivo={!righelloAttivo} rotazioneArea={rotazioneArea} />
          {elementiScenici.map((elemento) => (
            <ElementoScenico key={elemento.id} elemento={elemento} containerRef={containerRef} />
          ))}
          {istanze.map((istanza) => {
            const template = basette.find((b) => b.id === istanza.templateId);
            if (!template) return null;
            return (
              <Basetta
                key={istanza.id}
                istanza={istanza}
                template={template}
                containerRef={containerRef}
                rotazioneArea={rotazioneArea}
              />
            );
          })}
          <StrumentoRighello containerRef={containerRef} attivo={righelloAttivo} rotazioneArea={rotazioneArea} />
        </div>
      </div>
    </div>
  );
}

export default AreaLavoro;
