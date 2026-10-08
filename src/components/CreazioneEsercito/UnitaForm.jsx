import { useEffect, useMemo, useRef, useState } from 'react';
import { datiCsvCaricati, elencoFazioni, unitaPerFazione, useVersioneDatiCsv } from './csvUnitaImport';
import {
  datiArmyBuilderCaricati,
  datiPuntiUnita,
  erroreCaricamentoArmyBuilder,
  modelliPredefiniti,
  puntiPerNumeroModelli,
  useVersioneDatiArmyBuilder,
} from './csvArmyBuilderImport';
import styles from './CreazioneEsercito.module.css';

// Numero di modelli se nei dati non c'è nulla di meglio.
const MODELLI_DI_RIPIEGO = 1;
const OPZIONI_MOSTRATE = 3;

const CAMPI_STATISTICHE_CSV = [
  ['mov', 'MOV'],
  ['res', 'RES'],
  ['w', 'W'],
  ['ts', 'TS'],
  ['tsPiu', 'TS+'],
  ['oc', 'OC'],
  ['fnp', 'FNP'],
];

// Campi opzionali non presenti nel CSV: restano compilabili a mano.
const CAMPI_STATISTICHE_MANUALI = [
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
    fnp: unitaCsv?.fnp ?? '',
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

  // Numero di modelli e punti sono proposti dai dati dell'army builder (composizione e punti.csv) e
  // restano modificabili: finché l'utente non li tocca (null) seguono l'unità scelta; si azzerano ad
  // ogni cambio di fazione/unità.
  const versioneArmyBuilder = useVersioneDatiArmyBuilder();
  const [modelliManuali, setModelliManuali] = useState(null);
  const [puntiManuali, setPuntiManuali] = useState(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const datiPunti = useMemo(() => datiPuntiUnita(unitaCsv), [unitaCsv, versioneArmyBuilder]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const predefiniti = useMemo(() => modelliPredefiniti(unitaCsv), [unitaCsv, versioneArmyBuilder]);
  const numeroModelli = modelliManuali ?? String(predefiniti?.valore ?? MODELLI_DI_RIPIEGO);
  const modelliPerPunti = Math.max(1, Math.round(Number(numeroModelli) || 1));
  const stimaPunti = puntiPerNumeroModelli(datiPunti, modelliPerPunti);
  // I punti sono dell'intera scheda: se ha più profili di modello (es. Boy + Nob) li propongo solo sul
  // primo, per non contarli due volte creando un'unità per ogni profilo.
  const primoProfilo = unitaDisponibili.find((u) => u.datasheetId === unitaCsv?.datasheetId);
  const proponiPunti = Boolean(stimaPunti) && primoProfilo?.chiave === unitaCsv?.chiave;
  const punti = puntiManuali ?? (proponiPunti ? String(stimaPunti.punti) : '');
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
    setModelliManuali(null);
    setPuntiManuali(null);
    setFazioneScelta(nuovaFazione);
    const prima = unitaPerFazione(nuovaFazione)[0];
    setChiaveScelta(prima?.chiave ?? '');
    setStatistiche(statisticheDaUnitaCsv(prima));
  };

  const cambiaUnita = (chiave) => {
    statisticheInizializzate.current = true;
    setModelliManuali(null);
    setPuntiManuali(null);
    setChiaveScelta(chiave);
    const trovata = unitaDisponibili.find((u) => u.chiave === chiave);
    setStatistiche(statisticheDaUnitaCsv(trovata));
  };

  const aggiornaStatistica = (campo, valore) => setStatistiche((prev) => ({ ...prev, [campo]: valore }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!unitaCsv) return;
    const numero = Math.max(1, Math.round(Number(numeroModelli) || 1));
    const puntiNumero = punti === '' ? NaN : Number(punti);
    onCrea({
      nomeBase: unitaCsv.nome,
      baseSize: unitaCsv.baseSize,
      datasheetId: unitaCsv.datasheetId,
      numeroModelli: numero,
      punti: Number.isFinite(puntiNumero) && puntiNumero >= 0 ? puntiNumero : undefined,
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

      <div className={styles.rigaCampi}>
        <label>
          Numero di modelli
          <input
            type="number"
            min="1"
            step="1"
            value={numeroModelli}
            onChange={(e) => setModelliManuali(e.target.value)}
          />
        </label>

        <label>
          Punti
          <input
            type="number"
            min="0"
            step="5"
            value={punti}
            placeholder="-"
            onChange={(e) => setPuntiManuali(e.target.value)}
          />
        </label>
      </div>

      <div className={styles.puntiInfo}>
        {predefiniti && (
          <div>
            Modelli predefiniti: {predefiniti.valore}
            {predefiniti.max && predefiniti.max !== predefiniti.min
              ? ` (la composizione prevede da ${predefiniti.min} a ${predefiniti.max})`
              : ''}
          </div>
        )}
        {datiPunti ? (
          <>
            {datiPunti.scaglioni.map((s) => (
              <div key={s.codice}>
                {s.etichetta ? `${s.etichetta}: ` : 'Costo: '}
                {s.tagli.map((t) => `${t.modelli} mod. = ${t.punti} pt`).join(' · ')}
              </div>
            ))}
            {stimaPunti && !stimaPunti.esatto && (
              <div>
                Con {modelliPerPunti} modelli si paga la taglia da {stimaPunti.taglia} ({stimaPunti.punti} pt).
              </div>
            )}
            {datiPunti.opzioni.length > 0 && (
              <div>
                Opzioni a pagamento:{' '}
                {datiPunti.opzioni
                  .slice(0, OPZIONI_MOSTRATE)
                  .map((o) => `${o.descrizione} ${o.punti} pt`)
                  .join(' · ')}
                {datiPunti.opzioni.length > OPZIONI_MOSTRATE ? ` · +${datiPunti.opzioni.length - OPZIONI_MOSTRATE} altre` : ''}
              </div>
            )}
            {!proponiPunti && stimaPunti && (
              <div>
                I punti riguardano l'intera unità: li ho proposti solo sul primo profilo ({primoProfilo?.nome}) per non
                contarli due volte.
              </div>
            )}
          </>
        ) : (
          <div>
            {!datiArmyBuilderCaricati()
              ? erroreCaricamentoArmyBuilder()
                ? 'Punti non raggiungibili: il sito del calcolatore non ha ancora i file army_builder/.'
                : 'Caricamento punti…'
              : 'Punti non disponibili per questa unità: inseriscili a mano se servono.'}
          </div>
        )}
      </div>

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
