import { useTavolo } from '../../contexts/TavoloContext';
import { DISPOSIZIONI } from '../../config/missioni';
import { idLayout } from '../../utils/layoutTavolo';
import styles from './SelettoreLayout.module.css';

// Sceglie il layout ufficiale (coppia di disposizioni + variante 1-3): il disegno sul tavolo lo fa LayoutTavolo.
function SelettoreLayout() {
  const { selezioneLayout, impostaSelezioneLayout, mostraQuote, alternaQuote } = useTavolo();
  const { giocatore1, giocatore2, numeroLayout } = selezioneLayout;
  const scelto = Boolean(giocatore1 && giocatore2 && numeroLayout);
  const errore = scelto && !idLayout(giocatore1, giocatore2, numeroLayout) ? 'Layout non disponibile per questa combinazione' : null;

  return (
    <div className={styles.pannello}>
      <h3>Force disposition</h3>

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

      <label>
        Layout
        <select value={numeroLayout} onChange={(e) => impostaSelezioneLayout({ numeroLayout: e.target.value })}>
          <option value="">Seleziona...</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </label>

      <label className={styles.spunta}>
        <input type="checkbox" checked={mostraQuote} onChange={alternaQuote} />
        Quote e icone di vista (V)
      </label>

      {errore && <div className={styles.errore}>{errore}</div>}
    </div>
  );
}

export default SelettoreLayout;
