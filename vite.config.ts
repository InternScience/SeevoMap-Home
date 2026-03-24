import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves this app from a repo subpath; relative asset URLs keep
  // the build portable while preserving normal local dev behavior.
  base: command === 'serve' ? '/' : './',
}))
