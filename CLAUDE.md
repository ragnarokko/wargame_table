# Tavolo da Gioco — panoramica progetto

App React (Vite) per gestire una partita su tavolo da gioco (wargame tipo Warhammer 40k): tavolo di dimensioni reali con area di staging, basette (miniature) trascinabili, misura delle distanze in pollici, elementi scenici e libreria di basette importabile/esportabile.

Architettura modulare: ogni funzionalità è un componente indipendente in `src/components/<Nome>/`, con JSX + CSS module propri. Obiettivo: poter modificare un modulo senza impattare gli altri.

## Struttura cartelle

```
src/
  contexts/       stato condiviso (Context API)
  hooks/          hook riusabili
  utils/          funzioni pure (conversioni, id)
  components/     un componente = una funzionalità = una cartella
```

### Moduli in `src/components/`

| Cartella | Cosa fa |
|---|---|
| `AreaLavoro/` | Contenitore principale: monta `Staging` + `Tavolo` come sfondo visivo e sopra un livello interattivo assoluto dove vengono renderizzate `Basetta` ed `ElementoScenico`. Possiede il `containerRef` usato come sistema di coordinate condiviso per il drag & drop. |
| `Tavolo/` | Solo visuale: rettangolo del tavolo di gioco (bordo, sfondo immagine stretchato, etichetta dimensioni). Nessuna logica interattiva. |
| `Staging/` | Solo visuale: area tratteggiata che circonda il tavolo, dove si preparano le basette prima di schierarle. |
| `Basetta/` | Miniatura trascinabile. Gestisce drag (via `useDraggable`), calcolo distanza percorsa quando il movimento avviene interamente sul tavolo, hover+Ctrl per mostrare `BasettaTooltip`, doppio click per rimuovere. |
| `BasettaTooltip/` | Popup con immagine + statistiche del template, mostrato da `Basetta`. |
| `MisuraDistanza/` | Piccolo badge che mostra l'ultima distanza percorsa (in pollici), renderizzato da `Basetta`. |
| `ElementoScenico/` | `ElementoScenico.jsx`: elemento scenico trascinabile sul campo (drag via `useDraggable`, doppio click per rimuovere). `GestioneElementiScenici.jsx`: pannello laterale con lista/form per aggiungere, modificare (nome, forma, dimensioni, colore) e rimuovere elementi scenici. |
| `LibreriaBasette/` | `LibreriaBasette.jsx`: pannello laterale con elenco basette in libreria, azioni schiera/modifica/rimuovi, export/import JSON. `BasettaForm.jsx`: form di creazione/modifica template basetta. |
| `CaricaSfondo/` | Pannello laterale: form dimensioni tavolo (pollici) + upload immagine di sfondo. |
| `PannelloLaterale/` | Compone la sidebar: `CaricaSfondo` + `LibreriaBasette` + `GestioneElementiScenici`. |

## Comunicazione tra moduli

Stato condiviso via **Context API**, tre provider indipendenti montati in `App.jsx` (`TavoloProvider` > `LibreriaProvider` > `TavoloStateProvider`):

- **`TavoloContext`** (`src/contexts/TavoloContext.jsx`) — dimensioni tavolo (pollici), immagine di sfondo, scala fissa `PX_PER_POLLICE = 14`, rettangoli calcolati (`tavoloRect`, `campoGiocoPx`, `margineStagingPx`), helper `puntoNelTavolo(x, y)`. È la fonte di verità per la conversione px↔pollici: cambiare dimensioni o sfondo ricalcola tutto automaticamente (il tavolo è sempre stirato a `larghezza*scala × altezza*scala`, indipendentemente dalla risoluzione dell'immagine caricata).
- **`LibreriaContext`** (`src/contexts/LibreriaContext.jsx`) — array di template basette (CRUD + `esportaJSON`/`importaJSON`). Un template = forma/dimensione/colore/immagine/statistiche di un "tipo" di basetta, non un'istanza sul campo.
- **`TavoloStateContext`** (`src/contexts/TavoloStateContext.jsx`) — istanze posizionate: `istanze` (basette effettivamente sul campo, con `templateId`, posizione `x/y` in px relativi al `containerRef` di `AreaLavoro`, `zona: 'staging'|'tavolo'`, `ultimaDistanza`) ed `elementiScenici`.

Punto di ingresso di ogni modulo: il componente principale della cartella (stesso nome del folder) importa solo gli hook `useTavolo()` / `useLibreria()` / `useTavoloState()` di cui ha bisogno — non riceve quasi nulla via props tranne `containerRef` (passato da `AreaLavoro` a `Basetta`/`ElementoScenico` per calcolare posizioni relative durante il drag) e i dati dell'istanza/template correnti (`istanza`, `template`, `elemento`).

Il drag & drop è centralizzato nell'hook `src/hooks/useDraggable.js`: dato un `containerRef` e una `posizione {x,y}`, gestisce Pointer Events e restituisce `posizioneVisualizzata`, `handlers`, `inTrascinamento`. Sia `Basetta` che `ElementoScenico` lo usano; la logica di business (calcolo distanza, cambio zona) resta nel componente chiamante tramite il callback `onSposta`.

## Convenzioni

- **Naming**: componenti e variabili in italiano (`Basetta`, `schieraBasetta`, `puntoNelTavolo`), coerente col dominio dell'app. File componente `NomeComponente.jsx` + `NomeComponente.module.css` nella stessa cartella (PascalCase per entrambi).
- **Stile CSS**: CSS Modules (`*.module.css`), variabili colore globali in `src/index.css` (`:root { --colore-*, --radius }`). Nessuna libreria UI esterna.
- **Stato**: solo Context API + `useState`/`useCallback` locali, nessun Redux/Zustand. Ogni context espone hook `useXxx()` che lancia errore se usato fuori dal proprio Provider.
- **Unità di misura**: le posizioni/dimensioni a runtime sono sempre in **px** (coordinate del `containerRef`), le dimensioni "di dominio" (tavolo, elementi scenici) sono in **pollici**, le basette in **mm**. Conversioni centralizzate in `src/utils/scala.js` (`polliciAPx`, `pxAPollici`, `mmAPx`) e `src/utils/basetta.js` (`calcolaDimensioniBasettaPx`).
- **Librerie**: React 19 + Vite, nessuna dipendenza aggiuntiva (drag & drop implementato a mano con Pointer Events, niente `react-dnd`/simili).
- **ID**: `crypto.randomUUID()` via `src/utils/id.js`.

## Stato attuale

**Modulo 1 — Mappa e Basette: completo e funzionante.**
Testato manualmente: ridimensionamento tavolo, upload sfondo, drag & drop basette (staging↔tavolo e movimento sul tavolo), calcolo distanza, tooltip Ctrl+hover, form aggiungi/modifica basetta, gestione elementi scenici, export libreria JSON.

Per avviare: `npm run dev` (Vite, porta 5173).

## Moduli futuri previsti

_(da compilare man mano che si aggiungono nuovi moduli)_
