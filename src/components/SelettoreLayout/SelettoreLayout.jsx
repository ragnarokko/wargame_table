import { useEffect, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import styles from './SelettoreLayout.module.css';

const FORCE_DISPOSITIONS = [
  { codice: 'th', nome: 'Take and Hold' },
  { codice: 'di', nome: 'Disruption' },
  { codice: 'pf', nome: 'Purge the Foe' },
  { codice: 'pa', nome: 'Priority Assets' },
  { codice: 're', nome: 'Reconnaissance' },
];

const SUFFISSI_LAYOUT = { 1: 'a', 2: 'b', 3: 'c' };

// { 'RapidIngress-thdia.png': url, ... }
const moduliImmagini = import.meta.glob('../../assets/layouts/*.png', { eager: true, import: 'default' });
const immaginiPerNomeFile = new Map(
  Object.entries(moduliImmagini).map(([percorso, url]) => [percorso.split('/').pop(), url]),
);

function trovaImmagineLayout(codice1, codice2, numeroLayout) {
  const suffisso = SUFFISSI_LAYOUT[numeroLayout];
  const combinazioni = [`${codice1}${codice2}`, `${codice2}${codice1}`];
  for (const combinazione of combinazioni) {
    const nomeFile = `RapidIngress-${combinazione}${suffisso}.png`;
    if (immaginiPerNomeFile.has(nomeFile)) {
      return immaginiPerNomeFile.get(nomeFile);
    }
  }
  return null;
}

function SelettoreLayout() {
  const { setSfondo } = useTavolo();
  const [giocatore1, setGiocatore1] = useState('');
  const [giocatore2, setGiocatore2] = useState('');
  const [numeroLayout, setNumeroLayout] = useState('');
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    if (!giocatore1 || !giocatore2 || !numeroLayout) {
      setErrore(null);
      return;
    }

    const immagine = trovaImmagineLayout(giocatore1, giocatore2, numeroLayout);
    if (immagine) {
      setSfondo(immagine);
      setErrore(null);
    } else {
      setErrore('Layout non disponibile per questa combinazione');
    }
  }, [giocatore1, giocatore2, numeroLayout, setSfondo]);

  return (
    <div className={styles.pannello}>
      <h3>Force disposition</h3>

      <label>
        Giocatore 1
        <select value={giocatore1} onChange={(e) => setGiocatore1(e.target.value)}>
          <option value="">Seleziona...</option>
          {FORCE_DISPOSITIONS.map((fd) => (
            <option key={fd.codice} value={fd.codice}>
              {fd.nome}
            </option>
          ))}
        </select>
      </label>

      <label>
        Giocatore 2
        <select value={giocatore2} onChange={(e) => setGiocatore2(e.target.value)}>
          <option value="">Seleziona...</option>
          {FORCE_DISPOSITIONS.map((fd) => (
            <option key={fd.codice} value={fd.codice}>
              {fd.nome}
            </option>
          ))}
        </select>
      </label>

      <label>
        Layout
        <select value={numeroLayout} onChange={(e) => setNumeroLayout(e.target.value)}>
          <option value="">Seleziona...</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </label>

      {errore && <div className={styles.errore}>{errore}</div>}
    </div>
  );
}

export default SelettoreLayout;
