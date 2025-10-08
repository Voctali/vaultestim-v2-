/**
 * Serveur principal VaultEstim
 * API complète pour base de données cartes Pokémon
 */
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Routes
import cardsRouter from './routes/cards.js'
import setsRouter from './routes/sets.js'
import pricesRouter from './routes/prices.js'
import collectionsRouter from './routes/collections.js'
import syncRouter from './routes/sync.js'
import statsRouter from './routes/stats.js'

// Services
import { initializeDatabase } from './config/database.js'
import { startScheduledSync } from './services/SyncService.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.'
  }
})
app.use('/api/', limiter)

// CORS configuré pour Vite
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}))

// Compression et parsing
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Servir les images statiques
app.use('/images', express.static(path.join(__dirname, 'public/images')))

// Routes API
app.use('/api/cards', cardsRouter)
app.use('/api/sets', setsRouter)
app.use('/api/prices', pricesRouter)
app.use('/api/collections', collectionsRouter)
app.use('/api/sync', syncRouter)
app.use('/api/stats', statsRouter)

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      redis: 'connected',
      sync: process.env.SYNC_ENABLED === 'true' ? 'enabled' : 'disabled'
    }
  })
})

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err)

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message,
    timestamp: new Date().toISOString()
  })
})

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    path: req.originalUrl,
    method: req.method
  })
})

// Démarrage du serveur
async function startServer() {
  try {
    // Initialiser la base de données
    console.log('🔄 Initialisation de la base de données...')
    await initializeDatabase()

    // Démarrer la synchronisation automatique
    if (process.env.SYNC_ENABLED === 'true') {
      console.log('🔄 Démarrage synchronisation automatique...')
      startScheduledSync()
    }

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur VaultEstim démarré sur le port ${PORT}`)
      console.log(`📡 API disponible sur: http://localhost:${PORT}/api`)
      console.log(`🖼️ Images disponibles sur: http://localhost:${PORT}/images`)
      console.log(`💊 Health check: http://localhost:${PORT}/api/health`)
    })

  } catch (error) {
    console.error('❌ Erreur démarrage serveur:', error)
    process.exit(1)
  }
}

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur...')
  process.exit(0)
})

startServer()