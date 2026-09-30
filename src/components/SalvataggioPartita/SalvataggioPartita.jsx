import { useTavolo } from '../../contexts/TavoloContext';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { useIndicatori } from '../../contexts/IndicatoriContext';
import styles from './SalvataggioPartita.module.css';

const VERSIONE_SALVATAGGIO = 1;

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

  const handleSave = () => {
    const dati = {
      versione: VERSIONE_SALVATAGGIO,
      basette,
      istanze,
      elementiScenici,
      tavolo: { dimensioni, sfondo },
      indicatori,
    };
    const json = JSON.stringify(dati, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'partita.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dati = JSON.parse(reader.result);
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
      } catch (err) {
        alert('Caricamento fallito: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className={styles.azioni}>
      <button onClick={handleSave} title="Salva su file l'intera partita: eserciti, posizioni, mappa">
        💾 Save
      </button>
      <label className={styles.importaLabel} title="Carica una partita salvata in precedenza">
        📂 Load
        <input type="file" accept="application/json" onChange={handleLoad} hidden />
      </label>
    </div>
  );
}

export default SalvataggioPartita;
