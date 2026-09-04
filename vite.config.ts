import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: Number(process.env.PORT) || 5173 },
  build: {
    rollupOptions: {
      output: {
        // Recharts is only needed by the Prediction dashboard — keep it out of
        // the entry chunk so the booking page and tables load lean.
        manualChunks: { charts: ['recharts'] },
      },
    },
  },
})
