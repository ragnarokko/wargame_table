import { useState } from 'react';
import Modale from '../Modale/Modale';
import {
  SORGENTE_WAHAPEDIA_PREDEFINITA,
  comandoAggiornamentoBsdata,
  comandoAggiornamentoWahapedia,
  useImpostazioniDati,
} from '../../config/datiCsv';
import styles from './Aiuto.module.css';

// Elenco di tutti i tasti/interazioni usati nell'app (verificato leggendo il codice dei
// componenti coinvolti: Basetta, SelezioneMultipla, AreaLavoro, StrumentoRighello,
// ElementoScenico, LancioDado). Da tenere aggiornato se cambia la logica di quei moduli.
const SCORCIATOIE = [
  { tasti: '← ↑ → ↓', descrizione: 'Sposta di 0,25" (piccolo e preciso) la basetta selezionata, o tutto il gruppo selezionato. La direzione è quella a schermo, anche con l\'area ruotata con A/S.' },
  { tasti: 'Q / W', descrizione: 'Ruota di 15° la basetta selezionata attorno al proprio centro (con una sola basetta selezionata).' },
  { tasti: 'Q / W', descrizione: "Ruota di 15° l'intero gruppo selezionato attorno al suo centro geometrico (con 2 o più basette selezionate)." },
  { tasti: '+ / -', descrizione: 'Aumenta/diminuisce di 1 le ferite della basetta selezionata (singola), tra 0 e il massimo W.' },
  { tasti: 'Z / X', descrizione: "Con una basetta selezionata (singola), Z attiva/ingrandisce di 1\" l'aura (linea rossa concentrica); X la riduce di 1\", spegnendola sotto 1\". Indipendente per ogni basetta." },
  { tasti: 'C', descrizione: "Aura rapida: sulla basetta selezionata (singola) senza aura attiva la imposta direttamente a 9\"; se ha già un'aura (con C o con Z/X, a qualsiasi offset) la spegne del tutto." },
  { tasti: 'A / S', descrizione: "Ruota di 90° l'intera area di lavoro (tavolo + staging)." },
  { tasti: 'G / H', descrizione: "Zoom avanti / indietro sull'area di lavoro (solo aspetto visivo)." },
  { tasti: 'Tasto destro (trascina)', descrizione: "Sposta la visuale (pan) di mappa e staging, seguendo il movimento del mouse." },
  { tasti: 'Tasto sinistro (trascina)', descrizione: 'Sposta una basetta o un elemento scenico; su un\'area vuota disegna un rettangolo di selezione multipla, oppure misura una distanza libera se lo strumento righello è attivo.' },
  { tasti: 'D', descrizione: 'Attiva/disattiva lo strumento righello (stesso effetto del pulsante "Strumento righello" nel menu laterale).' },
  { tasti: 'F (tieni premuto)', descrizione: 'Misura rapida senza click: mostra una linea e la distanza in pollici dal punto in cui hai premuto F alla posizione attuale del mouse; scompare al rilascio. Funziona anche a righello non attivo.' },
  { tasti: '1 / 2 / 3', descrizione: 'Dispone le basette selezionate su 1, 2 o 3 file, distanziate di almeno 1" (richiede almeno 2 basette selezionate).' },
  { tasti: 'Canc / Backspace', descrizione: 'Seleziona una o più unità e premi Canc/Delete per eliminarle.' },
  { tasti: 'Esc', descrizione: 'Annulla un trascinamento in corso: la basetta (e l\'eventuale gruppo) torna alla posizione di partenza.' },
  { tasti: 'Ctrl + passa il mouse su una basetta', descrizione: 'Mostra il popup con immagine, statistiche, note e armi della basetta.' },
  { tasti: 'I (sopra una basetta)', descrizione: 'Tiene aperto il popup dei dettagli anche togliendo il mouse e lo rende cliccabile: le abilità lunghe e di fazione compaiono per nome e si aprono a tendina. Si chiude premendo di nuovo I o Esc.' },
  { tasti: 'Doppio click su una basetta', descrizione: "Seleziona l'unità nell'elenco a sinistra: apre l'esercito e i dettagli e, se serve, scorre l'elenco fino a mostrarla." },
  { tasti: 'L', descrizione: 'Apre/chiude la finestrella dei dadi (D6): imposta il numero di dadi e clicca sul dado per lanciarli (compaiono tutti i risultati e la somma); con «Dettaglio» i risultati sono ordinati e c\'è la tabella valore / quanti uguali / quanti almeno / quanti sotto (passando il mouse sul valore la riga si evidenzia).' },
];

