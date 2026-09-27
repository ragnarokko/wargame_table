import { useState } from 'react';
import Modale from '../Modale/Modale';
import styles from './Aiuto.module.css';

// Elenco di tutti i tasti/interazioni usati nell'app (verificato leggendo il codice dei
// componenti coinvolti: Basetta, SelezioneMultipla, AreaLavoro, StrumentoRighello,
// ElementoScenico). Da tenere aggiornato se cambia la logica di quei moduli.
const SCORCIATOIE = [
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
  { tasti: '1 / 2 / 3', descrizione: 'Dispone le basette selezionate su 1, 2 o 3 file, distanziate di almeno 1" (richiede almeno 2 basette selezionate).' },
  { tasti: 'Canc / Backspace', descrizione: 'Seleziona una o più unità e premi Canc/Delete per eliminarle.' },
  { tasti: 'Esc', descrizione: 'Annulla un trascinamento in corso: la basetta (e l\'eventuale gruppo) torna alla posizione di partenza.' },
  { tasti: 'Ctrl + passa il mouse su una basetta', descrizione: 'Mostra il popup con immagine e statistiche della basetta.' },
];

// Tasto "Aiuto": apre una finestra con l'elenco completo delle scorciatoie usate nell'app.
function Aiuto() {
  const [aperto, setAperto] = useState(false);

  return (
    <>
      <button type="button" className={styles.pulsante} onClick={() => setAperto(true)}>
        ❓ Aiuto
      </button>
      <Modale titolo="Tasti e comandi" aperto={aperto} onChiudi={() => setAperto(false)}>
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
