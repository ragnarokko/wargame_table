import { useState } from 'react';
import { dimensioniPerForma, etichettaDimensione } from '../../config/dimensioniBasette';
import styles from './CreazioneEsercito.module.css';

const CAMPI_STATISTICHE = [
  ['mov', 'MOV'],
  ['res', 'RES'],
  ['w', 'W'],
  ['ts', 'TS'],
  ['tsPiu', 'TS+'],
  ['oc', 'OC'],
  ['fnp', 'FNP'],
  ['range1', 'RANGE1'],
  ['range2', 'RANGE2'],
  ['range3', 'RANGE3'],
];

function valoriIniziali(coloreDefault) {
  const iniziale = {
    nomeUnita: '',
    numeroModelli: 5,
    forma: 'tonda',
    dimensioneId: dimensioniPerForma('tonda')[0].id,
    colore: coloreDefault,
    note: '',
  };
  CAMPI_STATISTICHE.forEach(([campo]) => {
    iniziale[campo] = '';
  });
  return iniziale;
}

function UnitaForm({ coloreDefault, onCrea, onAnnulla }) {
  const [dati, setDati] = useState(() => valoriIniziali(coloreDefault));

  const aggiorna = (campo, valore) => setDati((prev) => ({ ...prev, [campo]: valore }));

  const cambiaForma = (forma) => {
    setDati((prev) => ({ ...prev, forma, dimensioneId: dimensioniPerForma(forma)[0].id }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dati.nomeUnita.trim()) return;
    const numeroModelli = Math.max(1, Math.round(Number(dati.numeroModelli) || 1));
    onCrea({ ...dati, numeroModelli });
  };

  const opzioniDimensione = dimensioniPerForma(dati.forma);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        Nome unità
        <input value={dati.nomeUnita} onChange={(e) => aggiorna('nomeUnita', e.target.value)} required />
      </label>

      <label>
        Numero di modelli
        <input
          type="number"
          min="1"
          step="1"
          value={dati.numeroModelli}
          onChange={(e) => aggiorna('numeroModelli', e.target.value)}
        />
      </label>

      <div className={styles.rigaCampi}>
        <label>
          Forma basetta
          <select value={dati.forma} onChange={(e) => cambiaForma(e.target.value)}>
            <option value="tonda">Tonda</option>
            <option value="ovale">Ovale</option>
          </select>
        </label>

        <label>
          Dimensione basetta
          <select value={dati.dimensioneId} onChange={(e) => aggiorna('dimensioneId', e.target.value)}>
            {opzioniDimensione.map((dim) => (
              <option key={dim.id} value={dim.id}>
                {etichettaDimensione(dim, dati.forma)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Colore
        <input type="color" value={dati.colore} onChange={(e) => aggiorna('colore', e.target.value)} />
      </label>

      <div className={styles.separatore}>Statistiche (opzionali)</div>

      <div className={styles.grigliaStatistiche}>
        {CAMPI_STATISTICHE.map(([campo, etichetta]) => (
          <label key={campo}>
            {etichetta}
            <input value={dati[campo]} onChange={(e) => aggiorna(campo, e.target.value)} placeholder="-" />
          </label>
        ))}
      </div>

      <label>
        NOTE (opzionale)
        <textarea rows="2" value={dati.note} onChange={(e) => aggiorna('note', e.target.value)} placeholder="-" />
      </label>

      <div className={styles.formAzioni}>
        <button type="submit">Crea unità</button>
        <button type="button" onClick={onAnnulla}>
          Annulla
        </button>
      </div>
    </form>
  );
}

export default UnitaForm;
