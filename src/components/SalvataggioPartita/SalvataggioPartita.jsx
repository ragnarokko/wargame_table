import { useTavolo } from '../../contexts/TavoloContext';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { useIndicatori } from '../../contexts/IndicatoriContext';
import { useTracker } from '../../contexts/TrackerContext';
import { useRegoleEsercito } from '../../contexts/RegoleEsercitoContext';
import { useFazioneEsercito } from '../RegoleEsercito/useRegoleGiocatore';
import { elencoFazioniRegole } from '../RegoleEsercito/csvRegoleEsercito';
import SalvataggioGithub from './SalvataggioGithub';
import styles from './SalvataggioPartita.module.css';

const VERSIONE_SALVATAGGIO = 1;
// Nomi dei file già scaricati da questo browser: serve a distinguere i salvataggi omonimi con un progressivo
// (il browser non può leggere la cartella Download).
const CHIAVE_NOMI_SALVATAGGIO = 'tavolo-nomi-salvataggio';

const nomeFileSicuro = (testo) => testo.replace(/[\\/:*?"<>|]+/g, '').trim();

function leggiNomiUsati() {
  try {
    const nomi = JSON.parse(localStorage.getItem(CHIAVE_NOMI_SALVATAGGIO));
    return Array.isArray(nomi) ? nomi : [];
  } catch {
    return [];
  }
}

// Nome del file nella forma «Fazione blu_Fazione rossa_roundN»; se già usato diventa «…_2», «…_3», ecc.
// Registra il nome scelto.
function nomeSalvataggioUnivoco(base) {
  const usati = leggiNomiUsati();
  let nome = base;
  for (let n = 2; usati.includes(nome); n++) nome = `${base}_${n}`;
  try {
    localStorage.setItem(CHIAVE_NOMI_SALVATAGGIO, JSON.stringify([...usati, nome]));
  } catch {
    // senza localStorage il nome resta quello base
  }
  return nome;
}

// Salvataggio/caricamento completo della partita: eserciti (stessa struttura dati di
// PersistenzaEserciti, di cui però NON riusa il file/la chiave localStorage — sono due
// funzionalità separate e coesistenti), intera libreria basette, posizione/rotazione/ferite di
// ogni istanza su tavolo/staging, elementi scenici, dimensioni e sfondo del tavolo, indicatori
// (CP/Turno/extra, vedi IndicatoriContext) mostrati in alto nell'area di staging.
function SalvataggioPartita() {
  const { dimensioni, setDimensioni, sfondo, setSfondo } = useTavolo();
  const { basette, impostaBasette } = useLibreria();
  const { istanze, elementiScenici, ripristinaTavolo } = useTavoloState();
  const { indicatori, ripristinaIndicatori } = useIndicatori();
  const { stato: tracker, ripristinaTracker } = useTracker();
  const { stato: regoleEsercito, ripristinaRegoleEsercito } = useRegoleEsercito();
  const fazioneBlu = useFazioneEsercito('blu').codice;
  const fazioneRossa = useFazioneEsercito('rosso').codice;

  const nomeFazione = (codice, predefinito) =>
    nomeFileSicuro(elencoFazioniRegole().find((f) => f.codice === codice)?.nome ?? '') || predefinito;

  // Contenuto del salvataggio e nome di base del file («Fazione blu_Fazione rossa_roundN»).
  const preparaSalvataggio = () => {
    const dati = {
      versione: VERSIONE_SALVATAGGIO,
      basette,
      istanze,
      elementiScenici,
      tavolo: { dimensioni, sfondo },
      indicatori,
      tracker,
      regoleEsercito,
    };
    const base = `${nomeFazione(fazioneBlu, 'Blu')}_${nomeFazione(fazioneRossa, 'Rosso')}_round${indicatori.turno.valore}`;
    return { json: JSON.stringify(dati, null, 2), base };
  };

  const handleSave = () => {
    const { json, base } = preparaSalvataggio();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nomeSalvataggioUnivoco(base)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Ripristina la partita dal testo JSON di un salvataggio; lancia se il formato non è valido.
  const applicaSalvataggio = (testo) => {
    const dati = JSON.parse(testo);
    if (
      !Array.isArray(dati.basette) ||
      !Array.isArray(dati.istanze) ||
      !Array.isArray(dati.elementiScenici) ||
      !dati.tavolo ||
      !dati.tavolo.dimensioni
    ) {
      throw new Error('formato salvataggio non valido');
    }
    impostaBasette(dati.basette);
    ripristinaTavolo(dati.istanze, dati.elementiScenici);
    setDimensioni(dati.tavolo.dimensioni.larghezza, dati.tavolo.dimensioni.altezza);
    setSfondo(dati.tavolo.sfondo ?? null);
    // `indicatori` non esisteva nei salvataggi precedenti a questa funzionalità:
    // ripristinaIndicatori gestisce da sé l'assenza/parzialità del campo (vedi IndicatoriContext).
    ripristinaIndicatori(dati.indicatori);
    // Anche `tracker` manca nei salvataggi più vecchi: in tal caso il tracker riparte dal setup.
    ripristinaTracker(dati.tracker);
    // Idem per `regoleEsercito` (fazione e distaccamenti scelti nel pannello Eserciti).
    ripristinaRegoleEsercito(dati.regoleEsercito);
  };

  const handleLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        applicaSalvataggio(reader.result);
      } catch (err) {
        alert('Caricamento fallito: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className={styles.gruppo}>
      <div className={styles.azioni}>
        <button onClick={handleSave} title="Salva su file l'intera partita: eserciti, posizioni, mappa">
          💾 Save
        </button>
        <label className={styles.importaLabel} title="Carica una partita salvata in precedenza">
          📂 Load
          <input type="file" accept="application/json" onChange={handleLoad} hidden />
        </label>
      </div>
      <SalvataggioGithub preparaSalvataggio={preparaSalvataggio} applicaSalvataggio={applicaSalvataggio} />
    </div>
  );
}

export default SalvataggioPartita;
