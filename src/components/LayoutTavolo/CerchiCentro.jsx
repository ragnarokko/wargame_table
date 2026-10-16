import { useTavolo } from '../../contexts/TavoloContext';
import styles from './LayoutTavolo.module.css';

const RAGGI_POLLICI = [3, 6];

// Due cerchi (3" e 6") attorno al centro del tavolo, utili per la missione Centre Ground. Il viewBox è in
// pollici sulle dimensioni reali del tavolo (px per pollice uguale nei due assi), quindi restano cerchi.
// Solo visuale, indipendente dal layout scelto.
function CerchiCentro() {
  const { tavoloRect, dimensioni, mostraCentro } = useTavolo();
  if (!mostraCentro) return null;
  const cx = dimensioni.larghezza / 2;
  const cy = dimensioni.altezza / 2;
  return (
    <svg
      className={styles.cerchiCentro}
      style={{ left: tavoloRect.left, top: tavoloRect.top, width: tavoloRect.width, height: tavoloRect.height }}
      viewBox={`0 0 ${dimensioni.larghezza} ${dimensioni.altezza}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {RAGGI_POLLICI.map((r) => (
        <g key={r}>
          <circle className={styles.cerchio} cx={cx} cy={cy} r={r} />
          <text className={styles.etichettaCerchio} x={cx} y={cy - r + 0.9}>
            {r}"
          </text>
        </g>
      ))}
    </svg>
  );
}

export default CerchiCentro;
