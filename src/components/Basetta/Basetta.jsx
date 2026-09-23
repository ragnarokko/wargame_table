import { useEffect, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { useDraggable } from '../../hooks/useDraggable';
import { calcolaDimensioniBasettaPx } from '../../utils/basetta';
import BasettaTooltip from '../BasettaTooltip/BasettaTooltip';
import MisuraDistanza from '../MisuraDistanza/MisuraDistanza';
import styles from './Basetta.module.css';

function Basetta({ istanza, template, containerRef }) {
  const { pxPerPollice, puntoNelTavolo } = useTavolo();
  const { spostaIstanza, rimuoviIstanza } = useTavoloState();
  const [hover, setHover] = useState(false);
  const [ctrlPremuto, setCtrlPremuto] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Control') setCtrlPremuto(true);
    };
    const onKeyUp = (e) => {
      if (e.key === 'Control') setCtrlPremuto(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handleSposta = (puntoFinale) => {
    const zonaPartenza = istanza.zona;
    const zonaArrivo = puntoNelTavolo(puntoFinale.x, puntoFinale.y) ? 'tavolo' : 'staging';

    let distanza = null;
    if (zonaPartenza === 'tavolo' && zonaArrivo === 'tavolo') {
      const dx = puntoFinale.x - istanza.x;
      const dy = puntoFinale.y - istanza.y;
      distanza = Math.sqrt(dx * dx + dy * dy) / pxPerPollice;
    }

    spostaIstanza(istanza.id, puntoFinale.x, puntoFinale.y, zonaArrivo, distanza);
  };

  const { posizioneVisualizzata, handlers, inTrascinamento } = useDraggable({
    containerRef,
    posizione: { x: istanza.x, y: istanza.y },
    onSposta: handleSposta,
  });

  const dimensionePx = calcolaDimensioniBasettaPx(template, pxPerPollice);

  const style = {
    left: posizioneVisualizzata.x - dimensionePx.larghezza / 2,
    top: posizioneVisualizzata.y - dimensionePx.altezza / 2,
    width: dimensionePx.larghezza,
    height: dimensionePx.altezza,
    backgroundColor: template.colore,
    borderRadius: template.forma === 'rettangolare' ? 4 : '50%',
    cursor: inTrascinamento ? 'grabbing' : 'grab',
    zIndex: inTrascinamento ? 50 : 10,
  };

  return (
    <div
      className={styles.basetta}
      style={style}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDoubleClick={() => rimuoviIstanza(istanza.id)}
      title="Trascina per spostare. Ctrl+hover per i dettagli. Doppio click per rimuovere."
    >
      <span className={styles.nome}>{template.nome}</span>
      {istanza.zona === 'tavolo' && istanza.ultimaDistanza != null && !inTrascinamento && (
        <MisuraDistanza pollici={istanza.ultimaDistanza} />
      )}
      {hover && ctrlPremuto && <BasettaTooltip template={template} />}
    </div>
  );
}

export default Basetta;
