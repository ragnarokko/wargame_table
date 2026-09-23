import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import styles from './GestioneElementiScenici.module.css';

function GestioneElementiScenici() {
  const { elementiScenici, aggiungiElementoScenico, modificaElementoScenico, rimuoviElementoScenico } =
    useTavoloState();
  const { tavoloRect } = useTavolo();

  const handleAggiungi = () => {
    aggiungiElementoScenico({
      x: tavoloRect.left + tavoloRect.width / 2,
      y: tavoloRect.top + tavoloRect.height / 2,
    });
  };

  return (
    <div className={styles.pannello}>
      <div className={styles.intestazione}>
        <h3>Elementi scenici</h3>
        <button onClick={handleAggiungi}>+ Aggiungi</button>
      </div>

      <ul className={styles.lista}>
        {elementiScenici.map((el) => (
          <li key={el.id} className={styles.riga}>
            <input
              className={styles.nomeInput}
              value={el.nome}
              onChange={(e) => modificaElementoScenico(el.id, { nome: e.target.value })}
            />
            <select
              value={el.forma}
              onChange={(e) => modificaElementoScenico(el.id, { forma: e.target.value })}
            >
              <option value="rettangolare">Rettangolare</option>
              <option value="ovale">Ovale</option>
            </select>
            <input
              type="number"
              min="0.5"
              step="0.5"
              className={styles.numeroInput}
              title="Larghezza (pollici)"
              value={el.larghezzaPollici}
              onChange={(e) => modificaElementoScenico(el.id, { larghezzaPollici: Number(e.target.value) })}
            />
            <input
              type="number"
              min="0.5"
              step="0.5"
              className={styles.numeroInput}
              title="Profondità (pollici)"
              value={el.altezzaPollici}
              onChange={(e) => modificaElementoScenico(el.id, { altezzaPollici: Number(e.target.value) })}
            />
            <input
              type="color"
              value={el.colore}
              onChange={(e) => modificaElementoScenico(el.id, { colore: e.target.value })}
            />
            <button className={styles.rimuoviBtn} onClick={() => rimuoviElementoScenico(el.id)} title="Rimuovi">
              ✕
            </button>
          </li>
        ))}
        {elementiScenici.length === 0 && <li className={styles.vuoto}>Nessun elemento scenico</li>}
      </ul>
    </div>
  );
}

export default GestioneElementiScenici;
