import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { COLORE_ESERCITO } from '../../config/eserciti';
import Modale from '../Modale/Modale';
import styles from './Distrutti.module.css';

// Per ogni unità dell'esercito con almeno un modello perso: modelli persi sui modelli iniziali (quelli con cui è
// stata creata) e punti in proporzione. Perso = non più sul campo (cancellato con Canc) o grigio (tasto R).
function perditeEsercito(esercitoId, basette, istanze) {
  const perdite = [];
  for (const unita of basette) {
    if (unita.esercito !== esercitoId) continue;
    const iniziali = Number(unita.numeroModelli) || 0;
    if (!iniziali) continue;
    const attivi = istanze.filter((i) => i.templateId === unita.id && !i.morta).length;
    const persi = Math.min(iniziali, Math.max(0, iniziali - attivi));
    if (persi === 0) continue;
    const punti = Number(unita.punti) || 0;
    perdite.push({
      id: unita.id,
      nome: unita.nome,
      colore: unita.colore,
      persi,
      iniziali,
      punti: Math.round((punti * persi) / iniziali),
    });
  }
  return perdite;
}

function Riquadro({ titolo, esercitoId, perdite }) {
  const totale = perdite.reduce((somma, p) => somma + p.punti, 0);
  return (
    <section className={styles.riquadro} style={{ '--colore-esercito': COLORE_ESERCITO[esercitoId] }}>
      <h4 className={styles.titolo}>{titolo}</h4>
      {perdite.length === 0 ? (
        <p className={styles.vuoto}>Nessuna perdita.</p>
      ) : (
        <ul className={styles.elenco}>
          {perdite.map((p) => (
            <li key={p.id} className={p.persi === p.iniziali ? styles.distrutta : undefined}>
              <span className={styles.pallino} style={{ backgroundColor: p.colore }} />
              <span className={styles.nome}>{p.nome}</span>
              <span className={styles.numeri}>
                {p.persi}/{p.iniziali} mod.
                {p.punti > 0 ? ` · ${p.punti} pt` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      {totale > 0 && <div className={styles.totale}>Totale: {totale} pt</div>}
    </section>
  );
}

// Pulsante della fascia indicatori (accanto a Turno) che apre i due riquadri "Distrutti blu" / "Distrutti rossi":
// i modelli di ciascun esercito non più sul campo. Il popup è montato su document.body, perché la fascia sta
// dentro l'area di lavoro, che viene ruotata e zoomata (un elemento `fixed` lì dentro ne seguirebbe la trasformazione).
function PulsanteDistrutti() {
  const [aperto, setAperto] = useState(false);
  const { basette } = useLibreria();
  const { istanze } = useTavoloState();

  return (
    <>
      <button
        type="button"
        className={styles.pulsante}
        onClick={() => setAperto(true)}
        title="Modelli distrutti di Blu e Rosso (cancellati con Canc o grigi con R)"
      >
        ☠
      </button>
      {aperto &&
        createPortal(
          <Modale titolo="Distrutti" aperto onChiudi={() => setAperto(false)}>
            <div className={styles.riquadri}>
              <Riquadro titolo="Distrutti blu" esercitoId="blu" perdite={perditeEsercito('blu', basette, istanze)} />
              <Riquadro titolo="Distrutti rossi" esercitoId="rosso" perdite={perditeEsercito('rosso', basette, istanze)} />
            </div>
          </Modale>,
          document.body,
        )}
    </>
  );
}

export default PulsanteDistrutti;
