import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // wapedia/ contiene i CSV grezzi (fonte di public/info.csv e public/Datasheets_wargear.csv,
      // letti solo via fetch a runtime, mai importati da moduli): esclusa dal watcher perché
      // altri strumenti (es. Excel/sync) vi scrivono file .tmp effimeri che possono far crashare
      // Vite su Windows con un EBUSY non gestito sul file watcher (visto in pratica: il dev
      // server moriva). Gli stessi CSV in public/ vengono ora modificati a mano direttamente (per
      // aggiornarli senza rebuild, vedi "Aggiorna dati"), quindi corrono lo stesso rischio se
      // modificati con uno strumento che scrive file temporanei: esclusi anche loro, dato che non
      // serve comunque nessun HMR per file mai importati da JS.
      ignored: ['**/wapedia/**', '**/public/*.csv'],
    },
  },
})
