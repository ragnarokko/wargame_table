// I due CSV (unità e armi) vivono nel repo del calcolatore "Botte!" e sono pubblicati con lui su
// GitHub Pages: è l'unica copia dei dati, usata sia dal calcolatore sia da questa app (che li
// scarica a runtime, vedi csvUnitaImport.js/csvArmiImport.js). GitHub Pages risponde con
// Access-Control-Allow-Origin: *, quindi il fetch cross-origin funziona anche da localhost.
// Per aggiornare i dati: modificare i file in quel repo, fare push, poi "Aggiorna dati" qui.
export const URL_BASE_DATI_CSV = 'https://ragnarokko.github.io/calcolatore_wh40/';
export const URL_INFO_CSV = `${URL_BASE_DATI_CSV}info.csv`;
export const URL_ARMI_CSV = `${URL_BASE_DATI_CSV}Datasheets_wargear.csv`;
