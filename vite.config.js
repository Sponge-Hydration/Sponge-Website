import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fixImagePreloads } from './scripts/fix-image-preloads.js'

export default defineConfig({
  plugins: [react()],
  ssgOptions: {
    // See scripts/fix-image-preloads.js: stops the hero poster downloading twice.
    onPageRendered: (_route, html) => fixImagePreloads(html),
  },
})
