import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
    // Each test drives consent state directly; a shared jsdom would leak
    // localStorage and injected <script> tags between files.
    restoreMocks: true,
  },
})
