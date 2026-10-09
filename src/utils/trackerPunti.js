import { LIMITI_VP } from '../config/missioni';

// Logica di punteggio del tracker di partita (funzioni pure, nessun React).
//
// Una missione è un elenco di `sezioni` (vedi src/config/missioni.js), ognuna con `righe` di punteggio.
// La `selezione` di un dialogo di punteggio è un oggetto { 'indiceSezione:indiceRiga': n }, dove n è 0/1
// per le righe a spunta e un contatore per le righe `per`.

export const chiaveRiga = (indiceSezione, indiceRiga) => `${indiceSezione}:${indiceRiga}`;

// Sezioni che valgono nel round indicato, con l'indice originale (serve per le chiavi della selezione).
// Quelle di fine battaglia valgono solo nell'ultimo round.
export function sezioniDelRound(sezioni, round) {
  return sezioni
    .map((sezione, indice) => ({ sezione, indice }))
    .filter(({ sezione }) =>
      sezione.round === 'fine'
        ? round === LIMITI_VP.round
        : round >= sezione.round[0] && round <= sezione.round[1],
    );
}

// Raggruppa le righe di una sezione in "voci": una riga principale, le sue eventuali alternative
// (`alt`, si sceglie una sola riga del gruppo) e i bonus cumulativi (`cum`) che dipendono da essa.
export function raggruppaRighe(righe) {
  const voci = [];
  righe.forEach((riga, indice) => {
    const elemento = { riga, indice };
    const ultima = voci[voci.length - 1];
    if (riga.cum && ultima) ultima.cumulativi.push(elemento);
    else if (riga.alt && ultima) ultima.righe.push(elemento);
    else voci.push({ righe: [elemento], cumulativi: [] });
  });
  return voci;
}

// Quanti "eventi" della voce principale sono stati contati (base per i bonus cumulativi).
function conteggioVoce(voce, indiceSezione, selezione) {
  return voce.righe.reduce((somma, { indice }) => somma + (selezione[chiaveRiga(indiceSezione, indice)] || 0), 0);
}

// Punti di una selezione: `normale` (sezioni di round, con tetto di sezione) e `fine` (fine battaglia).
export function calcolaPunti(sezioni, round, selezione) {
  let normale = 0;
  let fine = 0;
  for (const { sezione, indice: indiceSezione } of sezioniDelRound(sezioni, round)) {
    let somma = 0;
    for (const voce of raggruppaRighe(sezione.righe)) {
      const base = conteggioVoce(voce, indiceSezione, selezione);
      for (const { riga, indice } of voce.righe) {
        somma += (selezione[chiaveRiga(indiceSezione, indice)] || 0) * riga.vp;
      }
      for (const { riga, indice } of voce.cumulativi) {
        const n = selezione[chiaveRiga(indiceSezione, indice)] || 0;
        somma += Math.min(n, riga.per ? base : base > 0 ? 1 : 0) * riga.vp;
      }
    }
    if (sezione.cap) somma = Math.min(somma, sezione.cap);
    if (sezione.round === 'fine') fine += somma;
    else normale += somma;
  }
  return { normale, fine };
}

const somma = (valori) => valori.reduce((tot, v) => tot + v, 0);

// Totali di un giocatore. `primaria` è { round: vp } (un valore per round, già con il tetto di round
// applicato dal dialogo); `log` sono le voci delle secondarie { round, vp }, con tetto per round.
export function totaliGiocatore(giocatore) {
  const primaria = Math.min(somma(Object.values(giocatore.primaria)), LIMITI_VP.primariaTotale);
  const secondariaPerRound = {};
  for (const voce of giocatore.log) {
    secondariaPerRound[voce.round] = (secondariaPerRound[voce.round] || 0) + voce.vp;
  }
  const secondaria = Math.min(
    somma(Object.values(secondariaPerRound).map((v) => Math.min(v, LIMITI_VP.secondariaRound))),
    LIMITI_VP.secondariaTotale,
  );
  return { primaria, secondaria, totale: primaria + secondaria, secondariaPerRound };
}
