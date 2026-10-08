import { useEffect, useRef, useState } from 'react';
import { EVENTO_EVIDENZIA_UNITA } from '../../utils/selezioneEventi';
import AbilitaEstese from './AbilitaEstese';
import styles from './CreazioneEsercito.module.css';

const CAMPI_STATISTICHE = [
  ['mov', 'MOV'],
  ['res', 'RES'],
  ['w', 'W'],
  ['ts', 'TS'],
  ['tsPiu', 'TS+'],
  ['oc', 'OC'],
  ['fnp', 'FNP'],
  ['range1', 'RANGE1'],
  ['range2', 'RANGE2'],
  ['range3', 'RANGE3'],
];

// Voce dell'accordion per una singola unità: il nome, al passaggio del mouse, evidenzia
// tutte le basette sul campo appartenenti a questa unità (stesso templateId) e, al click, le
// seleziona (onSeleziona); la freccia a sinistra apre/chiude i dettagli.
function UnitaListItem({ unita, numeroModelli, mostrata, onSeleziona, onRimuovi, onRinomina }) {
  const [dettagliAperti, setDettagliAperti] = useState(false);
  const [rinominaAperta, setRinominaAperta] = useState(false);
  const [nuovoNome, setNuovoNome] = useState(unita.nome);
  const [evidenziataDalCampo, setEvidenziataDalCampo] = useState(false);
  const voceRef = useRef(null);

  // Doppio click sulla basetta sul campo (vedi CreazioneEsercito): apre i dettagli e porta la voce in
  // vista, scorrendo la lista (e la barra laterale) se serve. Il piccolo ritardo lascia il tempo
  // all'accordion di aprirsi e ai dettagli di prendere posto prima della misura.
  useEffect(() => {
    if (!mostrata) return undefined;
    setDettagliAperti(true);
    const timer = setTimeout(() => voceRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80);
    return () => clearTimeout(timer);
  }, [mostrata]);

  // Speculare all'evidenziazione lista→basette: l'hover su una basetta sul campo
  // (o su una sua "sorella" della stessa unità) evidenzia questa riga.
  useEffect(() => {
    const onEvidenzia = (e) => setEvidenziataDalCampo(e.detail.templateId === unita.id);
    window.addEventListener(EVENTO_EVIDENZIA_UNITA, onEvidenzia);
    return () => window.removeEventListener(EVENTO_EVIDENZIA_UNITA, onEvidenzia);
  }, [unita.id]);

  const evidenzia = () =>
    window.dispatchEvent(new CustomEvent(EVENTO_EVIDENZIA_UNITA, { detail: { templateId: unita.id } }));
  const spegniEvidenza = () =>
    window.dispatchEvent(new CustomEvent(EVENTO_EVIDENZIA_UNITA, { detail: { templateId: null } }));

  const apriRinomina = () => {
    setNuovoNome(unita.nome);
    setRinominaAperta(true);
  };

  const confermaRinomina = (e) => {
    e.preventDefault();
    onRinomina(nuovoNome);
    setRinominaAperta(false);
  };

  const statistiche = CAMPI_STATISTICHE.filter(([campo]) => unita[campo]);

  return (
    <li ref={voceRef} className={`${styles.unitaItem} ${mostrata ? styles.unitaMostrata : ''}`}>
      <div className={`${styles.riga} ${evidenziataDalCampo ? styles.rigaEvidenziata : ''}`}>
        <span className={styles.pallino} style={{ backgroundColor: unita.colore }} />
        {rinominaAperta ? (
          <form className={styles.rinominaForm} onSubmit={confermaRinomina}>
            <input
              className={styles.rinominaInput}
              value={nuovoNome}
              autoFocus
              onChange={(e) => setNuovoNome(e.target.value)}
              onBlur={confermaRinomina}
            />
          </form>
        ) : (
          <div className={styles.nomeUnita} onMouseEnter={evidenzia} onMouseLeave={spegniEvidenza}>
            <button
              type="button"
              className={styles.frecciaBtn}
              onClick={() => setDettagliAperti((v) => !v)}
              title="Mostra/nascondi i dettagli"
            >
              {dettagliAperti ? '▼' : '▶'}
            </button>
            <button
              type="button"
              className={styles.nomeBtn}
              onClick={onSeleziona}
              title="Clicca per selezionare le basette dell'unità sul tavolo (poi frecce, Q/W, ecc.); passa il mouse per evidenziarle"
            >
              <span className={styles.nomeTesto}>{unita.nome}</span>
            </button>
          </div>
        )}
        <span className={styles.contatore}>
          {numeroModelli} mod.
          {unita.punti > 0 ? ` · ${unita.punti} pt` : ''}
        </span>
        <div className={styles.azioni}>
          <button onClick={apriRinomina} title="Rinomina unità">
            ✎
          </button>
          <button onClick={onRimuovi} title="Rimuovi unità">
            ✕
          </button>
        </div>
      </div>

      {dettagliAperti && (
        <div className={styles.dettagliUnita}>
          {statistiche.length > 0 && (
            <div className={styles.statGriglia}>
              {statistiche.map(([campo, etichetta]) => (
                <div key={campo} className={styles.statVoce}>
                  <span className={styles.statEtichetta}>{etichetta}</span>
                  <span>{unita[campo]}</span>
                </div>
              ))}
            </div>
          )}
          {unita.note && <div className={styles.note}>{unita.note}</div>}
          <AbilitaEstese abilita={unita.abilitaEstese} />
          {statistiche.length === 0 && !unita.note && !unita.abilitaEstese?.length && (
            <div className={styles.vuoto}>Nessun dettaglio disponibile</div>
          )}
        </div>
      )}
    </li>
  );
}

export default UnitaListItem;
