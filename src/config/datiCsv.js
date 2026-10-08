import { useSyncExternalStore } from 'react';

// I due CSV (unità e armi) vivono nel repo del calcolatore "Botte!" e sono pubblicati con lui su
// GitHub Pages: è l'unica copia dei dati, usata sia dal calcolatore sia da questa app (che li
// scarica a runtime, vedi csvUnitaImport.js/csvArmiImport.js). GitHub Pages risponde con
// Access-Control-Allow-Origin: *, quindi il fetch cross-origin funziona anche da localhost.
// Per aggiornare i dati: rigenerarli (o modificarli) in quel repo, fare push, poi "Aggiorna dati" qui.
//
// Due scelte sono modificabili dall'utente nel popup Impostazioni (⚙, in alto a sinistra) e
// salvate in localStorage: quale coppia di file usare (letta a ogni download, quindi "Aggiorna dati"
// applica subito la scelta) e l'indirizzo GitHub della repo BSData da cui lo script del calcolatore
// ricava i dati (serve solo a comporre il comando di aggiornamento mostrato in Impostazioni e Aiuto).
//
// Per provare una versione locale del calcolatore senza pubblicare nulla: `.env.local` con
// `VITE_URL_CALCOLATORE=http://localhost:5180/` (sito dei dati) e, volendo, `VITE_SET_DATI=originale`.
// Vale per tutto: tasto "Botte!" e "Aggiorna dati" inclusi. `.env.local` non va committato.

const CHIAVE_STORAGE = 'wh40-impostazioni-dati';

const URL_SITO =
  import.meta.env.VITE_URL_CALCOLATORE || 'https://ragnarokko.github.io/calcolatore_wh40/';
// Repo da cui lo script tools/bsdata-to-csv.mjs (nel repo del calcolatore) ricava i dati BSData.
export const URL_REPO_BSDATA_PREDEFINITO = 'https://github.com/BSData/wh40k-11e';

// "originale" = info.csv / Datasheets_wargear.csv (mai modificati); "bsdata" = info_11e.csv /
// Datasheets_wargear_11e.csv, generati da BSData/wh40k-11e con `node tools/bsdata-to-csv.mjs`.
export const SET_DATI_DISPONIBILI = {
  originale: {
    etichetta: 'Dati tradizionali',
    info: 'info.csv',
    armi: 'Datasheets_wargear.csv',
  },
  bsdata: {
    etichetta: 'Dati BSData (11ª edizione)',
    info: 'info_11e.csv',
    armi: 'Datasheets_wargear_11e.csv',
  },
};
const setEnv = import.meta.env.VITE_SET_DATI;
const SET_PREDEFINITO = setEnv in SET_DATI_DISPONIBILI ? setEnv : 'bsdata';

// Accetta indirizzi di repo GitHub (https://github.com/utente/repo, anche con /tree/ramo o .git) e li
// riporta alla forma canonica; restituisce null se non è un indirizzo di repo GitHub.
export function normalizzaUrlRepo(testo) {
  try {
    const url = new URL((testo || '').trim());
    if (url.protocol !== 'https:' || !/^(www\.)?github\.com$/i.test(url.hostname)) return null;
    const [utente, nome, tree, ...ramo] = url.pathname.split('/').filter(Boolean);
    if (!utente || !nome) return null;
    const base = `https://github.com/${utente}/${nome.replace(/\.git$/i, '')}`;
    return tree === 'tree' && ramo.length ? `${base}/tree/${ramo.join('/')}` : base;
  } catch {
    return null;
  }
}

function leggiSalvate() {
  try {
    const grezzo = JSON.parse(localStorage.getItem(CHIAVE_STORAGE) || '{}');
    return {
      set: grezzo.set in SET_DATI_DISPONIBILI ? grezzo.set : SET_PREDEFINITO,
      repoBsdata: normalizzaUrlRepo(grezzo.repoBsdata) || URL_REPO_BSDATA_PREDEFINITO,
    };
  } catch {
    return { set: SET_PREDEFINITO, repoBsdata: URL_REPO_BSDATA_PREDEFINITO };
  }
}

// Lo stato è sostituito (mai modificato sul posto) a ogni cambio: serve a useSyncExternalStore.
let stato = leggiSalvate();
const ascoltatori = new Set();

function aggiorna(nuovo) {
  stato = { ...stato, ...nuovo };
  try {
    localStorage.setItem(CHIAVE_STORAGE, JSON.stringify(stato));
  } catch {
    // localStorage non disponibile: la scelta vale solo fino alla chiusura della pagina.
  }
  ascoltatori.forEach((cb) => cb());
}

export function impostaSetDati(set) {
  if (set in SET_DATI_DISPONIBILI) aggiorna({ set });
}

// Restituisce false (senza salvare nulla) se l'indirizzo non è una repo GitHub valida.
export function impostaRepoBsdata(testo) {
  const url = normalizzaUrlRepo(testo);
  if (!url) return false;
  aggiorna({ repoBsdata: url });
  return true;
}

export function ripristinaRepoBsdata() {
  aggiorna({ repoBsdata: URL_REPO_BSDATA_PREDEFINITO });
}

// Comando (da lanciare nella cartella del repo del calcolatore) che rigenera i file BSData dalla
// repo indicata. Include sempre --repo: lo script se la ricorda (tools/bsdata-sorgente.json), ma così
// il comando mostrato corrisponde sempre a ciò che c'è scritto in Impostazioni.
export const comandoAggiornamentoBsdata = (repoBsdata) =>
  `node tools/bsdata-to-csv.mjs --refresh --repo ${repoBsdata}`;

export function useImpostazioniDati() {
  return useSyncExternalStore(
    (cb) => {
      ascoltatori.add(cb);
      return () => ascoltatori.delete(cb);
    },
    () => stato,
  );
}

export const setDati = () => stato.set;
export const urlSitoDati = () => URL_SITO;
export const origineSito = () => new URL(URL_SITO).origin;
export const nomiFileDati = () => SET_DATI_DISPONIBILI[stato.set];
export const urlInfoCsv = () => `${URL_SITO}${nomiFileDati().info}`;
export const urlArmiCsv = () => `${URL_SITO}${nomiFileDati().armi}`;
