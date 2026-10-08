import { useState } from 'react';
import Modale from '../Modale/Modale';
import {
  SET_DATI_DISPONIBILI,
  URL_REPO_BSDATA_PREDEFINITO,
  comandoAggiornamentoBsdata,
  impostaRepoBsdata,
  impostaSetDati,
  ripristinaRepoBsdata,
  useImpostazioniDati,
} from '../../config/datiCsv';
import styles from './Impostazioni.module.css';

// Rotella in alto a sinistra: apre (via Modale) le impostazioni dei dati — quale coppia di CSV usare
// (tradizionali o BSData, scelta singola, applicata dal tasto "⟳ Aggiorna dati") e l'indirizzo GitHub
// della repo BSData, che finisce nel comando di aggiornamento (--repo) dello script del calcolatore.
// Le scelte sono salvate in localStorage (config/datiCsv.js).
function Impostazioni() {
  const [aperto, setAperto] = useState(false);
  const [inModifica, setInModifica] = useState(false);
  const [bozza, setBozza] = useState('');
  const [errore, setErrore] = useState('');
  const [copiato, setCopiato] = useState(false);
  const { set, repoBsdata } = useImpostazioniDati();
  const comando = comandoAggiornamentoBsdata(repoBsdata);

  const chiudi = () => {
    setAperto(false);
    setInModifica(false);
    setErrore('');
  };

  const iniziaModifica = () => {
    setBozza(repoBsdata);
    setErrore('');
    setInModifica(true);
  };

  const salva = () => {
    if (!impostaRepoBsdata(bozza)) {
      setErrore('Indirizzo non valido: serve un indirizzo di repo GitHub, es. https://github.com/BSData/wh40k-11e');
      return;
    }
    setInModifica(false);
    setErrore('');
  };

  const copiaComando = async () => {
    try {
      await navigator.clipboard.writeText(comando);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 1500);
    } catch {
      // Appunti non disponibili: il comando resta comunque selezionabile a mano.
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.rotella}
        onClick={() => setAperto(true)}
        title="Impostazioni"
        aria-label="Impostazioni"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      <Modale titolo="Impostazioni" aperto={aperto} onChiudi={chiudi}>
        <div className={styles.sezione}>
          <h4 className={styles.sezioneTitolo}>Dati di unità e armi</h4>
          <div className={styles.scelte} role="radiogroup" aria-label="Dati di unità e armi">
            {Object.entries(SET_DATI_DISPONIBILI).map(([chiave, dati]) => (
              <label key={chiave} className={`${styles.scelta} ${set === chiave ? styles.sceltaAttiva : ''}`}>
                <input
                  type="radio"
                  name="set-dati"
                  checked={set === chiave}
                  onChange={() => impostaSetDati(chiave)}
                />
                <span>
                  <strong>{dati.etichetta}</strong>
                  <span className={styles.file}>
                    {dati.info} + {dati.armi}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className={styles.nota}>
            La scelta viene applicata premendo <strong>⟳ Aggiorna dati</strong> in fondo al menù laterale
            (anche nelle finestre «Botte!» già aperte).
          </p>
        </div>

        <div className={styles.sezione}>
          <h4 className={styles.sezioneTitolo}>GitHub che ospita i dati BSData</h4>
          {inModifica ? (
            <>
              <input
                type="url"
                className={styles.campo}
                value={bozza}
                onChange={(e) => setBozza(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') salva();
                }}
                autoFocus
                spellCheck={false}
              />
              {errore && <p className={styles.errore}>{errore}</p>}
              <div className={styles.azioni}>
                <button type="button" onClick={salva}>
                  Salva
                </button>
                <button type="button" className={styles.secondario} onClick={() => setInModifica(false)}>
                  Annulla
                </button>
              </div>
            </>
          ) : (
            <div className={styles.rigaUrl}>
              <a className={styles.url} href={repoBsdata} target="_blank" rel="noreferrer">
                {repoBsdata}
              </a>
              <button type="button" className={styles.secondario} onClick={iniziaModifica}>
                ✎ Edit
              </button>
            </div>
          )}
          {!inModifica && repoBsdata !== URL_REPO_BSDATA_PREDEFINITO && (
            <button type="button" className={styles.link} onClick={ripristinaRepoBsdata}>
              Ripristina l'indirizzo predefinito
            </button>
          )}
          <p className={styles.nota}>
            Se BSData sposta la repo, cambia l'indirizzo qui: il comando sotto punta alla nuova repo e lo
            script se la ricorda.
          </p>
        </div>

        <div className={styles.sezione}>
          <h4 className={styles.sezioneTitolo}>Aggiornare i CSV BSData da GitHub</h4>
          <p className={styles.nota} style={{ marginTop: 0 }}>
            Nella cartella del repo del calcolatore (<code>D:\Claude\sito_dadi</code>) lancia:
          </p>
          <div className={styles.rigaUrl} style={{ marginTop: 6 }}>
            <code className={styles.url}>{comando}</code>
            <button type="button" className={styles.secondario} onClick={copiaComando}>
              {copiato ? '✓ Copiato' : 'Copia'}
            </button>
          </div>
          <p className={styles.nota}>
            Poi commit e push dei file, e <strong>⟳ Aggiorna dati</strong>. Tutti i passaggi sono in ❓ Aiuto.
          </p>
        </div>
      </Modale>
    </>
  );
}

export default Impostazioni;
