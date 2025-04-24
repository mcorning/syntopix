import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
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
