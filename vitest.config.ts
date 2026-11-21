import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Test config is kept separate from vite.config.ts on purpose: tests must not
// load the prerender or Tailwind plugins.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
