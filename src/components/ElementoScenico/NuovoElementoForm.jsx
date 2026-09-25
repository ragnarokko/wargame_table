import { useState } from 'react';
import styles from './GestioneElementiScenici.module.css';

const VALORI_DEFAULT = {
  nome: 'Terreno',
  forma: 'rettangolare',
  larghezzaPollici: 6,
  altezzaPollici: 4,
  colore: '#6b8f71',
};

function NuovoElementoForm({ onAggiungi, onAnnulla }) {
  const [dati, setDati] = useState(VALORI_DEFAULT);
  const [avanzateAperte, setAvanzateAperte] = useState(false);

  const aggiorna = (campo, valore) => setDati((prev) => ({ ...prev, [campo]: valore }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onAggiungi(dati);
  };

  return (
    <form className={styles.formCompatto} onSubmit={handleSubmit}>
      <div className={styles.rigaCompatta}>
        <select value={dati.forma} onChange={(e) => aggiorna('forma', e.target.value)} title="Forma">
          <option value="rettangolare">Rettangolare</option>
          <option value="ovale">Ovale</option>
        </select>

        <input
          type="number"
          min="0.5"
          step="0.5"
          className={styles.numeroInput}
          title="Larghezza (pollici)"
          value={dati.larghezzaPollici}
          onChange={(e) => aggiorna('larghezzaPollici', Number(e.target.value))}
        />
        <input
          type="number"
          min="0.5"
          step="0.5"
          className={styles.numeroInput}
          title="Profondità (pollici)"
          value={dati.altezzaPollici}
          onChange={(e) => aggiorna('altezzaPollici', Number(e.target.value))}
        />

        <button
          type="button"
          className={styles.avanzateBtn}
          onClick={() => setAvanzateAperte((v) => !v)}
          title="Opzioni avanzate"
        >
          {avanzateAperte ? '▾' : '▸'}
        </button>

        <button type="submit">Aggiungi</button>
        <button type="button" onClick={onAnnulla}>
          Annulla
        </button>
      </div>

      {avanzateAperte && (
        <div className={styles.avanzatePannello}>
          <label>
            Nome
            <input value={dati.nome} onChange={(e) => aggiorna('nome', e.target.value)} />
          </label>
          <label>
            Colore
            <input type="color" value={dati.colore} onChange={(e) => aggiorna('colore', e.target.value)} />
          </label>
        </div>
      )}
    </form>
  );
}

export default NuovoElementoForm;
