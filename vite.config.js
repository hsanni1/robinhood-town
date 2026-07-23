import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward the suggestions API to the local backend during dev so the
    // client can call a relative /api/* path.
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
