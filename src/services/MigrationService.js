/**
 * Service de migration des données IndexedDB vers le backend SQLite
 */

import { IndexedDBService } from './IndexedDBService'
import { config } from '@/lib/config'

export class MigrationService {
  static API_BASE_URL = config.API_BASE_URL

  /**
   * Obtenir le token JWT depuis localStorage
   */
  static getAuthToken() {
    return localStorage.getItem('vaultestim_token')
  }

  /**
   * Migrer toutes les données IndexedDB vers le backend
   */
  static async migrateAllData() {
    try {
      console.log('🔄 Début de la migration IndexedDB → Backend SQLite...')

      const token = this.getAuthToken()
      if (!token) {
        throw new Error('Token d\'authentification manquant')
      }

      // Vérifier que IndexedDB a des données
      const stats = await IndexedDBService.getStorageStats()
      console.log('📊 Statistiques IndexedDB:', stats)

      if (stats.cards === 0 && stats.series === 0) {
        console.log('⚠️ Aucune donnée à migrer dans IndexedDB')
        return {
          success: true,
          message: 'Aucune donnée à migrer',
          migrated: {
            cards: 0,
            series: 0,
            blocks: 0,
            extensions: 0
          }
        }
      }

      const migrationResults = {
        cards: 0,
        series: 0,
        blocks: 0,
        extensions: 0,
        errors: []
      }

      // 1. Migrer les cartes découvertes
      try {
        const cards = await IndexedDBService.loadDiscoveredCards()
        if (cards.length > 0) {
          console.log(`📦 Migration de ${cards.length} cartes découvertes...`)
          const response = await this.migrateDiscoveredCards(cards, token)
          migrationResults.cards = response.count
          console.log(`✅ ${response.count} cartes migrées`)
        }
      } catch (error) {
        console.error('❌ Erreur migration cartes:', error)
        migrationResults.errors.push(`Cartes: ${error.message}`)
      }

      // 2. Migrer la base de données des séries
      try {
        const series = await IndexedDBService.loadSeriesDatabase()
        if (series.length > 0) {
          console.log(`📚 Migration de ${series.length} séries...`)
          const response = await this.migrateSeries(series, token)
          migrationResults.series = response.count
          console.log(`✅ ${response.count} séries migrées`)
        }
      } catch (error) {
        console.error('❌ Erreur migration séries:', error)
        migrationResults.errors.push(`Séries: ${error.message}`)
      }

      // 3. Migrer les blocs personnalisés
      try {
        const blocks = await IndexedDBService.loadCustomBlocks()
        if (blocks.length > 0) {
          console.log(`🧱 Migration de ${blocks.length} blocs personnalisés...`)
          const response = await this.migrateCustomBlocks(blocks, token)
          migrationResults.blocks = response.count
          console.log(`✅ ${response.count} blocs migrés`)
        }
      } catch (error) {
        console.error('❌ Erreur migration blocs:', error)
        migrationResults.errors.push(`Blocs: ${error.message}`)
      }

      // 4. Migrer les extensions personnalisées
      try {
        const extensions = await IndexedDBService.loadCustomExtensions()
        if (extensions.length > 0) {
          console.log(`📝 Migration de ${extensions.length} extensions personnalisées...`)
          const response = await this.migrateCustomExtensions(extensions, token)
          migrationResults.extensions = response.count
          console.log(`✅ ${response.count} extensions migrées`)
        }
      } catch (error) {
        console.error('❌ Erreur migration extensions:', error)
        migrationResults.errors.push(`Extensions: ${error.message}`)
      }

      console.log('🎉 Migration terminée!')
      console.log('📊 Résultats:', migrationResults)

      return {
        success: migrationResults.errors.length === 0,
        message: migrationResults.errors.length === 0
          ? 'Migration réussie'
          : `Migration partielle avec ${migrationResults.errors.length} erreurs`,
        migrated: {
          cards: migrationResults.cards,
          series: migrationResults.series,
          blocks: migrationResults.blocks,
          extensions: migrationResults.extensions
        },
        errors: migrationResults.errors
      }
    } catch (error) {
      console.error('❌ Erreur migration globale:', error)
      throw error
    }
  }

  /**
   * Migrer les cartes découvertes
   */
  static async migrateDiscoveredCards(cards, token) {
    const response = await fetch(`${this.API_BASE_URL}/collection/migrate-discovered`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cards })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur migration cartes')
    }

    return await response.json()
  }

  /**
   * Migrer la base de données des séries
   */
  static async migrateSeries(series, token) {
    const response = await fetch(`${this.API_BASE_URL}/collection/migrate-series`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ series })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur migration séries')
    }

    return await response.json()
  }

  /**
   * Migrer les blocs personnalisés
   */
  static async migrateCustomBlocks(blocks, token) {
    const response = await fetch(`${this.API_BASE_URL}/collection/migrate-blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ blocks })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur migration blocs')
    }

    return await response.json()
  }

  /**
   * Migrer les extensions personnalisées
   */
  static async migrateCustomExtensions(extensions, token) {
    const response = await fetch(`${this.API_BASE_URL}/collection/migrate-custom-extensions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ extensions })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur migration extensions')
    }

    return await response.json()
  }

  /**
   * Nettoyer IndexedDB après migration réussie
   */
  static async cleanupIndexedDB() {
    try {
      console.log('🧹 Nettoyage IndexedDB après migration...')
      await IndexedDBService.clearAllData()
      console.log('✅ IndexedDB nettoyée')
      return true
    } catch (error) {
      console.error('❌ Erreur nettoyage IndexedDB:', error)
      return false
    }
  }

  /**
   * Vérifier si des données existent dans IndexedDB
   */
  static async hasIndexedDBData() {
    try {
      const stats = await IndexedDBService.getStorageStats()
      return stats.cards > 0 || stats.series > 0
    } catch (error) {
      console.error('❌ Erreur vérification IndexedDB:', error)
      return false
    }
  }

  /**
   * Vérifier si des données existent dans le backend
   */
  static async hasBackendData(token) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/collection/discovered`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.cards && data.cards.length > 0
    } catch (error) {
      console.error('❌ Erreur vérification backend:', error)
      return false
    }
  }

  /**
   * Déterminer si une migration est nécessaire
   */
  static async needsMigration() {
    try {
      const token = this.getAuthToken()
      if (!token) {
        return false
      }

      const hasIndexedDB = await this.hasIndexedDBData()
      const hasBackend = await this.hasBackendData(token)

      // Migration nécessaire si IndexedDB a des données mais pas le backend
      return hasIndexedDB && !hasBackend
    } catch (error) {
      console.error('❌ Erreur vérification migration:', error)
      return false
    }
  }

  /**
   * Migration automatique au démarrage (si nécessaire)
   */
  static async autoMigrate() {
    try {
      const needsMigration = await this.needsMigration()

      if (needsMigration) {
        console.log('🔄 Migration automatique détectée...')
        const result = await this.migrateAllData()

        if (result.success) {
          console.log('✅ Migration automatique réussie')
          // Optionnel: nettoyer IndexedDB après migration
          // await this.cleanupIndexedDB()
        }

        return result
      }

      console.log('✅ Aucune migration nécessaire')
      return { success: true, message: 'Aucune migration nécessaire' }
    } catch (error) {
      console.error('❌ Erreur migration automatique:', error)
      throw error
    }
  }
}
