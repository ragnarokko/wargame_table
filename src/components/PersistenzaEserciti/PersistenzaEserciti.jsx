import { useEffect, useRef } from 'react';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import styles from './PersistenzaEserciti.module.css';

export const CHIAVE_LOCALSTORAGE = 'tavolo-eserciti-json';

function applicaDati(dati, sostituisciUnitaEserciti, impostaIstanzePerTemplates) {
  if (!dati || !Array.isArray(dati.unita) || !Array.isArray(dati.istanze)) {
    throw new Error('formato JSON non valido');
  }
  sostituisciUnitaEserciti(dati.unita);
  impostaIstanzePerTemplates(
    dati.unita.map((u) => u.id),
    dati.istanze,
  );
}

// Export/import dello stato completo dei due eserciti (unità + posizioni delle basette),
// con salvataggio automatico in localStorage e ripristino al primo caricamento del sito.
function PersistenzaEserciti() {
  const { basette, sostituisciUnitaEserciti } = useLibreria();
  const { istanze, impostaIstanzePerTemplates } = useTavoloState();
  const caricatoIniziale = useRef(false);

  useEffect(() => {
    if (caricatoIniziale.current) return;
    caricatoIniziale.current = true;
    const salvato = localStorage.getItem(CHIAVE_LOCALSTORAGE);
    if (!salvato) return;
    try {
      applicaDati(JSON.parse(salvato), sostituisciUnitaEserciti, impostaIstanzePerTemplates);
    } catch {
      // JSON salvato non valido o corrotto: ignora e lascia lo stato iniziale.
    }
    // Va eseguito una sola volta all'avvio, indipendentemente dai riferimenti delle funzioni di contesto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEsporta = () => {
    const unitaEserciti = basette.filter((b) => b.esercito);
    const idUnita = new Set(unitaEserciti.map((u) => u.id));
    const istanzeEserciti = istanze.filter((i) => idUnita.has(i.templateId));
    const json = JSON.stringify({ unita: unitaEserciti, istanze: istanzeEserciti }, null, 2);

    localStorage.setItem(CHIAVE_LOCALSTORAGE, json);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eserciti.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImporta = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        applicaDati(JSON.parse(reader.result), sostituisciUnitaEserciti, impostaIstanzePerTemplates);
        localStorage.setItem(CHIAVE_LOCALSTORAGE, reader.result);
      } catch (err) {
        alert('Import fallito: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className={styles.azioni}>
      <button onClick={handleEsporta} title="Esporta entrambi gli eserciti in un file JSON">
        ⬇ Esporta eserciti
      </button>
      <label className={styles.importaLabel} title="Importa eserciti da un file JSON">
        ⬆ Importa eserciti
        <input type="file" accept="application/json" onChange={handleImporta} hidden />
      </label>
    </div>
  );
}

export default PersistenzaEserciti;
