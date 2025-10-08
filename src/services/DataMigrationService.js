/**
 * Service de migration des données de l'ancienne IndexedDB locale vers le backend
 */

export class DataMigrationService {
  /**
   * Récupérer toutes les données de l'ancienne IndexedDB locale
   */
  static async getOldLocalData() {
    const oldData = {
      discoveredCards: [],
      seriesDatabase: [],
      customBlocks: [],
      customExtensions: [],
      collection: [],
      favorites: [],
      wishlist: []
    }

    try {
      // Récupérer les données de VaultEstimDB (v3)
      const db = await this.openOldDatabase('VaultEstimDB', 3)

      if (db) {
        // Cartes découvertes
        oldData.discoveredCards = await this.getAllFromStore(db, 'discovered_cards')

        // Base de données des séries
        oldData.seriesDatabase = await this.getAllFromStore(db, 'series_database')

        // Blocs personnalisés
        oldData.customBlocks = await this.getAllFromStore(db, 'custom_blocks')

        // Extensions personnalisées
        oldData.customExtensions = await this.getAllFromStore(db, 'custom_extensions')

        db.close()
      }

      // Récupérer depuis localStorage (fallback pour anciennes versions)
      const localStorageCollection = localStorage.getItem('vaultestim_collection')
      const localStorageFavorites = localStorage.getItem('vaultestim_favorites')
      const localStorageWishlist = localStorage.getItem('vaultestim_wishlist')

      if (localStorageCollection) {
        try {
          oldData.collection = JSON.parse(localStorageCollection)
        } catch (e) {
          console.error('Erreur parsing collection localStorage:', e)
        }
      }

      if (localStorageFavorites) {
        try {
          oldData.favorites = JSON.parse(localStorageFavorites)
        } catch (e) {
          console.error('Erreur parsing favorites localStorage:', e)
        }
      }

      if (localStorageWishlist) {
        try {
          oldData.wishlist = JSON.parse(localStorageWishlist)
        } catch (e) {
          console.error('Erreur parsing wishlist localStorage:', e)
        }
      }

      console.log('📦 Données anciennes récupérées:', {
        discoveredCards: oldData.discoveredCards.length,
        seriesDatabase: oldData.seriesDatabase.length,
        customBlocks: oldData.customBlocks.length,
        customExtensions: oldData.customExtensions.length,
        collection: oldData.collection.length,
        favorites: oldData.favorites.length,
        wishlist: oldData.wishlist.length
      })

      return oldData
    } catch (error) {
      console.error('❌ Erreur récupération données anciennes:', error)
      return oldData
    }
  }

