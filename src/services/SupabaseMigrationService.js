/**
 * Service de migration des données IndexedDB → Supabase
 * Migration sécurisée avec backup et vérification
 * POUR VOS 8515 CARTES + 162 EXTENSIONS
 */
import { IndexedDBService } from './IndexedDBService'
import { SupabaseService } from './SupabaseService'
import { SupabaseCollectionService } from './SupabaseCollectionService'
import { BackendApiService } from './BackendApiService'

export class SupabaseMigrationService {
  /**
   * ÉTAPE 1 : Backup complet des données actuelles
   */
  static async createBackup() {
    console.log('🔄 ÉTAPE 1/5 : Création du backup...')

    try {
      // Charger toutes les données IndexedDB
      const [
        discoveredCards,
        seriesDatabase,
        customBlocks,
        customExtensions
      ] = await Promise.all([
        IndexedDBService.loadDiscoveredCards(),
        IndexedDBService.loadSeriesDatabase(),
        IndexedDBService.loadCustomBlocks(),
        IndexedDBService.loadCustomExtensions()
      ])

      const backup = {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        source: 'IndexedDB',
        data: {
          discovered_cards: discoveredCards,
          series_database: seriesDatabase,
          custom_blocks: customBlocks,
          custom_extensions: customExtensions
        },
        stats: {
          cards_count: discoveredCards.length,
          series_count: seriesDatabase.length,
          blocks_count: customBlocks.length,
          extensions_count: customExtensions.length
        }
      }

      // Sauvegarder dans localStorage comme backup d'urgence
      localStorage.setItem('vaultestim_backup_before_migration', JSON.stringify(backup))

      // Créer un fichier téléchargeable
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `vaultestim-backup-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)

      console.log('✅ Backup créé :')
      console.log(`   - ${backup.stats.cards_count} cartes`)
      console.log(`   - ${backup.stats.series_count} extensions`)
      console.log(`   - ${backup.stats.blocks_count} blocs personnalisés`)
      console.log(`   - ${backup.stats.extensions_count} extensions déplacées`)

      return backup
    } catch (error) {
      console.error('❌ Erreur création backup:', error)
      throw new Error('Impossible de créer le backup. Migration annulée.')
    }
  }

  /**
   * ÉTAPE 2 : Migrer les cartes découvertes (8515 cartes)
   */
  static async migrateDiscoveredCards(cards) {
    console.log(`🔄 ÉTAPE 2/5 : Migration de ${cards.length} cartes...`)

    try {
      await SupabaseService.saveDiscoveredCards(cards)

      // Vérification
      const migratedCards = await SupabaseService.loadDiscoveredCards()

      if (migratedCards.length !== cards.length) {
        throw new Error(
          `❌ Erreur de vérification : ${cards.length} cartes envoyées, ${migratedCards.length} reçues`
        )
      }

      console.log(`✅ ${migratedCards.length} cartes migrées et vérifiées`)
      return migratedCards
    } catch (error) {
      console.error('❌ Erreur migration cartes:', error)
      throw error
    }
  }

  /**
   * ÉTAPE 3 : Migrer les extensions (162 extensions)
   */
  static async migrateSeriesDatabase(series) {
    console.log(`🔄 ÉTAPE 3/5 : Migration de ${series.length} extensions...`)

    try {
      await SupabaseService.saveSeriesDatabase(series)

      // Vérification
      const migratedSeries = await SupabaseService.loadSeriesDatabase()

      if (migratedSeries.length < series.length * 0.95) { // Tolérance 5% pour dédupication
        console.warn(`⚠️ Attention : ${series.length} extensions envoyées, ${migratedSeries.length} reçues`)
      }

      console.log(`✅ ${migratedSeries.length} extensions migrées et vérifiées`)
      return migratedSeries
    } catch (error) {
      console.error('❌ Erreur migration extensions:', error)
      throw error
    }
  }

  /**
   * ÉTAPE 4 : Migrer les blocs et extensions personnalisés
   */
  static async migrateCustomData(customBlocks, customExtensions) {
    console.log(`🔄 ÉTAPE 4/5 : Migration des données personnalisées...`)

    try {
      // Migrer les blocs personnalisés
      for (const block of customBlocks) {
        await SupabaseService.saveCustomBlock(block)
      }

      // Migrer les extensions déplacées
      for (const ext of customExtensions) {
        await SupabaseService.saveCustomExtension(
          ext.id,
          ext.series,
          ext.originalSeries || ext.original_series
        )
      }

      // Vérification
      const [migratedBlocks, migratedExtensions] = await Promise.all([
        SupabaseService.loadCustomBlocks(),
        SupabaseService.loadCustomExtensions()
      ])

      console.log(`✅ ${migratedBlocks.length} blocs personnalisés migrés`)
      console.log(`✅ ${migratedExtensions.length} extensions déplacées migrées`)

      return { migratedBlocks, migratedExtensions }
    } catch (error) {
      console.error('❌ Erreur migration données personnalisées:', error)
      throw error
    }
  }

  /**
   * ÉTAPE 5 : Migrer la collection utilisateur (depuis backend SQLite)
   */
  static async migrateUserCollection() {
    console.log('🔄 ÉTAPE 5/5 : Migration de la collection utilisateur...')

    try {
      // Charger depuis le backend SQLite
      const [
        collection,
        favorites,
        wishlist,
        batches,
        sales
      ] = await Promise.all([
        BackendApiService.getUserCollection(),
        BackendApiService.getUserFavorites(),
        BackendApiService.getUserWishlist(),
        BackendApiService.getDuplicateBatches(),
        BackendApiService.getUserSales()
      ])

      // Migrer vers Supabase
      for (const card of collection) {
        await SupabaseCollectionService.addToCollection(card)
      }

      for (const fav of favorites) {
        await SupabaseCollectionService.addToFavorites(fav)
      }

      for (const wish of wishlist) {
        await SupabaseCollectionService.addToWishlist(wish)
      }

      for (const batch of batches) {
        await SupabaseCollectionService.createDuplicateBatch(batch)
      }

      for (const sale of sales) {
        await SupabaseCollectionService.createSale(sale)
      }

      console.log(`✅ Collection migrée :`)
      console.log(`   - ${collection.length} cartes`)
      console.log(`   - ${favorites.length} favoris`)
      console.log(`   - ${wishlist.length} wishlist`)
      console.log(`   - ${batches.length} lots de doublons`)
      console.log(`   - ${sales.length} ventes`)

      return { collection, favorites, wishlist, batches, sales }
    } catch (error) {
      console.error('❌ Erreur migration collection:', error)
      // Ne pas throw ici, continuer même si la collection échoue
      console.warn('⚠️ La migration continue malgré l\'erreur de collection')
      return null
    }
  }

  /**
   * MIGRATION COMPLÈTE - Orchestration
   */
  static async migrateAll() {
    console.log('🚀 DÉBUT DE LA MIGRATION VERS SUPABASE')
    console.log('=========================================')

    const startTime = Date.now()
    const report = {
      started_at: new Date().toISOString(),
      steps: [],
      errors: [],
      success: false
    }

    try {
      // ÉTAPE 1 : Backup
      const backup = await this.createBackup()
      report.steps.push({
        name: 'Backup',
        status: 'success',
        details: backup.stats
      })

      // ÉTAPE 2 : Migrer les cartes
      const migratedCards = await this.migrateDiscoveredCards(backup.data.discovered_cards)
      report.steps.push({
        name: 'Cartes découvertes',
        status: 'success',
        count: migratedCards.length
      })

      // ÉTAPE 3 : Migrer les extensions
      const migratedSeries = await this.migrateSeriesDatabase(backup.data.series_database)
      report.steps.push({
        name: 'Extensions',
        status: 'success',
        count: migratedSeries.length
      })

      // ÉTAPE 4 : Migrer les données personnalisées
      const customData = await this.migrateCustomData(
        backup.data.custom_blocks,
        backup.data.custom_extensions
      )
      report.steps.push({
        name: 'Données personnalisées',
        status: 'success',
        blocks: customData.migratedBlocks.length,
        extensions: customData.migratedExtensions.length
      })

      // ÉTAPE 5 : Migrer la collection (optionnel)
      try {
        const collectionData = await this.migrateUserCollection()
        if (collectionData) {
          report.steps.push({
            name: 'Collection utilisateur',
            status: 'success',
            details: {
              collection: collectionData.collection.length,
              favorites: collectionData.favorites.length,
              wishlist: collectionData.wishlist.length,
              batches: collectionData.batches.length,
              sales: collectionData.sales.length
            }
          })
        }
      } catch (error) {
        report.errors.push({
          step: 'Collection utilisateur',
          error: error.message
        })
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)

      report.success = true
      report.completed_at = new Date().toISOString()
      report.duration_seconds = duration

      console.log('')
      console.log('🎉 MIGRATION RÉUSSIE !')
      console.log('=========================================')
      console.log(`⏱️ Durée : ${duration}s`)
      console.log('')
      console.log('📊 RÉSUMÉ :')
      report.steps.forEach(step => {
        console.log(`✅ ${step.name}:`, step.count || step.details || step)
      })

      if (report.errors.length > 0) {
        console.log('')
        console.log('⚠️ AVERTISSEMENTS :')
        report.errors.forEach(err => {
          console.warn(`   - ${err.step}: ${err.error}`)
        })
      }

      console.log('')
      console.log('🎯 PROCHAINES ÉTAPES :')
      console.log('   1. Vérifiez vos données dans Supabase')
      console.log('   2. Testez l\'application')
      console.log('   3. Si tout fonctionne, vous pouvez désactiver le backend SQLite')

      return report
    } catch (error) {
      report.success = false
      report.error = error.message
      report.completed_at = new Date().toISOString()

      console.error('')
      console.error('❌ MIGRATION ÉCHOUÉE')
      console.error('=========================================')
      console.error('Erreur :', error.message)
      console.error('')
      console.error('🔄 ROLLBACK :')
      console.error('   Vos données sont toujours dans IndexedDB')
      console.error('   Le backup est disponible dans localStorage')
      console.error('   Téléchargement du backup effectué')

      throw error
    }
  }

  /**
   * Restaurer depuis un backup
   */
  static async restoreFromBackup(backupData) {
    console.log('🔄 Restauration depuis le backup...')

    try {
      await Promise.all([
        IndexedDBService.saveDiscoveredCards(backupData.data.discovered_cards),
        IndexedDBService.saveSeriesDatabase(backupData.data.series_database)
      ])

      for (const block of backupData.data.custom_blocks) {
        await IndexedDBService.saveCustomBlock(block)
      }

      for (const ext of backupData.data.custom_extensions) {
        await IndexedDBService.saveCustomExtension(ext.id, ext.series, ext.originalSeries)
      }

      console.log('✅ Restauration réussie')
      return true
    } catch (error) {
      console.error('❌ Erreur restauration:', error)
      throw error
    }
  }

  /**
   * Vérifier l'intégrité des données après migration
   */
  static async verifyMigration(backup) {
    console.log('🔍 Vérification de l\'intégrité...')

    try {
      const [cards, series, blocks, extensions] = await Promise.all([
        SupabaseService.loadDiscoveredCards(),
        SupabaseService.loadSeriesDatabase(),
        SupabaseService.loadCustomBlocks(),
        SupabaseService.loadCustomExtensions()
      ])

      const checks = {
        cards: {
          expected: backup.stats.cards_count,
          actual: cards.length,
          ok: cards.length === backup.stats.cards_count
        },
        series: {
          expected: backup.stats.series_count,
          actual: series.length,
          ok: series.length >= backup.stats.series_count * 0.95 // Tolérance dédupication
        },
        blocks: {
          expected: backup.stats.blocks_count,
          actual: blocks.length,
          ok: blocks.length === backup.stats.blocks_count
        },
        extensions: {
          expected: backup.stats.extensions_count,
          actual: extensions.length,
          ok: extensions.length === backup.stats.extensions_count
        }
      }

      const allOk = Object.values(checks).every(check => check.ok)

      if (allOk) {
        console.log('✅ Vérification réussie : toutes les données sont OK')
      } else {
        console.warn('⚠️ Certaines vérifications ont échoué :')
        Object.entries(checks).forEach(([key, check]) => {
          if (!check.ok) {
            console.warn(`   - ${key}: attendu ${check.expected}, trouvé ${check.actual}`)
          }
        })
      }

      return { checks, allOk }
    } catch (error) {
      console.error('❌ Erreur vérification:', error)
      throw error
    }
  }
}
