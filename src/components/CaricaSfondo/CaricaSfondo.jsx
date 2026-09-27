import { useEffect, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import PannelloEspandibile from '../PannelloEspandibile/PannelloEspandibile';
import styles from './CaricaSfondo.module.css';

function CaricaSfondo() {
  const { dimensioni, setDimensioni, sfondo, setSfondo } = useTavolo();
  const [aperto, setAperto] = useState(false);
  const [larghezza, setLarghezza] = useState(dimensioni.larghezza);
  const [altezza, setAltezza] = useState(dimensioni.altezza);

  useEffect(() => {
    setLarghezza(dimensioni.larghezza);
    setAltezza(dimensioni.altezza);
  }, [dimensioni]);

  const applicaDimensioni = (e) => {
    e.preventDefault();
    setDimensioni(larghezza, altezza);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSfondo(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className={styles.pannello}>
      <PannelloEspandibile titolo="Tavolo di gioco" aperto={aperto} onToggle={() => setAperto((v) => !v)}>
        <form className={styles.formDimensioni} onSubmit={applicaDimensioni}>
          <label>
            Larghezza (in)
            <input
              type="number"
              min="1"
              step="0.5"
              value={larghezza}
              onChange={(e) => setLarghezza(e.target.value)}
            />
          </label>
          <label>
            Profondità (in)
            <input type="number" min="1" step="0.5" value={altezza} onChange={(e) => setAltezza(e.target.value)} />
          </label>
          <button type="submit">Applica</button>
        </form>

        <label className={styles.caricaFile}>
          Sfondo tavolo (immagine)
          <input type="file" accept="image/*" onChange={handleFile} />
        </label>

        {sfondo && (
          <button className={styles.rimuoviBtn} onClick={() => setSfondo(null)}>
            Rimuovi sfondo
          </button>
        )}
      </PannelloEspandibile>
    </div>
  );
}

export default CaricaSfondo;
