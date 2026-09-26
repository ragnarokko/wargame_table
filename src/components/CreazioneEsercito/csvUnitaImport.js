import csvGrezzo from '../../../wapedia/info.csv?raw';

const SEPARATORE = '|';

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

// Colonne effettive di wapedia/info.csv (verificate aprendo il file, non corrispondono
// 1:1 ai nomi "ideali": separatore `|`, intestazione
// datasheet_id|line|name|MOV|RES|TS|TS+|Note|W|Ld|OC|base_size|fac|faction
function normalizzaUnita(record) {
  return {
    chiave: `${record.datasheet_id}-${record.line}`,
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

let unitaCache = null;

function caricaUnitaCsv() {
  if (!unitaCache) {
    unitaCache = parseRigheCsv(csvGrezzo)
      .map(normalizzaUnita)
      .filter((u) => u.fazione && u.nome);
  }
  return unitaCache;
}

export function elencoFazioni() {
  return [...new Set(caricaUnitaCsv().map((u) => u.fazione))].sort((a, b) => a.localeCompare(b));
}

export function unitaPerFazione(fazione) {
  return caricaUnitaCsv().filter((u) => u.fazione === fazione);
}

// Determina forma e dimensioni (mm) della basetta a partire dal campo base_size del CSV:
// - un solo numero → basetta tonda di quel diametro
// - due numeri (es. "170 x 109mm") → basetta ovale, primo numero = lato lungo
// - campo assente/vuoto → rettangolo 100x50mm come placeholder provvisorio
export function determinaFormaEDimensioni(baseSize) {
  const numeri = (baseSize || '').match(/[\d.]+/g);
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
