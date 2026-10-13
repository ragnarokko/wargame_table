import { elencoFazioni, tutteLeUnita } from './csvUnitaImport';
import { idSchedaPerNome, modelliPredefiniti } from './csvArmyBuilderImport';

// Importazione di una lista fatta con New Recruit (o altri builder): il testo si analizza in righe di unità
// ("3x Brôkhyr Thunderkyn (80pts)", "Einhyr Champion (65pts)", anche con [..pts] o "points") e ognuna si
// associa a un'unità dei dati CSV per nome. I punti scritti nella lista si ignorano (si ricalcolano dai dati).

// Nomi con cui i builder chiamano le fazioni, quando non coincidono con quello dei dati.
const ALIAS_FAZIONI = {
  adeptusastartes: 'Space Marines',
  agentsoftheimperium: 'Imperial Agents',
};

// Minuscolo, senza accenti né punteggiatura (apostrofi tipografici compresi): "T’au" = "T'au" = "tau".
function normalizza(testo) {
  return (testo || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}
const singolare = (testo) => normalizza(testo).replace(/s$/, '');

const PUNTI = String.raw`[(\[]\s*\+?\s*\d+\s*(?:pts?|points?)\s*[)\]]`;
// [prefisso tipo "Char1:"] [N x] nome (NN pts)
const RE_UNITA = new RegExp(String.raw`^(?:[A-Za-z][A-Za-z ]{0,24}\d+\s*:\s*)?(?:(\d+)\s*x?\s+)?(.+?)\s*${PUNTI}`, 'i');
// Righe di equipaggiamento, potenziamenti e simili: non sono unità anche se riportano dei punti.
const RE_NON_UNITA = /^\s*(?:[•·\-–*+>]|enhancement|warlord)/i;

// Righe di unità del testo e fazione scritta nell'intestazione (es. "Xenos - Leagues of Votann - Mercenary
// Oathband"), se riconoscibile. Restituisce { fazioneTesto, voci: [{ nome, modelli | null }] }.
export function analizzaLista(testo) {
  const righe = (testo || '').split(/\r?\n/).filter((r) => r.trim() !== '');
  const candidate = [];
  const altre = [];
  for (const riga of righe) {
    if (!RE_NON_UNITA.test(riga) && RE_UNITA.test(riga.trim())) candidate.push(riga);
    else altre.push(riga);
  }
  // Le righe di equipaggiamento rientrate hanno spesso anch'esse i punti: si tengono solo quelle con il
  // rientro minimo, cioè le unità.
  const rientro = (r) => r.match(/^\s*/)[0].replace(/\t/g, '    ').length;
  const minimo = Math.min(...candidate.map(rientro));
  const voci = candidate
    .filter((r) => rientro(r) === minimo)
    .map((r) => {
      const m = r.trim().match(RE_UNITA);
      return { nome: m[2].trim().replace(/\s+/g, ' '), modelli: m[1] ? Number(m[1]) : null };
    });

  const fazioni = new Map(elencoFazioni().map((f) => [normalizza(f), f]));
  let fazioneTesto = '';
  for (const riga of altre) {
    for (const parte of riga.split(/\s[-–—]\s|[|,:;()[\]+]/)) {
      const chiave = normalizza(parte);
      const trovata = fazioni.get(chiave) ?? (ALIAS_FAZIONI[chiave] && fazioni.get(normalizza(ALIAS_FAZIONI[chiave])));
      if (trovata) {
        fazioneTesto = trovata;
        break;
      }
    }
    if (fazioneTesto) break;
  }
  return { fazioneTesto, voci };
}

// Unità dei dati a cui corrisponde un nome: prima uguaglianza esatta, poi senza la "s" finale, poi tramite il
// nome della scheda (es. "Boyz" → profilo "Boy"), infine per nome che ne contiene un altro (approssimata).
function candidatePerNome(nome, unita) {
  const n = normalizza(nome);
  const s = singolare(nome);
  const esatte = unita.filter((u) => normalizza(u.nome) === n);
  if (esatte.length) return { elenco: esatte, approssimata: false };
  const singolari = unita.filter((u) => singolare(u.nome) === s);
  if (singolari.length) return { elenco: singolari, approssimata: false };
  const idScheda = idSchedaPerNome(nome);
  if (idScheda) {
    const profili = unita.filter((u) => String(u.datasheetId) === String(idScheda)).sort((a, b) => a.riga - b.riga);
    if (profili.length) return { elenco: [profili[0]], approssimata: false };
  }
  if (n.length >= 5) {
    const contenute = unita.filter((u) => {
      const un = normalizza(u.nome);
      return un.startsWith(n) || (un.length >= 5 && n.startsWith(un));
    });
    if (contenute.length) return { elenco: contenute, approssimata: true };
  }
  return { elenco: [], approssimata: false };
}

// Associa le voci della lista alle unità dei dati. La fazione è quella dell'intestazione; se manca si
// sceglie quella che copre più unità. Restituisce { fazione, righe: [{ nome, modelli, unita | null,
// approssimata }] }; `modelli` è già il numero effettivo (quello scritto o il predefinito dell'unità).
export function riconosciLista(testo) {
  const { fazioneTesto, voci } = analizzaLista(testo);
  const tutte = tutteLeUnita();
  const trovate = voci.map((v) => ({ ...v, ...candidatePerNome(v.nome, tutte) }));

  let fazione = fazioneTesto;
  if (!fazione) {
    const conteggio = new Map();
    for (const t of trovate) {
      for (const f of new Set(t.elenco.map((u) => u.fazione))) conteggio.set(f, (conteggio.get(f) ?? 0) + 1);
    }
    fazione = [...conteggio].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  }

  const righe = trovate.map((t) => {
    // Con più corrispondenze si preferisce la fazione della lista; poi il profilo con numero di riga più basso.
    const unita =
      t.elenco.filter((u) => u.fazione === fazione).sort((a, b) => a.riga - b.riga)[0] ??
      [...t.elenco].sort((a, b) => a.riga - b.riga)[0] ??
      null;
    const modelli = t.modelli ?? (unita ? modelliPredefiniti(unita)?.valore : null) ?? 1;
    return { nome: t.nome, modelli, unita, approssimata: Boolean(unita) && t.approssimata };
  });
  return { fazione, righe };
}
