import { useEffect, useMemo, useState } from 'react';
import { ESERCITI } from '../../config/eserciti';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useRegoleEsercito } from '../../contexts/RegoleEsercitoContext';
import { codiceFazionePerDatasheetId, useVersioneDatiCsv } from '../CreazioneEsercito/csvUnitaImport';
import PannelloDestro from '../PannelloDestro/PannelloDestro';
import {
  abilitaFazione,
  caricaDatiRegoleSeNecessario,
  contenutoDistaccamento,
  datiRegoleCaricati,
  distaccamentiFazione,
  elencoFazioniRegole,
  erroreCaricamentoRegole,
  stratagemmiComuni,
  useVersioneDatiRegole,
} from './csvRegoleEsercito';
import { Potenziamento, Regola, Sezione, Stratagemma } from './VociRegole';
import styles from './RegoleEsercito.module.css';

// Punti distaccamento (DP) spendibili da un esercito: la somma dei DP dei distaccamenti scelti non li supera.
export const LIMITE_DP = 3;

const COLORE_GIOCATORE = { blu: '#3b82f6', rosso: '#ef4444' };

// Pannello laterale destro "Eserciti": per l'esercito Blu o Rosso mostra le abilità d'esercito della fazione e
// permette di scegliere i distaccamenti (fino a LIMITE_DP punti), sotto i quali compaiono regole, potenziamenti
// e stratagemmi di ciascuno; in fondo gli stratagemmi comuni, sempre validi. Dati in csvRegoleEsercito.js,
// scelte in RegoleEsercitoContext.
function RegoleEsercito({ aperto, onApri, onChiudi }) {
  return (
    <PannelloDestro titolo="Eserciti" aperto={aperto} onApri={onApri} onChiudi={onChiudi} larghezza={400}>
      <ContenutoRegole />
    </PannelloDestro>
  );
}

// Fazione proposta per un esercito: quella più frequente tra le sue unità create.
function fazioneDalleUnita(basette, esercito) {
  const conteggio = new Map();
  for (const b of basette) {
    if (b.esercito !== esercito) continue;
    const codice = codiceFazionePerDatasheetId(b.datasheetId);
    if (codice) conteggio.set(codice, (conteggio.get(codice) ?? 0) + 1);
  }
  return [...conteggio].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}

