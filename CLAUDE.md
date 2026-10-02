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
| `AreaLavoro/` | Contenitore principale: monta `Staging` + `Tavolo` come sfondo visivo e sopra un livello interattivo assoluto dove vengono renderizzate `Basetta` ed `ElementoScenico`, oltre a `SelezioneMultipla`, `StrumentoRighello` e `MisuraRapida`. Possiede il `containerRef` usato come sistema di coordinate condiviso per il drag & drop, e gestisce rotazione (tasti A/S, 90° per volta, `rotazioneArea`), zoom (tasti G/H, solo visivo, `zoom`) e pan (trascinamento con il tasto destro, CSS `transform` sul livello interattivo) dell'intera area, passati come prop ai figli che ne hanno bisogno. |
| `Tavolo/` | Solo visuale: rettangolo del tavolo di gioco (bordo, sfondo immagine stretchato, etichetta dimensioni). Nessuna logica interattiva. |
| `Staging/` | Solo visuale: area tratteggiata che circonda il tavolo, dove si preparano le basette prima di schierarle. |
| `Basetta/` | Miniatura trascinabile. Implementa il proprio drag via Pointer Events (non usa più `useDraggable`: serve un calcolo dei punti consapevole di rotazione/zoom dell'area, vedi `puntoRelativoRuotato` più sotto), calcolo distanza percorsa quando il movimento avviene interamente sul tavolo, hover+Ctrl per mostrare `BasettaTooltip`, rotazione con Q/W (singola o, se 2+ basette sono selezionate, delegata al gruppo da `SelezioneMultipla`), ferite correnti con +/- (solo se il template ha un `w` numerico), aura con Z/X (offset crescente/decrescente di 1") e C (scorciatoia rapida a 9"/spegnimento), anello colorato secondo l'esercito (`--colore-squadra`), nome che va a capo su più righe se troppo lungo, selezione singola/multipla con trascinamento di gruppo (sincronizzate tra le istanze via eventi custom su `window`, vedi `src/utils/selezioneEventi.js`), evidenziazione bidirezionale con la lista eserciti (`CreazioneEsercito`/`UnitaListItem`): hover su un'unità in lista illumina le sue basette sul campo e viceversa. La rimozione non è più legata al doppio click (rimosso): passa dalla selezione + Canc/Backspace, vedi `SelezioneMultipla`. |
| `BasettaTooltip/` | Popup con immagine + statistiche del template, mostrato da `Basetta`; per le unità esercito (campo `esercito` presente) mostra anche la griglia di statistiche strutturate (MOV/RES/W/TS/TS+/OC/FNP/RANGE1-3) e le NOTE. |
| `MisuraDistanza/` | Piccolo badge che mostra l'ultima distanza percorsa (in pollici), renderizzato da `Basetta` durante un trascinamento e da `SelezioneMultipla` durante una rotazione di gruppo. |
| `SelezioneMultipla/` | `SelezioneMultipla.jsx`: overlay invisibile su `AreaLavoro` con più funzioni — trascinamento per selezionare più basette con un rettangolo di gomma (emette `EVENTO_SELEZIONE_MULTIPLA`, consumato da ogni `Basetta`); con 2+ basette selezionate, Q/W ruota l'intero gruppo attorno al suo centro geometrico (`EVENTO_ROTAZIONE_GRUPPO` per l'anteprima live durante un drag in corso) e i tasti 1/2/3 dispongono le basette selezionate su 1-3 file allineate alla direzione attuale della selezione, distanziate di almeno 1"; Canc/Backspace elimina le basette selezionate tramite l'hook `useEliminaSelezione.js`. `PulsanteEliminaSelezione.jsx`: pulsante nel pannello laterale, visibile solo con una selezione attiva, stesso effetto della scorciatoia. |
| `StrumentoRighello/` | `StrumentoRighello.jsx`: overlay di misura libera tra due punti qualsiasi del tavolo (click-trascina, mostra la distanza in pollici), attivabile in alternativa alla selezione multipla; stato tenuto in `App.jsx` e attivabile anche con il tasto D (oltre al pulsante). `PulsanteRighello.jsx`: pulsante toggle nel pannello laterale per lo stesso stato. `MisuraRapida.jsx`: misurazione rapida indipendente col tasto F tenuto premuto (nessun click, nessun toggle: sempre attiva), stessa logica/stile del righello ma senza overlay che intercetta i click, quindi non interferisce mai con drag/selezione/pan. |
| `ElementoScenico/` | `ElementoScenico.jsx`: elemento scenico trascinabile sul campo (drag via `useDraggable` — a differenza di `Basetta` non tiene conto di rotazione/zoom dell'area, vedi sopra —, doppio click per rimuovere). `GestioneElementiScenici.jsx`: pannello laterale con lista (righe editabili inline) ed elemento espandibile `NuovoElementoForm.jsx` per aggiungere nuovi elementi (forma, dimensioni, nome, colore). |
| `LibreriaBasette/` | `LibreriaBasette.jsx`: pannello laterale (in un `PannelloEspandibile`) con elenco basette in libreria, azioni schiera/modifica/rimuovi, export/import JSON. "Schiera" cerca la posizione libera più vicina a una griglia proposta in staging, rispettando 1" di distanza minima dalle basette già presenti (`src/utils/posizionamentoLibero.js`: `trovaPosizioneLibera`/`rettangoliDaIstanze`, ricerca a spirale). `BasettaForm.jsx`: form compatto (riga con cascata forma→dimensione, dettagli avanzati espandibili) di creazione/modifica template basetta, avvolto in `PannelloEspandibile`; supporta forma tonda/ovale (preset da `src/config/dimensioniBasette.js`) e rettangolare (larghezza/lunghezza libere in mm). |
| `CreazioneEsercito/` | `CreazioneEsercito.jsx`: pannello laterale con selezione tra due eserciti (Blu/Rosso), creazione unità multi-modello e due liste ad accordion (una per esercito, via `PannelloEspandibile`) con le unità create. Riusa `Basetta`/`LibreriaContext` (ogni unità è un template esteso con `esercito`, `numeroModelli` e stat opzionali MOV/RES/W/TS/TS+/OC/FNP/RANGE1-3/NOTE) e `TavoloStateContext.schieraBasette` per posizionare automaticamente tutti i modelli in staging su una fila (1" tra i centri, ≥2" dalle altre unità già presenti). `csvUnitaImport.js`: carica a runtime (fetch, non più a build time) `public/info.csv` — colonne `datasheet_id`, `line`, `name`, `MOV`, `RES`, `TS`, `TS+`, `Note`, `W`, `Ld`, `OC`, `base_size`, `fac`, `faction` separate da `\|` — ed espone fazioni/unità disponibili; `determinaFormaEDimensioni(base_size)` riconosce un solo numero (tonda), due numeri (ovale, primo = lato lungo), il prefisso `r_LUNGxLARGHmm` (es. `r_100x50mm`, rettangolare) o un campo vuoto (placeholder rettangolare 100×50mm); `generaNomeUnivoco` evita nomi duplicati in fase di creazione aggiungendo un progressivo (Scout, Scout2, ...). `UnitaForm.jsx`: form di creazione unità con fazione/unità/statistiche lette dal CSV (colore di default preso da `src/utils/colori.js`, primo colore libero nella palette per l'esercito scelto); si aggiorna da solo quando i dati CSV vengono (ri)caricati (`useVersioneDatiCsv`). `PulsanteAggiornaDati.jsx`: pulsante (montato a parte in fondo a `PannelloLaterale`, non dentro `CreazioneEsercito`) che forza un nuovo fetch di `public/info.csv`, utile dopo averlo modificato a mano, anche in produzione, senza rebuild. `UnitaListItem.jsx`: voce dell'accordion per una singola unità (nome/dettagli espandibili, rinomina inline — senza deduplica automatica, a differenza della creazione —, rimuovi), evidenzia le basette corrispondenti sul campo al passaggio del mouse sul nome (evento `EVENTO_EVIDENZIA_UNITA`) e le seleziona al click sul nome (`EVENTO_SELEZIONE_MULTIPLA`, la freccia ▶ a sinistra apre i dettagli) ed è a sua volta evidenziata dall'hover sulle basette sul campo (evidenziazione bidirezionale). |
| `PersistenzaEserciti/` | Sotto-componente montato da `CreazioneEsercito`: pulsanti per esportare/importare in JSON lo stato completo dei due eserciti (unità + istanze posizionate in staging/tavolo). Ogni export/import salva anche una copia in `localStorage`, ricaricata automaticamente all'avvio del sito se presente. Distinto da `SalvataggioPartita` (vedi sotto): chiave `localStorage` e formato JSON separati, non intercambiabili. |
| `CaricaSfondo/` | Pannello laterale (in un `PannelloEspandibile`, collassato di default): form dimensioni tavolo (pollici) + upload immagine di sfondo. |
| `SelettoreLayout/` | Pannello laterale "Force disposition": due select per i "codici" dei due giocatori + numero layout (1-3), risolve l'immagine di sfondo corrispondente tra gli asset in `src/assets/layouts/` (import.meta.glob) e la imposta via `TavoloContext.setSfondo`. |
| `SalvataggioPartita/` | Pulsanti Save/Load nel pannello laterale: esporta/importa in un unico file JSON l'intera partita (libreria basette completa, istanze su tavolo/staging con posizione/rotazione/ferite/aura, elementi scenici, dimensioni e sfondo del tavolo, indicatori CP/Turno/extra di `IndicatoriContext`), tramite `TavoloContext`/`LibreriaContext`/`TavoloStateContext.ripristinaTavolo`/`IndicatoriContext.ripristinaIndicatori`. Non tocca `localStorage`: è un salvataggio file-based distinto da `PersistenzaEserciti`. Il browser scarica il file in Download (non può scrivere nel repository): per versionare un salvataggio, spostarlo a mano in `savegames/` (vedi il README lì dentro) e fare commit+push, così arriva anche clonando il repo. |
| `Modale/` | Finestra modale generica riutilizzabile (overlay + riquadro con titolo e pulsante di chiusura, chiusura anche con Esc o click sull'overlay); non conosce il contenuto (`children`). Usata da `Aiuto` e `LinkUtili`. |
| `Aiuto/` | Pulsante "❓ Aiuto" che apre (via `Modale`) l'elenco completo delle scorciatoie da tastiera dell'app (array `SCORCIATOIE`, vedi sezione dedicata più sotto): va tenuto aggiornato a mano se cambiano le scorciatoie. |
| `LinkUtili/` | Pulsante "🔗 Link" che apre (via `Modale`) un elenco statico di link esterni utili (terreni, regole, download GW, Munitorum Field Manual, ecc.), aperti in una nuova scheda. |
| `PannelloEspandibile/` | Contenitore riutilizzabile generico (non legato a un dominio specifico): riga singola collassata con titolo + freccia (▶/▼), controllata dall'esterno (`aperto`/`onToggle`), che espande mostrando i `children` (un form o una lista) senza conoscerne la logica interna. Usato da `LibreriaBasette`, `CaricaSfondo`, `GestioneElementiScenici`/`NuovoElementoForm` e `CreazioneEsercito` (accordion per esercito). |
| `PannelloLaterale/` | Compone la sidebar, in ordine: `SalvataggioPartita` + `CaricaSfondo` + `SelettoreLayout` + `PulsanteRighello` + `PulsanteEliminaSelezione` + `CreazioneEsercito` + `LibreriaBasette` + `GestioneElementiScenici` + `Aiuto` + `LinkUtili` + `PulsanteAggiornaDati` (quest'ultimo in fondo, per riflettere il fatto che agisce sui dati dell'intera app). |

## Comunicazione tra moduli

Stato condiviso via **Context API**, tre provider indipendenti montati in `App.jsx` (`TavoloProvider` > `LibreriaProvider` > `TavoloStateProvider`):

- **`TavoloContext`** (`src/contexts/TavoloContext.jsx`) — dimensioni tavolo (pollici), immagine di sfondo, scala fissa `PX_PER_POLLICE = 14`, rettangoli calcolati (`tavoloRect`, `campoGiocoPx`, `margineStagingPx`), helper `puntoNelTavolo(x, y)`. È la fonte di verità per la conversione px↔pollici: cambiare dimensioni o sfondo ricalcola tutto automaticamente (il tavolo è sempre stirato a `larghezza*scala × altezza*scala`, indipendentemente dalla risoluzione dell'immagine caricata).
- **`LibreriaContext`** (`src/contexts/LibreriaContext.jsx`) — array di template basette (CRUD + `esportaJSON`/`importaJSON`, `sostituisciUnitaEserciti` usato dall'import degli eserciti per rimpiazzare solo le basette con campo `esercito`, `impostaBasette` per sostituire l'intera libreria usato da `SalvataggioPartita`). Un template = forma/dimensione/colore/immagine/statistiche di un "tipo" di basetta, non un'istanza sul campo.
- **`TavoloStateContext`** (`src/contexts/TavoloStateContext.jsx`) — istanze posizionate: `istanze` (basette effettivamente sul campo, con `templateId`, posizione `x/y` in px relativi al `containerRef` di `AreaLavoro`, `zona: 'staging'|'tavolo'`, `ultimaDistanza`, `rotazione`, `ferite`, `auraOffset`) ed `elementiScenici`. Oltre a `schieraBasetta`/`schieraBasette`/`spostaIstanza`/`rimuoviIstanza`, espone `ruotaIstanza`/`impostaFeriteIstanza`/`impostaAuraIstanza` (Q/W, +/-, Z/X/C su `Basetta`: valori persistiti sull'istanza, non stato locale del componente, proprio per essere inclusi automaticamente in un salvataggio), `rimuoviIstanze` (cancellazione multipla, usata da `useEliminaSelezione`), `impostaIstanzePerTemplates`/`rimuoviIstanzePerTemplate` (sostituzione/rimozione mirata per template, usate dall'import eserciti) e `ripristinaTavolo` (sostituzione totale di istanze+elementiScenici, usata da `SalvataggioPartita`).

Punto di ingresso di ogni modulo: il componente principale della cartella (stesso nome del folder) importa solo gli hook `useTavolo()` / `useLibreria()` / `useTavoloState()` di cui ha bisogno — non riceve quasi nulla via props tranne `containerRef` (passato da `AreaLavoro` a `Basetta`/`ElementoScenico`/`SelezioneMultipla`/`StrumentoRighello`/`MisuraRapida` per calcolare posizioni relative durante il drag/la misura, insieme a `rotazioneArea` e `zoom` correnti dell'area) e i dati dell'istanza/template correnti (`istanza`, `template`, `elemento`).

Oltre alla Context API, alcune interazioni trasversali tra `Basetta` e i pannelli laterali passano per **eventi custom su `window`** (`src/utils/selezioneEventi.js`), per evitare di introdurre un Context condiviso solo per queste: `EVENTO_SELEZIONE_MULTIPLA`/`EVENTO_TRASCINAMENTO_GRUPPO` (selezione e drag di gruppo, emessi da `Basetta`/`SelezioneMultipla`), `EVENTO_ROTAZIONE_GRUPPO` (spostamento live "sul posto" durante una rotazione di gruppo con Q/W mentre un drag di gruppo è già in corso, emesso da `SelezioneMultipla` e consumato da ogni `Basetta` selezionata) ed `EVENTO_EVIDENZIA_UNITA` (hover su un'unità in `CreazioneEsercito`/`UnitaListItem` ↔ bagliore sulle basette corrispondenti in `Basetta`, nelle due direzioni).

Il drag & drop di `ElementoScenico` è centralizzato nell'hook `src/hooks/useDraggable.js`: dato un `containerRef` e una `posizione {x,y}`, gestisce Pointer Events e restituisce `posizioneVisualizzata`, `handlers`, `inTrascinamento`; la logica di business (calcolo distanza, cambio zona) resta nel componente chiamante tramite il callback `onSposta`. `Basetta` **non** usa più questo hook: implementa la propria gestione dei Pointer Events perché deve tenere conto di rotazione/zoom dell'area (cosa che `useDraggable` non fa), oltre a intrecciarla con selezione/rotazione/ferite/aura. Il calcolo dei punti relativi al `containerRef` tenendo conto di rotazione e zoom dell'area (`rotazioneArea`, `zoom`) è centralizzato in `src/utils/coordinate.js` (`puntoRelativoRuotato`), usato da `Basetta`, `SelezioneMultipla`, `StrumentoRighello` e `MisuraRapida`.

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
Testato manualmente: creazione unità multi-modello per i due eserciti con schieramento automatico in staging, liste ad accordion per esercito con dettagli unità ed evidenziazione delle basette al hover, export/import JSON dello stato completo dei due eserciti con auto-caricamento da `localStorage` all'avvio, selezione singola/multipla delle basette con trascinamento di gruppo e rotazione (Q/W), rotazione dell'intera area di lavoro (A/S), strumento righello per misure libere, selettore layout "Force disposition" con caricamento automatico dello sfondo, form basetta/elemento scenico compattati in pannelli espandibili.

**Modulo 3 — Import da CSV, editing basette e strumenti avanzati: completo e funzionante.**
Testato manualmente: import unità da `public/info.csv` con basi tonde/ovali/rettangolari (`r_LUNGxLARGHmm`) o placeholder, ricarica dei dati a runtime col pulsante "Aggiorna dati" (senza rebuild, anche in produzione), rinomina inline delle unità, ferite (+/-) e aura (Z/X/C) per singola basetta con anello colore squadra, evidenziazione bidirezionale basetta↔lista, cancellazione con Canc/Backspace (pulsante dedicato + scorciatoia, doppio click rimosso), zoom (G/H) e pan (tasto destro) dell'area di lavoro, righello attivabile anche con D, misurazione rapida senza click con F, disposizione automatica delle basette selezionate su 1/2/3 file, Save/Load dell'intera partita, pannelli laterali collassabili, finestre Aiuto e Link utili.

Per avviare: `npm run dev` (Vite, porta 5173).

## Scorciatoie da tastiera

Elenco completo (specchio dell'array `SCORCIATOIE` in `src/components/Aiuto/Aiuto.jsx`, mostrato in-app dal pulsante "❓ Aiuto"): tutte le scorciatoie legate a una basetta/gruppo ignorano la pressione se il focus è su un campo di input/textarea/select/contentEditable.

| Tasti | Effetto |
|---|---|
| ← ↑ → ↓ | Sposta di 0,25" (`PASSO_FRECCE_POLLICI` in `Basetta.jsx`) la basetta selezionata o tutte quelle del gruppo selezionato (ognuna ascolta per conto suo); direzione a schermo, compensata dalla rotazione dell'area (A/S). |
| L | Apre/chiude la finestrella del dado D6 (`LancioDado`); clic sul dado per il tiro. |
| Q / W | Ruota di 15° la basetta selezionata (singola) attorno al proprio centro; con 2+ basette selezionate ruota invece l'intero gruppo attorno al suo centro geometrico. |
| + / - | Aumenta/diminuisce di 1 le ferite della basetta selezionata (singola, solo se ha un `w` numerico), tra 0 e il massimo. |
| Z / X | Basetta selezionata (singola): Z attiva/ingrandisce di 1" l'aura, X la riduce di 1" spegnendola sotto 1". Indipendente per ogni basetta. |
| C | Basetta selezionata (singola): senza aura attiva la imposta direttamente a 9"; con aura già attiva (a qualsiasi offset, impostato con C o Z/X) la spegne del tutto. |
| A / S | Ruota di 90° l'intera area di lavoro (tavolo + staging). |
| G / H | Zoom avanti/indietro sull'area di lavoro (solo aspetto visivo). |
| D | Attiva/disattiva lo strumento righello (stesso stato del pulsante "Strumento righello" nel menu laterale). |
| F (tieni premuto) | Misura rapida senza click dal punto in cui è stato premuto alla posizione attuale del mouse; scompare al rilascio. Funziona anche a righello non attivo. |
| 1 / 2 / 3 | Con 2+ basette selezionate, le dispone su 1, 2 o 3 file distanziate di almeno 1". |
| Canc / Backspace | Elimina le basette selezionate (richiede una selezione attiva). |
| Esc | Annulla un trascinamento in corso; chiude anche una finestra `Modale` aperta (Aiuto/Link). |
| Ctrl + hover su una basetta | Mostra il popup `BasettaTooltip` con immagine e statistiche. |
| Tasto destro (trascina) | Pan dell'intera area di lavoro. |
| Tasto sinistro (trascina) | Sposta una basetta/elemento scenico; su area vuota disegna il rettangolo di selezione multipla, oppure misura se il righello (D) è attivo. |

Nessun vero conflitto (due azioni diverse sullo stesso tasto nello stesso contesto): l'unico caso di tasti condivisi è Q/W, che cambia comportamento in base al numero di basette selezionate (0-1 vs 2+), per design della selezione singola/di gruppo — non serve una modifica, ma va tenuto a mente aggiungendo nuove scorciatoie su Q/W.

## Moduli futuri previsti

_(da compilare man mano che si aggiungono nuovi moduli)_
