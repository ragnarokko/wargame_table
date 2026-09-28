import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // wapedia/ contiene i CSV grezzi (fonte di public/info.csv, letto solo via fetch a
      // runtime, mai importato da moduli): esclusa dal watcher perché altri strumenti (es.
      // Excel/sync) vi scrivono file .tmp effimeri che possono far crashare Vite su Windows
      // con un EBUSY non gestito sul file watcher (visto in pratica: il dev server moriva).
      ignored: ['**/wapedia/**'],
    },
  },
})
