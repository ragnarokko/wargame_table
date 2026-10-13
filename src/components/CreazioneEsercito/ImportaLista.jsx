import { useMemo, useState } from 'react';
import Modale from '../Modale/Modale';
import { datiCsvCaricati, useVersioneDatiCsv } from './csvUnitaImport';
import { useVersioneDatiArmyBuilder } from './csvArmyBuilderImport';
import { riconosciLista } from './riconoscimentoLista';
import styles from './ImportaLista.module.css';

const ESEMPIO = `Xenos - Leagues of Votann - Mercenary Oathband

Einhyr Champion (65pts)

3x Brôkhyr Thunderkyn (80pts)
10x Hernkyn Yaegirs (90pts)`;

// Finestra per incollare una lista fatta con New Recruit (o altri builder): le unità riconosciute si
// mostrano subito sotto il testo e "Importa" le crea nell'esercito scelto (onImporta riceve
// [{ unita, modelli }], con `unita` = riga di info.csv).
function ImportaLista({ aperto, nomeEsercito, onImporta, onChiudi }) {
  const [testo, setTesto] = useState('');
  const versioneCsv = useVersioneDatiCsv();
  const versioneArmyBuilder = useVersioneDatiArmyBuilder();
  // La versione dei dati non è letta qui dentro ma fa ricalcolare il riconoscimento quando i CSV arrivano.
  const risultato = useMemo(
    () => (testo.trim() ? riconosciLista(testo) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [testo, versioneCsv, versioneArmyBuilder],
  );
  const riconosciute = risultato?.righe.filter((r) => r.unita) ?? [];
  const nonRiconosciute = risultato?.righe.filter((r) => !r.unita) ?? [];

  const chiudi = () => {
    setTesto('');
    onChiudi();
  };

  const importa = () => {
    onImporta(riconosciute.map((r) => ({ unita: r.unita, modelli: r.modelli })));
    chiudi();
  };

  return (
    <Modale titolo={`Importa lista — ${nomeEsercito}`} aperto={aperto} onChiudi={chiudi}>
      <p className={styles.testo}>
        Incolla qui il testo esportato da New Recruit (o da un altro builder). Vengono lette fazione, nomi e numero di
        modelli di ogni unità; i punti scritti nella lista si ignorano e si usano quelli dei dati.
      </p>
      <textarea
        className={styles.area}
        rows="9"
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        placeholder={ESEMPIO}
        spellCheck={false}
        autoFocus
      />

      {!datiCsvCaricati() && <p className={styles.nota}>Caricamento dati CSV…</p>}
      {risultato && datiCsvCaricati() && (
        <div className={styles.risultato}>
          {risultato.fazione && (
            <div className={styles.fazione}>
              Fazione: <strong>{risultato.fazione}</strong>
            </div>
          )}
          {risultato.righe.length === 0 && (
            <p className={styles.nota}>Nessuna riga di unità riconosciuta (cerco righe tipo «3x Nome (80pts)»).</p>
          )}
          <ul className={styles.elenco}>
            {risultato.righe.map((r, i) => (
              <li key={i} className={r.unita ? styles.ok : styles.ko}>
                <span className={styles.segno}>{r.unita ? '✓' : '✗'}</span>
                <span className={styles.numero}>{r.modelli}×</span>
                <span className={styles.nome}>
                  {r.unita ? r.unita.nome : r.nome}
                  {r.unita && r.unita.nome.toLowerCase() !== r.nome.toLowerCase() && (
                    <span className={styles.dettaglio}>
                      {' '}
                      ← «{r.nome}»{r.approssimata ? ' (nome simile)' : ''}
                    </span>
                  )}
                  {!r.unita && <span className={styles.dettaglio}> non trovata nei dati</span>}
                  {r.unita && risultato.fazione && r.unita.fazione !== risultato.fazione && (
                    <span className={styles.dettaglio}> ({r.unita.fazione})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.azioni}>
        <button type="button" onClick={importa} disabled={riconosciute.length === 0}>
          {riconosciute.length > 0
            ? `Importa ${riconosciute.length} unità${nonRiconosciute.length ? ` (${nonRiconosciute.length} non trovate saltate)` : ''}`
            : 'Importa'}
        </button>
        <button type="button" onClick={chiudi}>
          Annulla
        </button>
      </div>
    </Modale>
  );
}

export default ImportaLista;
