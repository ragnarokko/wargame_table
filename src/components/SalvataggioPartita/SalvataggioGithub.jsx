import { useState } from 'react';
import {
  caricaDaGithub,
  elencaSalvataggi,
  ErroreGithub,
  NOME_REPO,
  salvaSuGithub,
  salvaToken,
  tokenSalvato,
  utenteDelToken,
} from '../../utils/githubSalvataggi';
import Modale from '../Modale/Modale';
import GuidaGithub from './GuidaGithub';
import styles from './SalvataggioGithub.module.css';

const CHIAVE_UTENTE = 'tavolo-github-utente';

function utenteSalvato() {
  try {
    return localStorage.getItem(CHIAVE_UTENTE) ?? '';
  } catch {
    return '';
  }
}

function salvaUtente(utente) {
  try {
    if (utente) localStorage.setItem(CHIAVE_UTENTE, utente);
    else localStorage.removeItem(CHIAVE_UTENTE);
  } catch {
    // vale solo finché la pagina resta aperta
  }
}

// Salva e carica la partita su GitHub (repo privato `wargame_wh_save`, cartella `savegames/`), accanto ai
// pulsanti su file locale. Chiede il token (fine-grained, solo quel repo) al primo uso e lo ricorda; la guida per
// crearlo è nella finestra di collegamento, riapribile col pulsante «?».
// `preparaSalvataggio()` restituisce { json, base }, `applicaSalvataggio(testo)` carica la partita (lancia se non valida).
function SalvataggioGithub({ preparaSalvataggio, applicaSalvataggio }) {
  const [token, setToken] = useState(tokenSalvato);
  const [utente, setUtente] = useState(utenteSalvato);
  const [finestra, setFinestra] = useState(null); // null | 'accesso' | 'carica'
  const [azionePendente, setAzionePendente] = useState(null); // 'salva' | 'carica' dopo l'accesso
  const [tokenDigitato, setTokenDigitato] = useState('');
  const [elenco, setElenco] = useState(null);
  const [occupato, setOccupato] = useState(false);
  const [messaggio, setMessaggio] = useState(null); // { testo, errore }

  const chiediAccesso = (azione, errore) => {
    setAzionePendente(azione);
    setTokenDigitato('');
    setMessaggio(errore ? { testo: errore, errore: true } : null);
    setFinestra('accesso');
  };

  const esegui = async (azione, tk, ut) => {
    setOccupato(true);
    setMessaggio(null);
    try {
      if (azione === 'salva') {
        const { json, base } = preparaSalvataggio();
        const nome = await salvaSuGithub(tk, ut, base, json);
        setMessaggio({ testo: `Salvato: ${nome}` });
      } else {
        setElenco(null);
        setFinestra('carica');
        setElenco(await elencaSalvataggi(tk, ut));
      }
    } catch (e) {
      if (e instanceof ErroreGithub && e.stato === 401) {
        salvaToken('');
        setToken('');
        chiediAccesso(azione, e.message);
      } else {
        setFinestra(null);
        setMessaggio({ testo: e.message, errore: true });
      }
    } finally {
      setOccupato(false);
    }
  };

  const avvia = (azione) => {
    if (token && utente) esegui(azione, token, utente);
    else chiediAccesso(azione);
  };

  const collega = async () => {
    const tk = tokenDigitato.trim();
    if (!tk) return;
    setOccupato(true);
    setMessaggio(null);
    try {
      const ut = await utenteDelToken(tk);
      salvaToken(tk);
      salvaUtente(ut);
      setToken(tk);
      setUtente(ut);
      setFinestra(null);
      setOccupato(false);
      if (azionePendente) await esegui(azionePendente, tk, ut);
    } catch (e) {
      setOccupato(false);
      setMessaggio({ testo: e.message, errore: true });
    }
  };

  const scollega = () => {
    salvaToken('');
    salvaUtente('');
    setToken('');
    setUtente('');
    setMessaggio(null);
  };

  const carica = async (nome) => {
    setOccupato(true);
    try {
      applicaSalvataggio(await caricaDaGithub(token, utente, nome));
      setFinestra(null);
      setMessaggio({ testo: `Caricato: ${nome}` });
    } catch (e) {
      setFinestra(null);
      setMessaggio({ testo: `Caricamento fallito: ${e.message}`, errore: true });
    } finally {
      setOccupato(false);
    }
  };

  return (
    <div className={styles.azioni}>
      <button
        onClick={() => avvia('salva')}
        disabled={occupato}
        title={`Salva la partita su GitHub (repo privato ${NOME_REPO})`}
      >
        ☁ GitHub Save
      </button>
      <button onClick={() => avvia('carica')} disabled={occupato} title="Carica una partita salvata su GitHub">
        ☁ GitHub Load
      </button>
      <button
        className={styles.guidaBtn}
        onClick={() => chiediAccesso(null)}
        title="Guida: come collegare GitHub"
        aria-label="Guida GitHub"
      >
        ?
      </button>
      {(utente || messaggio) && (
        <div className={styles.stato}>
          <span className={messaggio?.errore ? styles.errore : undefined}>
            {messaggio ? messaggio.testo : `GitHub: ${utente}`}
          </span>
          {utente && (
            <button type="button" onClick={scollega} title="Dimentica il token salvato in questo browser">
              Scollega
            </button>
          )}
        </div>
      )}

      {finestra === 'accesso' && (
        <Modale titolo="Collega GitHub" aperto onChiudi={() => setFinestra(null)}>
          <p className={styles.testo}>
            Le partite vengono salvate in <b>savegames/</b> del repo privato <b>{NOME_REPO}</b> del tuo account. Per
            collegarlo serve un token che veda solo quel repo:
          </p>
          <GuidaGithub />
          <input
            className={styles.campo}
            type="password"
            placeholder="github_pat_…"
            value={tokenDigitato}
            onChange={(e) => setTokenDigitato(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && collega()}
            autoFocus
          />
          {messaggio?.errore && <p className={`${styles.testo} ${styles.errore}`}>{messaggio.testo}</p>}
          <button type="button" onClick={collega} disabled={occupato || !tokenDigitato.trim()}>
            {occupato ? 'Verifica…' : 'Collega'}
          </button>
        </Modale>
      )}

      {finestra === 'carica' && (
        <Modale titolo={`Carica da GitHub — ${utente}`} aperto onChiudi={() => setFinestra(null)}>
          {elenco === null ? (
            <p className={styles.testo}>Carico l&apos;elenco…</p>
          ) : elenco.length === 0 ? (
            <p className={styles.testo}>Nessun salvataggio trovato su GitHub.</p>
          ) : (
            <ul className={styles.elenco}>
              {elenco.map((nome) => (
                <li key={nome}>
                  <button type="button" disabled={occupato} onClick={() => carica(nome)}>
                    {nome.replace(/\.json$/, '')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modale>
      )}
    </div>
  );
}

export default SalvataggioGithub;
