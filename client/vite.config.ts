import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [
        // Let Vite access Vuetify's compiled styles
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, 'client'),
        path.resolve(__dirname, '../../'), // if needed for monorepo paths
      ],
    },
  },
})
