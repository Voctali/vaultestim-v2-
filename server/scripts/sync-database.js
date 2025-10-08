/**
 * Script de synchronisation manuelle de la base de données
 */
import { SyncService } from '../services/SyncService.js'
import { initializeDatabase } from '../config/database.js'
import dotenv from 'dotenv'

dotenv.config()

async function runSync() {
  const args = process.argv.slice(2)
  const syncType = args[0] || 'full'

  try {
    console.log('🔄 Initialisation...')
    await initializeDatabase()

    console.log(`🚀 Démarrage synchronisation: ${syncType}`)

    let result
    switch (syncType) {
      case 'sets':
        result = await SyncService.syncSets()
        break
      case 'cards':
        result = await SyncService.syncCards()
        break
      case 'prices':
        result = await SyncService.syncPrices()
        break
      case 'images':
        result = await SyncService.cacheImages()
        break
      case 'full':
      default:
        result = await SyncService.fullSync()
        break
    }

    console.log('✅ Synchronisation terminée!')
    console.log('📊 Résultats:', result)

  } catch (error) {
    console.error('❌ Erreur synchronisation:', error)
    process.exit(1)
  }

  process.exit(0)
}

console.log(`
🎮 VaultEstim Database Sync
═══════════════════════════

Usage: node sync-database.js [type]

Types disponibles:
  full    - Synchronisation complète (défaut)
  sets    - Extensions uniquement
  cards   - Cartes uniquement
  prices  - Prix uniquement
  images  - Images uniquement

`)

runSync()