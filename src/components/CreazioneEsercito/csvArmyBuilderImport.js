import { useSyncExternalStore } from 'react';
import { urlArmyBuilderCsv } from '../../config/datiCsv';
import { parseRigheCsv } from './csvUnitaImport';

// Dati extra per l'army builder (cartella army_builder/ del sito del calcolatore, generata da
// Wahapedia con `node tools/wahapedia-to-csv.mjs`): per ora servono
//   punti.csv        datasheet_id|name|scaglione|tipo|modelli|punti|descrizione
//   composizione.csv datasheet_id|name|line|descrizione|modello|min|max
//   abilita.csv      datasheet_id|name|line|model|ability_id|ability|type|parameter|descrizione   (facoltativo)
//   abilita_comuni.csv ability_id|ability|fac|legend|descrizione   (facoltativo: testo delle abilità di fazione)
// Sono indicizzati per datasheet_id (gli stessi di info.csv). Per le unità BSData che non hanno un id
// Wahapedia si ripiega sul nome. Se i file mancano (sito non ancora aggiornato) l'app funziona
// comunque, semplicemente senza punti.

const normalizza = (testo) => (testo || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const singolare = (testo) => normalizza(testo).replace(/s$/, '');

const ETICHETTE_SCAGLIONE = {
  unica: '',
  1: '1ª unità',
  '1-2': '1ª–2ª unità',
  '1-3': '1ª–3ª unità',
  '2+': '2ª e successive',
  '3+': '3ª e successive',
  '4+': '4ª e successive',
};

let puntiPerId = new Map(); // id → { scaglioni: [{ codice, etichetta, tagli: [{ modelli, punti }] }], opzioni: [...] }
let idPerNome = new Map(); // nome normalizzato → id
let composizionePerId = new Map(); // id → [{ modello, min, max }]
let abilitaPerId = new Map(); // id → [{ nome, core, parametro, descrizione }]
let caricato = false;
let promessaInCorso = null;
let ultimoErrore = null;
let versione = {};
const ascoltatori = new Set();

function notificaAscoltatori() {
  ascoltatori.forEach((cb) => cb());
}

async function scaricaCsv(nomeFile) {
  const percorso = urlArmyBuilderCsv(nomeFile);
  const risposta = await fetch(`${percorso}?t=${Date.now()}`, { cache: 'no-store' });
  const testo = await risposta.text();
  if (!risposta.ok || testo.trimStart().startsWith('<')) {
    throw new Error(`Impossibile leggere ${percorso} (HTTP ${risposta.status})`);
  }
  return parseRigheCsv(testo);
}

function costruisciPunti(righe) {
  const perId = new Map();
  const perNome = new Map();
  for (const r of righe) {
    const id = String(r.datasheet_id);
    if (!id) continue;
    if (!perId.has(id)) perId.set(id, { scaglioni: [], opzioni: [] });
    const scheda = perId.get(id);
    const punti = Number(r.punti);
    if (!Number.isFinite(punti)) continue;
    if (r.tipo === 'unita') {
      let scaglione = scheda.scaglioni.find((s) => s.codice === r.scaglione);
      if (!scaglione) {
        scaglione = { codice: r.scaglione, etichetta: ETICHETTE_SCAGLIONE[r.scaglione] ?? r.scaglione, tagli: [] };
        scheda.scaglioni.push(scaglione);
      }
      scaglione.tagli.push({ modelli: Number(r.modelli), punti });
    } else {
      scheda.opzioni.push({ scaglione: r.scaglione, descrizione: r.descrizione, punti });
    }
    const chiaveNome = normalizza(r.name);
    if (chiaveNome && !perNome.has(chiaveNome)) perNome.set(chiaveNome, id);
  }
  perId.forEach((scheda) => scheda.scaglioni.forEach((s) => s.tagli.sort((a, b) => a.modelli - b.modelli)));
  return { perId, perNome };
}

function costruisciComposizione(righe) {
  const perId = new Map();
  for (const r of righe) {
    if (!r.modello) continue;
    const id = String(r.datasheet_id);
    if (!perId.has(id)) perId.set(id, []);
    perId.get(id).push({ modello: r.modello, min: Number(r.min), max: Number(r.max) });
  }
  return perId;
}

// Abilità per scheda. Le abilità di fazione non hanno il testo in riga: sta in abilita_comuni.csv,
// richiamato con ability_id.
function costruisciAbilita(righe, comuni) {
  const testoComune = new Map(comuni.map((c) => [String(c.ability_id), (c.descrizione ?? '').trim()]));
  const perId = new Map();
  for (const r of righe) {
    const nome = (r.ability ?? '').trim();
    if (!nome) continue;
    const id = String(r.datasheet_id);
    if (!perId.has(id)) perId.set(id, []);
    const core = r.type === 'Core';
    const descrizione = core ? '' : ((r.descrizione ?? '').trim() || testoComune.get(String(r.ability_id)) || '');
    perId.get(id).push({ nome, core, fazione: r.type === 'Faction', parametro: (r.parameter ?? '').trim(), descrizione });
  }
  return perId;
}

async function scaricaEProcessa() {
  const [righePunti, righeComposizione] = await Promise.all([
    scaricaCsv('punti.csv'),
    scaricaCsv('composizione.csv'),
  ]);
  // Le abilità sono un di più: se i file mancano il resto continua a funzionare.
  const [righeAbilita, righeComuni] = await Promise.all([
    scaricaCsv('abilita.csv').catch(() => []),
    scaricaCsv('abilita_comuni.csv').catch(() => []),
  ]);
  const { perId, perNome } = costruisciPunti(righePunti);
  return {
    perId,
    perNome,
    composizione: costruisciComposizione(righeComposizione),
    abilita: costruisciAbilita(righeAbilita, righeComuni),
  };
}

// Come csvArmiImport.js: caricamento al primo utilizzo, richieste concorrenti condivise, e in caso di
// errore la cache precedente resta valida.
export function caricaDatiArmyBuilderSeNecessario() {
  if (caricato) return Promise.resolve();
  if (!promessaInCorso) {
    promessaInCorso = scaricaEProcessa()
      .then((dati) => {
        puntiPerId = dati.perId;
        idPerNome = dati.perNome;
        composizionePerId = dati.composizione;
        abilitaPerId = dati.abilita;
        caricato = true;
        ultimoErrore = null;
      })
      .catch((errore) => {
        ultimoErrore = errore;
        throw errore;
      })
      .finally(() => {
        promessaInCorso = null;
        // Nuovo riferimento anche dopo un errore: il form deve ri-renderizzarsi per mostrarlo.
        versione = {};
        notificaAscoltatori();
      });
  }
  return promessaInCorso;
}

export function ricaricaDatiArmyBuilder() {
  caricato = false;
  return caricaDatiArmyBuilderSeNecessario();
}

export function datiArmyBuilderCaricati() {
  return caricato;
}

// Ultimo errore di caricamento (Error o null): il form unità lo usa per spiegare perché mancano i punti.
export function erroreCaricamentoArmyBuilder() {
  return ultimoErrore;
}

// Cambia riferimento ad ogni caricamento riuscito: va usato come dipendenza dei useMemo che chiamano
// le funzioni qui sotto, che leggono uno stato esterno al render.
export function useVersioneDatiArmyBuilder() {
  return useSyncExternalStore(
    (cb) => {
      ascoltatori.add(cb);
      return () => ascoltatori.delete(cb);
    },
    () => versione,
  );
}

function idScheda(unitaCsv) {
  if (!unitaCsv) return null;
  const id = String(unitaCsv.datasheetId);
  if (puntiPerId.has(id)) return id;
  return idPerNome.get(normalizza(unitaCsv.nome)) ?? null;
}

// Costi dell'unità: { scaglioni: [{ codice, etichetta, tagli: [{ modelli, punti }] }], opzioni: [...] },
// oppure null se l'unità non ha punti nei dati.
export function datiPuntiUnita(unitaCsv) {
  const id = idScheda(unitaCsv);
  const scheda = id ? puntiPerId.get(id) : null;
  return scheda && scheda.scaglioni.length > 0 ? scheda : null;
}

// Punti per un dato numero di modelli, dal primo scaglione (quello della prima unità): il taglio più
// piccolo che li contiene (10 modelli → taglio da 10; 12 → taglio da 20). `esatto` dice se il numero
// coincide con un taglio vero; se supera il taglio massimo si restituisce quello.
export function puntiPerNumeroModelli(datiPunti, numeroModelli) {
  const tagli = datiPunti?.scaglioni[0]?.tagli;
  if (!tagli || tagli.length === 0) return null;
  const taglio = tagli.find((t) => t.modelli >= numeroModelli) ?? tagli[tagli.length - 1];
  return { punti: taglio.punti, taglia: taglio.modelli, esatto: taglio.modelli === numeroModelli };
}

// Numero di modelli proposto alla creazione: quello minimo della composizione per questo profilo
// (es. "9-18 Boy" → 9); se la composizione non lo nomina, la taglia più piccola dei punti quando la
// scheda ha un solo tipo di modello; altrimenti null (il form usa il suo valore di ripiego).
export function modelliPredefiniti(unitaCsv) {
  const id = idScheda(unitaCsv);
  if (!id) return null;
  const righe = composizionePerId.get(id) ?? [];
  const chiave = singolare(unitaCsv.nome);
  const propria = righe.find((r) => singolare(r.modello) === chiave);
  if (propria && propria.min > 0) return { valore: propria.min, min: propria.min, max: propria.max };
  if (righe.length <= 1) {
    const taglia = puntiPerId.get(id)?.scaglioni[0]?.tagli[0]?.modelli;
    if (taglia) return { valore: taglia, min: taglia, max: righe[0]?.max || null };
  }
  return null;
}

// Le abilità con testo più lungo di così, e quelle di fazione, non finiscono nel testo di NOTE: si
// mostrano per nome con un menu a tendina (vedi AbilitaEstese.jsx).
const SOGLIA_ABILITA_LUNGA = 150;

function abilitaDellUnita(unitaCsv) {
  if (!unitaCsv) return [];
  const id = String(unitaCsv.datasheetId);
  const chiave = abilitaPerId.has(id) ? id : idPerNome.get(normalizza(unitaCsv.nome));
  return (chiave && abilitaPerId.get(chiave)) || [];
}

const eEstesa = (a) => !a.core && a.descrizione && (a.fazione || a.descrizione.length > SOGLIA_ABILITA_LUNGA);

// Testo di NOTE: le abilità core solo con il nome (e l'eventuale valore, es. "Scouts 6\"", "Feel No Pain 5+")
// su una riga, poi quelle non core e brevi come "Nome: descrizione", una per riga. Stringa vuota se
// l'unità non ha abilità nei dati. L'unità si trova per id Wahapedia o, per le BSData senza id
// corrispondente, per nome (come i punti).
export function abilitaUnitaTesto(unitaCsv) {
  const abilita = abilitaDellUnita(unitaCsv).filter((a) => !eEstesa(a));
  const core = abilita.filter((a) => a.core).map((a) => (a.parametro ? `${a.nome} ${a.parametro}` : a.nome));
  const altre = abilita.filter((a) => !a.core).map((a) => (a.descrizione ? `${a.nome}: ${a.descrizione}` : a.nome));
  return [...new Set([core.join(', '), ...altre])].filter(Boolean).join('\n');
}

// Abilità lunghe o di fazione, da mostrare per nome con la descrizione a tendina: [{ nome, descrizione }].
export function abilitaEsteseUnita(unitaCsv) {
  const viste = new Set();
  return abilitaDellUnita(unitaCsv)
    .filter(eEstesa)
    .filter((a) => !viste.has(a.nome) && viste.add(a.nome))
    .map((a) => ({ nome: a.nome, descrizione: a.descrizione }));
}
