/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Accounts read the public Supabase URL and publishable key at build time,
  // under either the app's VITE_ names or the website's NEXT_PUBLIC_ names on Vercel.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  // The GeoNames city list (~2.4 MB) is its own lazily loaded chunk, used only by the birthplace search.
  build: { chunkSizeWarningLimit: 2600 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
})
