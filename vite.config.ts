import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base relativa: la build funziona su GitHub Pages (/maps/) e in qualunque sottocartella
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
