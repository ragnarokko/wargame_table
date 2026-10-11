import { origineSito } from '../../config/datiCsv';
import { registraFinestraCalcolatore } from '../../utils/finestreCalcolatore';
import { urlCalcolatoreSenzaCache } from './datiCalcolatore';

// Finestra "Botte!" aperta sulla scheda Duello (una sola: gli attacchi successivi la riusano e la portano in primo piano).
let finestra = null;

// Apre (o riusa) la finestra del Duello e le invia i dati dell'attacco. `costruisciDati` è asincrona
// (aspetta i CSV delle armi) e viene chiamata dopo l'apertura della finestra, che deve avvenire subito,
// dentro il gesto dell'utente, altrimenti il browser blocca il popup. Restituisce false se il popup è bloccato.
export async function apriDuello(costruisciDati) {
  const giaAperta = finestra && !finestra.closed;
  if (!giaAperta) {
    const larghezza = Math.min(1150, Math.round(window.screen.availWidth * 0.95));
    const sinistra = Math.round((window.screen.availWidth - larghezza) / 2);
    const features = `width=${larghezza},height=${window.screen.availHeight},left=${sinistra},top=0`;
    finestra = window.open(urlCalcolatoreSenzaCache('duello'), '_blank', features);
    if (!finestra) return false;
    registraFinestraCalcolatore(finestra);
  }
  const corrente = finestra;
  const datiPronti = costruisciDati();
  if (giaAperta) {
    corrente.postMessage(await datiPronti, origineSito());
    corrente.focus();
    return true;
  }
  // Finestra appena aperta: i dati partono solo quando la pagina segnala di essere pronta ("wh40-ready"),
  // altrimenti potrebbe non aver ancora registrato il proprio listener.
  const onMessage = (e) => {
    if (e.source !== corrente || e.data?.type !== 'wh40-ready') return;
    window.removeEventListener('message', onMessage);
    datiPronti.then((dati) => corrente.postMessage(dati, origineSito()));
  };
  window.addEventListener('message', onMessage);
  return true;
}
