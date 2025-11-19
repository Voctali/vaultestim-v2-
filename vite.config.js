import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Fonction pour vérifier si les certificats SSL existent
const getHttpsConfig = () => {
  const keyPath = path.resolve(__dirname, 'localhost+2-key.pem')
  const certPath = path.resolve(__dirname, 'localhost+2.pem')

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }
  }

  // Pas de HTTPS si les certificats n'existent pas (production)
  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    host: true,
    // HTTPS désactivé temporairement pour le dev local
    // https: getHttpsConfig(),
    proxy: {
      '/api/pokemontcg': {
        target: 'https://api.pokemontcg.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pokemontcg/, ''),
        timeout: 60000, // Timeout de 60 secondes (API parfois lente)
        proxyTimeout: 60000, // Timeout du proxy à 60 secondes
        secure: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Origin', 'https://api.pokemontcg.io');
          });
        }
      }
    }
  }
})
