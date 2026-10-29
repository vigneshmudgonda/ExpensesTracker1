import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  import tailwindcss from '@tailwindcss/vite'
  plugins: [react(),tailwindcss(),
],
})
