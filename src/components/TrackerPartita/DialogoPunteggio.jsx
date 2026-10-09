import { useState } from 'react';
import { LIMITI_VP } from '../../config/missioni';
import { calcolaPunti, chiaveRiga, raggruppaRighe, sezioniDelRound } from '../../utils/trackerPunti';
import Modale from '../Modale/Modale';
import styles from './TrackerPartita.module.css';

const titoloRound = (round) => {
  if (round === 'fine') return 'Fine battaglia';
  const [da, a] = round;
  if (da === 1 && a === LIMITI_VP.round) return 'Qualsiasi round';
  if (da === a) return `Round ${da}`;
  return a === LIMITI_VP.round ? `Dal round ${da}` : `Round ${da}-${a}`;
};

function Contatore({ valore, massimo, onCambia }) {
  return (
    <span className={styles.contatore}>
      <button type="button" onClick={() => onCambia(Math.max(0, valore - 1))} disabled={valore <= 0}>
        −
      </button>
      <span className={styles.contatoreValore}>{valore}</span>
      <button type="button" onClick={() => onCambia(Math.min(massimo, valore + 1))} disabled={valore >= massimo}>
        +
      </button>
    </span>
  );
}

// Dialogo di punteggio di una missione per un round: elenca le condizioni valide in quel round
// (spunte, contatori "per ogni…", alternative a scelta singola, bonus cumulativi) e ne somma i VP.
// Il tetto di round vale per le sezioni di round, non per quelle di fine battaglia.
// `onConferma` riceve { vp, scarta }: `vp` è già limitato dal tetto.
function DialogoPunteggio({
  titolo,
  nota,
  sezioni,
  round,
  tettoRound,
  testoConferma,
  avviso,
  scartabile,
  scartaPredefinito = false,
  onConferma,
  onChiudi,
}) {
  const [selezione, setSelezione] = useState({});
  const [scarta, setScarta] = useState(scartaPredefinito);
  const applicabili = sezioniDelRound(sezioni, round);
  const { normale, fine } = calcolaPunti(sezioni, round, selezione);
  const normaleConTetto = tettoRound ? Math.min(normale, tettoRound) : normale;
  const totale = normaleConTetto + fine;

  const imposta = (chiave, valore) => setSelezione((prev) => ({ ...prev, [chiave]: valore }));

  const scegliAlternativa = (indiceSezione, voce, indiceScelto) => {
    setSelezione((prev) => {
      const nuova = { ...prev };
      for (const { indice } of voce.righe) nuova[chiaveRiga(indiceSezione, indice)] = indice === indiceScelto ? 1 : 0;
      return nuova;
    });
  };

  const renderVoce = (indiceSezione, voce, chiaveVoce) => {
    const prima = voce.righe[0];
    const base = voce.righe.reduce((s, { indice }) => s + (selezione[chiaveRiga(indiceSezione, indice)] || 0), 0);
    return (
      <li key={chiaveVoce} className={styles.voce}>
        {voce.righe.length > 1 ? (
          <div className={styles.alternative}>
            <label className={styles.riga}>
              <input
                type="radio"
                name={chiaveVoce}
                checked={base === 0}
                onChange={() => scegliAlternativa(indiceSezione, voce, -1)}
              />
              <span className={styles.testoRiga}>Nessuna di queste</span>
            </label>
            {voce.righe.map(({ riga, indice }) => (
              <label key={indice} className={styles.riga}>
                <input
                  type="radio"
                  name={chiaveVoce}
                  checked={(selezione[chiaveRiga(indiceSezione, indice)] || 0) > 0}
                  onChange={() => scegliAlternativa(indiceSezione, voce, indice)}
                />
                <span className={styles.testoRiga}>{riga.t}</span>
                <span className={styles.vp}>{riga.vp} VP</span>
              </label>
            ))}
          </div>
        ) : prima.riga.per ? (
          <div className={styles.riga}>
            <Contatore
              valore={selezione[chiaveRiga(indiceSezione, prima.indice)] || 0}
              massimo={99}
              onCambia={(n) => imposta(chiaveRiga(indiceSezione, prima.indice), n)}
            />
            <span className={styles.testoRiga}>{prima.riga.t}</span>
            <span className={styles.vp}>{prima.riga.vp} VP ciascuno</span>
          </div>
        ) : (
          <label className={styles.riga}>
            <input
              type="checkbox"
              checked={(selezione[chiaveRiga(indiceSezione, prima.indice)] || 0) > 0}
              onChange={(e) => imposta(chiaveRiga(indiceSezione, prima.indice), e.target.checked ? 1 : 0)}
            />
            <span className={styles.testoRiga}>{prima.riga.t}</span>
            <span className={styles.vp}>{prima.riga.vp} VP</span>
          </label>
        )}
        {voce.cumulativi.map(({ riga, indice }) => (
          <div key={indice} className={`${styles.riga} ${styles.cumulativo}`}>
            {riga.per ? (
              <Contatore
                valore={Math.min(selezione[chiaveRiga(indiceSezione, indice)] || 0, base)}
                massimo={base}
                onCambia={(n) => imposta(chiaveRiga(indiceSezione, indice), n)}
              />
            ) : (
              <input
                type="checkbox"
                disabled={base === 0}
                checked={base > 0 && (selezione[chiaveRiga(indiceSezione, indice)] || 0) > 0}
                onChange={(e) => imposta(chiaveRiga(indiceSezione, indice), e.target.checked ? 1 : 0)}
              />
            )}
            <span className={styles.testoRiga}>{riga.t}</span>
            <span className={styles.vp}>+{riga.vp} VP{riga.per ? ' ciascuno' : ''}</span>
          </div>
        ))}
      </li>
    );
  };

  return (
    <Modale titolo={titolo} aperto onChiudi={onChiudi}>
      {nota && <p className={styles.notaMissione}>{nota}</p>}
      {avviso && <p className={styles.avviso}>{avviso}</p>}
      {applicabili.length === 0 ? (
        <p className={styles.vuoto}>Nessun punteggio previsto in questo round.</p>
      ) : (
        applicabili.map(({ sezione, indice }) => (
          <section key={indice} className={styles.sezione}>
            <h4>
              {titoloRound(sezione.round)}
              {sezione.momento && <span className={styles.momento}> · {sezione.momento}</span>}
              {sezione.cap && <span className={styles.momento}> · max {sezione.cap} VP</span>}
            </h4>
            <ul className={styles.voci}>
              {raggruppaRighe(sezione.righe).map((voce) => renderVoce(indice, voce, `${indice}:${voce.righe[0].indice}`))}
            </ul>
          </section>
        ))
      )}
      {scartabile && (
        <label className={styles.scarta}>
          <input type="checkbox" checked={scarta} onChange={(e) => setScarta(e.target.checked)} />
          Scarta la carta dopo il punteggio
        </label>
      )}
      <div className={styles.piede}>
        <div className={styles.totaleDialogo}>
          {totale} VP
          {tettoRound && normale > tettoRound && (
            <span className={styles.avviso}> (tetto di round {tettoRound}: contano {tettoRound} su {normale})</span>
          )}
        </div>
        <div className={styles.azioniDialogo}>
          <button type="button" onClick={() => onConferma({ vp: totale, scarta })}>
            {testoConferma}
          </button>
          <button type="button" className={styles.secondario} onClick={onChiudi}>
            Annulla
          </button>
        </div>
      </div>
    </Modale>
  );
}

export default DialogoPunteggio;
