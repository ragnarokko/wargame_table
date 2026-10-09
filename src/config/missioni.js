// Missioni primarie e secondarie di Warhammer 40,000 11a edizione (carte GDM 2026) per il tracker.
// File GENERATO da uno script di estrazione: contiene solo punteggi (VP) e condizioni riassunte in
// italiano, non il testo delle carte. Modificabile a mano; i nomi delle missioni restano in inglese.
//
// Formato di una riga di punteggio: { t: condizione, vp, per?, cum?, alt? }
//   per: "per ogni ..." (contatore, vp ciascuno); cum: bonus cumulativo sulla riga precedente (con
//   `per` si conta al massimo quanti sono stati contati nella riga principale); alt: alternativa alla
//   riga precedente (se ne sceglie una sola, di solito la versione più alta).
// Una sezione vale per i round `round: [da, a]` oppure per `'fine'` (punti di fine battaglia, 5° round);
// `cap` limita i VP segnati in un evento. Le missioni primarie dipendono dalla coppia di disposizioni
// (la tua `disposizione` e quella dell'avversario `contro`).

// `codice` è quello usato da SelettoreLayout per trovare l'immagine del layout.
export const DISPOSIZIONI = [
  { id: 'take-and-hold', codice: 'th', nome: 'Take and Hold' },
  { id: 'purge-the-foe', codice: 'pf', nome: 'Purge the Foe' },
  { id: 'reconnaissance', codice: 're', nome: 'Reconnaissance' },
  { id: 'priority-assets', codice: 'pa', nome: 'Priority Assets' },
  { id: 'disruption', codice: 'di', nome: 'Disruption' },
];

// Limiti di punteggio (come nel tracker di riferimento): tetto per round e totale, per primarie e secondarie.
export const LIMITI_VP = {
  primariaRound: 15,
  primariaTotale: 45,
  secondariaRound: 15,
  secondariaTotale: 45,
  // Secondarie fisse da scegliere in fase di setup (le secondarie in gioco non hanno limite).
  secondarieFisse: 2,
  round: 5,
};

