import { useSyncExternalStore } from 'react';
import { urlArmiCsv } from '../../config/datiCsv';

const SEPARATORE = '|';

// Colonne effettive di Datasheets_wargear.csv (verificate aprendo il file): a differenza
// di info.csv l'intestazione ha DUE colonne chiamate "name" (una per l'unità, una per l'arma), per
// cui non si può costruire un record indicizzato per nome colonna come in csvUnitaImport.js (la
// seconda sovrascriverebbe la prima) e si legge invece per posizione:
// datasheet_id|name(unità)|line|line_in_wargear|dice|name(arma)|description|range|type|A|BS_WS|S|AP|D
function parseRigheCsv(testo) {
  const righe = testo
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((riga) => riga.trim() !== '');
  const [, ...corpo] = righe;
  return corpo.map((riga) => {
    const v = riga.split(SEPARATORE).map((c) => c.trim());
    return {
      datasheetId: v[0] ?? '',
      unita: v[1] ?? '',
      arma: v[5] ?? '',
      descrizione: v[6] ?? '',
      range: v[7] ?? '',
      tipo: v[8] ?? '',
      attGrezzo: v[9] ?? '',
      bsWsGrezzo: v[10] ?? '',
      forzaGrezzo: v[11] ?? '',
      apGrezzo: v[12] ?? '',
      danniGrezzo: v[13] ?? '',
    };
  });
}

// Converte un valore "NdM+K" (es. "2D6+3", "D3") nella sua media arrotondata; un numero semplice
// passa invariato. Usato per i campi del calcolatore "Botte!" (ATT/DANNI), che accettano solo
// interi fissi e non notazione a dadi.
export function valoreMedioDado(grezzo, minimo = 1) {
  const testo = (grezzo || '').trim();
  if (!testo || testo === '-') return minimo;
  const intero = Number(testo);
  if (!Number.isNaN(intero)) return Math.max(minimo, Math.round(intero));
  const match = testo.match(/^(\d*)d(\d+)(?:\+(\d+))?$/i);
  if (!match) return minimo;
  const numDadi = match[1] ? Number(match[1]) : 1;
  const facce = Number(match[2]);
  const bonus = match[3] ? Number(match[3]) : 0;
  return Math.max(minimo, Math.round((numDadi * (facce + 1)) / 2 + bonus));
}

// BS_WS del CSV è già la soglia "X+" come numero semplice (2-6); alcune armi hanno "-" o "N/A"
// (nessun tiro per colpire, es. armi ad area) e non c'è una soglia XCOL sensata da impostare.
export function sogliaDaTesto(grezzo) {
  const numero = Number((grezzo || '').trim());
  return Number.isInteger(numero) && numero >= 2 && numero <= 6 ? numero : null;
}

// L'AP nel CSV è negativo o zero come da convenzione di gioco (es. "-2"); il calcolatore vuole
// invece il valore assoluto da sommare alla soglia salvezza (vedi combat.ap + combat.save in
// sito_dadi/index.html), quindi va invertito di segno.
export function apDaTesto(grezzo) {
  const numero = Number((grezzo || '').trim());
  return Number.isNaN(numero) ? 0 : Math.max(0, -numero);
}

let armiCache = [];
let caricato = false;
let promessaInCorso = null;
let ultimoErrore = null;
const ascoltatori = new Set();

function notificaAscoltatori() {
  ascoltatori.forEach((cb) => cb());
}

async function scaricaEProcessaCsv() {
  const percorso = urlArmiCsv();
  const risposta = await fetch(`${percorso}?t=${Date.now()}`, { cache: 'no-store' });
  const testo = await risposta.text();
  if (!risposta.ok || testo.trimStart().startsWith('<')) {
    throw new Error(`Impossibile leggere ${percorso} (HTTP ${risposta.status})`);
  }
  return parseRigheCsv(testo).filter((a) => a.datasheetId && a.arma);
}

export function caricaDatiArmiSeNecessario() {
  if (caricato) return Promise.resolve();
  if (!promessaInCorso) {
    promessaInCorso = scaricaEProcessaCsv()
      .then((armi) => {
        armiCache = armi;
        caricato = true;
        ultimoErrore = null;
      })
      .catch((errore) => {
        ultimoErrore = errore;
        throw errore;
      })
      .finally(() => {
        promessaInCorso = null;
        notificaAscoltatori();
      });
  }
  return promessaInCorso;
}

export function ricaricaDatiArmi() {
  caricato = false;
  return caricaDatiArmiSeNecessario();
}

export function datiArmiCaricati() {
  return caricato;
}

// Ultimo errore di caricamento/ricaricamento (Error o null se l'ultimo tentativo è andato a
// buon fine): usato da ErroreDatiCsv.jsx per mostrare un popup con il dettaglio.
export function erroreCaricamentoArmi() {
  return ultimoErrore;
}

export function useVersioneDatiArmi() {
  return useSyncExternalStore(
    (cb) => {
      ascoltatori.add(cb);
      return () => ascoltatori.delete(cb);
    },
    () => armiCache,
  );
}

// Le unità create prima di questa funzionalità (o importate da un salvataggio precedente) non
// hanno `datasheetId`: si ricade sul nome unità del CSV (case-insensitive), provando anche a
// togliere un eventuale suffisso numerico di dedup aggiunto da generaNomeUnivoco (es. "Scout2").
export function armiPerTemplate(template) {
  if (!caricato || !template) return [];
  if (template.datasheetId) {
    const perId = armiCache.filter((a) => a.datasheetId === String(template.datasheetId));
    if (perId.length) return perId;
  }
  const nome = (template.nome || '').trim().toLowerCase();
  if (!nome) return [];
  const perNome = armiCache.filter((a) => a.unita.trim().toLowerCase() === nome);
  if (perNome.length) return perNome;
  const nomeSenzaSuffisso = nome.replace(/\d+$/, '');
  if (nomeSenzaSuffisso === nome) return [];
  return armiCache.filter((a) => a.unita.trim().toLowerCase() === nomeSenzaSuffisso);
}
