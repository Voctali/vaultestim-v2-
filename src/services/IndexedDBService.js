/**
 * Service IndexedDB pour stockage illimité des cartes Pokémon
 * Remplace localStorage pour éviter les limitations de quota
 */

export class IndexedDBService {
  static DB_NAME = 'VaultEstimDB'
  static DB_VERSION = 3
  static STORES = {
    CARDS: 'discovered_cards',
    SERIES: 'series_database',
    CACHE: 'search_cache',
    METADATA: 'metadata',
    CUSTOM_BLOCKS: 'custom_blocks',
    CUSTOM_EXTENSIONS: 'custom_extensions'
  }

  static db = null

  /**
   * Initialiser la base de données IndexedDB
   */
  static async initDB() {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => {
        console.error('❌ Erreur ouverture IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB initialisée avec succès')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        console.log('🔄 Mise à jour structure IndexedDB...')

        // Store pour les cartes découvertes
        if (!db.objectStoreNames.contains(this.STORES.CARDS)) {
          const cardsStore = db.createObjectStore(this.STORES.CARDS, { keyPath: 'id' })
          cardsStore.createIndex('name', 'name', { unique: false })
          cardsStore.createIndex('setId', 'set.id', { unique: false })
          cardsStore.createIndex('source', '_source', { unique: false })
          console.log('📦 Store cartes créé')
        }

        // Store pour les séries/extensions
        if (!db.objectStoreNames.contains(this.STORES.SERIES)) {
          const seriesStore = db.createObjectStore(this.STORES.SERIES, { keyPath: 'id' })
          seriesStore.createIndex('name', 'name', { unique: false })
          seriesStore.createIndex('year', 'year', { unique: false })
          console.log('📚 Store séries créé')
        }

        // Store pour le cache de recherche
        if (!db.objectStoreNames.contains(this.STORES.CACHE)) {
          const cacheStore = db.createObjectStore(this.STORES.CACHE, { keyPath: 'key' })
          cacheStore.createIndex('expires', 'expires', { unique: false })
          console.log('💾 Store cache créé')
        }

        // Store pour les métadonnées
        if (!db.objectStoreNames.contains(this.STORES.METADATA)) {
          const metadataStore = db.createObjectStore(this.STORES.METADATA, { keyPath: 'key' })
          console.log('🏷️ Store métadonnées créé')
        }

        // Store pour les blocs personnalisés
        if (!db.objectStoreNames.contains(this.STORES.CUSTOM_BLOCKS)) {
          const blocksStore = db.createObjectStore(this.STORES.CUSTOM_BLOCKS, { keyPath: 'id' })
          blocksStore.createIndex('name', 'name', { unique: false })
          blocksStore.createIndex('createdAt', 'createdAt', { unique: false })
          console.log('🧱 Store blocs personnalisés créé')
        }

        // Store pour les extensions personnalisées (déplacements de blocs)
        if (!db.objectStoreNames.contains(this.STORES.CUSTOM_EXTENSIONS)) {
          const extensionsStore = db.createObjectStore(this.STORES.CUSTOM_EXTENSIONS, { keyPath: 'id' })
          extensionsStore.createIndex('name', 'name', { unique: false })
          extensionsStore.createIndex('series', 'series', { unique: false })
          extensionsStore.createIndex('originalSeries', 'originalSeries', { unique: false })
          extensionsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          console.log('📝 Store extensions personnalisées créé')
        }
      }
    })
  }

  /**
   * Sauvegarder toutes les cartes découvertes (optimisé pour gros volumes)
   */
  static async saveDiscoveredCards(cards) {
    try {
      await this.initDB()

      // Vider le store d'abord
      await this.clearStore(this.STORES.CARDS)

      // Traitement par batch pour éviter les timeouts de transaction
      const BATCH_SIZE = 100
      let savedCount = 0

      for (let i = 0; i < cards.length; i += BATCH_SIZE) {
        const batch = cards.slice(i, i + BATCH_SIZE)

        // Nouvelle transaction pour chaque batch
        const transaction = this.db.transaction([this.STORES.CARDS], 'readwrite')
        const store = transaction.objectStore(this.STORES.CARDS)

        const batchPromises = batch.map(card => {
          return new Promise((resolve, reject) => {
            const request = store.add({
              ...card,
              _savedAt: Date.now()
            })
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        })

        // Attendre que ce batch soit terminé avant de continuer
        await Promise.all(batchPromises)
        savedCount += batch.length

        console.log(`💾 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} cartes sauvegardées (${savedCount}/${cards.length})`)

        // Petite pause pour éviter de surcharger le navigateur
        if (i + BATCH_SIZE < cards.length) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      console.log(`✅ ${savedCount} cartes complètes sauvegardées dans IndexedDB (stockage illimité)`)
      return true
    } catch (error) {
      console.error('❌ Erreur sauvegarde cartes IndexedDB:', error)
      return false
    }
  }

  /**
   * Charger toutes les cartes découvertes
   */
  static async loadDiscoveredCards() {
    try {
      await this.initDB()
      const transaction = this.db.transaction([this.STORES.CARDS], 'readonly')
      const store = transaction.objectStore(this.STORES.CARDS)

      return new Promise((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => {
          const cards = request.result || []
          console.log(`📦 ${cards.length} cartes chargées depuis IndexedDB`)
          resolve(cards)
        }
        request.onerror = () => {
          console.error('❌ Erreur chargement cartes IndexedDB:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur chargement IndexedDB:', error)
      return []
    }
  }

  /**
   * Ajouter de nouvelles cartes (sans doublons, optimisé pour gros volumes)
   */
  static async addDiscoveredCards(newCards) {
    try {
      await this.initDB()

      // Traitement par batch pour éviter les timeouts
      const BATCH_SIZE = 50
      let totalAddedCount = 0

      for (let i = 0; i < newCards.length; i += BATCH_SIZE) {
        const batch = newCards.slice(i, i + BATCH_SIZE)

        // Nouvelle transaction pour chaque batch
        const transaction = this.db.transaction([this.STORES.CARDS], 'readwrite')
        const store = transaction.objectStore(this.STORES.CARDS)

        let batchAddedCount = 0
        const batchPromises = batch.map(card => {
          return new Promise((resolve) => {
            // Vérifier si la carte existe déjà
            const checkRequest = store.get(card.id)
            checkRequest.onsuccess = () => {
              if (!checkRequest.result) {
                // Carte n'existe pas, l'ajouter
                const addRequest = store.add({
                  ...card,
                  _savedAt: Date.now()
                })
                addRequest.onsuccess = () => {
                  batchAddedCount++
                  resolve()
                }
                addRequest.onerror = () => resolve() // Ignorer les erreurs d'ajout
              } else {
                resolve() // Carte existe déjà
              }
            }
            checkRequest.onerror = () => resolve()
          })
        })

        await Promise.all(batchPromises)
        totalAddedCount += batchAddedCount

        console.log(`📦 Batch ajout ${Math.floor(i / BATCH_SIZE) + 1}: ${batchAddedCount} nouvelles cartes ajoutées (${totalAddedCount} total)`)

        // Petite pause
        if (i + BATCH_SIZE < newCards.length) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      console.log(`✅ ${totalAddedCount} nouvelles cartes ajoutées à IndexedDB`)
      return totalAddedCount
    } catch (error) {
      console.error('❌ Erreur ajout cartes IndexedDB:', error)
      return 0
    }
  }

  /**
   * Mettre à jour une carte découverte dans IndexedDB
   */
  static async updateDiscoveredCard(cardId, updates) {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORES.CARDS], 'readwrite')
        const store = transaction.objectStore(this.STORES.CARDS)

        // Récupérer la carte existante
        const getRequest = store.get(cardId)

        getRequest.onsuccess = () => {
          const existingCard = getRequest.result

          if (!existingCard) {
            console.warn(`⚠️ Carte ${cardId} non trouvée dans IndexedDB`)
            reject(new Error(`Carte ${cardId} non trouvée`))
            return
          }

          // Fusionner les mises à jour
          const updatedCard = {
            ...existingCard,
            ...updates,
            _updatedAt: Date.now()
          }

          // Sauvegarder la carte mise à jour
          const putRequest = store.put(updatedCard)

          putRequest.onsuccess = () => {
            console.log(`✅ Carte ${cardId} mise à jour dans IndexedDB`)
            resolve(updatedCard)
          }

          putRequest.onerror = () => {
            console.error(`❌ Erreur mise à jour carte ${cardId}:`, putRequest.error)
            reject(putRequest.error)
          }
        }

        getRequest.onerror = () => {
          console.error(`❌ Erreur récupération carte ${cardId}:`, getRequest.error)
          reject(getRequest.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur updateDiscoveredCard:', error)
      throw error
    }
  }

  /**
   * Sauvegarder la base de données des séries (optimisé pour gros volumes)
   */
  static async saveSeriesDatabase(series) {
    try {
      await this.initDB()

      // Vider le store d'abord
      await this.clearStore(this.STORES.SERIES)

      // Dédupliquer les séries par ID pour éviter l'erreur "Key already exists"
      const uniqueSeries = []
      const seenIds = new Set()

      series.forEach((serie, index) => {
        // Générer un ID unique si absent ou dupliquer
        let serieId = serie.id
        if (!serieId || seenIds.has(serieId)) {
          serieId = `${serie.id || 'unknown'}-${index}`
          console.warn(`⚠️ Série avec ID dupliqué/manquant détectée: ${serie.name || 'Sans nom'} → nouvel ID: ${serieId}`)
        }

        seenIds.add(serieId)
        uniqueSeries.push({
          ...serie,
          id: serieId // Utiliser l'ID unique
        })
      })

      console.log(`📚 ${uniqueSeries.length} séries uniques après déduplication (${series.length - uniqueSeries.length} doublons supprimés)`)

      // Traitement par batch pour les séries aussi
      const BATCH_SIZE = 50
      let savedCount = 0

      for (let i = 0; i < uniqueSeries.length; i += BATCH_SIZE) {
        const batch = uniqueSeries.slice(i, i + BATCH_SIZE)

        // Nouvelle transaction pour chaque batch
        const transaction = this.db.transaction([this.STORES.SERIES], 'readwrite')
        const store = transaction.objectStore(this.STORES.SERIES)

        const batchPromises = batch.map(serie => {
          return new Promise((resolve, reject) => {
            // Utiliser put() au lieu de add() pour gérer les doublons résiduels
            const request = store.put({
              ...serie,
              _savedAt: Date.now()
            })
            request.onsuccess = () => resolve()
            request.onerror = () => {
              console.warn(`⚠️ Erreur sauvegarde série ${serie.id}:`, request.error)
              resolve() // Continuer même en cas d'erreur
            }
          })
        })

        // Attendre que ce batch soit terminé
        await Promise.all(batchPromises)
        savedCount += batch.length

        console.log(`📚 Batch séries ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} séries sauvegardées (${savedCount}/${uniqueSeries.length})`)

        // Petite pause
        if (i + BATCH_SIZE < uniqueSeries.length) {
          await new Promise(resolve => setTimeout(resolve, 5))
        }
      }

      console.log(`✅ ${savedCount} séries sauvegardées dans IndexedDB`)
      return true
    } catch (error) {
      console.error('❌ Erreur sauvegarde séries IndexedDB:', error)
      return false
    }
  }

  /**
   * Charger la base de données des séries
   */
  static async loadSeriesDatabase() {
    try {
      await this.initDB()
      const transaction = this.db.transaction([this.STORES.SERIES], 'readonly')
      const store = transaction.objectStore(this.STORES.SERIES)

      return new Promise((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => {
          const series = request.result || []
          console.log(`📚 ${series.length} séries chargées depuis IndexedDB`)
          resolve(series)
        }
        request.onerror = () => {
          console.error('❌ Erreur chargement séries IndexedDB:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur chargement séries IndexedDB:', error)
      return []
    }
  }

  /**
   * Rechercher des cartes par nom (pour recherche locale)
   */
  static async searchCardsByName(query) {
    try {
      await this.initDB()
      const transaction = this.db.transaction([this.STORES.CARDS], 'readonly')
      const store = transaction.objectStore(this.STORES.CARDS)

      return new Promise((resolve) => {
        const request = store.getAll()
        request.onsuccess = () => {
          const allCards = request.result || []
          const queryLower = query.toLowerCase()

          const matchingCards = allCards.filter(card => {
            return card.name?.toLowerCase().includes(queryLower) ||
                   card.name_fr?.toLowerCase().includes(queryLower)
          })

          console.log(`🔍 IndexedDB recherche "${query}": ${matchingCards.length} résultats`)
          resolve(matchingCards)
        }
        request.onerror = () => resolve([])
      })
    } catch (error) {
      console.error('❌ Erreur recherche IndexedDB:', error)
      return []
    }
  }

  /**
   * Obtenir les statistiques de stockage
   */
  static async getStorageStats() {
    try {
      await this.initDB()

      const cardsCount = await this.getStoreCount(this.STORES.CARDS)
      const seriesCount = await this.getStoreCount(this.STORES.SERIES)

      // Estimer la taille (IndexedDB n'a pas d'API directe pour la taille)
      const estimatedSize = cardsCount * 5 // ~5KB par carte en moyenne

      return {
        cards: cardsCount,
        series: seriesCount,
        estimatedSizeMB: (estimatedSize / 1024).toFixed(2),
        unlimited: true
      }
    } catch (error) {
      console.error('❌ Erreur stats IndexedDB:', error)
      return { cards: 0, series: 0, estimatedSizeMB: 0, unlimited: true }
    }
  }

  /**
   * Compter les éléments dans un store
   */
  static async getStoreCount(storeName) {
    return new Promise((resolve) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(0)
    })
  }

  /**
   * Vider un store complètement
   */
  static async clearStore(storeName) {
    return new Promise((resolve) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
    })
  }

  /**
   * Migrer les données depuis localStorage vers IndexedDB
   */
  static async migrateFromLocalStorage() {
    try {
      console.log('🔄 Migration localStorage → IndexedDB...')

      // Migrer les cartes découvertes
      const savedCards = localStorage.getItem('vaultestim_discovered_cards')
      if (savedCards) {
        const cards = JSON.parse(savedCards)
        await this.saveDiscoveredCards(cards)
        console.log(`✅ ${cards.length} cartes migrées`)
      }

      // Migrer les séries
      const savedSeries = localStorage.getItem('vaultestim_series_database')
      if (savedSeries) {
        const series = JSON.parse(savedSeries)
        await this.saveSeriesDatabase(series)
        console.log(`✅ ${series.length} séries migrées`)
      }

      // Optionnel : supprimer les anciennes données localStorage
      // localStorage.removeItem('vaultestim_discovered_cards')
      // localStorage.removeItem('vaultestim_series_database')

      console.log('✅ Migration terminée avec succès')
      return true
    } catch (error) {
      console.error('❌ Erreur migration:', error)
      return false
    }
  }

  /**
   * Nettoyer la base de données (pour maintenance)
   */
  static async clearAllData() {
    try {
      await this.initDB()
      await Promise.all([
        this.clearStore(this.STORES.CARDS),
        this.clearStore(this.STORES.SERIES),
        this.clearStore(this.STORES.CACHE),
        this.clearStore(this.STORES.METADATA),
        this.clearStore(this.STORES.CUSTOM_BLOCKS),
        this.clearStore(this.STORES.CUSTOM_EXTENSIONS)
      ])
      console.log('🗑️ Toutes les données IndexedDB supprimées')
      return true
    } catch (error) {
      console.error('❌ Erreur nettoyage IndexedDB:', error)
      return false
    }
  }

  /**
   * Sauvegarder un bloc personnalisé
   */
  static async saveCustomBlock(block) {
    try {
      await this.initDB()

      // Ajouter timestamp de création
      const blockWithTimestamp = {
        ...block,
        createdAt: block.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const transaction = this.db.transaction([this.STORES.CUSTOM_BLOCKS], 'readwrite')
      const store = transaction.objectStore(this.STORES.CUSTOM_BLOCKS)

      return new Promise((resolve, reject) => {
        const request = store.put(blockWithTimestamp)

        request.onsuccess = () => {
          console.log(`✅ Bloc personnalisé sauvegardé: ${block.name}`)
          resolve(true)
        }

        request.onerror = () => {
          console.error('❌ Erreur sauvegarde bloc:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur sauvegarde bloc personnalisé:', error)
      return false
    }
  }

  /**
   * Charger tous les blocs personnalisés
   */
  static async loadCustomBlocks() {
    try {
      await this.initDB()

      const transaction = this.db.transaction([this.STORES.CUSTOM_BLOCKS], 'readonly')
      const store = transaction.objectStore(this.STORES.CUSTOM_BLOCKS)

      return new Promise((resolve, reject) => {
        const request = store.getAll()

        request.onsuccess = () => {
          const blocks = request.result || []
          console.log(`📦 ${blocks.length} blocs personnalisés chargés`)
          resolve(blocks)
        }

        request.onerror = () => {
          console.error('❌ Erreur chargement blocs:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur chargement blocs personnalisés:', error)
      return []
    }
  }

  /**
   * Supprimer un bloc personnalisé
   */
  static async deleteCustomBlock(blockId) {
    try {
      await this.initDB()

      const transaction = this.db.transaction([this.STORES.CUSTOM_BLOCKS], 'readwrite')
      const store = transaction.objectStore(this.STORES.CUSTOM_BLOCKS)

      return new Promise((resolve, reject) => {
        const request = store.delete(blockId)

        request.onsuccess = () => {
          console.log(`🗑️ Bloc personnalisé supprimé: ${blockId}`)
          resolve(true)
        }

        request.onerror = () => {
          console.error('❌ Erreur suppression bloc:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur suppression bloc personnalisé:', error)
      return false
    }
  }

  /**
   * Mettre à jour un bloc personnalisé
   */
  static async updateCustomBlock(blockId, updates) {
    try {
      await this.initDB()

      const transaction = this.db.transaction([this.STORES.CUSTOM_BLOCKS], 'readwrite')
      const store = transaction.objectStore(this.STORES.CUSTOM_BLOCKS)

      // Récupérer le bloc existant
      const getRequest = store.get(blockId)

      return new Promise((resolve, reject) => {
        getRequest.onsuccess = () => {
          const existingBlock = getRequest.result

          if (!existingBlock) {
            reject(new Error(`Bloc ${blockId} introuvable`))
            return
          }

          // Fusionner les mises à jour
          const updatedBlock = {
            ...existingBlock,
            ...updates,
            updatedAt: new Date().toISOString()
          }

          const putRequest = store.put(updatedBlock)

          putRequest.onsuccess = () => {
            console.log(`✅ Bloc personnalisé mis à jour: ${blockId}`)
            resolve(true)
          }

          putRequest.onerror = () => {
            console.error('❌ Erreur mise à jour bloc:', putRequest.error)
            reject(putRequest.error)
          }
        }

        getRequest.onerror = () => {
          console.error('❌ Erreur récupération bloc:', getRequest.error)
          reject(getRequest.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur mise à jour bloc personnalisé:', error)
      return false
    }
  }

  /**
   * Sauvegarder une extension personnalisée (avec nouveau bloc)
   */
  static async saveCustomExtension(extensionId, newSeries, originalSeries = null) {
    try {
      await this.initDB()

      const customExtension = {
        id: extensionId,
        series: newSeries, // Nouveau bloc assigné
        originalSeries: originalSeries || 'Non défini', // Bloc d'origine
        updatedAt: new Date().toISOString()
      }

      const transaction = this.db.transaction([this.STORES.CUSTOM_EXTENSIONS], 'readwrite')
      const store = transaction.objectStore(this.STORES.CUSTOM_EXTENSIONS)

      return new Promise((resolve, reject) => {
        const request = store.put(customExtension)

        request.onsuccess = () => {
          console.log(`✅ Extension personnalisée sauvegardée: ${extensionId} → ${newSeries}`)
          resolve(true)
        }

        request.onerror = () => {
          console.error('❌ Erreur sauvegarde extension:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur sauvegarde extension personnalisée:', error)
      return false
    }
  }

  /**
   * Charger toutes les extensions personnalisées
   */
  static async loadCustomExtensions() {
    try {
      await this.initDB()

      const transaction = this.db.transaction([this.STORES.CUSTOM_EXTENSIONS], 'readonly')
      const store = transaction.objectStore(this.STORES.CUSTOM_EXTENSIONS)

      return new Promise((resolve, reject) => {
        const request = store.getAll()

        request.onsuccess = () => {
          const extensions = request.result || []
          console.log(`📝 ${extensions.length} extensions personnalisées chargées`)
          resolve(extensions)
        }

        request.onerror = () => {
          console.error('❌ Erreur chargement extensions:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur chargement extensions personnalisées:', error)
      return []
    }
  }

  /**
   * Supprimer une extension personnalisée (revenir au bloc d'origine)
   */
  static async deleteCustomExtension(extensionId) {
    try {
      await this.initDB()

      const transaction = this.db.transaction([this.STORES.CUSTOM_EXTENSIONS], 'readwrite')
      const store = transaction.objectStore(this.STORES.CUSTOM_EXTENSIONS)

      return new Promise((resolve, reject) => {
        const request = store.delete(extensionId)

        request.onsuccess = () => {
          console.log(`🗑️ Extension personnalisée supprimée: ${extensionId}`)
          resolve(true)
        }

        request.onerror = () => {
          console.error('❌ Erreur suppression extension:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur suppression extension personnalisée:', error)
      return false
    }
  }

  /**
   * Obtenir le bloc personnalisé d'une extension (si elle a été déplacée)
   */
  static async getCustomExtensionSeries(extensionId) {
    try {
      await this.initDB()

      const transaction = this.db.transaction([this.STORES.CUSTOM_EXTENSIONS], 'readonly')
      const store = transaction.objectStore(this.STORES.CUSTOM_EXTENSIONS)

      return new Promise((resolve, reject) => {
        const request = store.get(extensionId)

        request.onsuccess = () => {
          const customExtension = request.result
          resolve(customExtension ? customExtension.series : null)
        }

        request.onerror = () => {
          console.error('❌ Erreur récupération extension:', request.error)
          resolve(null)
        }
      })
    } catch (error) {
      console.error('❌ Erreur récupération extension personnalisée:', error)
      return null
    }
  }

  /**
   * Supprimer une extension de la base de données locale
   */
  static async deleteExtensionFromDatabase(extensionId) {
    try {
      await this.initDB()

      // Supprimer l'extension de la série database
      const transaction = this.db.transaction([this.STORES.SERIES], 'readwrite')
      const store = transaction.objectStore(this.STORES.SERIES)

      return new Promise((resolve, reject) => {
        const request = store.delete(extensionId)

        request.onsuccess = () => {
          console.log(`🗑️ Extension supprimée de la base locale: ${extensionId}`)
          resolve(true)
        }

        request.onerror = () => {
          console.error('❌ Erreur suppression extension:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur suppression extension de la base:', error)
      return false
    }
  }

  /**
   * Supprimer toutes les cartes d'une extension
   */
  static async deleteCardsFromExtension(extensionId) {
    try {
      await this.initDB()

      const transaction = this.db.transaction([this.STORES.CARDS], 'readwrite')
      const store = transaction.objectStore(this.STORES.CARDS)

      // Récupérer toutes les cartes pour filtrer celles de l'extension
      return new Promise((resolve, reject) => {
        const getAllRequest = store.getAll()

        getAllRequest.onsuccess = () => {
          const allCards = getAllRequest.result
          const cardsToDelete = allCards.filter(card =>
            card.set?.id === extensionId || card.setId === extensionId
          )

          // Supprimer chaque carte de l'extension
          let deletedCount = 0
          const deletePromises = cardsToDelete.map(card => {
            return new Promise((resolveDelete) => {
              const deleteRequest = store.delete(card.id)
              deleteRequest.onsuccess = () => {
                deletedCount++
                resolveDelete()
              }
              deleteRequest.onerror = () => resolveDelete() // Continuer même en cas d'erreur
            })
          })

          Promise.all(deletePromises).then(() => {
            console.log(`🗑️ ${deletedCount} cartes supprimées de l'extension ${extensionId}`)
            resolve(deletedCount)
          })
        }

        getAllRequest.onerror = () => {
          console.error('❌ Erreur récupération cartes:', getAllRequest.error)
          reject(getAllRequest.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur suppression cartes extension:', error)
      return 0
    }
  }

  /**
   * Supprimer complètement une extension (extension + toutes ses cartes)
   */
  static async deleteCompleteExtension(extensionId) {
    try {
      await this.initDB()

      // Supprimer d'abord toutes les cartes de l'extension
      const deletedCardsCount = await this.deleteCardsFromExtension(extensionId)

      // Puis supprimer l'extension elle-même
      const extensionDeleted = await this.deleteExtensionFromDatabase(extensionId)

      // Supprimer aussi l'extension personnalisée si elle existe
      await this.deleteCustomExtension(extensionId)

      console.log(`🗑️ Extension complète supprimée: ${extensionId} (${deletedCardsCount} cartes)`)
      return { extensionDeleted, deletedCardsCount }
    } catch (error) {
      console.error('❌ Erreur suppression extension complète:', error)
      return { extensionDeleted: false, deletedCardsCount: 0 }
    }
  }

  /**
   * Supprimer un bloc complet (toutes ses extensions et cartes)
   */
  static async deleteCompleteBlock(blockName, extensions = []) {
    try {
      await this.initDB()

      let totalDeletedCards = 0
      let deletedExtensions = 0

      // Supprimer toutes les extensions du bloc
      for (const extension of extensions) {
        const result = await this.deleteCompleteExtension(extension.id)
        if (result.extensionDeleted) {
          deletedExtensions++
          totalDeletedCards += result.deletedCardsCount
        }
      }

      // Supprimer le bloc personnalisé s'il existe
      const customBlockId = blockName.replace(/\s+/g, '-').toLowerCase()
      await this.deleteCustomBlock(customBlockId)

      console.log(`🗑️ Bloc complet supprimé: ${blockName} (${deletedExtensions} extensions, ${totalDeletedCards} cartes)`)
      return { deletedExtensions, totalDeletedCards }
    } catch (error) {
      console.error('❌ Erreur suppression bloc complet:', error)
      return { deletedExtensions: 0, totalDeletedCards: 0 }
    }
  }
}