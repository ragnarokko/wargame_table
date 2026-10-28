import { useTavolo } from '../../contexts/TavoloContext';
import styles from './LayoutTavolo.module.css';

// Due linee tratteggiate, una verticale e una orizzontale per il centro del tavolo, che lo dividono nei 4 quarti.
// Come CerchiCentro: il viewBox è in pollici sulle dimensioni reali del tavolo e non dipende dal layout scelto.
function Quarti() {
  const { tavoloRect, dimensioni, mostraQuarti } = useTavolo();
  if (!mostraQuarti) return null;
  const cx = dimensioni.larghezza / 2;
  const cy = dimensioni.altezza / 2;
  return (
    <svg
      className={styles.quarti}
      style={{ left: tavoloRect.left, top: tavoloRect.top, width: tavoloRect.width, height: tavoloRect.height }}
      viewBox={`0 0 ${dimensioni.larghezza} ${dimensioni.altezza}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line className={styles.lineaQuarti} x1={cx} y1={0} x2={cx} y2={dimensioni.altezza} />
      <line className={styles.lineaQuarti} x1={0} y1={cy} x2={dimensioni.larghezza} y2={cy} />
    </svg>
  );
}

export default Quarti;
