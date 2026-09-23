import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { useDraggable } from '../../hooks/useDraggable';
import { polliciAPx } from '../../utils/scala';
import styles from './ElementoScenico.module.css';

function ElementoScenico({ elemento, containerRef }) {
  const { pxPerPollice } = useTavolo();
  const { modificaElementoScenico, rimuoviElementoScenico } = useTavoloState();

  const handleSposta = (punto) => {
    modificaElementoScenico(elemento.id, { x: punto.x, y: punto.y });
  };

  const { posizioneVisualizzata, handlers, inTrascinamento } = useDraggable({
    containerRef,
    posizione: { x: elemento.x, y: elemento.y },
    onSposta: handleSposta,
  });

  const larghezzaPx = polliciAPx(elemento.larghezzaPollici, pxPerPollice);
  const altezzaPx = polliciAPx(elemento.altezzaPollici, pxPerPollice);

  const style = {
    left: posizioneVisualizzata.x - larghezzaPx / 2,
    top: posizioneVisualizzata.y - altezzaPx / 2,
    width: larghezzaPx,
    height: altezzaPx,
    backgroundColor: elemento.colore,
    borderRadius: elemento.forma === 'ovale' ? '50%' : 8,
    cursor: inTrascinamento ? 'grabbing' : 'grab',
    zIndex: inTrascinamento ? 40 : 5,
  };

  return (
    <div
      className={styles.elemento}
      style={style}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onDoubleClick={() => rimuoviElementoScenico(elemento.id)}
      title="Trascina per spostare. Doppio click per rimuovere."
    >
      <span className={styles.etichetta}>{elemento.nome}</span>
    </div>
  );
}

export default ElementoScenico;
