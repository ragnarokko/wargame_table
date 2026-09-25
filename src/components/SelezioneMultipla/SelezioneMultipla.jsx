import { useState } from 'react';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { puntoRelativoRuotato } from '../../utils/coordinate';
import { EVENTO_SELEZIONE_MULTIPLA } from '../../utils/selezioneEventi';
import styles from './SelezioneMultipla.module.css';

const SOGLIA_TRASCINAMENTO_PX = 3;

function SelezioneMultipla({ containerRef, attivo, rotazioneArea = 0 }) {
  const { istanze } = useTavoloState();
  const [rettangolo, setRettangolo] = useState(null);

  const puntoRelativo = (clientX, clientY) =>
    puntoRelativoRuotato(clientX, clientY, containerRef.current, rotazioneArea);

  const emettiSelezione = (ids) => {
    window.dispatchEvent(new CustomEvent(EVENTO_SELEZIONE_MULTIPLA, { detail: { ids } }));
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const punto = puntoRelativo(e.clientX, e.clientY);
    setRettangolo({ origine: punto, corrente: punto });
  };

  const onPointerMove = (e) => {
    if (!rettangolo) return;
    const punto = puntoRelativo(e.clientX, e.clientY);
    setRettangolo((r) => (r ? { ...r, corrente: punto } : r));
  };

  const onPointerUp = () => {
    if (!rettangolo) return;
    const { origine, corrente } = rettangolo;
    const trascinato = Math.hypot(corrente.x - origine.x, corrente.y - origine.y);
    setRettangolo(null);

    if (trascinato < SOGLIA_TRASCINAMENTO_PX) {
      emettiSelezione([]);
      return;
    }

    const minX = Math.min(origine.x, corrente.x);
    const maxX = Math.max(origine.x, corrente.x);
    const minY = Math.min(origine.y, corrente.y);
    const maxY = Math.max(origine.y, corrente.y);

    const selezionati = istanze
      .filter((ist) => ist.x >= minX && ist.x <= maxX && ist.y >= minY && ist.y <= maxY)
      .map((ist) => ist.id);

    emettiSelezione(selezionati);
  };

  if (!attivo) return null;

  const rettangoloStyle = rettangolo && {
    left: Math.min(rettangolo.origine.x, rettangolo.corrente.x),
    top: Math.min(rettangolo.origine.y, rettangolo.corrente.y),
    width: Math.abs(rettangolo.corrente.x - rettangolo.origine.x),
    height: Math.abs(rettangolo.corrente.y - rettangolo.origine.y),
  };

  return (
    <>
      <div
        className={styles.areaCattura}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {rettangoloStyle && <div className={styles.rettangolo} style={rettangoloStyle} />}
    </>
  );
}

export default SelezioneMultipla;
