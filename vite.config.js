import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // L'app è pubblicata su GitHub Pages in un sottopercorso (ragnarokko.github.io/wargame_table/):
  // senza base i file statici non verrebbero trovati. In sviluppo (npm run dev) resta '/'.
  base: command === 'build' ? '/wargame_table/' : '/',
  plugins: [react()],
  server: {
    watch: {
      // wapedia/ contiene i CSV grezzi, sorgente di info.csv e Datasheets_wargear.csv (che ora
      // vivono nel repo del calcolatore e vengono scaricati da lì a runtime): esclusa dal watcher
      // perché altri strumenti (es. Excel/sync) vi scrivono file .tmp effimeri che possono far
      // crashare Vite su Windows con un EBUSY non gestito sul file watcher (visto in pratica: il
      // dev server moriva).
      ignored: ['**/wapedia/**'],
    },
  },
}))
