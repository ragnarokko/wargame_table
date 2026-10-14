// Converte i 45 layout dell'11a edizione (Event Companion) pubblicati da rapidingress.com in un JSON
// per layout, in src/data/layouts/<ID>.json, letti a runtime da LayoutTavolo (un layout alla volta).
//
//   node tools/converti-layout-rapidingress.mjs [--aggiorna] [--cache <cartella>] [--out <cartella>]
//
// Sorgenti (CORS aperto, nessuna autenticazione): terrain-data-11e.js (terreni, zone di schieramento,
// obiettivi, icone "occhio") e measurements-11e.js (quote in pollici). Vengono scaricate una volta in
// --cache (predefinita tools/.cache/rapidingress, esclusa da git); --aggiorna le riscarica.
//
// Il sorgente usa un'origine in basso a sinistra con l'asse Y verso l'alto: qui la Y è ribaltata
// (origine in alto a sinistra, come lo schermo), tutto in pollici su un tavolo 60×44. I contorni sono
// semplificati (Ramer-Douglas-Peucker, 0,03") e arrotondati al centesimo di pollice.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITO = 'https://rapidingress.com';
const FILE_SORGENTE = ['terrain-data-11e.js', 'measurements-11e.js'];
const TOLLERANZA_POLLICI = 0.03;

function argomento(nome, predefinito) {
  const i = process.argv.indexOf(nome);
  return i >= 0 ? process.argv[i + 1] : predefinito;
}
const cartellaCache = path.resolve(RADICE, argomento('--cache', 'tools/.cache/rapidingress'));
const cartellaOut = path.resolve(RADICE, argomento('--out', 'src/data/layouts'));
const aggiorna = process.argv.includes('--aggiorna');

async function leggiSorgente(nomeFile) {
  const percorso = path.join(cartellaCache, nomeFile);
  if (aggiorna || !existsSync(percorso)) {
    console.log(`Scarico ${SITO}/${nomeFile} …`);
    const risposta = await fetch(`${SITO}/${nomeFile}`);
    if (!risposta.ok) throw new Error(`${nomeFile}: HTTP ${risposta.status}`);
    mkdirSync(cartellaCache, { recursive: true });
    writeFileSync(percorso, await risposta.text());
  }
  return readFileSync(percorso, 'utf8');
}

// I file sorgente sono script del browser con `const NOME = ...`: si eseguono in un contesto isolato.
function caricaDati(codiceTerreni, codiceQuote) {
  const script = `${codiceTerreni}\n${codiceQuote}\nthis.__dati = { layout: ELEVEN_E_LAYOUTS, quote: ELEVEN_E_MEASUREMENTS };`;
  const contesto = vm.createContext({});
  vm.runInContext(script, contesto);
  return contesto.__dati;
}

const arrotonda = (v) => Math.round(v * 100) / 100;

