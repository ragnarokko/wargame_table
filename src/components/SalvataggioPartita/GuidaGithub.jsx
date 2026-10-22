import { NOME_REPO, URL_NUOVO_REPO, URL_NUOVO_TOKEN } from '../../utils/githubSalvataggi';
import styles from './SalvataggioGithub.module.css';

// Guida passo-passo per collegare GitHub ai salvataggi (usata dalla finestra di collegamento e da ℹ Info e dati).
function GuidaGithub() {
  return (
    <ol className={styles.guida}>
      <li>
        Crea il repo <b>{NOME_REPO}</b> sul tuo account, <b>privato</b>:{' '}
        <a href={URL_NUOVO_REPO} target="_blank" rel="noreferrer">
          apri la pagina di creazione
        </a>{' '}
        (il nome è già compilato; non servono README né altre opzioni) e premi &quot;Create repository&quot;. Se esiste già, salta
        questo passo.
      </li>
      <li>
        Crea il token:{' '}
        <a href={URL_NUOVO_TOKEN} target="_blank" rel="noreferrer">
          apri la pagina dei token
        </a>
        . Controlla che sia un token <b>fine-grained</b>, scegli una scadenza (ad es. 90 giorni) e in &quot;Repository
        access&quot; seleziona <b>Only select repositories</b> → <b>{NOME_REPO}</b>.
      </li>
      <li>
        In &quot;Permissions&quot; → &quot;Repository permissions&quot; imposta <b>Contents</b> su <b>Read and write</b> (Metadata resta
        in sola lettura da solo) e premi &quot;Generate token&quot;.
      </li>
      <li>
        Copia il token (inizia con <code>github_pat_</code>, GitHub lo mostra una volta sola) e incollalo nel campo qui
        sotto. Resta solo in questo browser; &quot;Scollega&quot; lo dimentica. Scaduto il token, ripeti dal passo 2.
      </li>
    </ol>
  );
}

export default GuidaGithub;
