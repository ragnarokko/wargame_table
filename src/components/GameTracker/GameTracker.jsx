import styles from './GameTracker.module.css';

const URL_TRACKER = 'https://gdmissions.app/11th/tracker';

function GameTracker() {
  // Prova a posizionare la finestra sul terzo destro dello schermo (dimensioni
  // calcolate su screen.availWidth/availHeight per adattarsi a schermi diversi).
  // NB: è il browser a decidere se onorare le features di dimensione/posizione
  // di window.open — alcuni (specie se non riconoscono il click come apertura
  // "legittima" di popup) apriranno comunque una normale scheda a tutto schermo,
  // ignorandole. Non è un problema risolvibile lato codice.
  const apriInNuovaScheda = () => {
    const larghezza = Math.round(window.screen.availWidth / 3);
    const altezza = window.screen.availHeight;
    const sinistra = window.screen.availWidth - larghezza;
    const alto = 0;
    const features = `width=${larghezza},height=${altezza},left=${sinistra},top=${alto},noopener,noreferrer`;
    window.open(URL_TRACKER, '_blank', features);
  };

  return (
    <button type="button" className={styles.pulsante} onClick={apriInNuovaScheda}>
      Game Tracker ↗
    </button>
  );
}

export default GameTracker;
