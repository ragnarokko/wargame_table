import { useTavolo } from '../../contexts/TavoloContext';
import { useTracker } from '../../contexts/TrackerContext';
import { DISPOSIZIONI } from '../../config/missioni';
import { idLayout } from '../../utils/layoutTavolo';
import styles from './SelettoreLayout.module.css';

// Sceglie il layout ufficiale (coppia di disposizioni + variante 1-3): il disegno sul tavolo lo fa LayoutTavolo.
function SelettoreLayout() {
  const { selezioneLayout, impostaSelezioneLayout, mostraQuote, alternaQuote, mostraCentro, alternaCentro } = useTavolo();
  const { stato: tracker } = useTracker();
  const { giocatore1, giocatore2, numeroLayout } = selezioneLayout;

  // Riporta qui le disposizioni scelte nel tracker (Blu = Giocatore 1, Rosso = Giocatore 2): servono se nel
  // frattempo sono state cambiate a mano da questo pannello. Quelle non ancora scelte nel tracker non si toccano.
  const codice = (id) => DISPOSIZIONI.find((d) => d.id === id)?.codice ?? '';
  const daTracker = {
    giocatore1: codice(tracker.giocatori.blu.disposizione),
    giocatore2: codice(tracker.giocatori.rosso.disposizione),
  };
  const aggiornaDaTracker = () => {
    const patch = {};
    if (daTracker.giocatore1) patch.giocatore1 = daTracker.giocatore1;
    if (daTracker.giocatore2) patch.giocatore2 = daTracker.giocatore2;
    if (Object.keys(patch).length > 0) impostaSelezioneLayout(patch);
  };
  const scelto = Boolean(giocatore1 && giocatore2 && numeroLayout);
  const errore = scelto && !idLayout(giocatore1, giocatore2, numeroLayout) ? 'Layout non disponibile per questa combinazione' : null;

  return (
    <div className={styles.pannello}>
      <div className={styles.titolo}>
        <h3>Force disposition</h3>
        <button
          type="button"
          className={styles.aggiorna}
          onClick={aggiornaDaTracker}
          disabled={!daTracker.giocatore1 && !daTracker.giocatore2}
          title="Aggiorna dal tracker: riporta qui le disposizioni di forze scelte per Blu (Giocatore 1) e Rosso (Giocatore 2)"
          aria-label="Aggiorna dal tracker"
        >
          ⟳
        </button>
      </div>

      {/* Le disposizioni si scelgono di norma dal tracker (che le riporta qui): a tendina, chiuse di default. */}
      <details className={styles.disposizioni}>
        <summary>Giocatore 1 e 2</summary>
        <label>
          Giocatore 1
          <select value={giocatore1} onChange={(e) => impostaSelezioneLayout({ giocatore1: e.target.value })}>
            <option value="">Seleziona...</option>
            {DISPOSIZIONI.map((fd) => (
              <option key={fd.codice} value={fd.codice}>
                {fd.nome}
              </option>
            ))}
          </select>
        </label>

        <label>
          Giocatore 2
          <select value={giocatore2} onChange={(e) => impostaSelezioneLayout({ giocatore2: e.target.value })}>
            <option value="">Seleziona...</option>
            {DISPOSIZIONI.map((fd) => (
              <option key={fd.codice} value={fd.codice}>
                {fd.nome}
              </option>
            ))}
          </select>
        </label>
      </details>

      <div className={styles.riga}>
        <label className={styles.layout}>
          Layout
          <select value={numeroLayout} onChange={(e) => impostaSelezioneLayout({ numeroLayout: e.target.value })}>
            <option value="">-</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </label>

        <label className={styles.spunta}>
          <input type="checkbox" checked={mostraQuote} onChange={alternaQuote} />
          Quote/icone (V)
        </label>

        <label className={styles.spunta} title="Cerchi di 3&quot; e 6&quot; attorno al centro del tavolo (Centre Ground)">
          <input type="checkbox" checked={mostraCentro} onChange={alternaCentro} />
          Centro
        </label>
      </div>

      {errore && <div className={styles.errore}>{errore}</div>}
    </div>
  );
}

export default SelettoreLayout;
