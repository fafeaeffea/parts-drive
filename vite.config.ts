import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative asset paths: the build works from any folder or sub-path.
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
  },
})
