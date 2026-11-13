import { useEffect, useMemo, useState } from 'react';
import { CAPITOLI, FAZIONE_CON_CAPITOLI, capitoloDistaccamento } from '../../config/capitoliDistaccamenti';
import { ESERCITI } from '../../config/eserciti';
import { useRegoleEsercito } from '../../contexts/RegoleEsercitoContext';
import PannelloDestro from '../PannelloDestro/PannelloDestro';
import { URL_REGOLE } from '../../config/regole';
import { REGOLE_ARMI, REGOLE_TERRENO } from '../../config/regoleArmi';
import {
  abilitaBase,
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
import { FASI, valeInFase } from './fasiStratagemmi';
import { useFazioneEsercito } from './useRegoleGiocatore';
import { Potenziamento, Regola, Sezione, Stratagemma, VoceGlossario } from './VociRegole';
import styles from './RegoleEsercito.module.css';

// Punti distaccamento (DP) spendibili da un esercito: la somma dei DP dei distaccamenti scelti non li supera.
export const LIMITE_DP = 3;

const COLORE_GIOCATORE = { blu: '#3b82f6', rosso: '#ef4444' };
// Classe colore (colore_blu / colore_rosso) di ciascun esercito: l'id dell'esercito coincide col nome del colore.
const COLORE_GIOCATORE_ID = { blu: 'blu', rosso: 'rosso' };

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

function ContenutoRegole() {
  const { stato, impostaFazione, impostaSottofazione, impostaDistaccamento } = useRegoleEsercito();
  const versioneRegole = useVersioneDatiRegole();
  // Esercito mostrato (Blu/Rosso): scelta solo di vista, non fa parte della partita.
  const [esercitoId, setEsercitoId] = useState(ESERCITI[0].id);
  // Fase scelta nel filtro degli stratagemmi ('tutto' o l'id di una fase di FASI).
  const [faseFiltro, setFaseFiltro] = useState('tutto');

  useEffect(() => {
    caricaDatiRegoleSeNecessario().catch(() => {});
  }, []);

  const scelte = stato[esercitoId];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fazioni = useMemo(() => elencoFazioniRegole(), [versioneRegole]);
  const { codice: codiceValido, dalleUnita } = useFazioneEsercito(esercitoId);

  /* eslint-disable react-hooks/exhaustive-deps */
  const tuttiDistaccamenti = useMemo(() => distaccamentiFazione(codiceValido), [codiceValido, versioneRegole]);
  const abilita = useMemo(() => abilitaFazione(codiceValido), [codiceValido, versioneRegole]);
  const comuni = useMemo(() => stratagemmiComuni(), [versioneRegole]);
  const regoleUnita = useMemo(() => abilitaBase(), [versioneRegole]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Space Marines: con una sottofazione (capitolo) scelta restano i distaccamenti generici e quelli di quel capitolo.
  const haCapitoli = codiceValido === FAZIONE_CON_CAPITOLI;
  const sottofazione = haCapitoli ? scelte.sottofazione : '';
  const distaccamenti = sottofazione
    ? tuttiDistaccamenti.filter((d) => !capitoloDistaccamento(d.id) || capitoloDistaccamento(d.id) === sottofazione)
    : tuttiDistaccamenti;

  // Solo i distaccamenti scelti che esistono ancora nei dati (e nella fazione mostrata).
  const scelti = distaccamenti.filter((d) => scelte.distaccamenti.includes(d.id));
  const dpUsati = scelti.reduce((somma, d) => somma + d.dp, 0);
  // Capitolo Space Marines già scelto (via un suo distaccamento): quelli di altri capitoli non sono più selezionabili.
  const capitoloScelto = scelti.map((d) => capitoloDistaccamento(d.id)).find(Boolean) ?? '';

  // Stratagemmi di tutti i distaccamenti scelti più quelli comuni, in un'unica lista (filtrabile per fase).
  const stratagemmi = [
    ...scelti.flatMap((d) => contenutoDistaccamento(d.id).stratagemmi.map((s) => ({ ...s, origine: d.nome }))),
    ...comuni.map((s) => ({ ...s, origine: 'Comune (sempre valido)' })),
  ];
  const stratagemmiVisibili = stratagemmi.filter((s) => valeInFase(s, faseFiltro));

  const errore = erroreCaricamentoRegole();

  return (
    <div className={styles.contenuto}>
      <div className={styles.sceltaEsercito}>
        {ESERCITI.map((e) => (
          <button
            key={e.id}
            type="button"
            className={`${styles.esercitoBtn} ${e.id === esercitoId ? styles.esercitoAttivo : ''}`}
            style={{ '--colore-giocatore': COLORE_GIOCATORE[e.id] }}
            aria-pressed={e.id === esercitoId}
            onClick={() => setEsercitoId(e.id)}
          >
            {e.nome}
          </button>
        ))}
      </div>

      <div className={styles.selettori}>
        <label>
          Fazione
          <select value={scelte.fazione} onChange={(e) => impostaFazione(esercitoId, e.target.value)}>
            <option value="">
              {dalleUnita && fazioni.some((f) => f.codice === dalleUnita)
                ? `Automatica: ${fazioni.find((f) => f.codice === dalleUnita).nome}`
                : 'Scegli la fazione…'}
            </option>
            {fazioni.map((f) => (
              <option key={f.codice} value={f.codice}>
                {f.nome}
              </option>
            ))}
          </select>
        </label>
        {haCapitoli && (
          <label>
            Sottofazione
            <select value={scelte.sottofazione} onChange={(e) => impostaSottofazione(esercitoId, e.target.value)}>
              <option value="">Tutte</option>
              {CAPITOLI.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
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
                const altroCapitolo = !scelto && Boolean(capitoloScelto) && Boolean(capitoloDistaccamento(d.id)) && capitoloDistaccamento(d.id) !== capitoloScelto;
                const nonCiStaPiu = !scelto && dpUsati + d.dp > LIMITE_DP;
                const nonSelezionabile = nonCiStaPiu || altroCapitolo;
                return (
                  <li key={d.id} className={nonSelezionabile ? styles.nonDisponibile : ''}>
                    <label
                      title={
                        altroCapitolo
                          ? `Hai già scelto un distaccamento dei ${capitoloScelto}`
                          : nonCiStaPiu
                            ? `Servono ${d.dp} DP, ne restano ${LIMITE_DP - dpUsati}`
                            : ''
                      }
                    >
                      <input
                        type="checkbox"
                        checked={scelto}
                        disabled={nonSelezionabile}
                        onChange={(e) => impostaDistaccamento(esercitoId, d.id, e.target.checked)}
                      />
                      <span className={styles.nomeDistaccamento}>
                        {d.nome}
                        <Capitolo id={d.id} />
                      </span>
                      <span className={styles.chip}>{d.dp} DP</span>
                      {d.disposizione && <span className={styles.disposizione}>{d.disposizione}</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
          </Sezione>

          {scelti.length > 0 && (
            <>
              <Sezione titolo="Bonus distaccamento" conteggio={scelti.length}>
                {scelti.map((d) => (
                  <BoxDistaccamento key={d.id} distaccamento={d}>
                    {contenutoDistaccamento(d.id).regole.length === 0 && <p className={styles.vuoto}>Nessuna regola nei dati.</p>}
                    {contenutoDistaccamento(d.id).regole.map((r) => (
                      <Regola key={r.id} nome={r.nome} descrizione={r.descrizione} aperta />
                    ))}
                  </BoxDistaccamento>
                ))}
              </Sezione>

              <Sezione titolo="Potenziamenti" conteggio={scelti.reduce((n, d) => n + contenutoDistaccamento(d.id).potenziamenti.length, 0)}>
                {scelti.map((d) => {
                  const potenziamenti = contenutoDistaccamento(d.id).potenziamenti;
                  return (
                    <BoxDistaccamento key={d.id} distaccamento={d}>
                      {potenziamenti.length === 0 && <p className={styles.vuoto}>Nessun potenziamento nei dati.</p>}
                      {potenziamenti.map((p) => (
                        <Potenziamento key={p.id} potenziamento={p} />
                      ))}
                    </BoxDistaccamento>
                  );
                })}
              </Sezione>
            </>
          )}
        </>
      )}

      {stratagemmi.length > 0 && (
        <Sezione
          titolo="Stratagemmi"
          conteggio={faseFiltro === 'tutto' ? stratagemmi.length : `${stratagemmiVisibili.length}/${stratagemmi.length}`}
        >
          <div className={styles.filtroFasi} role="group" aria-label="Fase di attivazione">
            <button
              type="button"
              className={`${styles.filtroFase} ${faseFiltro === 'tutto' ? styles.filtroFaseAttivo : ''}`}
              aria-pressed={faseFiltro === 'tutto'}
              onClick={() => setFaseFiltro('tutto')}
            >
              Tutto
            </button>
            {FASI.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${styles.filtroFase} ${faseFiltro === f.id ? styles.filtroFaseAttivo : ''}`}
                aria-pressed={faseFiltro === f.id}
                title={`Stratagemmi usabili in fase ${f.nome.toLowerCase()} (compresi quelli di qualsiasi fase)`}
                onClick={() => setFaseFiltro(f.id)}
              >
                <span aria-hidden="true">{f.simbolo}</span> {f.nome}
              </button>
            ))}
          </div>
          <div className={styles.legendaTurni}>
            <span><i className={`${styles.pallino} ${styles[`colore_${COLORE_GIOCATORE_ID[esercitoId]}`]}`} /> tuo turno</span>
            <span><i className={`${styles.pallino} ${styles[`colore_${COLORE_GIOCATORE_ID[esercitoId] === 'blu' ? 'rosso' : 'blu'}`]}`} /> turno avversario</span>
            <span><i className={`${styles.pallino} ${styles.colore_verde}`} /> qualsiasi</span>
          </div>
          {stratagemmiVisibili.length === 0 && <p className={styles.vuoto}>Nessuno stratagemma per questa fase.</p>}
          {stratagemmiVisibili.map((s) => (
            <Stratagemma key={s.id} stratagemma={s} colorePropria={COLORE_GIOCATORE_ID[esercitoId]} origine={s.origine} />
          ))}
        </Sezione>
      )}

      <Sezione titolo="Regole" conteggio={REGOLE_ARMI.length + regoleUnita.length + REGOLE_TERRENO.length}>
        <Sezione titolo="Armi" conteggio={REGOLE_ARMI.length}>
          {REGOLE_ARMI.map((r) => (
            <VoceGlossario key={r.nome} nome={r.nome} descrizione={r.descrizione} link={r.ancora ? `${URL_REGOLE}#${r.ancora}` : undefined} />
          ))}
        </Sezione>

        <Sezione titolo="Unità" conteggio={regoleUnita.length}>
          {regoleUnita.map((a) => (
            <Regola key={a.nome} nome={a.nome} descrizione={a.descrizione} />
          ))}
        </Sezione>

        <Sezione titolo="Terreno e altre parole chiave" conteggio={REGOLE_TERRENO.length}>
          {REGOLE_TERRENO.map((r) => (
            <VoceGlossario key={r.nome} nome={r.nome} descrizione={r.descrizione} link={r.ancora ? `${URL_REGOLE}#${r.ancora}` : undefined} />
          ))}
        </Sezione>
      </Sezione>
    </div>
  );
}

// Capitolo degli Space Marines a cui appartiene il distaccamento, tra parentesi e in piccolo (nulla per gli altri).
function Capitolo({ id }) {
  const capitolo = capitoloDistaccamento(id);
  return capitolo ? <small className={styles.capitolo}> ({capitolo})</small> : null;
}

// Riquadro di un distaccamento scelto (nome e DP in testa) con il suo contenuto dentro uno dei tre gruppi.
function BoxDistaccamento({ distaccamento, children }) {
  return (
    <section className={styles.distaccamento}>
      <h3>
        <span>
          {distaccamento.nome}
          <Capitolo id={distaccamento.id} />
        </span>{' '}
        <span className={styles.chip}>{distaccamento.dp} DP</span>
      </h3>
      {children}
    </section>
  );
}

export default RegoleEsercito;
