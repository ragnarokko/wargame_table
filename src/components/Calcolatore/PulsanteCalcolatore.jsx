import { useCallback } from 'react';
import { useLibreria } from '../../contexts/LibreriaContext';
import { caricaDatiArmiSeNecessario } from '../CreazioneEsercito/csvArmiImport';
import { origineSito } from '../../config/datiCsv';
import { estraiUnita, urlCalcolatoreSenzaCache } from './datiCalcolatore';
import { registraFinestraCalcolatore } from '../../utils/finestreCalcolatore';
import styles from './PulsanteCalcolatore.module.css';

// #combat fa aprire direttamente la scheda "Combattimento" del calcolatore (vedi lo script
// di index.html in quel repo, che legge location.hash all'avvio).

// Tasto "Botte!": apre il calcolatore di combattimento in una finestra separata (stessa
// logica con cui si apriva il vecchio pulsante Game Tracker: una nuova finestra ad ogni click,
// dimensionata sullo schermo disponibile) e gli invia le unità delle due armate via postMessage, così
// nel Difensore si può scegliere un'unità invece di ricopiarne a mano le statistiche.
function PulsanteCalcolatore() {
  const { basette } = useLibreria();

  const apri = useCallback(async () => {
    const larghezza = Math.min(1000, Math.round(window.screen.availWidth * 0.9));
    const altezza = window.screen.availHeight;
    const sinistra = Math.round((window.screen.availWidth - larghezza) / 2);
    const features = `width=${larghezza},height=${altezza},left=${sinistra},top=0`;
    const finestra = window.open(urlCalcolatoreSenzaCache('combat'), '_blank', features);
    if (!finestra) return; // popup bloccato dal browser
    registraFinestraCalcolatore(finestra);

    // Normalmente già pronti (precaricati da CreazioneEsercito al mount): questo await è solo
    // una rete di sicurezza per un click prestissimo dopo l'avvio dell'app.
    await caricaDatiArmiSeNecessario().catch(() => {});

    const datiEserciti = {
      type: 'wh40-eserciti',
      blu: estraiUnita(basette, 'blu'),
      rosso: estraiUnita(basette, 'rosso'),
    };
    // Il calcolatore segnala di essere pronto ("wh40-ready") al primo caricamento: solo
    // allora ha senso inviargli i dati, altrimenti la pagina potrebbe non aver ancora
    // registrato il proprio listener e il messaggio andrebbe perso.
    const onMessage = (e) => {
      if (e.source !== finestra || e.data?.type !== 'wh40-ready') return;
      finestra.postMessage(datiEserciti, origineSito());
      window.removeEventListener('message', onMessage);
    };
    window.addEventListener('message', onMessage);
  }, [basette]);

  return (
    <div className={styles.pannello}>
      <button
        type="button"
        className={styles.pulsante}
        onClick={apri}
        title="Apre il calcolatore di combattimento in una finestra separata, con le unità delle due armate pronte da selezionare come Difensore"
      >
        🥊 Botte!
      </button>
    </div>
  );
}

export default PulsanteCalcolatore;
