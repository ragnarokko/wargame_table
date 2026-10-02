import { useState } from 'react';
import Modale from '../Modale/Modale';
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
  { tasti: 'Ctrl + passa il mouse su una basetta', descrizione: 'Mostra il popup con immagine, statistiche e armi della basetta.' },
  { tasti: 'L', descrizione: 'Apre/chiude la finestrella del dado (D6): clicca sul dado per ottenere un valore casuale da 1 a 6.' },
];

// Tasto "Aiuto": apre una finestra con l'elenco completo delle scorciatoie usate nell'app e con
// le informazioni sull'origine dei dati delle unità (info.csv) e delle armi (Datasheets_wargear.csv).
function Aiuto() {
  const [aperto, setAperto] = useState(false);

  return (
    <>
      <button type="button" className={styles.pulsante} onClick={() => setAperto(true)}>
        ❓ Aiuto
      </button>
      <Modale titolo="Aiuto" aperto={aperto} onChiudi={() => setAperto(false)}>
        <div className={styles.sezione}>
          <h4 className={styles.sezioneTitolo}>Dati unità (CSV)</h4>
          <p className={styles.paragrafo}>
            Le unità disponibili in "Creazione Esercito" vengono lette da{' '}
            <code className={styles.codice}>info.csv</code>, che vive nel repo del calcolatore
            "Botte!" (GitHub: ragnarokko/calcolatore_wh40, cartella principale, accanto a{' '}
            <code className={styles.codice}>index.html</code>) ed è pubblicato con lui su{' '}
            <code className={styles.codice}>ragnarokko.github.io/calcolatore_wh40/info.csv</code>:
            l'app lo scarica a runtime, quindi per aggiornare i dati basta modificare il file in
            quel repo, fare commit e push, attendere la pubblicazione di GitHub Pages (di solito
            uno o due minuti) e premere "⟳ Aggiorna dati" in fondo al menù, senza ricompilare
            nulla: la richiesta arriva anche alle finestre "Botte!" già aperte. Serve una
            connessione internet.
          </p>
          <p className={styles.paragrafo}>
            Per ogni riga vengono importati: fazione, nome dell'unità, statistiche MOV / RES /
            TS / TS+ / W / OC, note e <code className={styles.codice}>base_size</code> (dimensione
            basetta: un numero = tonda, due numeri = ovale, "r_LUNGxLARGHmm" = rettangolare,
            vuoto = rettangolo 100×50mm di riserva).
          </p>
        </div>
        <div className={styles.sezione}>
          <h4 className={styles.sezioneTitolo}>Dati armi (CSV)</h4>
          <p className={styles.paragrafo}>
            Le armi mostrate nel popup Ctrl+hover e nella finestra "Botte!" (Attaccante) vengono
            lette da <code className={styles.codice}>Datasheets_wargear.csv</code>: stesso
            meccanismo e stessa cartella di <code className={styles.codice}>info.csv</code> nel repo del
            calcolatore (ricaricabile con "⟳ Aggiorna dati" senza ricompilare). Le armi
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
      </Modale>
    </>
  );
}

export default Aiuto;