  /**
   * Ouvrir l'ancienne base de données
   */
  static openOldDatabase(dbName, version) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version)

      request.onerror = () => {
        console.warn(`⚠️ Impossible d'ouvrir ${dbName}`)
        resolve(null)
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onupgradeneeded = () => {
        // Ne rien faire, on veut juste lire
      }
    })
  }

  /**
   * Récupérer toutes les données d'un store
   */
  static getAllFromStore(db, storeName) {
    return new Promise((resolve) => {
      try {
        if (!db.objectStoreNames.contains(storeName)) {
          resolve([])
          return
        }

        const transaction = db.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.getAll()

        request.onsuccess = () => {
          resolve(request.result || [])
        }

        request.onerror = () => {
          console.error(`Erreur lecture ${storeName}:`, request.error)
          resolve([])
        }
      } catch (error) {
        console.error(`Erreur accès ${storeName}:`, error)
        resolve([])
      }
    })
  }

  /**
   * Migrer les données vers le backend
   */
  static async migrateToBackend(oldData, apiUrl) {
    const results = {
      success: true,
      migrated: {
        collection: 0,
        favorites: 0,
        wishlist: 0,
        discoveredCards: 0,
        customBlocks: 0
      },
      errors: []
    }

    try {
      const token = localStorage.getItem('vaultestim_token')
      if (!token) {
        throw new Error('Non authentifié')
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      // Migrer la collection
      if (oldData.collection.length > 0) {
        try {
          const response = await fetch(`${apiUrl}/collection/migrate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ cards: oldData.collection })
          })

          if (response.ok) {
            results.migrated.collection = oldData.collection.length
          } else {
            results.errors.push('Erreur migration collection')
          }
        } catch (error) {
          results.errors.push('Erreur migration collection: ' + error.message)
        }
      }

      // Migrer les favoris
      if (oldData.favorites.length > 0) {
        try {
          const response = await fetch(`${apiUrl}/collection/migrate-favorites`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ cards: oldData.favorites })
          })

          if (response.ok) {
            results.migrated.favorites = oldData.favorites.length
          } else {
            results.errors.push('Erreur migration favoris')
          }
        } catch (error) {
          results.errors.push('Erreur migration favoris: ' + error.message)
        }
      }

      // Migrer la wishlist
      if (oldData.wishlist.length > 0) {
        try {
          const response = await fetch(`${apiUrl}/collection/migrate-wishlist`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ cards: oldData.wishlist })
          })

          if (response.ok) {
            results.migrated.wishlist = oldData.wishlist.length
          } else {
            results.errors.push('Erreur migration wishlist')
          }
        } catch (error) {
          results.errors.push('Erreur migration wishlist: ' + error.message)
        }
      }

      // Migrer les cartes découvertes
      if (oldData.discoveredCards.length > 0) {
        try {
          const response = await fetch(`${apiUrl}/collection/migrate-discovered`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ cards: oldData.discoveredCards })
          })

          if (response.ok) {
            results.migrated.discoveredCards = oldData.discoveredCards.length
          } else {
            results.errors.push('Erreur migration cartes découvertes')
          }
        } catch (error) {
          results.errors.push('Erreur migration cartes découvertes: ' + error.message)
        }
      }

      // Migrer la base de données des séries
      if (oldData.seriesDatabase.length > 0) {
        try {
          const response = await fetch(`${apiUrl}/collection/migrate-series`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ series: oldData.seriesDatabase })
          })

          if (response.ok) {
            console.log(`✅ ${oldData.seriesDatabase.length} séries migrées`)
          } else {
            results.errors.push('Erreur migration base de séries')
          }
        } catch (error) {
          results.errors.push('Erreur migration base de séries: ' + error.message)
        }
      }

      // Migrer les blocs personnalisés
      if (oldData.customBlocks.length > 0) {
        try {
          const response = await fetch(`${apiUrl}/collection/migrate-blocks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ blocks: oldData.customBlocks })
          })

          if (response.ok) {
            results.migrated.customBlocks = oldData.customBlocks.length
          } else {
            results.errors.push('Erreur migration blocs personnalisés')
          }
        } catch (error) {
          results.errors.push('Erreur migration blocs personnalisés: ' + error.message)
        }
      }

      // Migrer les extensions personnalisées
      if (oldData.customExtensions.length > 0) {
        try {
          const response = await fetch(`${apiUrl}/collection/migrate-custom-extensions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ extensions: oldData.customExtensions })
          })

          if (response.ok) {
            console.log(`✅ ${oldData.customExtensions.length} extensions personnalisées migrées`)
          } else {
            results.errors.push('Erreur migration extensions personnalisées')
          }
        } catch (error) {
          results.errors.push('Erreur migration extensions personnalisées: ' + error.message)
        }
      }

      console.log('✅ Migration terminée:', results)
      return results
    } catch (error) {
      console.error('❌ Erreur migration:', error)
      results.success = false
      results.errors.push(error.message)
      return results
    }
  }

  /**
   * Vérifier si des données anciennes existent
   */
  static async hasOldData() {
    try {
      // Vérifier localStorage
      const hasLocalStorage =
        localStorage.getItem('vaultestim_collection') ||
        localStorage.getItem('vaultestim_favorites') ||
        localStorage.getItem('vaultestim_wishlist')

      if (hasLocalStorage) return true

      // Vérifier IndexedDB
      const db = await this.openOldDatabase('VaultEstimDB', 3)
      if (db) {
        const discoveredCards = await this.getAllFromStore(db, 'discovered_cards')
        const customBlocks = await this.getAllFromStore(db, 'custom_blocks')
        db.close()

        return discoveredCards.length > 0 || customBlocks.length > 0
      }

      return false
    } catch (error) {
      console.error('Erreur vérification anciennes données:', error)
      return false
    }
  }
}
