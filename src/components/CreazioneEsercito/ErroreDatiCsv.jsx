import { useEffect, useState } from 'react';
import Modale from '../Modale/Modale';
import { erroreCaricamentoUnita, useVersioneDatiCsv } from './csvUnitaImport';
import { erroreCaricamentoArmi, useVersioneDatiArmi } from './csvArmiImport';
import { nomiFileDati } from '../../config/datiCsv';
import styles from './ErroreDatiCsv.module.css';

// Popup automatico per gli errori di caricamento di info.csv/Datasheets_wargear.csv, sia al primo
// avvio (l'useEffect in CreazioneEsercito.jsx ignora l'errore in silenzio, per non bloccare
// l'app) sia da "Aggiorna dati" (che finora mostrava solo "⚠ Errore, riprova" sul pulsante,
// senza alcun dettaglio sul perché). Si riapre da sola ad ogni nuovo errore, anche se l'utente
// aveva chiuso il popup di un errore precedente.
function ErroreDatiCsv() {
  useVersioneDatiCsv();
  useVersioneDatiArmi();
  const erroreUnita = erroreCaricamentoUnita();
  const erroreArmi = erroreCaricamentoArmi();
  const errori = [
    erroreUnita && { file: nomiFileDati().info, messaggio: erroreUnita.message },
    erroreArmi && { file: nomiFileDati().armi, messaggio: erroreArmi.message },
  ].filter(Boolean);
  const chiaveErrori = errori.map((e) => `${e.file}:${e.messaggio}`).join('|');

  const [chiuso, setChiuso] = useState(false);
  useEffect(() => {
    setChiuso(false);
  }, [chiaveErrori]);

  if (errori.length === 0 || chiuso) return null;

  return (
    <Modale titolo="Errore caricamento dati" aperto onChiudi={() => setChiuso(true)}>
      <p className={styles.paragrafo}>
        Uno o più file CSV non sono stati letti correttamente. I dati dell'ultimo caricamento
        riuscito (se presenti) restano quelli in uso.
      </p>
      <ul className={styles.lista}>
        {errori.map((e) => (
          <li key={e.file} className={styles.voce}>
            <strong>{e.file}</strong>: {e.messaggio}
          </li>
        ))}
      </ul>
    </Modale>
  );
}

export default ErroreDatiCsv;
