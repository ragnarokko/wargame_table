import { useState } from 'react';
import styles from './LibreriaBasette.module.css';

const VALORI_DEFAULT = {
  nome: '',
  colore: '#457b9d',
  forma: 'tonda',
  diametroMm: 32,
  larghezzaMm: 32,
  lunghezzaMm: 60,
  immagine: '',
  statistiche: '',
};

function BasettaForm({ basettaIniziale, onSalva, onAnnulla }) {
  const [dati, setDati] = useState(() => ({ ...VALORI_DEFAULT, ...basettaIniziale }));

  const aggiorna = (campo, valore) => setDati((prev) => ({ ...prev, [campo]: valore }));

  const handleImmagine = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => aggiorna('immagine', reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dati.nome.trim()) return;
    onSalva(dati);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        Nome
        <input value={dati.nome} onChange={(e) => aggiorna('nome', e.target.value)} required />
      </label>

      <label>
        Colore
        <input type="color" value={dati.colore} onChange={(e) => aggiorna('colore', e.target.value)} />
      </label>

      <label>
        Forma
        <select value={dati.forma} onChange={(e) => aggiorna('forma', e.target.value)}>
          <option value="tonda">Tonda</option>
          <option value="ovale">Ovale</option>
          <option value="rettangolare">Rettangolare</option>
        </select>
      </label>

      {dati.forma === 'tonda' ? (
        <label>
          Diametro (mm)
          <input
            type="number"
            min="1"
            value={dati.diametroMm}
            onChange={(e) => aggiorna('diametroMm', Number(e.target.value))}
          />
        </label>
      ) : (
        <>
          <label>
            Larghezza (mm)
            <input
              type="number"
              min="1"
              value={dati.larghezzaMm}
              onChange={(e) => aggiorna('larghezzaMm', Number(e.target.value))}
            />
          </label>
          <label>
            Lunghezza (mm)
            <input
              type="number"
              min="1"
              value={dati.lunghezzaMm}
              onChange={(e) => aggiorna('lunghezzaMm', Number(e.target.value))}
            />
          </label>
        </>
      )}

      <label>
        Immagine (opzionale)
        <input type="file" accept="image/*" onChange={handleImmagine} />
      </label>
      {dati.immagine && <img src={dati.immagine} alt="anteprima" className={styles.anteprima} />}

      <label>
        Statistiche (opzionale)
        <textarea
          rows="3"
          value={dati.statistiche}
          onChange={(e) => aggiorna('statistiche', e.target.value)}
          placeholder={'Es: Movimento 6"\nForza 4\nResistenza 3'}
        />
      </label>

      <div className={styles.formAzioni}>
        <button type="submit">Salva</button>
        <button type="button" onClick={onAnnulla}>
          Annulla
        </button>
      </div>
    </form>
  );
}

export default BasettaForm;
