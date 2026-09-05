import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    // 5199 is the project's dev port: it is what .claude/launch.json opens,
    // what the README documents, and what the API's CLIENT_ORIGIN allows.
    // Leaving this at Vite's 5173 default meant `npm run dev` from a plain
    // terminal served the app on an origin the API refused.
    port: Number(process.env.PORT) || 5199,
  },
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
