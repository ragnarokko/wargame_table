// I due CSV (unità e armi) vivono nel repo del calcolatore "Botte!" e sono pubblicati con lui su
// GitHub Pages: è l'unica copia dei dati, usata sia dal calcolatore sia da questa app (che li
// scarica a runtime, vedi csvUnitaImport.js/csvArmiImport.js). GitHub Pages risponde con
// Access-Control-Allow-Origin: *, quindi il fetch cross-origin funziona anche da localhost.
// Per aggiornare i dati: rigenerarli (o modificarli) in quel repo, fare push, poi "Aggiorna dati" qui.
//
// Per provare una versione locale del calcolatore (e dei suoi CSV) senza pubblicare nulla: creare
// `.env.local` con `VITE_URL_CALCOLATORE=http://localhost:5180/` (server statico con CORS aperto).
// Vale anche per il tasto "Botte!" e per "Aggiorna dati". `.env.local` non va committato.
export const URL_BASE_DATI_CSV =
  import.meta.env.VITE_URL_CALCOLATORE || 'https://ragnarokko.github.io/calcolatore_wh40/';
export const ORIGINE_CALCOLATORE = new URL(URL_BASE_DATI_CSV).origin;

// Quale coppia di file usare. "bsdata" = info_11e.csv / Datasheets_wargear_11e.csv, generati da
// BSData/wh40k-11e con tools/bsdata-to-csv.mjs nel repo del calcolatore; "originale" = i file di
// prima (info.csv / Datasheets_wargear.csv, mai modificati). Per tornare agli originali basta
// cambiare SET_PREDEFINITO (o impostare VITE_SET_DATI=originale in `.env.local` per una prova).
// Lo stesso set viene passato al calcolatore (?dati=) quando si apre "Botte!".
const SET_PREDEFINITO = 'bsdata';
const SET_DATI_DISPONIBILI = {
  bsdata: { info: 'info_11e.csv', armi: 'Datasheets_wargear_11e.csv' },
  originale: { info: 'info.csv', armi: 'Datasheets_wargear.csv' },
};
const setRichiesto = import.meta.env.VITE_SET_DATI;
export const SET_DATI = setRichiesto in SET_DATI_DISPONIBILI ? setRichiesto : SET_PREDEFINITO;
export const URL_INFO_CSV = `${URL_BASE_DATI_CSV}${SET_DATI_DISPONIBILI[SET_DATI].info}`;
export const URL_ARMI_CSV = `${URL_BASE_DATI_CSV}${SET_DATI_DISPONIBILI[SET_DATI].armi}`;
