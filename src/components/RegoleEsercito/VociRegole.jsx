import { fasiStratagemma, tipoTurno } from './fasiStratagemmi';
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

// Voce del glossario di regole (src/config/regoleArmi.js): come Regola, con un link opzionale al testo
// ufficiale completo (quando la regola ha una sezione dedicata nelle Core Rules).
export function VoceGlossario({ nome, descrizione, link }) {
  return (
    <details className={styles.voce}>
      <summary>{nome}</summary>
      <Testo testo={descrizione} />
      {link && (
        <div className={styles.meta}>
          <a href={link} target="_blank" rel="noreferrer">
            Testo ufficiale completo ↗
          </a>
        </div>
      )}
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

// Colori dei turni e delle fasi nel sottotitolo degli stratagemmi (solo lo sfondo di quelle parole).
const COLORE_TURNO = [
  [/^your/i, 'blu'],
  [/^opponent/i, 'rosso'],
  [/^either/i, 'verde'],
];
const COLORE_FASE = {
  movement: 'blu',
  shooting: 'arancione',
  fight: 'rosso',
  any: 'verde',
  charge: 'viola',
  command: 'giallo',
};

function Etichetta({ colore, children }) {
  return <span className={`${styles.etichetta} ${colore ? styles[`colore_${colore}`] : ''}`}>{children}</span>;
}

// "Shooting or Fight phase" → due etichette colorate ("Shooting", "Fight phase") unite da "or".
function FasiColorate({ fase }) {
  const nomi = fase.replace(/\s*phase$/i, '').split(/\s+or\s+/i);
  return nomi.map((nome, i) => (
    <span key={nome}>
      {i > 0 && ' or '}
      <Etichetta colore={COLORE_FASE[nome.trim().toLowerCase()]}>{i === nomi.length - 1 ? `${nome} phase` : nome}</Etichetta>
    </span>
  ));
}

function SottotitoloStratagemma({ tipo, turno, fase }) {
  const coloreTurno = COLORE_TURNO.find(([regex]) => regex.test(turno))?.[1];
  const parti = [
    tipo && <span key="tipo">{tipo}</span>,
    turno && (
      <Etichetta key="turno" colore={coloreTurno}>
        {turno}
      </Etichetta>
    ),
    fase && <FasiColorate key="fase" fase={fase} />,
  ].filter(Boolean);
  return (
    <div className={styles.meta}>
      {parti.map((p, i) => (
        <span key={p.key}>
          {i > 0 && ' · '}
          {p}
        </span>
      ))}
    </div>
  );
}

// Pallino del turno: blu se è il turno del giocatore dell'esercito mostrato, rosso se è quello dell'avversario,
// verde se vale in entrambi (colori dei due eserciti: `colorePropria` e `coloreAvversario` sono 'blu' | 'rosso').
function PallinoTurno({ turno, colorePropria }) {
  const tipo = tipoTurno(turno);
  if (!tipo) return null;
  const coloreAvversario = colorePropria === 'blu' ? 'rosso' : 'blu';
  const colore = tipo === 'proprio' ? colorePropria : tipo === 'avversario' ? coloreAvversario : 'verde';
  const titolo = tipo === 'proprio' ? 'Nel tuo turno' : tipo === 'avversario' ? 'Nel turno avversario' : 'In qualsiasi turno';
  return <span className={`${styles.pallino} ${styles[`colore_${colore}`]}`} title={titolo} aria-label={titolo} />;
}

// `origine`: nome del distaccamento (o "Comune") mostrato sotto il nome quando l'elenco mescola più fonti.
export function Stratagemma({ stratagemma, colorePropria = 'blu', origine }) {
  const { nome, cp, tipo, turno, fase, descrizione } = stratagemma;
  const fasi = fasiStratagemma(fase);
  return (
    <details className={styles.voce}>
      <summary>
        <PallinoTurno turno={turno} colorePropria={colorePropria} />
        <span>{nome}</span>
        {fasi.length > 0 && (
          <span className={styles.simboli} title={fasi.map((f) => f.nome).join(' / ')}>
            {fasi.map((f) => (
              <span key={f.id}>{f.simbolo}</span>
            ))}
          </span>
        )}
        <span className={`${styles.chip} ${styles.chipDestra}`}>{cp} CP</span>
      </summary>
      {origine && <div className={styles.meta}>{origine}</div>}
      <SottotitoloStratagemma tipo={tipo} turno={turno} fase={fase} />
      <Testo testo={descrizione} />
    </details>
  );
}
