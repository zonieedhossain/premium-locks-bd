import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': { target: 'http://172.17.159.131:8081', changeOrigin: true },
      '/uploads': { target: 'http://172.17.159.131:8081', changeOrigin: true },
    },
  },
})