export const MISSIONI_PRIMARIE = [
  {
    id: "battlefield-dominance",
    nome: "Battlefield Dominance",
    disposizione: "take-and-hold",
    contro: "take-and-hold",
    sezioni: [
      {
        round: [1, 2],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli più obiettivi dell'avversario.", vp: 2 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Per ogni obiettivo che controlli.", vp: 3, per: true },
          { t: "Per ognuno di quegli obiettivi (escluso il tuo di casa) se controlli il tuo obiettivo di casa.", vp: 2, per: true, cum: true },
        ],
      },
    ],
  },
  {
    id: "immovable-object",
    nome: "Immovable Object",
    disposizione: "take-and-hold",
    contro: "purge-the-foe",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli almeno un obiettivo centrale.", vp: 3 },
        ],
      },
      {
        round: [2, 4],
        momento: "Fine della tua fase di comando",
        righe: [
          { t: "Per ogni obiettivo che controlli (escluso il tuo obiettivo di casa).", vp: 5, per: true },
        ],
      },
      {
        round: [5, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Per ogni obiettivo che controlli (escluso il tuo obiettivo di casa).", vp: 5, per: true },
        ],
      },
    ],
  },
  {
    id: "purge-and-secure",
    nome: "Purge and Secure",
    disposizione: "take-and-hold",
    contro: "reconnaissance",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Una o più unità nemiche distrutte in questo turno da una tua unità in portata di un obiettivo.", vp: 3 },
          { t: "Una o più unità nemiche distrutte che a inizio turno erano in portata di un obiettivo.", vp: 3, alt: true },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Per ogni obiettivo che controlli (escluso il tuo obiettivo di casa).", vp: 4, per: true },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli almeno un obiettivo che a inizio turno non controllavi (escluso il tuo di casa).", vp: 3 },
        ],
      },
    ],
  },
  {
    id: "inescapable-dominion",
    nome: "Inescapable Dominion",
    disposizione: "take-and-hold",
    contro: "priority-assets",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli tre o più obiettivi.", vp: 4 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli due o più obiettivi.", vp: 5 },
          { t: "Controlli più obiettivi dell'avversario.", vp: 4 },
        ],
      },
      {
        round: "fine",
        righe: [
          { t: "Controlli l'obiettivo di casa avversario.", vp: 5 },
        ],
      },
    ],
  },
  {
    id: "determined-acquisition",
    nome: "Determined Acquisition",
    disposizione: "take-and-hold",
    contro: "disruption",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Per ogni obiettivo che controlli e che a inizio turno non controllavi (escluso il tuo di casa).", vp: 2, per: true },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Per ogni obiettivo che controlli.", vp: 3, per: true },
          { t: "Per ognuno di quegli obiettivi che è nel territorio avversario.", vp: 3, per: true, cum: true },
        ],
      },
    ],
  },
  {
    id: "unstoppable-force",
    nome: "Unstoppable Force",
    disposizione: "purge-the-foe",
    contro: "take-and-hold",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Una o più unità nemiche distrutte in questo turno.", vp: 3 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Per ogni obiettivo che controlli (escluso il tuo obiettivo di casa).", vp: 4, per: true },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli almeno un obiettivo che a inizio turno non controllavi (escluso il tuo di casa).", vp: 3 },
        ],
      },
      {
        round: "fine",
        righe: [
          { t: "Controlli almeno un obiettivo centrale.", vp: 5 },
        ],
      },
    ],
  },
  {
    id: "meatgrinder",
    nome: "Meatgrinder",
    disposizione: "purge-the-foe",
    contro: "purge-the-foe",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Una o più unità nemiche distrutte in questo turno.", vp: 3 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "In questo turno sono state distrutte più unità nemiche di quante tue unità siano state distrutte nel turno precedente.", vp: 5 },
          { t: "Controlli l'obiettivo di casa avversario.", vp: 5 },
        ],
      },
    ],
  },
  {
    id: "consecrate",
    nome: "Consecrate",
    disposizione: "purge-the-foe",
    contro: "reconnaissance",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Uno o due obiettivi consacrati (consecrated).", vp: 3 },
          { t: "Tre o più obiettivi consacrati (consecrated).", vp: 6, alt: true },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
          { t: "Controlli più obiettivi dell'avversario.", vp: 4 },
        ],
      },
      {
        round: "fine",
        righe: [
          { t: "L'obiettivo di casa avversario è consacrato (consecrated).", vp: 5 },
        ],
      },
    ],
    nota: "Ogni unità che distrugge un'unità diventa consacratrice: a fine turno può consacrare un obiettivo in portata (escluso il tuo di casa) piazzando un tuo segnalino operazione.",
  },
  {
    id: "destroyers-wrath",
    nome: "Destroyer's Wrath",
    disposizione: "purge-the-foe",
    contro: "priority-assets",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Una o più unità nemiche distrutte in questo turno.", vp: 3 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
          { t: "Controlli più obiettivi dell'avversario.", vp: 6 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "In questo turno sono state distrutte più unità nemiche di quante tue unità siano state distrutte nel turno precedente.", vp: 4 },
        ],
      },
    ],
  },
  {
    id: "punishment",
    nome: "Punishment",
    disposizione: "purge-the-foe",
    contro: "disruption",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine di un turno (di chiunque)",
        righe: [
          { t: "Una o più unità nemiche condannate (condemned) hanno lasciato il campo in questo turno.", vp: 5 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
          { t: "Controlli più obiettivi dell'avversario.", vp: 5 },
        ],
      },
      {
        round: "fine",
        righe: [
          { t: "Controlli l'obiettivo di casa avversario.", vp: 8 },
        ],
      },
    ],
    nota: "A inizio turno scegli da 1 a 3 unità nemiche (in portata di obiettivi e/o che hanno distrutto tue unità): sono condannate (condemned) fino al tuo turno successivo.",
  },
  {
    id: "reconnaissance-sweep",
    nome: "Reconnaissance Sweep",
    disposizione: "reconnaissance",
    contro: "take-and-hold",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Tre o più tue unità interamente in tre quarti diversi del tavolo e a più di 6\" dal centro.", vp: 3 },
          { t: "Quattro o più tue unità interamente in quattro quarti diversi del tavolo e a più di 6\" dal centro.", vp: 6, alt: true },
        ],
      },
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Per ogni unità nemica distrutta in questo turno.", vp: 1, per: true },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 3 },
        ],
      },
    ],
  },
  {
    id: "triangulation",
    nome: "Triangulation",
    disposizione: "reconnaissance",
    contro: "purge-the-foe",
    sezioni: [
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Un obiettivo triangolato (triangulated).", vp: 3 },
          { t: "Due obiettivi triangolati (triangulated).", vp: 6, alt: true },
          { t: "Tre o più obiettivi triangolati (triangulated).", vp: 10, alt: true },
        ],
      },
      {
        round: "fine",
        righe: [
          { t: "Controlli quattro o più obiettivi.", vp: 10 },
        ],
      },
    ],
  },
  {
    id: "gather-intel",
    nome: "Gather Intel",
    disposizione: "reconnaissance",
    contro: "reconnaissance",
    sezioni: [
      {
        round: [1, 1],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli almeno un obiettivo centrale.", vp: 6 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Per ogni tua unità che ha completato l'azione Extract Intelligence in questo turno.", vp: 7, per: true },
        ],
      },
      {
        round: "fine",
        righe: [
          { t: "Tre o più tuoi segnalini operazione sul campo.", vp: 5 },
          { t: "Un tuo segnalino operazione è in portata dell'obiettivo di casa avversario.", vp: 5 },
        ],
      },
    ],
  },
  {
    id: "search-and-scour",
    nome: "Search and Scour",
    disposizione: "reconnaissance",
    contro: "priority-assets",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli almeno un obiettivo centrale.", vp: 3 },
          { t: "Una o più unità nemiche che a inizio turno erano in un'area di terreno sono state distrutte.", vp: 2 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Per ogni obiettivo che controlli (escluso il tuo obiettivo di casa).", vp: 4, per: true },
        ],
      },
      {
        round: "fine",
        righe: [
          { t: "Nessuna unità nemica interamente nel tuo territorio.", vp: 5 },
        ],
      },
    ],
  },
  {
    id: "surveil-the-foe",
    nome: "Surveil the Foe",
    disposizione: "reconnaissance",
    contro: "disruption",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Una o più unità nemiche tracciate (surveilled) in questo turno, salvo che ognuna sia in portata di obiettivi con segnalini operazione in portata.", vp: 4 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
          { t: "Controlli più obiettivi dell'avversario.", vp: 4 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Nessun segnalino operazione avversario sul campo.", vp: 5 },
        ],
      },
    ],
    nota: "Quando una tua unità finisce un movimento in portata di un obiettivo con segnalini operazione avversari, rimuovi quei segnalini.",
  },
  {
    id: "secure-asset",
    nome: "Secure Asset",
    disposizione: "priority-assets",
    contro: "take-and-hold",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Una tua unità ha messo in sicurezza il bene (secure the asset) in questo turno.", vp: 4 },
          { t: "Una o più unità nemiche distrutte che a inizio turno erano in portata di un obiettivo centrale.", vp: 2 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
          { t: "Controlli tre o più obiettivi.", vp: 4 },
        ],
      },
    ],
  },
  {
    id: "vital-link",
    nome: "Vital Link",
    disposizione: "priority-assets",
    contro: "purge-the-foe",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli almeno un obiettivo centrale.", vp: 2 },
          { t: "Per ogni tuo segnalino operazione in portata di uno di quegli obiettivi.", vp: 1, per: true, cum: true },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
          { t: "Uno o più di quegli obiettivi è un obiettivo centrale.", vp: 4, cum: true },
        ],
      },
      {
        round: "fine",
        righe: [
          { t: "Controlli l'obiettivo di casa avversario.", vp: 10 },
        ],
      },
    ],
  },
  {
    id: "vanguard-operation",
    nome: "Vanguard Operation",
    disposizione: "priority-assets",
    contro: "reconnaissance",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Una tua unità ha eseguito una vanguard operation in questo turno.", vp: 4 },
          { t: "Una o più unità nemiche distrutte in questo turno.", vp: 2 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
        ],
      },
      {
        round: "fine",
        righe: [
          { t: "Controlli l'obiettivo di casa avversario.", vp: 10 },
        ],
      },
    ],
  },
  {
    id: "sabotage",
    nome: "Sabotage",
    disposizione: "priority-assets",
    contro: "priority-assets",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Per ogni tua unità che ha commesso sabotaggio in questo turno.", vp: 3, per: true },
          { t: "Per ognuna di quelle unità in portata di un obiettivo nel territorio avversario.", vp: 2, per: true, cum: true },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
        ],
      },
    ],
  },
  {
    id: "extract-relic",
    nome: "Extract Relic",
    disposizione: "priority-assets",
    contro: "disruption",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Una tua unità ha eseguito una sensor sweep in questo turno.", vp: 4 },
          { t: "Una o più unità nemiche distrutte che a inizio turno erano in portata di un obiettivo.", vp: 3 },
          { t: "Un solo segnalino operazione avversario sul campo, con una tua unità nella stessa area di terreno e nessuna unità nemica in quell'area.", vp: 4 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
        ],
      },
      {
        round: "fine",
        righe: [
          { t: "Un solo segnalino operazione avversario sul campo, con una tua unità nella stessa area di terreno e nessuna unità nemica in quell'area.", vp: 5 },
        ],
      },
    ],
  },
  {
    id: "death-trap",
    nome: "Death Trap",
    disposizione: "disruption",
    contro: "take-and-hold",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Per ogni area di terreno intrappolata (trapped) in questo turno.", vp: 2, per: true },
          { t: "Per ognuna di quelle aree di terreno che è un obiettivo.", vp: 3, per: true, cum: true },
        ],
      },
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Una o più unità nemiche che a inizio turno erano in un'area di terreno intrappolata (trapped) sono state distrutte.", vp: 3 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
        ],
      },
    ],
  },
  {
    id: "delaying-action",
    nome: "Delaying Action",
    disposizione: "disruption",
    contro: "purge-the-foe",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Per ogni unità nemica distrutta in questo turno.", vp: 2, per: true },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (esclusi gli obiettivi di casa).", vp: 4 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli almeno un obiettivo centrale e almeno uno di espansione.", vp: 3 },
        ],
      },
    ],
  },
  {
    id: "smoke-and-mirrors",
    nome: "Smoke and Mirrors",
    disposizione: "disruption",
    contro: "reconnaissance",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Per ogni obiettivo con esca (decoyed).", vp: 2, per: true },
          { t: "Per ognuno di quegli obiettivi che è nel territorio avversario.", vp: 2, per: true, cum: true },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
        ],
      },
      {
        round: "fine",
        righe: [
          { t: "Quattro o più obiettivi con esca (decoyed).", vp: 10 },
        ],
      },
    ],
  },
  {
    id: "locate-and-deny",
    nome: "Locate and Deny",
    disposizione: "disruption",
    contro: "priority-assets",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Una o più unità nemiche distrutte che a inizio turno erano in portata di un obiettivo.", vp: 4 },
          { t: "Un solo tuo segnalino operazione sul campo, con una tua unità nella stessa area di terreno e nessuna unità nemica in quell'area.", vp: 4 },
        ],
      },
      {
        round: [2, 5],
        momento: "Fine della tua fase di comando (nel 5° round, a fine turno)",
        righe: [
          { t: "Controlli almeno un obiettivo (escluso il tuo obiettivo di casa).", vp: 4 },
        ],
      },
      {
        round: "fine",
        righe: [
          { t: "Un solo tuo segnalino operazione sul campo, con una tua unità nella stessa area di terreno e nessuna unità nemica in quell'area.", vp: 5 },
        ],
      },
    ],
    nota: "A inizio battaglia scegli 5 aree di terreno fuori dalla tua zona di schieramento e piazza in ognuna un tuo segnalino operazione.",
  },
  {
    id: "outmanoeuvre",
    nome: "Outmanoeuvre",
    disposizione: "disruption",
    contro: "disruption",
    sezioni: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli l'obiettivo di casa avversario.", vp: 10 },
        ],
      },
      {
        round: [1, 1],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Per ogni obiettivo che controlli (escluso il tuo obiettivo di casa).", vp: 4, per: true },
        ],
      },
      {
        round: [2, 3],
        momento: "Fine della tua fase di comando",
        righe: [
          { t: "Per ogni obiettivo che controlli (escluso il tuo obiettivo di casa).", vp: 5, per: true },
        ],
      },
      {
        round: [4, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Per ogni obiettivo che controlli (escluso il tuo obiettivo di casa).", vp: 6, per: true },
        ],
      },
    ],
  },
];

