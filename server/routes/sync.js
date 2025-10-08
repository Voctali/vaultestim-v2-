/**
 * Routes API pour la synchronisation
 */
import express from 'express'
import { SyncService } from '../services/SyncService.js'

const router = express.Router()

/**
 * POST /api/sync/full
 * Déclencher une synchronisation complète
 */
router.post('/full', async (req, res) => {
  try {
    if (SyncService.isRunning) {
      return res.status(409).json({
        error: 'Synchronisation déjà en cours',
        status: SyncService.getStatus()
      })
    }

    // Démarrer la sync en arrière-plan
    SyncService.fullSync().catch(error => {
      console.error('❌ Erreur sync complète:', error)
    })

    res.json({
      message: 'Synchronisation complète démarrée',
      status: SyncService.getStatus()
    })

  } catch (error) {
    console.error('❌ Erreur démarrage sync:', error)
    res.status(500).json({ error: 'Erreur lors du démarrage' })
  }
})

/**
 * POST /api/sync/sets
 * Synchroniser uniquement les extensions
 */
router.post('/sets', async (req, res) => {
  try {
    if (SyncService.isRunning) {
      return res.status(409).json({
        error: 'Synchronisation déjà en cours'
      })
    }

    // Démarrer la sync en arrière-plan
    SyncService.syncSets().catch(error => {
      console.error('❌ Erreur sync sets:', error)
    })

    res.json({
      message: 'Synchronisation des extensions démarrée'
    })

  } catch (error) {
    console.error('❌ Erreur sync sets:', error)
    res.status(500).json({ error: 'Erreur lors de la synchronisation' })
  }
})

/**
 * POST /api/sync/prices
 * Synchroniser uniquement les prix
 */
router.post('/prices', async (req, res) => {
  try {
    if (SyncService.isRunning) {
      return res.status(409).json({
        error: 'Synchronisation déjà en cours'
      })
    }

    // Démarrer la sync en arrière-plan
    SyncService.syncPrices().catch(error => {
      console.error('❌ Erreur sync prices:', error)
    })

    res.json({
      message: 'Synchronisation des prix démarrée'
    })

  } catch (error) {
    console.error('❌ Erreur sync prices:', error)
    res.status(500).json({ error: 'Erreur lors de la synchronisation' })
  }
})

/**
 * GET /api/sync/status
 * Statut de la synchronisation
 */
router.get('/status', (req, res) => {
  res.json(SyncService.getStatus())
})

export default router