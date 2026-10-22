// Salvataggi della partita su GitHub, direttamente dal browser (api.github.com ha CORS aperto).
// L'accesso è un Personal Access Token "fine-grained" incollato dall'utente e ricordato in localStorage, limitato al
// solo repo `wargame_wh_save` (creato a mano dall'utente: un token così non può creare repo) con permesso
// Contents: read and write. I file stanno in `savegames/`.

const API = 'https://api.github.com';
const CARTELLA = 'savegames';
const CHIAVE_TOKEN = 'tavolo-github-token';

export const NOME_REPO = 'wargame_wh_save';
export const URL_NUOVO_REPO = `https://github.com/new?name=${NOME_REPO}&visibility=private`;
export const URL_NUOVO_TOKEN = `https://github.com/settings/personal-access-tokens/new?name=${NOME_REPO}&description=Salvataggi+Tavolo+da+Gioco&contents=write`;

const repoUtente = (utente) => `/repos/${utente}/${NOME_REPO}`;

export function tokenSalvato() {
  try {
    return localStorage.getItem(CHIAVE_TOKEN) ?? '';
  } catch {
    return '';
  }
}

export function salvaToken(token) {
  try {
    if (token) localStorage.setItem(CHIAVE_TOKEN, token);
    else localStorage.removeItem(CHIAVE_TOKEN);
  } catch {
    // senza localStorage il token vale solo finché la pagina resta aperta
  }
}

export class ErroreGithub extends Error {
  constructor(messaggio, stato) {
    super(messaggio);
    this.stato = stato;
  }
}

async function chiama(token, percorso, { metodo = 'GET', corpo, raw = false } = {}) {
  const risposta = await fetch(`${API}${percorso}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (risposta.status === 401) throw new ErroreGithub('Token non valido o scaduto.', 401);
  if (!risposta.ok) {
    let dettaglio = '';
    try {
      dettaglio = (await risposta.json()).message ?? '';
    } catch {
      // risposta senza JSON
    }
    const base = `GitHub ha risposto ${risposta.status}${dettaglio ? `: ${dettaglio.replace(/\.$/, '')}` : ''}.`;
    const aiuto = risposta.status === 403 ? ` Controlla che il token abbia Contents: Read and write su ${NOME_REPO}.` : '';
    throw new ErroreGithub(base + aiuto, risposta.status);
  }
  return raw ? risposta.text() : risposta.json();
}

// Nome dell'utente a cui appartiene il token.
export async function utenteDelToken(token) {
  return (await chiama(token, '/user')).login;
}

// Controlla che il repo dei salvataggi esista e che il token lo veda.
export async function verificaRepo(token, utente) {
  try {
    await chiama(token, repoUtente(utente));
  } catch (e) {
    if (e.stato === 404) {
      throw new ErroreGithub(
        `Repo ${utente}/${NOME_REPO} non trovato: crealo (privato) e dai al token accesso a quel repo.`,
        404,
      );
    }
    throw e;
  }
}

const percorsoFile = (utente, nome) => `${repoUtente(utente)}/contents/${CARTELLA}/${encodeURIComponent(nome)}`;

// Nomi dei file .json salvati, in ordine alfabetico ([] se la cartella non esiste ancora).
export async function elencaSalvataggi(token, utente) {
  await verificaRepo(token, utente);
  try {
    const voci = await chiama(token, `${repoUtente(utente)}/contents/${CARTELLA}`);
    return voci
      .filter((v) => v.type === 'file' && v.name.endsWith('.json'))
      .map((v) => v.name)
      .sort((a, b) => a.localeCompare(b));
  } catch (e) {
    if (e.stato === 404) return [];
    throw e;
  }
}

// Testo in base64 (UTF-8), a blocchi per non saturare lo stack con i file grandi.
function inBase64(testo) {
  const byte = new TextEncoder().encode(testo);
  let binario = '';
  for (let i = 0; i < byte.length; i += 0x8000) binario += String.fromCharCode(...byte.subarray(i, i + 0x8000));
  return btoa(binario);
}

// Salva `json` in `savegames/<base>.json` (con `_2`, `_3`… se il nome c'è già) e restituisce il nome del file.
export async function salvaSuGithub(token, utente, base, json) {
  const esistenti = new Set(await elencaSalvataggi(token, utente));
  let nome = `${base}.json`;
  for (let n = 2; esistenti.has(nome); n++) nome = `${base}_${n}.json`;
  await chiama(token, percorsoFile(utente, nome), {
    metodo: 'PUT',
    corpo: { message: `Salvataggio ${nome.replace(/\.json$/, '')}`, content: inBase64(json) },
  });
  return nome;
}

// Testo di un salvataggio (modalità raw: funziona anche oltre 1 MB).
export function caricaDaGithub(token, utente, nome) {
  return chiama(token, percorsoFile(utente, nome), { raw: true });
}
