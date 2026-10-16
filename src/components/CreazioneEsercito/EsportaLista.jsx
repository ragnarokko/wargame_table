import { useState } from 'react';
import Modale from '../Modale/Modale';
import styles from './EsportaLista.module.css';

// Finestra con il testo delle unità di un esercito (righe tipo «3x Nome (80pts)», le stesse che "Importa"
// sa leggere): si può copiare negli appunti o salvare in un file .txt.
function EsportaLista({ aperto, nomeEsercito, testo, onChiudi }) {
  const [copiato, setCopiato] = useState(false);

  const copia = async () => {
    try {
      await navigator.clipboard.writeText(testo);
    } catch {
      // Appunti non disponibili (contesto non sicuro): ripiego sulla selezione del testo e copia del browser.
      const area = document.getElementById('esporta-lista-testo');
      area?.select();
      document.execCommand('copy');
    }
    setCopiato(true);
    setTimeout(() => setCopiato(false), 1500);
  };

  const salva = () => {
    const url = URL.createObjectURL(new Blob([testo], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `esercito-${nomeEsercito.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modale titolo={`Esporta lista — ${nomeEsercito}`} aperto={aperto} onChiudi={onChiudi}>
      <div className={styles.azioni}>
        <button type="button" onClick={copia}>
          {copiato ? 'Copiato ✓' : 'Copia testo'}
        </button>
        <button type="button" onClick={salva}>
          Salva in .txt
        </button>
      </div>
      <textarea id="esporta-lista-testo" className={styles.area} rows="14" value={testo} readOnly spellCheck={false} />
    </Modale>
  );
}

export default EsportaLista;
