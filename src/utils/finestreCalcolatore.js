// Finestre del calcolatore "Botte!" aperte da questa app (PulsanteCalcolatore apre una nuova
// finestra ad ogni click). Servono a "Aggiorna dati": dopo aver riletto i CSV qui, la stessa
// richiesta viene inoltrata alle finestre ancora aperte, che li rileggono a loro volta.
const ORIGINE_CALCOLATORE = 'https://ragnarokko.github.io';
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
    finestra.postMessage({ type: 'wh40-ricarica' }, ORIGINE_CALCOLATORE);
  });
}