export const MISSIONI_SECONDARIE = [
  {
    id: "a-grievous-blow",
    nome: "A Grievous Blow",
    fissabile: true,
    sezioniFissa: [
      {
        round: [1, 5],
        momento: "Fine di un turno (di chiunque)",
        righe: [
          { t: "Per ogni unità nemica con consistenza iniziale 13+ distrutta in questo turno.", vp: 4, per: true },
        ],
      },
    ],
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine di un turno (di chiunque)",
        righe: [
          { t: "Una o più unità nemiche con consistenza iniziale 13+ distrutte in questo turno.", vp: 5 },
        ],
      },
    ],
  },
  {
    id: "a-tempting-target",
    nome: "A Tempting Target",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli il tuo bersaglio allettante (tempting target).", vp: 5 },
        ],
      },
    ],
  },
  {
    id: "assassination",
    nome: "Assassination",
    fissabile: true,
    sezioniFissa: [
      {
        round: [1, 5],
        momento: "Mentre la carta è attiva",
        righe: [
          { t: "Per ogni modello PERSONAGGIO nemico distrutto in questo turno.", vp: 3, per: true },
          { t: "Per ognuno di quei modelli con Ferite 4+.", vp: 1, per: true, cum: true },
        ],
      },
    ],
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del turno di uno dei due",
        righe: [
          { t: "Uno o più modelli PERSONAGGIO nemici distrutti in questo turno.", vp: 5 },
          { t: "Tutti i PERSONAGGI nemici sono stati distrutti durante la battaglia.", vp: 5, alt: true },
        ],
      },
    ],
  },
  {
    id: "beacon",
    nome: "Beacon",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del turno avversario o fine del 5° round (il primo dei due)",
        righe: [
          { t: "La tua unità beacon è sul campo e fuori dalla tua zona di schieramento.", vp: 3 },
          { t: "La tua unità beacon è sul campo e fuori dal tuo territorio.", vp: 5, alt: true },
        ],
      },
    ],
  },
  {
    id: "behind-enemy-lines",
    nome: "Behind Enemy Lines",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        cap: 5,
        righe: [
          { t: "Per ogni tua unità (esclusi VELIVOLI e unità in battle-shock) interamente nella zona di schieramento avversaria.", vp: 3, per: true },
        ],
      },
    ],
  },
  {
    id: "bring-it-down",
    nome: "Bring It Down",
    fissabile: true,
    sezioniFissa: [
      {
        round: [1, 5],
        momento: "Fine di un turno (di chiunque)",
        righe: [
          { t: "Per ogni modello nemico con Ferite 10+ distrutto in questo turno.", vp: 4, per: true },
        ],
      },
    ],
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine di un turno (di chiunque)",
        righe: [
          { t: "Uno o più modelli nemici con Ferite 10+ distrutti in questo turno.", vp: 5 },
        ],
      },
    ],
  },
  {
    id: "burden-of-trust",
    nome: "Burden of Trust",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del turno avversario o fine del 5° round (il primo dei due)",
        cap: 5,
        righe: [
          { t: "Per ogni obiettivo sorvegliato (guarded) dal tuo esercito.", vp: 2, per: true },
        ],
      },
    ],
  },
  {
    id: "centre-ground",
    nome: "Centre Ground",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Una o più tue unità (esclusi VELIVOLI e battle-shock) entro 3\" dal centro del campo e nessuna unità nemica entro 3\".", vp: 3 },
          { t: "Una o più tue unità (esclusi VELIVOLI e battle-shock) entro 3\" dal centro del campo e nessuna unità nemica entro 6\".", vp: 5, alt: true },
        ],
      },
    ],
  },
  {
    id: "cleanse",
    nome: "Cleanse",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Un obiettivo purificato (cleansed) dal tuo esercito in questo turno.", vp: 2 },
          { t: "Due o più obiettivi purificati (cleansed) dal tuo esercito in questo turno.", vp: 5, alt: true },
        ],
      },
    ],
    nota: "Richiede l'azione Cleanse (tua fase di tiro).",
  },
  {
    id: "defend-stronghold",
    nome: "Defend Stronghold",
    fissabile: false,
    sezioniTattica: [
      {
        round: [2, 5],
        momento: "Fine del turno avversario o fine del 5° round (il primo dei due)",
        righe: [
          { t: "Controlli il tuo obiettivo di casa.", vp: 3 },
          { t: "Nessuna unità nemica nella tua zona di schieramento.", vp: 2, cum: true },
        ],
      },
    ],
  },
  {
    id: "display-of-might",
    nome: "Display of Might",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Più tue unità che nemiche (esclusi VELIVOLI e battle-shock) interamente in No Man's Land.", vp: 2 },
        ],
      },
      {
        round: [1, 5],
        momento: "Fine del turno avversario",
        righe: [
          { t: "Più tue unità che nemiche (esclusi VELIVOLI e battle-shock) interamente in No Man's Land.", vp: 5 },
        ],
      },
    ],
  },
  {
    id: "engage-on-all-fronts",
    nome: "Engage on All Fronts",
    fissabile: true,
    sezioniFissa: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Hai presenza in tre quarti del tavolo.", vp: 2 },
          { t: "Hai presenza in quattro quarti del tavolo.", vp: 4, alt: true },
        ],
      },
    ],
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Hai presenza in tre quarti del tavolo.", vp: 3 },
          { t: "Hai presenza in quattro quarti del tavolo.", vp: 5, alt: true },
        ],
      },
    ],
  },
  {
    id: "forward-position",
    nome: "Forward Position",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli l'obiettivo di casa avversario e/o ogni obiettivo di espansione.", vp: 5 },
        ],
      },
    ],
  },
  {
    id: "no-prisoners",
    nome: "No Prisoners",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine di un turno (di chiunque)",
        cap: 5,
        righe: [
          { t: "Per ogni unità nemica distrutta in questo turno.", vp: 2, per: true },
        ],
      },
    ],
  },
  {
    id: "outflank",
    nome: "Outflank",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Una o più tue unità (esclusi VELIVOLI e battle-shock) entro 6\" da un bordo del campo e fuori dal tuo territorio.", vp: 3 },
          { t: "Due o più tue unità (esclusi VELIVOLI e battle-shock) entro 6\" da bordi opposti e almeno una fuori dal tuo territorio.", vp: 5, alt: true },
        ],
      },
    ],
  },
  {
    id: "overwhelming-force",
    nome: "Overwhelming Force",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine di un turno (di chiunque)",
        cap: 5,
        righe: [
          { t: "Per ogni unità nemica distrutta che a inizio turno era in portata di un obiettivo.", vp: 3, per: true },
        ],
      },
    ],
  },
  {
    id: "plunder",
    nome: "Plunder",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Un'area di terreno è stata saccheggiata (plundered) in questo turno.", vp: 5 },
        ],
      },
    ],
    nota: "Richiede l'azione Plunder (tua fase di tiro).",
  },
  {
    id: "secure-no-man-s-land",
    nome: "Secure No Man's Land",
    fissabile: false,
    sezioniTattica: [
      {
        round: [1, 5],
        momento: "Fine del tuo turno",
        righe: [
          { t: "Controlli due o più obiettivi in No Man's Land (escluso il tuo di casa).", vp: 5 },
        ],
      },
    ],
  },
];

export function missionePrimaria(disposizione, contro) {
  return MISSIONI_PRIMARIE.find((m) => m.disposizione === disposizione && m.contro === contro) ?? null;
}

export function missioneSecondaria(id) {
  return MISSIONI_SECONDARIE.find((m) => m.id === id) ?? null;
}
