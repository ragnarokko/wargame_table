# Savegames

Questa cartella è il posto dove versionare i file di salvataggio esportati con il
pulsante **💾 Save** (componente `SalvataggioPartita`, vedi `CLAUDE.md`).

## Come salvare una partita qui

1. In app, clicca **💾 Save**: il browser scarica un file `partita.json` nella
   cartella Download del sistema (il browser non può scrivere direttamente nel
   repository).
2. Sposta/copia quel file qui dentro, rinominandolo se vuoi tenerne più di uno
   (es. `partita-2026-10-01.json`, `torneo-finale.json`, ...).
3. Fai commit e push come per qualsiasi altro file:
   ```bash
   git add savegames/nome-file.json
   git commit -m "Aggiunge salvataggio partita del ..."
   git push
   ```

## Come caricarla su un altro PC

1. Clona (o fai `git pull` su) il repository: i file in questa cartella arrivano
   insieme al resto, essendo tracciati da git.
2. In app, clicca **📂 Load** e seleziona il file `.json` da qui.

Nessuna automazione: l'app non legge né scrive direttamente questa cartella, è
solo un punto di raccolta concordato per i file esportati con Save/Load.
