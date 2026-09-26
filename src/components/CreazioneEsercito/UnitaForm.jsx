import { useMemo, useState } from 'react';
import { elencoFazioni, unitaPerFazione } from './csvUnitaImport';
import styles from './CreazioneEsercito.module.css';

const CAMPI_STATISTICHE_CSV = [
  ['mov', 'MOV'],
  ['res', 'RES'],
  ['w', 'W'],
  ['ts', 'TS'],
  ['tsPiu', 'TS+'],
  ['oc', 'OC'],
];

// Campi opzionali non presenti nel CSV: restano compilabili a mano.
const CAMPI_STATISTICHE_MANUALI = [
  ['fnp', 'FNP'],
  ['range1', 'RANGE1'],
  ['range2', 'RANGE2'],
  ['range3', 'RANGE3'],
];

function statisticheDaUnitaCsv(unitaCsv) {
  return {
    mov: unitaCsv?.mov ?? '',
    res: unitaCsv?.res ?? '',
    w: unitaCsv?.w ?? '',
    ts: unitaCsv?.ts ?? '',
    tsPiu: unitaCsv?.tsPiu ?? '',
    oc: unitaCsv?.oc ?? '',
    note: unitaCsv?.note ?? '',
    fnp: '',
    range1: '',
    range2: '',
    range3: '',
  };
}

function UnitaForm({ coloreDefault, onCrea, onAnnulla }) {
  const fazioni = useMemo(() => elencoFazioni(), []);
  const [fazioneCsv, setFazioneCsv] = useState(fazioni[0] ?? '');
  const unitaDisponibili = useMemo(() => unitaPerFazione(fazioneCsv), [fazioneCsv]);
  const [chiaveUnita, setChiaveUnita] = useState(unitaDisponibili[0]?.chiave ?? '');
  const unitaCsv = unitaDisponibili.find((u) => u.chiave === chiaveUnita) ?? unitaDisponibili[0] ?? null;

  const [numeroModelli, setNumeroModelli] = useState(5);
  const [colore, setColore] = useState(coloreDefault);
  const [statistiche, setStatistiche] = useState(() => statisticheDaUnitaCsv(unitaDisponibili[0]));

  const cambiaFazione = (nuovaFazione) => {
    setFazioneCsv(nuovaFazione);
    const prima = unitaPerFazione(nuovaFazione)[0];
    setChiaveUnita(prima?.chiave ?? '');
    setStatistiche(statisticheDaUnitaCsv(prima));
  };

  const cambiaUnita = (chiave) => {
    setChiaveUnita(chiave);
    const trovata = unitaDisponibili.find((u) => u.chiave === chiave);
    setStatistiche(statisticheDaUnitaCsv(trovata));
  };

  const aggiornaStatistica = (campo, valore) => setStatistiche((prev) => ({ ...prev, [campo]: valore }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!unitaCsv) return;
    const numero = Math.max(1, Math.round(Number(numeroModelli) || 1));
    onCrea({
      nomeBase: unitaCsv.nome,
      baseSize: unitaCsv.baseSize,
      numeroModelli: numero,
      colore,
      ...statistiche,
    });
  };

  if (fazioni.length === 0) {
    return <p className={styles.vuoto}>Nessuna unità disponibile nel CSV.</p>;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.rigaCampi}>
        <label>
          Fazione
          <select value={fazioneCsv} onChange={(e) => cambiaFazione(e.target.value)}>
            {fazioni.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <label>
          Unità
          <select value={chiaveUnita} onChange={(e) => cambiaUnita(e.target.value)}>
            {unitaDisponibili.map((u) => (
              <option key={u.chiave} value={u.chiave}>
                {u.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Numero di modelli
        <input
          type="number"
          min="1"
          step="1"
          value={numeroModelli}
          onChange={(e) => setNumeroModelli(e.target.value)}
        />
      </label>

      <label>
        Colore
        <input type="color" value={colore} onChange={(e) => setColore(e.target.value)} />
      </label>

      <div className={styles.separatore}>Statistiche (dal CSV, modificabili)</div>

      <div className={styles.grigliaStatistiche}>
        {CAMPI_STATISTICHE_CSV.map(([campo, etichetta]) => (
          <label key={campo}>
            {etichetta}
            <input
              value={statistiche[campo]}
              onChange={(e) => aggiornaStatistica(campo, e.target.value)}
              placeholder="-"
            />
          </label>
        ))}
      </div>

      <div className={styles.separatore}>Statistiche aggiuntive (opzionali)</div>

      <div className={styles.grigliaStatistiche}>
        {CAMPI_STATISTICHE_MANUALI.map(([campo, etichetta]) => (
          <label key={campo}>
            {etichetta}
            <input
              value={statistiche[campo]}
              onChange={(e) => aggiornaStatistica(campo, e.target.value)}
              placeholder="-"
            />
          </label>
        ))}
      </div>

      <label>
        NOTE
        <textarea
          rows="2"
          value={statistiche.note}
          onChange={(e) => aggiornaStatistica('note', e.target.value)}
          placeholder="-"
        />
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
