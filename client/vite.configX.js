import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [
        path.resolve(__dirname, '.'), // Your source code
        path.resolve(__dirname, '../node_modules'), // Top-level node_modules
        path.resolve(__dirname, '../node_modules/.pnpm'), // PNPM virtual store (Vuetify lives here)
        path.resolve(__dirname, '../node_modules/vuetify'), // Fallback in case Vuetify uses classic install
      ],
    },
  },
})

console.log('>>> Vite config loaded')
