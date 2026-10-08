import styles from './CreazioneEsercito.module.css';

// Elenco di abilità lunghe o di fazione: solo il nome, con la descrizione completa che si apre/chiude
// con la freccia (<details> nativo). Non mostra nulla senza abilità.
function AbilitaEstese({ abilita }) {
  if (!abilita || abilita.length === 0) return null;
  return (
    <div className={styles.abilitaEstese}>
      {abilita.map((a) => (
        <details key={a.nome}>
          <summary>{a.nome}</summary>
          <p>{a.descrizione}</p>
        </details>
      ))}
    </div>
  );
}

export default AbilitaEstese;