function ContenutoRegole() {
  const { basette } = useLibreria();
  const { stato, impostaFazione, impostaDistaccamento } = useRegoleEsercito();
  const versioneRegole = useVersioneDatiRegole();
  const versioneUnita = useVersioneDatiCsv();
  // Esercito mostrato (Blu/Rosso): scelta solo di vista, non fa parte della partita.
  const [esercitoId, setEsercitoId] = useState(ESERCITI[0].id);

  useEffect(() => {
    caricaDatiRegoleSeNecessario().catch(() => {});
  }, []);

  const scelte = stato[esercitoId];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const proposta = useMemo(() => fazioneDalleUnita(basette, esercitoId), [basette, esercitoId, versioneUnita]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fazioni = useMemo(() => elencoFazioniRegole(), [versioneRegole]);
  const codice = scelte.fazione || proposta;
  const codiceValido = fazioni.some((f) => f.codice === codice) ? codice : '';

  /* eslint-disable react-hooks/exhaustive-deps */
  const distaccamenti = useMemo(() => distaccamentiFazione(codiceValido), [codiceValido, versioneRegole]);
  const abilita = useMemo(() => abilitaFazione(codiceValido), [codiceValido, versioneRegole]);
  const comuni = useMemo(() => stratagemmiComuni(), [versioneRegole]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Solo i distaccamenti scelti che esistono ancora nei dati (e nella fazione mostrata).
  const scelti = distaccamenti.filter((d) => scelte.distaccamenti.includes(d.id));
  const dpUsati = scelti.reduce((somma, d) => somma + d.dp, 0);

  const errore = erroreCaricamentoRegole();
  const colore = COLORE_GIOCATORE[esercitoId];

  return (
    <div className={styles.contenuto}>
      <div className={styles.selettori}>
        <label>
          Esercito
          <select
            value={esercitoId}
            onChange={(e) => setEsercitoId(e.target.value)}
            style={{ borderColor: colore, color: colore }}
          >
            {ESERCITI.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fazione
          <select value={codiceValido} onChange={(e) => impostaFazione(esercitoId, e.target.value)}>
            {!codiceValido && <option value="">Scegli la fazione…</option>}
            {fazioni.map((f) => (
              <option key={f.codice} value={f.codice}>
                {f.nome}
                {!scelte.fazione && f.codice === proposta ? ' (dalle unità)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {fazioni.length === 0 && (
        <p className={styles.vuoto}>
          {datiRegoleCaricati() || errore
            ? 'Dati non raggiungibili: il sito del calcolatore non ha ancora i file di army_builder/ (distaccamenti, stratagemmi).'
            : 'Caricamento dati…'}
        </p>
      )}

      {codiceValido && (
        <>
          <Sezione titolo="Abilità d'esercito" conteggio={abilita.length}>
            {abilita.length === 0 && <p className={styles.vuoto}>Nessuna abilità d'esercito nei dati.</p>}
            {abilita.map((a) => (
              <Regola key={a.nome} nome={a.nome} descrizione={a.descrizione} />
            ))}
          </Sezione>

          <Sezione titolo="Distaccamenti" aperta conteggio={`${dpUsati}/${LIMITE_DP} DP`}>
            {distaccamenti.length === 0 && <p className={styles.vuoto}>Nessun distaccamento nei dati.</p>}
            <ul className={styles.elencoDistaccamenti}>
              {distaccamenti.map((d) => {
                const scelto = scelte.distaccamenti.includes(d.id);
                const nonCiStaPiu = !scelto && dpUsati + d.dp > LIMITE_DP;
                return (
                  <li key={d.id} className={nonCiStaPiu ? styles.nonDisponibile : ''}>
                    <label title={nonCiStaPiu ? `Servono ${d.dp} DP, ne restano ${LIMITE_DP - dpUsati}` : ''}>
                      <input
                        type="checkbox"
                        checked={scelto}
                        disabled={nonCiStaPiu}
                        onChange={(e) => impostaDistaccamento(esercitoId, d.id, e.target.checked)}
                      />
                      <span className={styles.nomeDistaccamento}>{d.nome}</span>
                      <span className={styles.chip}>{d.dp} DP</span>
                      {d.disposizione && <span className={styles.disposizione}>{d.disposizione}</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
          </Sezione>

          {scelti.map((d) => (
            <DettaglioDistaccamento key={d.id} distaccamento={d} versione={versioneRegole} />
          ))}
        </>
      )}

      {comuni.length > 0 && (
        <Sezione titolo="Stratagemmi comuni (sempre validi)" conteggio={comuni.length}>
          {comuni.map((s) => (
            <Stratagemma key={s.id} stratagemma={s} />
          ))}
        </Sezione>
      )}
    </div>
  );
}

function DettaglioDistaccamento({ distaccamento, versione }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { regole, potenziamenti, stratagemmi } = useMemo(() => contenutoDistaccamento(distaccamento.id), [distaccamento.id, versione]);

  return (
    <section className={styles.distaccamento}>
      <h3>
        {distaccamento.nome} <span className={styles.chip}>{distaccamento.dp} DP</span>
      </h3>
      <Sezione titolo="Regole del distaccamento" aperta conteggio={regole.length}>
        {regole.length === 0 && <p className={styles.vuoto}>Nessuna regola nei dati.</p>}
        {regole.map((r) => (
          <Regola key={r.id} nome={r.nome} descrizione={r.descrizione} aperta />
        ))}
      </Sezione>
      <Sezione titolo="Potenziamenti" conteggio={potenziamenti.length}>
        {potenziamenti.length === 0 && <p className={styles.vuoto}>Nessun potenziamento nei dati.</p>}
        {potenziamenti.map((p) => (
          <Potenziamento key={p.id} potenziamento={p} />
        ))}
      </Sezione>
      <Sezione titolo="Stratagemmi" conteggio={stratagemmi.length}>
        {stratagemmi.length === 0 && <p className={styles.vuoto}>Nessuno stratagemma nei dati.</p>}
        {stratagemmi.map((s) => (
          <Stratagemma key={s.id} stratagemma={s} />
        ))}
      </Sezione>
    </section>
  );
}

export default RegoleEsercito;
