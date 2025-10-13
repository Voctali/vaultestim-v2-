/**
 * Service de cache local pour les cartes avec IndexedDB
 * Évite de recharger toute la base de données à chaque connexion
 */

const DB_NAME = 'VaultEstim_CardCache'
const DB_VERSION = 1
const STORE_NAME = 'cards'
const METADATA_STORE = 'metadata'

export class CardCacheService {
  static db = null

  /**
   * Initialiser la base de données IndexedDB
   */
  static async initDB() {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('❌ Erreur ouverture IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB CardCache initialisée')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Store pour les cartes
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const cardStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          cardStore.createIndex('setId', 'set.id', { unique: false })
          cardStore.createIndex('name', 'name', { unique: false })
          cardStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          console.log('📦 Store "cards" créé avec index')
        }

        // Store pour les métadonnées (timestamps, version, etc.)
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' })
          console.log('📦 Store "metadata" créé')
        }
      }
    })
  }

  /**
   * Récupérer toutes les cartes du cache local
   */
  static async getAllCards() {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAll()

        request.onsuccess = () => {
          const cards = request.result || []
          console.log(`📦 ${cards.length} cartes chargées depuis le cache IndexedDB`)
          resolve(cards)
        }

        request.onerror = () => {
          console.error('❌ Erreur lecture cache:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur getAllCards:', error)
      return []
    }
  }

  /**
   * Sauvegarder plusieurs cartes dans le cache (batch)
   */
  static async saveCards(cards) {
    try {
      if (!cards || cards.length === 0) return 0

      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const timestamp = new Date().toISOString()

        let savedCount = 0

        // Ajouter un timestamp à chaque carte
        cards.forEach(card => {
          const cardWithTimestamp = {
            ...card,
            cachedAt: timestamp
          }
          store.put(cardWithTimestamp)
          savedCount++
        })

        transaction.oncomplete = () => {
          console.log(`✅ ${savedCount} cartes sauvegardées dans le cache`)
          resolve(savedCount)
        }

        transaction.onerror = () => {
          console.error('❌ Erreur sauvegarde cache:', transaction.error)
          reject(transaction.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur saveCards:', error)
      return 0
    }
  }

  /**
   * Supprimer une carte du cache
   */
  static async deleteCard(cardId) {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(cardId)

        request.onsuccess = () => {
          console.log(`🗑️ Carte ${cardId} supprimée du cache`)
          resolve(true)
        }

        request.onerror = () => {
          console.error('❌ Erreur suppression carte:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur deleteCard:', error)
      return false
    }
  }

  /**
   * Vider complètement le cache
   */
  static async clearCache() {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.clear()

        request.onsuccess = () => {
          console.log('🧹 Cache de cartes vidé')
          resolve(true)
        }

        request.onerror = () => {
          console.error('❌ Erreur vidage cache:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur clearCache:', error)
      return false
    }
  }

  /**
   * Récupérer les métadonnées (timestamp dernière sync, version, etc.)
   */
  static async getMetadata(key) {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([METADATA_STORE], 'readonly')
        const store = transaction.objectStore(METADATA_STORE)
        const request = store.get(key)

        request.onsuccess = () => {
          resolve(request.result?.value || null)
        }

        request.onerror = () => {
          console.error('❌ Erreur lecture metadata:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur getMetadata:', error)
      return null
    }
  }

  /**
   * Sauvegarder une métadonnée
   */
  static async setMetadata(key, value) {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([METADATA_STORE], 'readwrite')
        const store = transaction.objectStore(METADATA_STORE)
        const request = store.put({ key, value, updatedAt: new Date().toISOString() })

        request.onsuccess = () => {
          console.log(`📝 Metadata "${key}" sauvegardée:`, value)
          resolve(true)
        }

        request.onerror = () => {
          console.error('❌ Erreur sauvegarde metadata:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur setMetadata:', error)
      return false
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  static async getCacheStats() {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const countRequest = store.count()

        countRequest.onsuccess = async () => {
          const cardCount = countRequest.result
          const lastSync = await this.getMetadata('lastSyncTimestamp')
          const cacheVersion = await this.getMetadata('cacheVersion')

          const stats = {
            cardCount,
            lastSync,
            cacheVersion: cacheVersion || '1.0.0',
            storage: 'IndexedDB (illimité)'
          }

          console.log('📊 Stats cache:', stats)
          resolve(stats)
        }

        countRequest.onerror = () => {
          reject(countRequest.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur getCacheStats:', error)
      return {
        cardCount: 0,
        lastSync: null,
        cacheVersion: '1.0.0',
        storage: 'IndexedDB'
      }
    }
  }

  /**
   * Vérifier si le cache existe et contient des données
   */
  static async hasCachedData() {
    try {
      const stats = await this.getCacheStats()
      return stats.cardCount > 0
    } catch (error) {
      console.error('❌ Erreur hasCachedData:', error)
      return false
    }
  }

  /**
   * Obtenir le timestamp de la dernière synchronisation
   */
  static async getLastSyncTimestamp() {
    return await this.getMetadata('lastSyncTimestamp')
  }

  /**
   * Mettre à jour le timestamp de la dernière synchronisation
   */
  static async updateLastSyncTimestamp() {
    const timestamp = new Date().toISOString()
    await this.setMetadata('lastSyncTimestamp', timestamp)
    console.log('🕐 Timestamp de sync mis à jour:', timestamp)
    return timestamp
  }
}
