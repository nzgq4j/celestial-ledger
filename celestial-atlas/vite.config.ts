/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The GeoNames city list (~2.4 MB) is its own lazily loaded chunk, used only by the birthplace search.
  build: { chunkSizeWarningLimit: 2600 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
})
