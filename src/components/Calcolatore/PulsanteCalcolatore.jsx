import { useCallback } from 'react';
import { useLibreria } from '../../contexts/LibreriaContext';
import {
  armiPerTemplate,
  apDaTesto,
  caricaDatiArmiSeNecessario,
  sogliaDaTesto,
  valoreMedioDado,
} from '../CreazioneEsercito/csvArmiImport';
import { origineSito, setDati, urlSitoDati } from '../../config/datiCsv';
import { registraFinestraCalcolatore } from '../../utils/finestreCalcolatore';
import styles from './PulsanteCalcolatore.module.css';

// #combat fa aprire direttamente la scheda "Combattimento" del calcolatore (vedi lo script
// di index.html in quel repo, che legge location.hash all'avvio).

// GitHub Pages serve index.html con Cache-Control: max-age=600 (visto in pratica, con tanto di
// hit sulla CDN davanti): senza una query string sempre diversa, aprendo il calcolatore entro
// 10 minuti da un aggiornamento del sito si rischia di ricevere dalla cache una versione vecchia
// della pagina (es. senza gli ultimi campi aggiunti all'Attaccante).
function urlCalcolatoreSenzaCache() {
  // Sito e set di dati sono quelli scelti in Impostazioni (letti ad ogni apertura).
  return `${urlSitoDati()}?t=${Date.now()}&dati=${setDati()}#combat`;
}

// Un'arma pronta per il calcolatore: valori già normalizzati (media dei dadi arrotondata, AP
// invertito di segno) perché i campi ATT/XCOL/AP/DANNI del calcolatore accettano solo numeri
// fissi (vedi csvArmiImport.js per il dettaglio delle conversioni).
function estraiArmi(template) {
  return armiPerTemplate(template).map((a) => ({
    nome: a.arma,
    descrizione: a.descrizione,
    att: valoreMedioDado(a.attGrezzo, 1),
    xcol: sogliaDaTesto(a.bsWsGrezzo),
    forza: Number(a.forzaGrezzo) || 1,
    ap: apDaTesto(a.apGrezzo),
    danni: valoreMedioDado(a.danniGrezzo, 1),
  }));
}

// Solo i campi che servono al calcolatore per precompilare Difensore (res/ts/tsPiu/w/fnp) e
// Attaccante (armi, via estraiArmi), più il datasheetId con cui il tab VSunità filtra le unità
// in gioco: le "unità" sono le basette con campo `esercito` create in
// Creazione Esercito (vedi CreazioneEsercito.jsx), non le basette generiche di libreria.
function estraiUnita(basette, esercito) {
  return basette
    .filter((b) => b.esercito === esercito)
    .map((b) => ({ nome: b.nome, datasheetId: b.datasheetId, res: b.res, ts: b.ts, tsPiu: b.tsPiu, w: b.w, fnp: b.fnp, armi: estraiArmi(b) }));
}

// Tasto "Botte!": apre il calcolatore di combattimento in una finestra separata (stessa
// logica di apertura di GameTracker.jsx: una nuova finestra ad ogni click, dimensionata
// sullo schermo disponibile) e gli invia le unità delle due armate via postMessage, così
// nel Difensore si può scegliere un'unità invece di ricopiarne a mano le statistiche.
function PulsanteCalcolatore() {
  const { basette } = useLibreria();

  const apri = useCallback(async () => {
    const larghezza = Math.min(1000, Math.round(window.screen.availWidth * 0.9));
    const altezza = window.screen.availHeight;
    const sinistra = Math.round((window.screen.availWidth - larghezza) / 2);
    const features = `width=${larghezza},height=${altezza},left=${sinistra},top=0`;
    const finestra = window.open(urlCalcolatoreSenzaCache(), '_blank', features);
    if (!finestra) return; // popup bloccato dal browser
    registraFinestraCalcolatore(finestra);

    // Normalmente già pronti (precaricati da CreazioneEsercito al mount): questo await è solo
    // una rete di sicurezza per un click prestissimo dopo l'avvio dell'app.
    await caricaDatiArmiSeNecessario().catch(() => {});

    const datiEserciti = {
      type: 'wh40-eserciti',
      blu: estraiUnita(basette, 'blu'),
      rosso: estraiUnita(basette, 'rosso'),
    };
    // Il calcolatore segnala di essere pronto ("wh40-ready") al primo caricamento: solo
    // allora ha senso inviargli i dati, altrimenti la pagina potrebbe non aver ancora
    // registrato il proprio listener e il messaggio andrebbe perso.
    const onMessage = (e) => {
      if (e.source !== finestra || e.data?.type !== 'wh40-ready') return;
      finestra.postMessage(datiEserciti, origineSito());
      window.removeEventListener('message', onMessage);
    };
    window.addEventListener('message', onMessage);
  }, [basette]);

  return (
    <div className={styles.pannello}>
      <button
        type="button"
        className={styles.pulsante}
        onClick={apri}
        title="Apre il calcolatore di combattimento in una finestra separata, con le unità delle due armate pronte da selezionare come Difensore"
      >
        🥊 Botte!
      </button>
    </div>
  );
}

export default PulsanteCalcolatore;
