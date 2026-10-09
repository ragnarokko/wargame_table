import { LIMITI_VP } from '../../config/missioni';
import { useTracker } from '../../contexts/TrackerContext';
import { totaliGiocatore } from '../../utils/trackerPunti';
import styles from './TrackerPartita.module.css';

const GIOCATORI = [
  { id: 'blu', nome: 'Blu' },
  { id: 'rosso', nome: 'Rosso' },
];
const ROUND = Array.from({ length: LIMITI_VP.round }, (_, i) => i + 1);

// Statistica fissa in fondo al tracker: per ogni round i punti delle primarie e delle secondarie di
// ciascun giocatore (le secondarie con il tetto di round), più i totali con i tetti complessivi.
function StatisticheTracker() {
  const { stato } = useTracker();
  const dati = GIOCATORI.map(({ id }) => {
    const g = stato.giocatori[id];
    const totali = totaliGiocatore(g);
    return {
      id,
      totali,
      primaria: (round) => g.primaria[round] || 0,
      secondaria: (round) => Math.min(totali.secondariaPerRound[round] || 0, LIMITI_VP.secondariaRound),
    };
  });

  return (
    <div className={styles.statistiche}>
      <table>
        <thead>
          <tr>
            <th rowSpan={2}>Round</th>
            {GIOCATORI.map((g) => (
              <th key={g.id} colSpan={2} className={g.id === 'blu' ? styles.colBlu : styles.colRosso}>
                {g.nome}
              </th>
            ))}
          </tr>
          <tr>
            {GIOCATORI.map((g) => (
              <ThPrimSec key={g.id} />
            ))}
          </tr>
        </thead>
        <tbody>
          {ROUND.map((round) => (
            <tr key={round} className={round === stato.round && !stato.finita ? styles.roundCorrente : ''}>
              <td>{round}</td>
              {dati.map((d) => (
                <CelleRound key={d.id} primaria={d.primaria(round)} secondaria={d.secondaria(round)} />
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Tot.</td>
            {dati.map((d) => (
              <CelleRound key={d.id} primaria={d.totali.primaria} secondaria={d.totali.secondaria} />
            ))}
          </tr>
          <tr>
            <td>VP</td>
            {dati.map((d) => (
              <td key={d.id} colSpan={2} className={styles.totaleRiga}>
                {d.totali.totale}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ThPrimSec() {
  return (
    <>
      <th title="Punti primarie">PRI</th>
      <th title="Punti secondarie">SEC</th>
    </>
  );
}

function CelleRound({ primaria, secondaria }) {
  return (
    <>
      <td className={primaria ? '' : styles.zero}>{primaria}</td>
      <td className={secondaria ? '' : styles.zero}>{secondaria}</td>
    </>
  );
}

export default StatisticheTracker;