function distanzaDalSegmento(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lunghezza2 = dx * dx + dy * dy;
  if (lunghezza2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lunghezza2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function semplificaLinea(punti, tolleranza) {
  if (punti.length < 3) return punti;
  let massimo = 0;
  let indice = 0;
  for (let i = 1; i < punti.length - 1; i++) {
    const d = distanzaDalSegmento(punti[i], punti[0], punti[punti.length - 1]);
    if (d > massimo) {
      massimo = d;
      indice = i;
    }
  }
  if (massimo <= tolleranza) return [punti[0], punti[punti.length - 1]];
  const sinistra = semplificaLinea(punti.slice(0, indice + 1), tolleranza);
  const destra = semplificaLinea(punti.slice(indice), tolleranza);
  return [...sinistra.slice(0, -1), ...destra];
}

// Poligono chiuso: si parte dal punto più lontano dal primo, così il "giunto" cade su un vertice che resta.
function semplificaPoligono(punti, tolleranza) {
  if (punti.length <= 4) return punti;
  let lontano = 0;
  let massimo = -1;
  punti.forEach((p, i) => {
    const d = Math.hypot(p[0] - punti[0][0], p[1] - punti[0][1]);
    if (d > massimo) {
      massimo = d;
      lontano = i;
    }
  });
  const ruotati = [...punti.slice(lontano), ...punti.slice(0, lontano)];
  const semplificati = semplificaLinea([...ruotati, ruotati[0]], tolleranza).slice(0, -1);
  return semplificati.length >= 3 ? semplificati : punti;
}

function centroide(punti) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < punti.length; i++) {
    const [x0, y0] = punti[i];
    const [x1, y1] = punti[(i + 1) % punti.length];
    const f = x0 * y1 - x1 * y0;
    area += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  if (area === 0) return punti[0];
  return [cx / (3 * area), cy / (3 * area)];
}

const RUOLI = { attacker: 'attaccante', defender: 'difensore' };

function convertiLayout(l, quoteLayout) {
  const altezza = l.boardHeight;
  const punti = (lista) => lista.map((p) => [p.x, altezza - p.y]);
  const contorno = (lista) => semplificaPoligono(punti(lista), TOLLERANZA_POLLICI).map(([x, y]) => [arrotonda(x), arrotonda(y)]);
  const idArea = (id) => id.slice(l.id.length + 1);

  const zone = l.deploymentZones.map((z) => ({
    ruolo: z.id.includes('-atk-') ? 'attaccante' : 'difensore',
    punti: punti(z.points).map(([x, y]) => [arrotonda(x), arrotonda(y)]),
  }));

  const impronte = [];
  const elementi = [];
  const obiettivi = [];
  for (const t of l.terrain) {
    if (t.base) {
      const contornoImpronta = contorno(t.points);
      impronte.push({ area: idArea(t.areaId), tipo: t.pieceType, oscurante: Boolean(t.obscuring), punti: contornoImpronta });
      if (t.objective) {
        const [x, y] = centroide(punti(t.points));
        obiettivi.push({
          numero: t.objective.number,
          area: idArea(t.areaId),
          tipo: t.objective.type,
          proprietario: RUOLI[t.objective.owner] ?? null,
          x: arrotonda(x),
          y: arrotonda(y),
        });
      }
    } else if (t.feature) {
      elementi.push({
        area: idArea(t.areaId),
        categoria: t.category,
        altezza: t.elevation,
        codici: t.codes ?? [],
        punti: contorno(t.points),
      });
    }
  }
  obiettivi.sort((a, b) => a.numero - b.numero);

  const occhi = (l.eyeBadges ?? []).map((o) => ({
    tipo: o.kind === 'separate' ? 'separate' : 'singola',
    x: arrotonda(o.x),
    y: arrotonda(altezza - o.y),
  }));

  const linee = (quoteLayout?.dimLines ?? []).map(([x1, y1, x2, y2]) => [x1, altezza - y1, x2, altezza - y2].map(arrotonda));
  const etichette = (quoteLayout?.dimLabels ?? []).map((e) => ({ testo: e.text, x: arrotonda(e.x), y: arrotonda(altezza - e.y) }));

  return {
    id: l.id,
    coppia: l.matchup,
    variante: l.variant,
    nome: l.dispositionLabel,
    missioni: l.missions,
    larghezza: l.boardWidth,
    altezza,
    zone,
    impronte,
    elementi,
    obiettivi,
    occhi,
    quote: { linee, etichette },
  };
}

const [codiceTerreni, codiceQuote] = await Promise.all(FILE_SORGENTE.map(leggiSorgente));
const { layout, quote } = caricaDati(codiceTerreni, codiceQuote);

mkdirSync(cartellaOut, { recursive: true });
let totale = 0;
for (const l of layout) {
  const json = JSON.stringify(convertiLayout(l, quote[l.id]));
  writeFileSync(path.join(cartellaOut, `${l.id}.json`), json);
  totale += json.length;
}
console.log(`${layout.length} layout scritti in ${path.relative(RADICE, cartellaOut)} (${Math.round(totale / 1024)} KB in tutto).`);
