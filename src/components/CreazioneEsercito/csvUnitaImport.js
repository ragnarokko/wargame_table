import { useSyncExternalStore } from 'react';
import { URL_INFO_CSV } from '../../config/datiCsv';

const SEPARATORE = '|';
const PERCORSO_CSV = URL_INFO_CSV;

// Un campo quotato usa la sequenza CSV standard: virgolette doppie raddoppiate
// per rappresentare una virgoletta letterale (es. MOV `"6"""` → `6"`).
function pulisciCampo(valoreGrezzo = '') {
  const valore = valoreGrezzo.trim();
  if (valore.length >= 2 && valore.startsWith('"') && valore.endsWith('"')) {
    return valore.slice(1, -1).replace(/""/g, '"');
  }
  return valore;
}

function parseRigheCsv(testo) {
  const righe = testo
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((riga) => riga.trim() !== '');
  const [intestazione, ...corpo] = righe;
  const colonne = intestazione.split(SEPARATORE).map((c) => c.trim());
  return corpo.map((riga) => {
    const valori = riga.split(SEPARATORE).map(pulisciCampo);
    const record = {};
    colonne.forEach((colonna, i) => {
      record[colonna] = valori[i] ?? '';
    });
    return record;
  });
}

// Colonne effettive di info.csv (verificate aprendo il file, non corrispondono
// 1:1 ai nomi "ideali": separatore `|`, intestazione
// datasheet_id|line|name|MOV|RES|TS|TS+|Note|W|Ld|OC|base_size|fac|faction
function normalizzaUnita(record) {
  return {
    chiave: `${record.datasheet_id}-${record.line}`,
    datasheetId: record.datasheet_id,
    fazione: record.faction,
    nome: record.name,
    baseSize: record.base_size,
    mov: record.MOV,
    res: record.RES,
    ts: record.TS,
    tsPiu: record['TS+'],
    w: record.W,
    oc: record.OC,
    note: record.Note,
  };
}

// Dati CSV caricati a runtime via fetch di info.csv, pubblicato dal repo del calcolatore (non più incorporati nel bundle a
// build time con `?raw`): così il pulsante "Aggiorna dati" (PulsanteAggiornaDati) può rileggere
// il file dopo una modifica a mano anche in produzione, senza bisogno di un rebuild.
let unitaCache = [];
let caricato = false;
let promessaInCorso = null;
let ultimoErrore = null;
const ascoltatori = new Set();

function notificaAscoltatori() {
  ascoltatori.forEach((cb) => cb());
}

async function scaricaEProcessaCsv() {
  // Query string anti-cache: forza sempre una richiesta di rete fresca, anche dietro
  // un eventuale CDN/proxy che ignorerebbe altrimenti `cache: 'no-store'`.
  const risposta = await fetch(`${PERCORSO_CSV}?t=${Date.now()}`, { cache: 'no-store' });
  const testo = await risposta.text();
  // Molti server (il dev server di Vite incluso, e i tipici host di siti SPA in produzione)
  // rispondono 200 con index.html per qualunque percorso non trovato, per supportare il
  // routing lato client: un testo che inizia con "<" non è mai un CSV valido, va trattato
  // come "file non trovato" a tutti gli effetti (altrimenti sembrerebbe un caricamento
  // riuscito con zero unità, invece di segnalare l'errore).
  if (!risposta.ok || testo.trimStart().startsWith('<')) {
    throw new Error(`Impossibile leggere ${PERCORSO_CSV} (HTTP ${risposta.status})`);
  }
  return parseRigheCsv(testo)
    .map(normalizzaUnita)
    .filter((u) => u.fazione && u.nome);
}

// Avvia il caricamento al primo utilizzo; chiamate concorrenti condividono la stessa richiesta.
// In caso di errore la cache precedente (se presente) resta valida: un fallito "Aggiorna dati"
// non cancella i dati già caricati.
export function caricaDatiCsvSeNecessario() {
  if (caricato) return Promise.resolve();
  if (!promessaInCorso) {
    promessaInCorso = scaricaEProcessaCsv()
      .then((unita) => {
        unitaCache = unita;
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

// Forza un nuovo caricamento scartando la cache corrente: usato dal pulsante "Aggiorna dati"
// per rileggere info.csv dopo averlo modificato nel repo del calcolatore.
export function ricaricaDatiCsv() {
  caricato = false;
  return caricaDatiCsvSeNecessario();
}

export function datiCsvCaricati() {
  return caricato;
}

// Ultimo errore di caricamento/ricaricamento (Error o null se l'ultimo tentativo è andato a
// buon fine): usato da ErroreDatiCsv.jsx per mostrare un popup con il dettaglio.
export function erroreCaricamentoUnita() {
  return ultimoErrore;
}

// Fa ri-renderizzare il componente chiamante ad ogni caricamento/ricaricamento dei dati CSV.
// Il valore restituito (il riferimento all'array cache) va usato come dipendenza di un useMemo
// che richiama elencoFazioni()/unitaPerFazione(), altrimenti quei risultati restano quelli letti
// all'ultimo render prima del caricamento.
export function useVersioneDatiCsv() {
  return useSyncExternalStore(
    (cb) => {
      ascoltatori.add(cb);
      return () => ascoltatori.delete(cb);
    },
    () => unitaCache,
  );
}

export function elencoFazioni() {
  return [...new Set(unitaCache.map((u) => u.fazione))].sort((a, b) => a.localeCompare(b));
}

export function unitaPerFazione(fazione) {
  return unitaCache.filter((u) => u.fazione === fazione);
}

// Determina forma e dimensioni (mm) della basetta a partire dal campo base_size del CSV:
// - prefisso "r_LUNGxLARGHmm" (es. "r_100x50mm") → basetta rettangolare, primo numero = lunghezza
// - un solo numero → basetta tonda di quel diametro
// - due numeri (es. "170 x 109mm") → basetta ovale, primo numero = lato lungo
// - campo assente/vuoto → rettangolo 100x50mm come placeholder provvisorio
export function determinaFormaEDimensioni(baseSize) {
  const valore = (baseSize || '').trim();
  const rettangolare = valore.match(/^r_([\d.]+)\s*x\s*([\d.]+)\s*mm$/i);
  if (rettangolare) {
    const [, lungo, largo] = rettangolare;
    return { forma: 'rettangolare', lunghezzaMm: Number(lungo), larghezzaMm: Number(largo) };
  }
  const numeri = valore.match(/[\d.]+/g);
  if (!numeri || numeri.length === 0) {
    return { forma: 'rettangolare', larghezzaMm: 100, lunghezzaMm: 50 };
  }
  if (numeri.length === 1) {
    return { forma: 'tonda', diametroMm: Number(numeri[0]) };
  }
  const [lungo, corto] = numeri.map(Number);
  return { forma: 'ovale', lunghezzaMm: lungo, larghezzaMm: corto };
}

// Se il nome base è già usato, aggiunge un progressivo (Scout, Scout2, Scout3, ...).
export function generaNomeUnivoco(nomeBase, nomiEsistenti) {
  if (!nomiEsistenti.includes(nomeBase)) return nomeBase;
  let contatore = 2;
  while (nomiEsistenti.includes(`${nomeBase}${contatore}`)) {
    contatore += 1;
  }
  return `${nomeBase}${contatore}`;
}
