import { useCallback, useEffect, useRef, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { puntoRelativoRuotato } from '../../utils/coordinate';
import styles from './StrumentoRighello.module.css';

// Misurazione rapida con il tasto F, senza click del mouse: stessa logica/stile dello
// strumento righello libero (StrumentoRighello), ma sempre attiva (indipendente da
// PulsanteRighello/D) e senza overlay che intercetta i click, quindi non interferisce
// mai con drag basette, selezione multipla o pan.
function MisuraRapida({ containerRef, rotazioneArea = 0, zoom = 1 }) {
  const { pxPerPollice } = useTavolo();
  const [misurazione, setMisurazione] = useState(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const attivaRef = useRef(false);

  const puntoRelativo = useCallback(
    (clientX, clientY) => puntoRelativoRuotato(clientX, clientY, containerRef.current, rotazioneArea, zoom),
    [containerRef, rotazioneArea, zoom],
  );

  // Tiene traccia della posizione del mouse in ogni momento (anche a riposo): così alla
  // pressione di F si conosce già da dove partire, senza bisogno di un click iniziale.
  useEffect(() => {
    const onPointerMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      if (attivaRef.current) {
        const punto = puntoRelativo(e.clientX, e.clientY);
        setMisurazione((m) => (m ? { ...m, corrente: punto } : m));
      }
    };
    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [puntoRelativo]);

  // F premuto (ignorando l'auto-repeat) memorizza il punto di partenza; F rilasciato
  // (o la finestra che perde il focus mentre è premuto) fa scomparire la misurazione.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat || attivaRef.current) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        attivaRef.current = true;
        const punto = puntoRelativo(mousePosRef.current.x, mousePosRef.current.y);
        setMisurazione({ origine: punto, corrente: punto });
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        attivaRef.current = false;
        setMisurazione(null);
      }
    };
    const onBlur = () => {
      attivaRef.current = false;
      setMisurazione(null);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [puntoRelativo]);

  if (!misurazione) return null;

  const dx = misurazione.corrente.x - misurazione.origine.x;
  const dy = misurazione.corrente.y - misurazione.origine.y;
  const pollici = Math.sqrt(dx * dx + dy * dy) / pxPerPollice;

  return (
    <div className={styles.overlayPassivo}>
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
    </div>
  );
}

export default MisuraRapida;
