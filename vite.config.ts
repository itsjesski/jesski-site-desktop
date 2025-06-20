import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  preview: {
    allowedHosts: [
      'jesski-desktop-site-emrcm.ondigitalocean.app',
      'jesski.com',
      'www.jesski.com',
      'localhost'
    ],
    host: '0.0.0.0',
    port: 8080
  },
  server: {
    allowedHosts: [
      'jesski-desktop-site-emrcm.ondigitalocean.app',
      'jesski.com', 
      'www.jesski.com',
      'localhost'
    ],
    host: '0.0.0.0'
  }
})