// Tasto "Aiuto": apre una finestra con l'elenco completo delle scorciatoie usate nell'app e con
// le informazioni sull'origine dei dati delle unità (info.csv) e delle armi (Datasheets_wargear.csv).
function Aiuto() {
  const [aperto, setAperto] = useState(false);
  const { repoBsdata } = useImpostazioniDati();

  return (
    <>
      <button type="button" className={styles.pulsante} onClick={() => setAperto(true)}>
        ❓ Aiuto
      </button>
      <Modale titolo="Aiuto" aperto={aperto} onChiudi={() => setAperto(false)}>
        <div className={styles.sezione}>
          <h4 className={styles.sezioneTitolo}>Dati unità (CSV)</h4>
          <p className={styles.paragrafo}>
            Le unità disponibili in "Creazione Esercito" vengono lette da un file CSV che vive nel repo
            del calcolatore "Botte!" (GitHub: ragnarokko/calcolatore_wh40, accanto a{' '}
            <code className={styles.codice}>index.html</code>) ed è pubblicato con lui: l'app lo
            scarica a runtime, senza ricompilare nulla, e serve una connessione internet. Quale
            coppia di file usare si sceglie con la rotella <strong>⚙ Impostazioni</strong> (in alto a
            sinistra): <strong>dati tradizionali</strong> (
            <code className={styles.codice}>info.csv</code> +{' '}
            <code className={styles.codice}>Datasheets_wargear.csv</code>, aggiornabili da Wahapedia) oppure{' '}
            <strong>dati BSData 11ª edizione</strong> (
            <code className={styles.codice}>info_11e.csv</code> +{' '}
            <code className={styles.codice}>Datasheets_wargear_11e.csv</code>, generati dalla repo{' '}
            <code className={styles.codice}>BSData/wh40k-11e</code>). Sempre lì si può cambiare
            l'indirizzo GitHub di BSData, nel caso venga spostato. La scelta tra i due set si applica con "⟳ Aggiorna dati" in fondo al menù, che
            avvisa anche le finestre "Botte!" già aperte.
          </p>
          <p className={styles.paragrafo}>
            Per ogni riga vengono importati: fazione, nome dell'unità, statistiche MOV / RES /
            TS / TS+ / W / OC, note e <code className={styles.codice}>base_size</code> (dimensione
            basetta: un numero = tonda, due numeri = ovale, "r_LUNGxLARGHmm" = rettangolare,
            vuoto = rettangolo 100×50mm di riserva).
          </p>
          <p className={styles.paragrafo}>
            Scegliendo un'unità nel form si vedono anche i <strong>punti</strong> (con le taglie, es. 10
            modelli = 90 pt) e un <strong>numero di modelli predefinito</strong> ricavato dalla composizione
            ufficiale: entrambi si possono cambiare a mano. Il totale dei punti compare accanto al nome di
            ogni esercito. Questi dati stanno nella cartella{' '}
            <code className={styles.codice}>army_builder/</code> del repo del calcolatore (punti,
            composizione, opzioni di equipaggiamento, leader, keyword, abilità, distaccamenti,
            potenziamenti) e si aggiornano con lo script Wahapedia descritto sotto.
          </p>
        </div>
        <div className={styles.sezione}>
          <h4 className={styles.sezioneTitolo}>Dati armi (CSV)</h4>
          <p className={styles.paragrafo}>
            Le armi mostrate nel popup Ctrl+hover e nella finestra "Botte!" (Attaccante) vengono
            lette dal file delle armi del set scelto in Impostazioni (stesso meccanismo e stessa
            cartella del file unità, ricaricabile con "⟳ Aggiorna dati"). Le armi
            di un'unità vengono trovate tramite <code className={styles.codice}>datasheet_id</code>{' '}
            (o, per le unità create prima di questa funzione, per nome).
          </p>
          <p className={styles.paragrafo}>
            Per ogni arma vengono importati: nome, tipo (Melee/Ranged), gittata, attacchi (A),
            soglia per colpire (BS_WS), forza (S), penetrazione armatura (AP), danni (D) e
            descrizione. Nel calcolatore "Botte!" i valori a dadi (es. "2D6+3") vengono convertiti
            nella loro media arrotondata e l'AP (negativo nel CSV) viene invertito di segno,
            perché quei campi accettano solo numeri fissi; le armi senza una soglia per colpire
            valida (es. "-" o "N/A") lasciano XCOL invariato.
          </p>
        </div>
        <ul className={styles.lista}>
          {SCORCIATOIE.map((s, i) => (
            <li key={i} className={styles.voce}>
              <span className={styles.tasti}>{s.tasti}</span>
              <span className={styles.descrizione}>{s.descrizione}</span>
            </li>
          ))}
        </ul>
        <div className={styles.sezioneFinale}>
          <h4 className={styles.sezioneTitolo}>Come aggiornare i CSV</h4>
          <p className={styles.paragrafo}>
            I file dati non stanno in questa app ma nel repo del calcolatore "Botte!" (su questo PC:{' '}
            <code className={styles.codice}>D:\Claude\sito_dadi</code>). Sono testo con colonne
            separate da <code className={styles.codice}>|</code>.
          </p>
          <h4 className={styles.sezioneTitolo}>Dati BSData: aggiornare da GitHub</h4>
          <p className={styles.paragrafo}>
            I file <code className={styles.codice}>_11e</code> si rigenerano con uno script del repo del
            calcolatore, che scarica i dati aggiornati da{' '}
            <code className={styles.codice}>{repoBsdata}</code> (l'indirizzo si modifica in ⚙
            Impostazioni; se BSData sposta la repo basta cambiarlo lì e il comando qui sotto si aggiorna).
            Dal terminale:
          </p>
          <ol className={styles.elenco}>
            <li>
              <code className={styles.codice}>cd D:\Claude\sito_dadi</code>
            </li>
            <li>
              <code className={styles.codice}>{comandoAggiornamentoBsdata(repoBsdata)}</code>
              <br />
              (rigenera <code className={styles.codice}>info_11e.csv</code> e{' '}
              <code className={styles.codice}>Datasheets_wargear_11e.csv</code>; l'indirizzo dopo{' '}
              <code className={styles.codice}>--repo</code> viene ricordato in{' '}
              <code className={styles.codice}>tools/bsdata-sorgente.json</code>; le dimensioni basetta già
              inserite restano.)
            </li>
            <li>
              <code className={styles.codice}>node tools/confronta-csv.mjs</code> (facoltativo: scrive in{' '}
              <code className={styles.codice}>bsdata/confronto.md</code> le differenze rispetto ai dati
              tradizionali)
            </li>
            <li>
              <code className={styles.codice}>
                git add info_11e.csv Datasheets_wargear_11e.csv tools/bsdata-ids.json tools/bsdata-sorgente.json
              </code>
              <br />
              <code className={styles.codice}>git commit -m "Aggiorna dati BSData"</code>
              <br />
              <code className={styles.codice}>git push</code>
            </li>
            <li>
              Attendi che GitHub Pages pubblichi il sito (di solito uno o due minuti), poi in questa app
              premi <strong>⟳ Aggiorna dati</strong> (con ⚙ Impostazioni su "Dati BSData").
            </li>
          </ol>
          <h4 className={styles.sezioneTitolo}>Dati tradizionali: aggiornare da Wahapedia</h4>
          <p className={styles.paragrafo}>
            <code className={styles.codice}>info.csv</code> e{' '}
            <code className={styles.codice}>Datasheets_wargear.csv</code> vengono dall'export dati di
            Wahapedia ({SORGENTE_WAHAPEDIA_PREDEFINITA}). Uno script li riscrive (applicando le stesse
            pulizie di sempre) e rigenera anche i file in{' '}
            <code className={styles.codice}>army_builder/</code> con i punti. Dal terminale:
          </p>
          <ol className={styles.elenco}>
            <li>
              <code className={styles.codice}>cd D:\Claude\sito_dadi</code>
            </li>
            <li>
              <code className={styles.codice}>{comandoAggiornamentoWahapedia}</code>
              <br />
              (scarica i file, mostra le differenze rispetto a quelli attuali e poi li sovrascrive. Per
              un'altra edizione: <code className={styles.codice}>--sorgente https://wahapedia.ru/wh40k12ed</code>.
              Le dimensioni basette corrette a mano stanno in{' '}
              <code className={styles.codice}>tools/wahapedia-basette.json</code> e hanno la precedenza;
              lo script avvisa se una correzione non coincide più con Wahapedia.)
            </li>
            <li>
              Guarda le differenze stampate: se qualcosa non torna, ripristina con{' '}
              <code className={styles.codice}>git checkout -- info.csv Datasheets_wargear.csv army_builder</code>.
            </li>
            <li>
              <code className={styles.codice}>
                git add info.csv Datasheets_wargear.csv army_builder tools/wahapedia-sorgente.json
              </code>
              <br />
              <code className={styles.codice}>git commit -m "Aggiorna dati da Wahapedia"</code>
              <br />
              <code className={styles.codice}>git push</code>
            </li>
            <li>
              Attendi la pubblicazione di GitHub Pages (uno o due minuti), poi premi{' '}
              <strong>⟳ Aggiorna dati</strong> (con ⚙ Impostazioni su "Dati tradizionali"); oppure "Ricarica
              dati" nel tab VSunità del calcolatore.
            </li>
          </ol>
          <p className={styles.paragrafo}>
            In alternativa si possono sempre modificare a mano <code className={styles.codice}>info.csv</code>{' '}
            e <code className={styles.codice}>Datasheets_wargear.csv</code> (mantieni la riga di
            intestazione), ma al prossimo lancio dello script le modifiche vengono sovrascritte: per le
            basette usa <code className={styles.codice}>tools/wahapedia-basette.json</code>.
          </p>
          <p className={styles.paragrafo}>
            Nota: le unità già create in "Creazione Esercito" mantengono le statistiche e la
            dimensione della basetta che avevano alla creazione; i dati nuovi valgono per le unità
            create dopo l'aggiornamento e per le armi (popup Ctrl+hover e "Botte!"). Lo stesso vale per le abilità (campo NOTE e tendine), che arrivano da army_builder/abilita.csv: per aggiornarle su un'unità già creata va ricreata.
          </p>
        </div>
      </Modale>
    </>
  );
}

export default Aiuto;
