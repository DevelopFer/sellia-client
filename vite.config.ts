import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'sellia-client-3zqr5.ondigitalocean.app',
      '.ondigitalocean.app', // Allow all Digital Ocean app subdomains
    ],
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'sellia-client-3zqr5.ondigitalocean.app',
      '.ondigitalocean.app',
    ],
  },
})