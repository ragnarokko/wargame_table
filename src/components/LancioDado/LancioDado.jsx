import { useEffect, useState } from 'react';
import styles from './LancioDado.module.css';

// Glifi Unicode delle sei facce di un D6 (U+2680-U+2685): mostrano il dado come su un dado
// vero (pallini), non solo la cifra. '🎲' è la faccia di riposo prima del primo lancio.
const FACCE_D6 = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const MAX_DADI = 100;

// Finestrella dei dadi (uno o più D6): nascosta di default (non più un elemento fisso sul tavolo), si
// apre/chiude con il tasto L — ignorato se il focus è su un campo di input/textarea/select/
// contentEditable, come le altre scorciatoie globali dell'app — o con Esc quando è aperta.
// Stato solo locale: il tiro non viene salvato nella partita (a differenza degli indicatori
// CP/Turno).
function LancioDado() {
  const [aperto, setAperto] = useState(false);
  const [numeroDadi, setNumeroDadi] = useState('1');
  const [risultati, setRisultati] = useState([]);
  const [dettaglio, setDettaglio] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setAperto((a) => !a);
      } else if (e.key === 'Escape') {
        setAperto(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!aperto) return null;

  const quantita = Math.min(MAX_DADI, Math.max(1, Math.round(Number(numeroDadi) || 1)));

  const lancia = () => {
    setNumeroDadi(String(quantita));
    setRisultati(Array.from({ length: quantita }, () => Math.floor(Math.random() * 6) + 1));
  };

  const somma = risultati.reduce((tot, v) => tot + v, 0);
  const mostrati = dettaglio ? [...risultati].sort((a, b) => a - b) : risultati;
  // Per ogni valore 1-6: quanti dadi hanno fatto esattamente quel valore e quanti hanno fatto almeno quel valore.
  const righeTabella = [1, 2, 3, 4, 5, 6].map((valore) => ({
    valore,
    uguali: risultati.filter((v) => v === valore).length,
    almeno: risultati.filter((v) => v >= valore).length,
    sotto: risultati.filter((v) => v < valore).length,
  }));

  return (
    <div className={styles.finestra}>
      <div className={styles.intestazione}>
        <span>Dadi (D6)</span>
        <label className={styles.dettaglio}>
          <input type="checkbox" checked={dettaglio} onChange={(e) => setDettaglio(e.target.checked)} />
          Dettaglio
        </label>
        <button type="button" className={styles.chiudiBtn} onClick={() => setAperto(false)} title="Chiudi (Esc)">
          ✕
        </button>
      </div>
      <label className={styles.numeroDadi}>
        Numero di dadi
        <input
          type="number"
          min="1"
          max={MAX_DADI}
          step="1"
          value={numeroDadi}
          onChange={(e) => setNumeroDadi(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') lancia();
          }}
        />
      </label>
      <button
        type="button"
        className={styles.dado}
        onClick={lancia}
        title="Lancia i dadi"
        aria-label={quantita === 1 ? 'Lancia un dado a 6 facce' : `Lancia ${quantita} dadi a 6 facce`}
      >
        <span className={styles.faccia}>🎲</span>
      </button>
      {risultati.length > 0 && (
        <>
          <div className={styles.risultati}>
            {mostrati.map((v, i) => (
              <span key={i} className={styles.facciaPiccola} title={String(v)}>
                {FACCE_D6[v - 1]}
              </span>
            ))}
          </div>
          <div className={styles.somma}>
            Somma: <strong>{somma}</strong>
          </div>
          {dettaglio && (
            <table className={styles.tabella}>
              <thead>
                <tr>
                  <th>Valore</th>
                  <th>Uguali</th>
                  <th>Almeno</th>
                  <th>Sotto</th>
                </tr>
              </thead>
              <tbody>
                {righeTabella.map((r) => (
                  <tr key={r.valore}>
                    <td>{r.valore}</td>
                    <td>{r.uguali}</td>
                    <td>{r.almeno}</td>
                    <td>{r.sotto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default LancioDado;
