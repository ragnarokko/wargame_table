import { LIMITI_VP } from '../../config/missioni';
import { raggruppaRighe, sezioniDelRound } from '../../utils/trackerPunti';
import Modale from '../Modale/Modale';
import { titoloRound } from './DialogoPunteggio';
import styles from './TrackerPartita.module.css';

// Riepilogo in sola lettura di una missione primaria: per ogni gruppo di round, quando si segna e
// quanti punti valgono le condizioni. Le sezioni valide nel round corrente sono evidenziate.
function RiepilogoMissione({ missione, round, onChiudi }) {
  const correnti = new Set(sezioniDelRound(missione.sezioni, round).map(({ indice }) => indice));

  return (
    <Modale titolo={missione.nome} aperto onChiudi={onChiudi}>
      {missione.nota && <p className={styles.notaMissione}>{missione.nota}</p>}
      <p className={styles.notaMissione}>
        Massimo {LIMITI_VP.primariaRound} VP per round e {LIMITI_VP.primariaTotale} VP in totale (fine battaglia
        esclusa dal tetto di round). In evidenza: round {round}.
      </p>
      {missione.sezioni.map((sezione, indice) => (
        <section key={indice} className={`${styles.sezione} ${correnti.has(indice) ? styles.sezioneCorrente : ''}`}>
          <h4>
            {titoloRound(sezione.round)}
            {sezione.momento && <span className={styles.momento}> · {sezione.momento}</span>}
            {sezione.cap && <span className={styles.momento}> · max {sezione.cap} VP</span>}
          </h4>
          <ul className={styles.voci}>
            {raggruppaRighe(sezione.righe).map((voce) => (
              <li key={voce.righe[0].indice} className={styles.voce}>
                {voce.righe.map(({ riga, indice: i }, k) => (
                  <div key={i} className={styles.rigaLettura}>
                    {voce.righe.length > 1 && <span className={styles.legamento}>{k === 0 ? '' : 'o'}</span>}
                    <span className={styles.testoRiga}>{riga.t}</span>
                    <span className={styles.vp}>
                      {riga.vp} VP{riga.per ? ' ciascuno' : ''}
                    </span>
                  </div>
                ))}
                {voce.cumulativi.map(({ riga, indice: i }) => (
                  <div key={i} className={`${styles.rigaLettura} ${styles.cumulativo}`}>
                    <span className={styles.testoRiga}>{riga.t}</span>
                    <span className={styles.vp}>
                      +{riga.vp} VP{riga.per ? ' ciascuno' : ''}
                    </span>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Modale>
  );
}

export default RiepilogoMissione;
