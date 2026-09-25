import { useState } from 'react';
import { dimensioniPerForma, etichettaDimensione } from '../../config/dimensioniBasette';
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

const PERSONALIZZATO = 'personalizzato';

function trovaPresetId(forma, dati) {
  if (forma === 'rettangolare') return null;
  const preset = dimensioniPerForma(forma).find((d) =>
    forma === 'tonda'
      ? d.diametroMm === dati.diametroMm
      : d.cortoMm === dati.larghezzaMm && d.lungoMm === dati.lunghezzaMm,
  );
  return preset ? preset.id : null;
}

function BasettaForm({ basettaIniziale, onSalva, onAnnulla }) {
  const [dati, setDati] = useState(() => ({ ...VALORI_DEFAULT, ...basettaIniziale }));
  const [dimensioneId, setDimensioneId] = useState(() => trovaPresetId(dati.forma, dati) ?? PERSONALIZZATO);
  const [avanzateAperte, setAvanzateAperte] = useState(false);

  const aggiorna = (campo, valore) => setDati((prev) => ({ ...prev, [campo]: valore }));

  const cambiaForma = (forma) => {
    if (forma === 'rettangolare') {
      setDimensioneId(PERSONALIZZATO);
      aggiorna('forma', forma);
      return;
    }
    const primoPreset = dimensioniPerForma(forma)[0];
    setDimensioneId(primoPreset.id);
    setDati((prev) => ({
      ...prev,
      forma,
      ...(forma === 'tonda'
        ? { diametroMm: primoPreset.diametroMm }
        : { larghezzaMm: primoPreset.cortoMm, lunghezzaMm: primoPreset.lungoMm }),
    }));
  };

  const cambiaDimensione = (id) => {
    setDimensioneId(id);
    if (id === PERSONALIZZATO) return;
    const preset = dimensioniPerForma(dati.forma).find((d) => d.id === id);
    if (!preset) return;
    setDati((prev) =>
      dati.forma === 'tonda'
        ? { ...prev, diametroMm: preset.diametroMm }
        : { ...prev, larghezzaMm: preset.cortoMm, lunghezzaMm: preset.lungoMm },
    );
  };

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

  const opzioniDimensione = dati.forma === 'rettangolare' ? [] : dimensioniPerForma(dati.forma);
  const mostraDimensioniPersonalizzate = dati.forma === 'rettangolare' || dimensioneId === PERSONALIZZATO;

  return (
    <form className={styles.formCompatto} onSubmit={handleSubmit}>
      <div className={styles.rigaCompatta}>
        <input
          className={styles.nomeCompatto}
          value={dati.nome}
          onChange={(e) => aggiorna('nome', e.target.value)}
          placeholder="Nome basetta"
          required
        />

        <select value={dati.forma} onChange={(e) => cambiaForma(e.target.value)} title="Forma">
          <option value="tonda">Tonda</option>
          <option value="ovale">Ovale</option>
          <option value="rettangolare">Rettangolare</option>
        </select>

        {opzioniDimensione.length > 0 && (
          <select value={dimensioneId} onChange={(e) => cambiaDimensione(e.target.value)} title="Dimensione">
            {opzioniDimensione.map((dim) => (
              <option key={dim.id} value={dim.id}>
                {etichettaDimensione(dim, dati.forma)}
              </option>
            ))}
            <option value={PERSONALIZZATO}>Personalizzato…</option>
          </select>
        )}

        {mostraDimensioniPersonalizzate && dati.forma === 'tonda' && (
          <input
            type="number"
            min="1"
            className={styles.numeroCompatto}
            title="Diametro (mm)"
            value={dati.diametroMm}
            onChange={(e) => aggiorna('diametroMm', Number(e.target.value))}
          />
        )}

        {mostraDimensioniPersonalizzate && dati.forma !== 'tonda' && (
          <>
            <input
              type="number"
              min="1"
              className={styles.numeroCompatto}
              title="Larghezza (mm)"
              value={dati.larghezzaMm}
              onChange={(e) => aggiorna('larghezzaMm', Number(e.target.value))}
            />
            <input
              type="number"
              min="1"
              className={styles.numeroCompatto}
              title="Lunghezza (mm)"
              value={dati.lunghezzaMm}
              onChange={(e) => aggiorna('lunghezzaMm', Number(e.target.value))}
            />
          </>
        )}

        <input type="color" value={dati.colore} onChange={(e) => aggiorna('colore', e.target.value)} title="Colore" />

        <button
          type="button"
          className={styles.avanzateBtn}
          onClick={() => setAvanzateAperte((v) => !v)}
          title="Opzioni avanzate"
        >
          {avanzateAperte ? '▾' : '▸'}
        </button>

        <button type="submit">Salva</button>
        <button type="button" onClick={onAnnulla}>
          Annulla
        </button>
      </div>

      {avanzateAperte && (
        <div className={styles.avanzatePannello}>
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
        </div>
      )}
    </form>
  );
}

export default BasettaForm;
