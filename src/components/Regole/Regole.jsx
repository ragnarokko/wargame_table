import { useMemo, useState } from 'react';
import { GRUPPI_FAZIONI, PARTI_REGOLE, URL_FAZIONI, URL_REGOLE } from '../../config/regole';
import Modale from '../Modale/Modale';
import styles from './Regole.module.css';

const normalizza = (testo) =>
  testo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const urlSezione = (id) => `${URL_REGOLE}#${id}`;

const SCHEDE = [
  ['generali', 'Regole generali'],
  ['eserciti', 'Eserciti'],
];

// Elenco delle fazioni di Warhammer 40,000, raggruppate come su Wahapedia, ognuna con il link alla sua pagina.
function ElencoEserciti() {
  return GRUPPI_FAZIONI.map((gruppo) => (
    <section key={gruppo.titolo} className={styles.parte}>
      <h4>{gruppo.titolo}</h4>
      <div className={styles.fazioni}>
        {gruppo.fazioni.map(([nome, slug]) => (
          <a key={slug} href={`${URL_FAZIONI}${slug}/`} target="_blank" rel="noopener noreferrer">
            {nome}
          </a>
        ))}
      </div>
    </section>
  ));
}

// Tasto "Regole": finestra con due linguette. "Regole generali": indice delle Core Rules (parti → capitoli →
// sezioni) e una ricerca sui titoli (inglesi e italiani). "Eserciti": le pagine delle fazioni su Wahapedia.
// Non contiene testo delle regole: ogni voce apre la pagina esatta di Wahapedia in una nuova scheda.
function Regole() {
  const [aperto, setAperto] = useState(false);
  const [ricerca, setRicerca] = useState('');
  const [scheda, setScheda] = useState('generali');

  // Applica il filtro: un capitolo che corrisponde mostra tutte le sue sezioni, altrimenti solo quelle
  // che corrispondono. Le parti senza risultati spariscono.
  const parti = useMemo(() => {
    const q = normalizza(ricerca.trim());
    if (!q) return PARTI_REGOLE.map((p) => ({ ...p, capitoli: p.capitoli.map((c) => ({ ...c, mostra: c.sezioni })) }));
    return PARTI_REGOLE.map((parte) => ({
      ...parte,
      capitoli: parte.capitoli
        .map((c) => {
          const capitoloTrovato = normalizza(`${c.numero} ${c.titolo} ${c.it}`).includes(q);
          const mostra = capitoloTrovato ? c.sezioni : c.sezioni.filter(([, titolo]) => normalizza(titolo).includes(q));
          return capitoloTrovato || mostra.length > 0 ? { ...c, mostra } : null;
        })
        .filter(Boolean),
    })).filter((parte) => parte.capitoli.length > 0);
  }, [ricerca]);

  const primoRisultato = parti[0]?.capitoli[0];

  const chiudi = () => {
    setAperto(false);
    setRicerca('');
  };

  const onKeyDown = (e) => {
    if (e.key !== 'Enter' || !primoRisultato) return;
    window.open(urlSezione(primoRisultato.id), '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <button type="button" className={styles.pulsante} onClick={() => setAperto(true)}>
        📖 Regole
      </button>
      <Modale titolo="Regole (Core Rules 11a ed.)" aperto={aperto} onChiudi={chiudi}>
        <div className={styles.linguette} role="tablist">
          {SCHEDE.map(([id, etichetta]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={scheda === id}
              className={`${styles.linguetta} ${scheda === id ? styles.linguettaAttiva : ''}`}
              onClick={() => setScheda(id)}
            >
              {etichetta}
            </button>
          ))}
        </div>
        {scheda === 'eserciti' && <ElencoEserciti />}
        {scheda === 'generali' && (
          <input
            type="search"
            className={styles.ricerca}
            placeholder="Cerca un capitolo o una sezione (anche in italiano)…"
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
          />
        )}
        {scheda === 'generali' && parti.length === 0 ? (
          <p className={styles.vuoto}>Nessun risultato.</p>
        ) : scheda === 'generali' ? (
          parti.map((parte) => (
            <section key={parte.titolo} className={styles.parte}>
              <h4>{parte.titolo}</h4>
              {parte.capitoli.map((c) => (
                <div key={c.id} className={styles.capitolo}>
                  <a href={urlSezione(c.id)} target="_blank" rel="noopener noreferrer" className={styles.titoloCapitolo}>
                    <span className={styles.numero}>{c.numero}</span> {c.titolo}
                    <span className={styles.it}> · {c.it}</span>
                  </a>
                  {c.mostra.length > 0 && (
                    <div className={styles.sezioni}>
                      {c.mostra.map(([id, titolo]) => (
                        <a key={id} href={urlSezione(id)} target="_blank" rel="noopener noreferrer">
                          {titolo}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          ))
        ) : null}
        <p className={styles.nota}>
          Le voci aprono la pagina su Wahapedia (
          <a href={scheda === 'eserciti' ? URL_FAZIONI : URL_REGOLE} target="_blank" rel="noopener noreferrer">
            {scheda === 'eserciti' ? 'Factions' : 'Core Rules'}
          </a>
          ); serve internet.
        </p>
      </Modale>
    </>
  );
}

export default Regole;
