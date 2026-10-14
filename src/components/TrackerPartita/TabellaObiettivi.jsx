import { useMemo } from 'react';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { useTracker } from '../../contexts/TrackerContext';
import { useLayoutCorrente } from '../../hooks/useLayoutCorrente';
import { ocPerObiettivo } from '../../utils/controlloObiettivi';
import styles from './TrackerPartita.module.css';

// OC dei due eserciti su ogni obiettivo del layout scelto in "Force disposition": somma degli OC dei
// modelli la cui basetta tocca l'area di terreno dell'obiettivo (vedi utils/controlloObiettivi.js).
// Si aggiorna mentre si spostano le basette; chi ha più OC è in evidenza. Senza un layout scelto non compare.
const NOME_BASE = { blu: 'Base blu', rosso: 'Base rossa' };
const NOME_TIPO = { central: 'Centrale', expansion: 'Espansione' };

function TabellaObiettivi() {
  const layout = useLayoutCorrente();
  const { tavoloRect, pxPerPollice } = useTavolo();
  const { basette } = useLibreria();
  const { istanze } = useTavoloState();
  const { stato } = useTracker();

  const righe = useMemo(
    () => (layout ? ocPerObiettivo(layout, istanze, basette, tavoloRect, pxPerPollice) : []),
    [layout, istanze, basette, tavoloRect, pxPerPollice],
  );
  if (!layout) return null;

  const attaccante = stato.attaccante === 'rosso' ? 'rosso' : 'blu';
  const difensore = attaccante === 'blu' ? 'rosso' : 'blu';

  return (
    <div className={styles.tabellaObiettivi}>
      <table>
        <caption>OC sugli obiettivi</caption>
        <thead>
          <tr>
            <th>Obiettivo</th>
            <th className={styles.colBlu}>Blu</th>
            <th className={styles.colRosso}>Rosso</th>
          </tr>
        </thead>
        <tbody>
          {layout.obiettivi.map((obiettivo, i) => {
            const { blu, rosso } = righe[i] ?? { blu: 0, rosso: 0 };
            const proprietario = obiettivo.proprietario === 'attaccante' ? attaccante : obiettivo.proprietario ? difensore : null;
            return (
              <tr key={obiettivo.numero}>
                <td className={styles.nomeObiettivo}>
                  {obiettivo.tipo === 'home' ? (
                    <span className={proprietario === 'blu' ? styles.testoBlu : styles.testoRosso}>{NOME_BASE[proprietario]}</span>
                  ) : (
                    `${NOME_TIPO[obiettivo.tipo]} ${obiettivo.numero}`
                  )}
                </td>
                <td className={blu > rosso ? styles.ocPrevale : blu === 0 ? styles.zero : ''}>{blu}</td>
                <td className={rosso > blu ? styles.ocPrevale : rosso === 0 ? styles.zero : ''}>{rosso}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TabellaObiettivi;
