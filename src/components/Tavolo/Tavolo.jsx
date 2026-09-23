import { useTavolo } from '../../contexts/TavoloContext';
import styles from './Tavolo.module.css';

function Tavolo() {
  const { tavoloRect, sfondo, dimensioni } = useTavolo();

  const style = {
    left: tavoloRect.left,
    top: tavoloRect.top,
    width: tavoloRect.width,
    height: tavoloRect.height,
    backgroundImage: sfondo ? `url(${sfondo})` : undefined,
  };

  return (
    <div className={styles.tavolo} style={style}>
      <span className={styles.etichetta}>
        {dimensioni.larghezza}&quot; × {dimensioni.altezza}&quot;
      </span>
    </div>
  );
}

export default Tavolo;
