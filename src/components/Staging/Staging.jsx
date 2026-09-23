import { useTavolo } from '../../contexts/TavoloContext';
import styles from './Staging.module.css';

function Staging() {
  const { campoGiocoPx } = useTavolo();

  return (
    <div className={styles.staging} style={{ width: campoGiocoPx.larghezza, height: campoGiocoPx.altezza }}>
      <span className={styles.etichetta}>Area di staging</span>
    </div>
  );
}

export default Staging;
