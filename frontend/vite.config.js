import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'billing.access.daragroup.cloud',
      // Opsional: tambahin ini biar lebih fleksibel
      '.daragroup.cloud',  // allow semua subdomain daragroup.cloud
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
