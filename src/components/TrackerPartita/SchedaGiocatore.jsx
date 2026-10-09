import { useState } from 'react';
import { LIMITI_VP, MISSIONI_SECONDARIE, missionePrimaria, missioneSecondaria } from '../../config/missioni';
import { useTracker } from '../../contexts/TrackerContext';
import { totaliGiocatore } from '../../utils/trackerPunti';
import Modale from '../Modale/Modale';
import DialogoPunteggio from './DialogoPunteggio';
import styles from './TrackerPartita.module.css';

export const NOME_GIOCATORE = { blu: 'Blu', rosso: 'Rosso' };
const COLORE_GIOCATORE = { blu: '#3b82f6', rosso: '#ef4444' };

// Scheda di un giocatore nella partita: totale VP, missione primaria (segna il round corrente) e
// secondarie in gioco (pesca/scegli, segna, scarta), con l'elenco dei punti segnati.
function SchedaGiocatore({ giocatore }) {
  const {
    stato,
    registraPrimaria,
    aggiungiVoceSecondaria,
    modificaVoceSecondaria,
    rimuoviVoceSecondaria,
    attivaSecondaria,
    scartaSecondaria,
    pescaSecondaria,
  } = useTracker();
  const [dialogoPrimaria, setDialogoPrimaria] = useState(false);
  const [cartaDaSegnare, setCartaDaSegnare] = useState(null);
  // Voce di secondaria del round corrente da correggere (id della voce nel log).
  const [voceDaModificare, setVoceDaModificare] = useState(null);
  const [sceltaAperta, setSceltaAperta] = useState(false);

  const g = stato.giocatori[giocatore];
  const avversario = stato.giocatori[giocatore === 'blu' ? 'rosso' : 'blu'];
  const round = stato.round;
  const primaria = missionePrimaria(g.disposizione, avversario.disposizione);
  const totali = totaliGiocatore(g);
  const attivo = stato.turnoDi === giocatore && !stato.finita;
  const roundPrimaria = Object.keys(g.primaria).map(Number).sort((a, b) => a - b);
  const cartaAttiva = cartaDaSegnare && g.attive.find((a) => a.carta === cartaDaSegnare);
  const cartaMissione = cartaDaSegnare ? missioneSecondaria(cartaDaSegnare) : null;
  // Le secondarie segnate in questo round restano modificabili finché si è in questo round (come le
  // primarie); nei round successivi non compaiono più, i punti restano nelle statistiche.
  const vociDelRound = g.log.filter((v) => v.round === round);
  const voce = voceDaModificare ? g.log.find((v) => v.id === voceDaModificare) : null;
  const cartaVoce = voce ? missioneSecondaria(voce.carta) : null;
  const modoVoce =
    voce?.modo ?? (g.tipoSecondarie === 'fisse' && cartaVoce?.fissabile ? 'fissa' : 'tattica');

  return (
    <section
      className={`${styles.scheda} ${attivo ? styles.schedaAttiva : ''}`}
      style={{ '--colore-giocatore': COLORE_GIOCATORE[giocatore] }}
    >
      <header className={styles.schedaTesta}>
        <span className={styles.nomeGiocatore}>
          {NOME_GIOCATORE[giocatore]}
          {attivo && <span className={styles.chipTurno}>turno</span>}
        </span>
        <span className={styles.totaleVp} title="Punti totali (primarie + secondarie)">
          {totali.totale}
          <small> VP</small>
        </span>
      </header>
      <div className={styles.barre}>
        <span>
          PRI {totali.primaria}/{LIMITI_VP.primariaTotale}
        </span>
        <span>
          SEC {totali.secondaria}/{LIMITI_VP.secondariaTotale}
        </span>
      </div>

      <div className={styles.blocco}>
        <div className={styles.bloccoTitolo}>Primaria</div>
        {primaria ? (
          <>
            <div className={styles.nomeMissione}>{primaria.nome}</div>
            <button type="button" className={styles.segna} onClick={() => setDialogoPrimaria(true)}>
              Segna round {round}
              {g.primaria[round] ? ` (${g.primaria[round]} VP)` : ''}
            </button>
            {roundPrimaria.length > 0 && (
              <div className={styles.storico}>
                {roundPrimaria.map((r) => `R${r}: ${g.primaria[r]}`).join(' · ')}
              </div>
            )}
          </>
        ) : (
          <div className={styles.vuoto}>Scegli le disposizioni di entrambi per avere la missione.</div>
        )}
      </div>

      <div className={styles.blocco}>
        <div className={styles.bloccoTitolo}>
          Secondarie
          <span className={styles.tipoSec}> · {g.tipoSecondarie}</span>
        </div>
        {g.attive.length === 0 && <div className={styles.vuoto}>Nessuna secondaria attiva.</div>}
        {g.attive.map(({ carta, modo }) => {
          const m = missioneSecondaria(carta);
          return (
            <div key={carta} className={styles.secondaria}>
              <span className={styles.nomeSecondaria}>
                {m?.nome ?? carta}
                {modo === 'fissa' && <span className={styles.chip}>fissa</span>}
              </span>
              <button type="button" className={styles.piccolo} onClick={() => setCartaDaSegnare(carta)}>
                Segna
              </button>
              <button
                type="button"
                className={`${styles.piccolo} ${styles.secondario}`}
                onClick={() => scartaSecondaria(giocatore, carta)}
                title="Scarta la carta"
              >
                ✕
              </button>
            </div>
          );
        })}
        <div className={styles.azioniSec}>
          {g.tipoSecondarie === 'tattiche' && (
            <button type="button" className={styles.piccolo} onClick={() => pescaSecondaria(giocatore)}>
              Pesca
            </button>
          )}
          <button type="button" className={styles.piccolo} onClick={() => setSceltaAperta(true)}>
            Scegli ({MISSIONI_SECONDARIE.length})
          </button>
        </div>
        {vociDelRound.length > 0 && (
          <>
            <div className={styles.bloccoTitolo}>Segnate nel round {round}</div>
            <ul className={styles.log}>
              {vociDelRound.map((v) => (
                <li key={v.id}>
                  <span>{missioneSecondaria(v.carta)?.nome ?? v.carta}</span>
                  <b>+{v.vp}</b>
                  <button
                    type="button"
                    className={`${styles.piccolo} ${styles.secondario}`}
                    onClick={() => setVoceDaModificare(v.id)}
                    title="Correggi i punti di questa voce"
                  >
                    Modifica
                  </button>
                  <button type="button" className={styles.x} onClick={() => rimuoviVoceSecondaria(giocatore, v.id)} title="Rimuovi">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {dialogoPrimaria && primaria && (
        <DialogoPunteggio
          titolo={`${primaria.nome} — ${NOME_GIOCATORE[giocatore]}, round ${round}`}
          nota={primaria.nota}
          sezioni={primaria.sezioni}
          round={round}
          tettoRound={LIMITI_VP.primariaRound}
          avviso={
            g.primaria[round]
              ? `Round ${round} già segnato con ${g.primaria[round]} VP: confermando verrà sostituito.`
              : undefined
          }
          testoConferma={g.primaria[round] ? 'Sostituisci' : 'Segna'}
          onConferma={({ vp }) => {
            registraPrimaria(giocatore, round, vp);
            setDialogoPrimaria(false);
          }}
          onChiudi={() => setDialogoPrimaria(false)}
        />
      )}

      {cartaAttiva && cartaMissione && (
        <DialogoPunteggio
          titolo={`${cartaMissione.nome} — ${NOME_GIOCATORE[giocatore]}, round ${round}`}
          nota={cartaMissione.nota}
          sezioni={cartaAttiva.modo === 'fissa' ? cartaMissione.sezioniFissa : cartaMissione.sezioniTattica}
          round={round}
          avviso={`Secondarie già segnate nel round ${round}: ${totali.secondariaPerRound[round] || 0}/${LIMITI_VP.secondariaRound}.`}
          testoConferma="Aggiungi"
          scartabile
          scartaPredefinito={cartaAttiva.modo !== 'fissa'}
          onConferma={({ vp, scarta }) => {
            aggiungiVoceSecondaria(giocatore, { carta: cartaAttiva.carta, modo: cartaAttiva.modo, round, vp, scarta });
            setCartaDaSegnare(null);
          }}
          onChiudi={() => setCartaDaSegnare(null)}
        />
      )}

      {voce && cartaVoce && (
        <DialogoPunteggio
          titolo={`${cartaVoce.nome} — ${NOME_GIOCATORE[giocatore]}, round ${voce.round}`}
          nota={cartaVoce.nota}
          sezioni={modoVoce === 'fissa' ? cartaVoce.sezioniFissa : cartaVoce.sezioniTattica}
          round={voce.round}
          avviso={`Questa voce vale ${voce.vp} VP: confermando verrà sostituita (0 VP la toglie).`}
          testoConferma="Sostituisci"
          onConferma={({ vp }) => {
            modificaVoceSecondaria(giocatore, voce.id, vp);
            setVoceDaModificare(null);
          }}
          onChiudi={() => setVoceDaModificare(null)}
        />
      )}

      {sceltaAperta && (
        <Modale titolo={`Secondaria — ${NOME_GIOCATORE[giocatore]}`} aperto onChiudi={() => setSceltaAperta(false)}>
          <ul className={styles.elencoCarte}>
            {MISSIONI_SECONDARIE.map((m) => {
              const gia = g.attive.some((a) => a.carta === m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    className={styles.carta}
                    disabled={gia}
                    onClick={() => {
                      attivaSecondaria(giocatore, m.id);
                      setSceltaAperta(false);
                    }}
                  >
                    <span>{m.nome}</span>
                    {m.fissabile && <span className={styles.chip}>fissa/tattica</span>}
                    {gia && <span className={styles.chip}>in gioco</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </Modale>
      )}
    </section>
  );
}

export default SchedaGiocatore;
