# Tavolo da Gioco

App web per gestire una partita di wargame (tipo Warhammer 40k) su un tavolo virtuale: tavolo in scala reale con area di staging, basette trascinabili, misure in pollici, eserciti importati da CSV e calcolatore di combattimento collegato.

## Avvio

```bash
npm install
npm run dev     # http://localhost:5173
```

Altri script: `npm run build`, `npm run preview`, `npm run lint` (Oxlint). Serve Node.js (LTS recente).

## Funzionalità

- **Tavolo e staging**: dimensioni in pollici, sfondo caricabile o scelto dai layout predefiniti ("Force disposition"), rotazione (A/S), zoom (G/H) e pan (tasto destro) dell'area.
- **Basette**: drag & drop con distanza percorsa, rotazione (Q/W), ferite (+/-), aura (Z/X/C), movimento fine con le frecce (0,25"), anello colore squadra, tooltip con statistiche e armi (Ctrl + hover).
- **Selezione multipla**: rettangolo di selezione o click sul nome dell'unità in lista; trascinamento e rotazione di gruppo, disposizione su 1-3 file (1/2/3), eliminazione con Canc.
- **Eserciti Blu/Rosso**: unità create da `info.csv` (basi tonde, ovali, rettangolari), schieramento automatico in staging, evidenziazione bidirezionale lista ↔ campo, rinomina, export/import JSON.
- **Misure**: righello (D) e misura rapida tenendo premuto F.
- **Indicatori**: CP Blu, CP Rosso, Turno e due extra con titolo editabile, in alto nello staging.
- **Dado D6**: tasto L, clic sul dado per il tiro.
- **Botte!**: apre il calcolatore di combattimento (repo `calcolatore_wh40`, su GitHub Pages) con le unità delle due armate e le loro armi già caricate.
- **Save/Load partita**: un unico file JSON con libreria, istanze, elementi scenici, tavolo, sfondo e indicatori. I file da versionare vanno in [`savegames/`](savegames/README.md).
- **Libreria basette** ed **elementi scenici** personalizzabili; finestre **Aiuto** (tutte le scorciatoie) e **Link utili**.
- **Aggiorna dati**: ricarica `info.csv` e `Datasheets_wargear.csv` dal sito del calcolatore, senza rebuild.

## Architettura

React 19 + Vite, nessuna libreria UI né di stato esterne (drag & drop con Pointer Events scritti a mano).

```
src/
  components/   un componente = una funzionalità = una cartella (JSX + CSS Module)
  contexts/     stato condiviso via Context API
  hooks/        hook riusabili (useDraggable)
  utils/        funzioni pure: scala px↔pollici, coordinate ruotate, eventi, posizionamento
  config/       dati statici: eserciti, dimensioni basette, fascia indicatori
public/         asset statici; i CSV (unità e armi) vivono nel repo del calcolatore e si scaricano a runtime
savegames/      salvataggi partita versionati a mano
```

- **Stato**: quattro Context indipendenti montati in `App.jsx`: `IndicatoriContext` (CP/Turno/extra), `TavoloContext` (dimensioni, sfondo, conversioni px↔pollici), `LibreriaContext` (template delle basette), `TavoloStateContext` (istanze sul campo ed elementi scenici).
- **Comunicazione trasversale**: gli eventi di selezione, rotazione di gruppo ed evidenziazione unità passano da eventi custom su `window` (`src/utils/selezioneEventi.js`), senza un Context dedicato.
- **Coordinate**: posizioni in px relative al contenitore di `AreaLavoro`, dimensioni di dominio in pollici (tavolo) e mm (basette); `puntoRelativoRuotato` tiene conto di rotazione e zoom dell'area.
- **Dati**: i CSV non sono nel bundle né in questo repo: li pubblica il calcolatore (`calcolatore_wh40`) e l'app li scarica a runtime (serve internet), quindi si aggiornano senza rebuild.
- **Calcolatore**: app separata, fonte dei dati. "Botte!" gli invia via `postMessage` (dopo `wh40-ready`) le unità dei due eserciti; il suo tab VSunità le usa come filtro.

La descrizione dettagliata dei moduli e delle convenzioni è in [`CLAUDE.md`](CLAUDE.md).
