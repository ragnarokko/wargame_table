import { useEffect, useMemo, useRef, useState } from 'react';
import { datiCsvCaricati, elencoFazioni, unitaPerFazione, useVersioneDatiCsv } from './csvUnitaImport';
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
  // I dati CSV possono ancora essere in caricamento al primo render (fetch asincrono, vedi
  // csvUnitaImport.js): fazioneCsv/chiaveUnita ricadono su un sentinella vuoto e si aggiornano
  // da soli non appena elencoFazioni()/unitaPerFazione() smettono di essere vuoti, invece di
  // restare bloccati sul valore (vuoto) letto al mount.
  const versioneDatiCsv = useVersioneDatiCsv();
  // versioneDatiCsv non è letto nel corpo delle callback, ma è una dipendenza voluta: è il
  // riferimento della cache CSV, e deve far ricalcolare fazioni/unitaDisponibili ad ogni
  // caricamento/ricaricamento anche se elencoFazioni()/unitaPerFazione() leggono uno stato
  // esterno al modulo invece di un valore passato esplicitamente.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fazioni = useMemo(() => elencoFazioni(), [versioneDatiCsv]);
  const [fazioneScelta, setFazioneScelta] = useState('');
  const fazioneCsv = fazioneScelta || fazioni[0] || '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const unitaDisponibili = useMemo(() => unitaPerFazione(fazioneCsv), [fazioneCsv, versioneDatiCsv]);
  const [chiaveScelta, setChiaveScelta] = useState('');
  const chiaveUnita = chiaveScelta || unitaDisponibili[0]?.chiave || '';
  const unitaCsv = unitaDisponibili.find((u) => u.chiave === chiaveUnita) ?? unitaDisponibili[0] ?? null;

  const [numeroModelli, setNumeroModelli] = useState(5);
  const [colore, setColore] = useState(coloreDefault);
  const [statistiche, setStatistiche] = useState(() => statisticheDaUnitaCsv(unitaDisponibili[0]));
  // Se al mount i dati CSV non erano ancora pronti, statistiche parte vuoto (nessun unitaCsv):
  // appena la prima unità diventa disponibile la popola una volta sola (i cambi successivi di
  // fazione/unità restano gestiti esplicitamente da cambiaFazione/cambiaUnita qui sotto).
  const statisticheInizializzate = useRef(Boolean(unitaDisponibili[0]));
  useEffect(() => {
    if (!statisticheInizializzate.current && unitaCsv) {
      statisticheInizializzate.current = true;
      setStatistiche(statisticheDaUnitaCsv(unitaCsv));
    }
  }, [unitaCsv]);

  const cambiaFazione = (nuovaFazione) => {
    statisticheInizializzate.current = true;
    setFazioneScelta(nuovaFazione);
    const prima = unitaPerFazione(nuovaFazione)[0];
    setChiaveScelta(prima?.chiave ?? '');
    setStatistiche(statisticheDaUnitaCsv(prima));
  };

  const cambiaUnita = (chiave) => {
    statisticheInizializzate.current = true;
    setChiaveScelta(chiave);
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
    return (
      <p className={styles.vuoto}>
        {datiCsvCaricati() ? 'Nessuna unità disponibile nel CSV.' : 'Caricamento dati CSV…'}
      </p>
    );
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
