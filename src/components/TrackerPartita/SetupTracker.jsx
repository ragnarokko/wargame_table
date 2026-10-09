import { DISPOSIZIONI, LIMITI_VP, MISSIONI_SECONDARIE } from '../../config/missioni';
import { useTracker } from '../../contexts/TrackerContext';
import { NOME_GIOCATORE } from './SchedaGiocatore';
import styles from './TrackerPartita.module.css';

const TIPI_SECONDARIE = [
  { id: 'tattiche', nome: 'Tattiche', descrizione: 'durante la partita le pesci a caso o le scegli' },
  { id: 'fisse', nome: 'Fisse', descrizione: `${LIMITI_VP.secondarieFisse} fisse scelte all'inizio` },
];

const FISSABILI = MISSIONI_SECONDARIE.filter((m) => m.fissabile);
const GIOCATORI = ['blu', 'rosso'];

// Setup della partita: disposizione di forze e tipo di secondarie per ciascun giocatore (con le
// secondarie fisse da scegliere), chi è attaccante e chi gioca per primo.
function SetupTracker() {
  const { stato, impostaGiocatore, impostaCampo, avviaPartita } = useTracker();

  const alternaFissa = (giocatore, carta) => {
    const fisse = stato.giocatori[giocatore].fisse;
    if (fisse.includes(carta)) impostaGiocatore(giocatore, { fisse: fisse.filter((c) => c !== carta) });
    else if (fisse.length < LIMITI_VP.secondarieFisse) impostaGiocatore(giocatore, { fisse: [...fisse, carta] });
  };

  const mancanti = [];
  for (const g of GIOCATORI) {
    const dati = stato.giocatori[g];
    if (!dati.disposizione) mancanti.push(`disposizione ${NOME_GIOCATORE[g]}`);
    if (dati.tipoSecondarie === 'fisse' && dati.fisse.length < LIMITI_VP.secondarieFisse) {
      mancanti.push(`fisse ${NOME_GIOCATORE[g]}`);
    }
  }
  if (!stato.primo) mancanti.push('primo turno');

  return (
    <div className={styles.setup}>
      {GIOCATORI.map((g) => {
        const dati = stato.giocatori[g];
        return (
          <fieldset key={g} className={`${styles.gruppo} ${g === 'blu' ? styles.gruppoBlu : styles.gruppoRosso}`}>
            <legend>{NOME_GIOCATORE[g]}</legend>
            <label className={styles.campo}>
              Disposizione di forze
              <select value={dati.disposizione} onChange={(e) => impostaGiocatore(g, { disposizione: e.target.value })}>
                <option value="">Seleziona…</option>
                {DISPOSIZIONI.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.campo}>
              Secondarie
              <div className={styles.scelte}>
                {TIPI_SECONDARIE.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.scelta} ${dati.tipoSecondarie === t.id ? styles.sceltaAttiva : ''}`}
                    onClick={() => impostaGiocatore(g, { tipoSecondarie: t.id })}
                    title={t.descrizione}
                  >
                    {t.nome}
                  </button>
                ))}
              </div>
            </div>
            {dati.tipoSecondarie === 'fisse' && (
              <div className={styles.campo}>
                Scegli {LIMITI_VP.secondarieFisse} fisse ({dati.fisse.length}/{LIMITI_VP.secondarieFisse})
                <div className={styles.fisse}>
                  {FISSABILI.map((m) => (
                    <label key={m.id}>
                      <input
                        type="checkbox"
                        checked={dati.fisse.includes(m.id)}
                        disabled={!dati.fisse.includes(m.id) && dati.fisse.length >= LIMITI_VP.secondarieFisse}
                        onChange={() => alternaFissa(g, m.id)}
                      />
                      {m.nome}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </fieldset>
        );
      })}

      <div className={styles.campo}>
        Attaccante (tiro di dado)
        <div className={styles.scelte}>
          {GIOCATORI.map((g) => (
            <button
              key={g}
              type="button"
              className={`${styles.scelta} ${stato.attaccante === g ? styles.sceltaAttiva : ''}`}
              onClick={() => impostaCampo('attaccante', stato.attaccante === g ? '' : g)}
            >
              {NOME_GIOCATORE[g]}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.campo}>
        Gioca per primo (tiro di dado)
        <div className={styles.scelte}>
          {GIOCATORI.map((g) => (
            <button
              key={g}
              type="button"
              className={`${styles.scelta} ${stato.primo === g ? styles.sceltaAttiva : ''}`}
              onClick={() => impostaCampo('primo', g)}
            >
              {NOME_GIOCATORE[g]}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className={styles.avvia} onClick={avviaPartita} disabled={mancanti.length > 0}>
        Inizia partita
      </button>
      {mancanti.length > 0 && <div className={styles.vuoto}>Manca: {mancanti.join(', ')}.</div>}
    </div>
  );
}

export default SetupTracker;
