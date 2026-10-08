// Finestre del calcolatore "Botte!" aperte da questa app (PulsanteCalcolatore apre una nuova
// finestra ad ogni click). Servono a "Aggiorna dati": dopo aver riletto i CSV qui, la stessa
// richiesta viene inoltrata alle finestre ancora aperte, che li rileggono a loro volta.
import { origineSito, setDati } from '../config/datiCsv';

const finestreAperte = new Set();

export function registraFinestraCalcolatore(finestra) {
  finestreAperte.add(finestra);
}

export function ricaricaFinestreCalcolatore() {
  finestreAperte.forEach((finestra) => {
    if (finestra.closed) {
      finestreAperte.delete(finestra);
      return;
    }
    // Il set di dati va nel messaggio: la finestra può essere stata aperta con un set diverso da quello
    // scelto nel frattempo in Impostazioni.
    finestra.postMessage({ type: 'wh40-ricarica', dati: setDati() }, origineSito());
  });
}
