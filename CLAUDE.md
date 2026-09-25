# Tavolo da Gioco — panoramica progetto

App React (Vite) per gestire una partita su tavolo da gioco (wargame tipo Warhammer 40k): tavolo di dimensioni reali con area di staging, basette (miniature) trascinabili, misura delle distanze in pollici, elementi scenici e libreria di basette importabile/esportabile.

Architettura modulare: ogni funzionalità è un componente indipendente in `src/components/<Nome>/`, con JSX + CSS module propri. Obiettivo: poter modificare un modulo senza impattare gli altri.

## Struttura cartelle

```
src/
  contexts/       stato condiviso (Context API)
  hooks/          hook riusabili
  utils/          funzioni pure (conversioni, id, eventi custom)
  config/         dati di configurazione statici (eserciti, dimensioni basette)
  components/     un componente = una funzionalità = una cartella
```

### Moduli in `src/components/`

| Cartella | Cosa fa |
|---|---|
| `AreaLavoro/` | Contenitore principale: monta `Staging` + `Tavolo` come sfondo visivo e sopra un livello interattivo assoluto dove vengono renderizzate `Basetta` ed `ElementoScenico`, oltre a `SelezioneMultipla` e `StrumentoRighello`. Possiede il `containerRef` usato come sistema di coordinate condiviso per il drag & drop, e gestisce la rotazione dell'intera area (tasti A/S, 90° per volta) passata come `rotazioneArea` ai figli. |
| `Tavolo/` | Solo visuale: rettangolo del tavolo di gioco (bordo, sfondo immagine stretchato, etichetta dimensioni). Nessuna logica interattiva. |
| `Staging/` | Solo visuale: area tratteggiata che circonda il tavolo, dove si preparano le basette prima di schierarle. |
| `Basetta/` | Miniatura trascinabile. Gestisce drag (via `useDraggable`), calcolo distanza percorsa quando il movimento avviene interamente sul tavolo, hover+Ctrl per mostrare `BasettaTooltip`, doppio click per rimuovere, rotazione con Q/E e selezione singola/multipla con trascinamento di gruppo (sincronizzate tra le istanze via eventi custom su `window`, vedi `src/utils/selezioneEventi.js`), evidenziazione al hover di un'unità nella lista eserciti (`CreazioneEsercito`). |
| `BasettaTooltip/` | Popup con immagine + statistiche del template, mostrato da `Basetta`. |
| `MisuraDistanza/` | Piccolo badge che mostra l'ultima distanza percorsa (in pollici), renderizzato da `Basetta`. |
| `SelezioneMultipla/` | Overlay invisibile su `AreaLavoro`: trascinamento per selezionare più basette con un rettangolo di gomma; emette l'evento `EVENTO_SELEZIONE_MULTIPLA` con gli id selezionati, consumato da ogni `Basetta`. |
| `StrumentoRighello/` | `StrumentoRighello.jsx`: overlay di misura libera tra due punti qualsiasi del tavolo (click-trascina, mostra la distanza in pollici), attivabile in alternativa alla selezione multipla. `PulsanteRighello.jsx`: pulsante toggle nel pannello laterale che ne controlla lo stato attivo/disattivo (stato tenuto in `App.jsx`). |
| `ElementoScenico/` | `ElementoScenico.jsx`: elemento scenico trascinabile sul campo (drag via `useDraggable`, doppio click per rimuovere). `GestioneElementiScenici.jsx`: pannello laterale con lista (righe editabili inline) ed elemento espandibile `NuovoElementoForm.jsx` per aggiungere nuovi elementi (forma, dimensioni, nome, colore). |
| `LibreriaBasette/` | `LibreriaBasette.jsx`: pannello laterale con elenco basette in libreria, azioni schiera/modifica/rimuovi, export/import JSON. `BasettaForm.jsx`: form compatto (riga con cascata forma→dimensione, dettagli avanzati espandibili) di creazione/modifica template basetta, avvolto in `PannelloEspandibile`. |
| `CreazioneEsercito/` | `CreazioneEsercito.jsx`: pannello laterale con selezione tra due eserciti (Blu/Rosso), creazione unità multi-modello e due liste ad accordion (una per esercito, via `PannelloEspandibile`) con le unità create. Riusa `Basetta`/`LibreriaContext` (ogni unità è un template esteso con `esercito`, `numeroModelli` e stat opzionali MOV/RES/W/TS/TS+/OC/FNP/RANGE1-3/NOTE) e `TavoloStateContext.schieraBasette` per posizionare automaticamente tutti i modelli in staging su una fila (1" tra i centri, ≥2" dalle altre unità già presenti). `UnitaForm.jsx`: form di creazione unità, con dimensioni basetta lette da `src/config/dimensioniBasette.js` (lista tonde/ovali facilmente estendibile) e colore di default preso da `src/utils/colori.js` (primo colore libero nella palette per l'esercito scelto). `UnitaListItem.jsx`: voce dell'accordion per una singola unità (nome/dettagli espandibili, rimuovi), evidenzia le basette corrispondenti sul campo al passaggio del mouse sul nome (evento `EVENTO_EVIDENZIA_UNITA`). |
| `PersistenzaEserciti/` | Sotto-componente montato da `CreazioneEsercito`: pulsanti per esportare/importare in JSON lo stato completo dei due eserciti (unità + istanze posizionate in staging/tavolo). Ogni export/import salva anche una copia in `localStorage`, ricaricata automaticamente all'avvio del sito se presente. |
| `CaricaSfondo/` | Pannello laterale: form dimensioni tavolo (pollici) + upload immagine di sfondo. |
| `SelettoreLayout/` | Pannello laterale "Force disposition": due select per i "codici" dei due giocatori + numero layout (1-3), risolve l'immagine di sfondo corrispondente tra gli asset in `src/assets/layouts/` (import.meta.glob) e la imposta via `TavoloContext.setSfondo`. |
| `PannelloEspandibile/` | Contenitore riutilizzabile generico (non legato a un dominio specifico): riga singola collassata con titolo + freccia (▶/▼), controllata dall'esterno (`aperto`/`onToggle`), che espande mostrando i `children` (un form o una lista) senza conoscerne la logica interna. Usato da `LibreriaBasette`, `GestioneElementiScenici`/`NuovoElementoForm` e `CreazioneEsercito` (accordion per esercito). |
| `PannelloLaterale/` | Compone la sidebar: `CaricaSfondo` + `SelettoreLayout` + `PulsanteRighello` + `CreazioneEsercito` + `LibreriaBasette` + `GestioneElementiScenici`. |

## Comunicazione tra moduli

Stato condiviso via **Context API**, tre provider indipendenti montati in `App.jsx` (`TavoloProvider` > `LibreriaProvider` > `TavoloStateProvider`):

- **`TavoloContext`** (`src/contexts/TavoloContext.jsx`) — dimensioni tavolo (pollici), immagine di sfondo, scala fissa `PX_PER_POLLICE = 14`, rettangoli calcolati (`tavoloRect`, `campoGiocoPx`, `margineStagingPx`), helper `puntoNelTavolo(x, y)`. È la fonte di verità per la conversione px↔pollici: cambiare dimensioni o sfondo ricalcola tutto automaticamente (il tavolo è sempre stirato a `larghezza*scala × altezza*scala`, indipendentemente dalla risoluzione dell'immagine caricata).
- **`LibreriaContext`** (`src/contexts/LibreriaContext.jsx`) — array di template basette (CRUD + `esportaJSON`/`importaJSON`, più `sostituisciUnitaEserciti` usato dall'import degli eserciti per rimpiazzare solo le basette con campo `esercito`). Un template = forma/dimensione/colore/immagine/statistiche di un "tipo" di basetta, non un'istanza sul campo.
- **`TavoloStateContext`** (`src/contexts/TavoloStateContext.jsx`) — istanze posizionate: `istanze` (basette effettivamente sul campo, con `templateId`, posizione `x/y` in px relativi al `containerRef` di `AreaLavoro`, `zona: 'staging'|'tavolo'`, `ultimaDistanza`) ed `elementiScenici`. Espone anche `impostaIstanzePerTemplates` (sostituzione mirata per template, usata dall'import eserciti) e `rimuoviIstanzePerTemplate`.

Punto di ingresso di ogni modulo: il componente principale della cartella (stesso nome del folder) importa solo gli hook `useTavolo()` / `useLibreria()` / `useTavoloState()` di cui ha bisogno — non riceve quasi nulla via props tranne `containerRef` (passato da `AreaLavoro` a `Basetta`/`ElementoScenico`/`SelezioneMultipla`/`StrumentoRighello` per calcolare posizioni relative durante il drag/la misura, ruotate secondo `rotazioneArea`) e i dati dell'istanza/template correnti (`istanza`, `template`, `elemento`).

Oltre alla Context API, alcune interazioni trasversali tra `Basetta` e i pannelli laterali passano per **eventi custom su `window`** (`src/utils/selezioneEventi.js`), per evitare di introdurre un Context condiviso solo per queste: `EVENTO_SELEZIONE_MULTIPLA`/`EVENTO_TRASCINAMENTO_GRUPPO` (selezione e drag di gruppo, emessi da `Basetta`/`SelezioneMultipla`) ed `EVENTO_EVIDENZIA_UNITA` (hover su un'unità in `CreazioneEsercito` → bagliore sulle basette corrispondenti in `Basetta`).

Il drag & drop è centralizzato nell'hook `src/hooks/useDraggable.js`: dato un `containerRef` e una `posizione {x,y}`, gestisce Pointer Events e restituisce `posizioneVisualizzata`, `handlers`, `inTrascinamento`. Sia `Basetta` che `ElementoScenico` lo usano; la logica di business (calcolo distanza, cambio zona) resta nel componente chiamante tramite il callback `onSposta`. Il calcolo dei punti relativi al `containerRef` tenendo conto della rotazione dell'area (`rotazioneArea`) è centralizzato in `src/utils/coordinate.js` (`puntoRelativoRuotato`), usato da `Basetta`, `SelezioneMultipla` e `StrumentoRighello`.

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

**Modulo 2 — Eserciti, selezione e strumenti da tavolo: completo e funzionante.**
Testato manualmente: creazione unità multi-modello per i due eserciti con schieramento automatico in staging, liste ad accordion per esercito con dettagli unità ed evidenziazione delle basette al hover, export/import JSON dello stato completo dei due eserciti con auto-caricamento da `localStorage` all'avvio, selezione singola/multipla delle basette con trascinamento di gruppo e rotazione (Q/E), rotazione dell'intera area di lavoro (A/S), strumento righello per misure libere, selettore layout "Force disposition" con caricamento automatico dello sfondo, form basetta/elemento scenico compattati in pannelli espandibili.

Per avviare: `npm run dev` (Vite, porta 5173).

## Moduli futuri previsti

_(da compilare man mano che si aggiungono nuovi moduli)_
