import { useCallback, useEffect, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { puntoRelativoRuotato } from '../../utils/coordinate';
import styles from './StrumentoRighello.module.css';

function StrumentoRighello({ containerRef, attivo, rotazioneArea = 0 }) {
  const { pxPerPollice } = useTavolo();
  const [misurazione, setMisurazione] = useState(null);

  useEffect(() => {
    if (!attivo) setMisurazione(null);
  }, [attivo]);

  const puntoRelativo = useCallback(
    (clientX, clientY) => puntoRelativoRuotato(clientX, clientY, containerRef.current, rotazioneArea),
    [containerRef, rotazioneArea],
  );

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const punto = puntoRelativo(e.clientX, e.clientY);
    setMisurazione({ origine: punto, corrente: punto });
  };

  const onPointerMove = (e) => {
    if (!misurazione) return;
    const punto = puntoRelativo(e.clientX, e.clientY);
    setMisurazione((m) => (m ? { ...m, corrente: punto } : m));
  };

  const onPointerUp = () => {
    setMisurazione(null);
  };

  let pollici = 0;
  if (misurazione) {
    const dx = misurazione.corrente.x - misurazione.origine.x;
    const dy = misurazione.corrente.y - misurazione.origine.y;
    pollici = Math.sqrt(dx * dx + dy * dy) / pxPerPollice;
  }

  if (!attivo) return null;

  return (
    <div
      className={styles.overlay}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {misurazione && (
        <>
          <svg className={styles.lineaSvg}>
            <line
              x1={misurazione.origine.x}
              y1={misurazione.origine.y}
              x2={misurazione.corrente.x}
              y2={misurazione.corrente.y}
              className={styles.linea}
            />
          </svg>
          <div
            className={styles.etichetta}
            style={{
              left: (misurazione.origine.x + misurazione.corrente.x) / 2,
              top: (misurazione.origine.y + misurazione.corrente.y) / 2,
            }}
          >
            {pollici.toFixed(1)}&quot;
          </div>
        </>
      )}
    </div>
  );
}

export default StrumentoRighello;
