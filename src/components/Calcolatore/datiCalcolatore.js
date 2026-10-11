import { apDaTesto, armiPerTemplate, sogliaDaTesto, valoreMedioDado } from '../CreazioneEsercito/csvArmiImport';
import { setDati, urlSitoDati } from '../../config/datiCsv';

// GitHub Pages serve index.html con Cache-Control: max-age=600 (visto in pratica, con tanto di
// hit sulla CDN davanti): senza una query string sempre diversa, aprendo il calcolatore entro
// 10 minuti da un aggiornamento del sito si rischia di ricevere dalla cache una versione vecchia
// della pagina (es. senza gli ultimi campi aggiunti all'Attaccante). `scheda` è l'hash che fa aprire
// direttamente una scheda ("combat" = Combattimento, "duello" = Duello; vedi lo script di index.html).
export function urlCalcolatoreSenzaCache(scheda = 'combat') {
  // Sito e set di dati sono quelli scelti in Impostazioni (letti ad ogni apertura).
  return `${urlSitoDati()}?t=${Date.now()}&dati=${setDati()}#${scheda}`;
}

// Un'arma pronta per il calcolatore: valori già normalizzati (media dei dadi arrotondata, AP
// invertito di segno) perché i campi ATT/XCOL/AP/DANNI del calcolatore accettano solo numeri
// fissi (vedi csvArmiImport.js per il dettaglio delle conversioni). `tipo` ("Ranged"/"Melee") e
// `range` servono alla scheda Duello (tiro/mischia e portata), non agli altri tab.
export function estraiArmi(template) {
  return armiPerTemplate(template).map((a) => ({
    nome: a.arma,
    descrizione: a.descrizione,
    tipo: a.tipo,
    range: a.range,
    att: valoreMedioDado(a.attGrezzo, 1),
    xcol: sogliaDaTesto(a.bsWsGrezzo),
    forza: Number(a.forzaGrezzo) || 1,
    ap: apDaTesto(a.apGrezzo),
    danni: valoreMedioDado(a.danniGrezzo, 1),
  }));
}

// Solo i campi che servono al calcolatore per precompilare Difensore (res/ts/tsPiu/w/fnp) e
// Attaccante (armi, via estraiArmi), più il datasheetId con cui il tab VSunità filtra le unità
// in gioco: le "unità" sono le basette con campo `esercito` create in
// Creazione Esercito (vedi CreazioneEsercito.jsx), non le basette generiche di libreria.
export function estraiUnita(basette, esercito) {
  return basette
    .filter((b) => b.esercito === esercito)
    .map((b) => ({ nome: b.nome, datasheetId: b.datasheetId, res: b.res, ts: b.ts, tsPiu: b.tsPiu, w: b.w, fnp: b.fnp, armi: estraiArmi(b) }));
}
