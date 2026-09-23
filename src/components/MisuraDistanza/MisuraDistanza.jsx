import styles from './MisuraDistanza.module.css';

function MisuraDistanza({ pollici }) {
  return <div className={styles.misura}>{pollici.toFixed(1)}&quot;</div>;
}

export default MisuraDistanza;
