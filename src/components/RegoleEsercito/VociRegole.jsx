import styles from './RegoleEsercito.module.css';

// Etichette in testa ai capoversi degli stratagemmi ("WHEN: …"), messe in grassetto.
const ETICHETTA = /^(WHEN|TARGET|EFFECT|RESTRICTIONS|RESTRICTION|COST):\s*/;

// Testo di regole: ¶ separa i capoversi (vedi csvRegoleEsercito.js); nei testi in riga unica degli elenchi puntati
// (abilità d'esercito) i " • " vanno a capo.
export function Testo({ testo }) {
  const capoversi = String(testo ?? '')
    .split(/¶|\s(?=•\s)/)
    .map((c) => c.trim())
    .filter(Boolean);
  return (
    <div className={styles.testo}>
      {capoversi.map((c, i) => {
        const etichetta = c.match(ETICHETTA);
        return (
          <p key={i}>
            {etichetta ? <b>{etichetta[1]}: </b> : null}
            {etichetta ? c.slice(etichetta[0].length) : c}
          </p>
        );
      })}
    </div>
  );
}

// Gruppo con titolo che si apre e chiude (<details>), con un conteggio accanto al titolo.
export function Sezione({ titolo, conteggio, aperta = false, children }) {
  return (
    <details className={styles.sezione} open={aperta || undefined}>
      <summary>
        {titolo}
        {conteggio !== undefined && <span className={styles.conteggio}>{conteggio}</span>}
      </summary>
      <div className={styles.sezioneCorpo}>{children}</div>
    </details>
  );
}

// Regola o abilità: nome che apre la descrizione.
export function Regola({ nome, descrizione, aperta = false }) {
  return (
    <details className={styles.voce} open={aperta || undefined}>
      <summary>{nome}</summary>
      <Testo testo={descrizione} />
    </details>
  );
}

export function Potenziamento({ potenziamento }) {
  return (
    <details className={styles.voce}>
      <summary>
        {potenziamento.nome}
        {potenziamento.costo && <span className={styles.chip}>{potenziamento.costo} pt</span>}
      </summary>
      {potenziamento.restrizione && <div className={styles.meta}>{potenziamento.restrizione}</div>}
      <Testo testo={potenziamento.descrizione} />
    </details>
  );
}

export function Stratagemma({ stratagemma }) {
  const { nome, cp, tipo, turno, fase, descrizione } = stratagemma;
  return (
    <details className={styles.voce}>
      <summary>
        {nome}
        <span className={styles.chip}>{cp} CP</span>
      </summary>
      <div className={styles.meta}>{[tipo, turno, fase].filter(Boolean).join(' · ')}</div>
      <Testo testo={descrizione} />
    </details>
  );
}
