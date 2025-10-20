/**
 * Service pour gérer les données CardMarket locales
 * Charge les fichiers JSON et les stocke dans IndexedDB pour matching rapide
 */

export class CardMarketDataService {
  static DB_NAME = 'VaultEstim_CardMarket'
  static DB_VERSION = 1
  static STORES = {
    SINGLES: 'singles',        // Cartes individuelles
    NONSINGLES: 'nonsingles',  // Produits scellés
    PRICES: 'prices',          // Guide des prix
    METADATA: 'metadata'       // Métadonnées (date import, etc.)
  }

  /**
   * Ouvrir la base de données IndexedDB
   */
  static async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Store pour les cartes singles
        if (!db.objectStoreNames.contains(this.STORES.SINGLES)) {
          const singlesStore = db.createObjectStore(this.STORES.SINGLES, { keyPath: 'idProduct' })
          singlesStore.createIndex('name', 'name', { unique: false })
          singlesStore.createIndex('idExpansion', 'idExpansion', { unique: false })
          singlesStore.createIndex('idMetacard', 'idMetacard', { unique: false })
          console.log('✅ Store "singles" créé')
        }

        // Store pour les produits scellés
        if (!db.objectStoreNames.contains(this.STORES.NONSINGLES)) {
          const nonsingleStore = db.createObjectStore(this.STORES.NONSINGLES, { keyPath: 'idProduct' })
          nonsingleStore.createIndex('name', 'name', { unique: false })
          nonsingleStore.createIndex('idExpansion', 'idExpansion', { unique: false })
          nonsingleStore.createIndex('idCategory', 'idCategory', { unique: false })
          console.log('✅ Store "nonsingles" créé')
        }

        // Store pour les prix
        if (!db.objectStoreNames.contains(this.STORES.PRICES)) {
          const pricesStore = db.createObjectStore(this.STORES.PRICES, { keyPath: 'idProduct' })
          pricesStore.createIndex('idCategory', 'idCategory', { unique: false })
          console.log('✅ Store "prices" créé')
        }

        // Store pour les métadonnées
        if (!db.objectStoreNames.contains(this.STORES.METADATA)) {
          db.createObjectStore(this.STORES.METADATA, { keyPath: 'key' })
          console.log('✅ Store "metadata" créé')
        }
      }
    })
  }

  /**
   * Importer les données depuis les fichiers JSON
   * @param {object} files - Fichiers JSON chargés { singles, nonsingles, prices }
   */
  static async importFromJSON(files) {
    console.log('📥 Début import CardMarket...')

    const db = await this.openDB()
    const startTime = Date.now()

    try {
      // 1. Importer les singles
      if (files.singles?.products) {
        console.log(`📦 Import ${files.singles.products.length} cartes singles...`)
        await this._bulkImport(db, this.STORES.SINGLES, files.singles.products, 1000)
        console.log(`✅ Singles importés`)
      }

      // 2. Importer les produits scellés
      if (files.nonsingles?.products) {
        console.log(`📦 Import ${files.nonsingles.products.length} produits scellés...`)
        await this._bulkImport(db, this.STORES.NONSINGLES, files.nonsingles.products, 500)
        console.log(`✅ Produits scellés importés`)
      }

      // 3. Importer les prix
      if (files.prices?.priceGuides) {
        console.log(`💰 Import ${files.prices.priceGuides.length} guides de prix...`)
        await this._bulkImport(db, this.STORES.PRICES, files.prices.priceGuides, 1000)
        console.log(`✅ Prix importés`)
      }

      // 4. Sauvegarder les métadonnées
      await this._saveMetadata(db, {
        importDate: new Date().toISOString(),
        singlesCount: files.singles?.products?.length || 0,
        nonsinglesCount: files.nonsingles?.products?.length || 0,
        pricesCount: files.prices?.priceGuides?.length || 0,
        version: files.singles?.version || 1,
        createdAt: files.singles?.createdAt || null
      })

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Import CardMarket terminé en ${duration}s`)

      return {
        success: true,
        duration,
        stats: {
          singles: files.singles?.products?.length || 0,
          nonsingles: files.nonsingles?.products?.length || 0,
          prices: files.prices?.priceGuides?.length || 0
        }
      }

    } catch (error) {
      console.error('❌ Erreur import CardMarket:', error)
      throw error
    } finally {
      db.close()
    }
  }

  /**
   * Import en masse avec batches pour performance
   */
  static async _bulkImport(db, storeName, items, batchSize = 1000) {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)

    let processed = 0

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)

      await Promise.all(
        batch.map(item => {
          return new Promise((resolve, reject) => {
            const request = store.put(item)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        })
      )

      processed += batch.length
      if (processed % 5000 === 0) {
        console.log(`  ⏳ ${processed} / ${items.length} importés...`)
      }
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  /**
   * Sauvegarder les métadonnées d'import
   */
  static async _saveMetadata(db, metadata) {
    const transaction = db.transaction([this.STORES.METADATA], 'readwrite')
    const store = transaction.objectStore(this.STORES.METADATA)

    return new Promise((resolve, reject) => {
      const request = store.put({ key: 'import', ...metadata })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Obtenir les métadonnées d'import
   */
  static async getMetadata() {
    const db = await this.openDB()
    const transaction = db.transaction([this.STORES.METADATA], 'readonly')
    const store = transaction.objectStore(this.STORES.METADATA)

    return new Promise((resolve, reject) => {
      const request = store.get('import')
      request.onsuccess = () => {
        db.close()
        resolve(request.result || null)
      }
      request.onerror = () => {
        db.close()
        reject(request.error)
      }
    })
  }

  /**
   * Rechercher une carte CardMarket par nom (approximatif)
   */
  static async searchCardByName(pokemonName, attacks = []) {
    const db = await this.openDB()
    const transaction = db.transaction([this.STORES.SINGLES], 'readonly')
    const store = transaction.objectStore(this.STORES.SINGLES)
    const index = store.index('name')

    return new Promise((resolve, reject) => {
      const results = []
      const range = IDBKeyRange.bound(
        pokemonName,
        pokemonName + '\uffff'
      )

      const request = index.openCursor(range)

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          const card = cursor.value

          // Si des attaques sont fournies, vérifier le matching
          if (attacks.length > 0) {
            const cardAttacks = this._extractAttacksFromName(card.name)
            const matchScore = this._calculateAttackMatchScore(attacks, cardAttacks)

            if (matchScore > 0) {
              results.push({ ...card, matchScore })
            }
          } else {
            // Pas d'attaques = retourner toutes les correspondances
            results.push({ ...card, matchScore: 0.5 })
          }

          cursor.continue()
        } else {
          db.close()
          // Trier par score de matching décroissant
          results.sort((a, b) => b.matchScore - a.matchScore)
          resolve(results)
        }
      }

      request.onerror = () => {
        db.close()
        reject(request.error)
      }
    })
  }

  /**
   * Extraire les noms d'attaques depuis le nom CardMarket
   * Ex: "Amoonguss [Sporprise | Rising Lunge]" → ["Sporprise", "Rising Lunge"]
   */
  static _extractAttacksFromName(name) {
    const match = name.match(/\[([^\]]+)\]/)
    if (!match) return []

    return match[1]
      .split('|')
      .map(attack => attack.trim().toLowerCase())
  }

  /**
   * Calculer un score de matching entre attaques
   * @returns {number} Score entre 0 et 1
   */
  static _calculateAttackMatchScore(attacks1, attacks2) {
    if (!attacks1.length || !attacks2.length) return 0

    const normalizedAttacks1 = attacks1.map(a => a.toLowerCase().trim())
    const normalizedAttacks2 = attacks2.map(a => a.toLowerCase().trim())

    let matchCount = 0

    normalizedAttacks1.forEach(attack1 => {
      if (normalizedAttacks2.includes(attack1)) {
        matchCount++
      }
    })

    // Score = ratio d'attaques qui matchent
    return matchCount / Math.max(normalizedAttacks1.length, normalizedAttacks2.length)
  }

  /**
   * Obtenir le prix pour un produit
   */
  static async getPriceForProduct(idProduct) {
    const db = await this.openDB()
    const transaction = db.transaction([this.STORES.PRICES], 'readonly')
    const store = transaction.objectStore(this.STORES.PRICES)

    return new Promise((resolve, reject) => {
      const request = store.get(idProduct)
      request.onsuccess = () => {
        db.close()
        resolve(request.result || null)
      }
      request.onerror = () => {
        db.close()
        reject(request.error)
      }
    })
  }

  /**
   * Rechercher des produits scellés par nom
   */
  static async searchSealedProducts(query = '', category = null) {
    const db = await this.openDB()
    const transaction = db.transaction([this.STORES.NONSINGLES], 'readonly')
    const store = transaction.objectStore(this.STORES.NONSINGLES)

    return new Promise((resolve, reject) => {
      const request = store.getAll()

      request.onsuccess = () => {
        let results = request.result

        // Filtrer par nom
        if (query) {
          const lowerQuery = query.toLowerCase()
          results = results.filter(p =>
            p.name.toLowerCase().includes(lowerQuery)
          )
        }

        // Filtrer par catégorie
        if (category !== null) {
          results = results.filter(p => p.idCategory === category)
        }

        db.close()
        resolve(results)
      }

      request.onerror = () => {
        db.close()
        reject(request.error)
      }
    })
  }

  /**
   * Obtenir les statistiques de la base de données
   */
  static async getStats() {
    const db = await this.openDB()
    const metadata = await this.getMetadata()

    const singlesCount = await this._countStore(db, this.STORES.SINGLES)
    const nonsinglesCount = await this._countStore(db, this.STORES.NONSINGLES)
    const pricesCount = await this._countStore(db, this.STORES.PRICES)

    db.close()

    return {
      singles: singlesCount,
      nonsingles: nonsinglesCount,
      prices: pricesCount,
      importDate: metadata?.importDate || null,
      version: metadata?.version || null
    }
  }

  /**
   * Compter les entrées dans un store
   */
  static async _countStore(db, storeName) {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Vider toutes les données CardMarket
   */
  static async clearAll() {
    const db = await this.openDB()

    const stores = [
      this.STORES.SINGLES,
      this.STORES.NONSINGLES,
      this.STORES.PRICES,
      this.STORES.METADATA
    ]

    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      await new Promise((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }

    db.close()
    console.log('🗑️ Toutes les données CardMarket supprimées')
  }

  /**
   * Construire l'URL CardMarket directe depuis un idProduct
   * Note: L'URL exacte peut varier, à tester/ajuster
   */
  static buildDirectUrl(idProduct, productName = '') {
    // Option 1: URL avec ID direct
    // return `https://www.cardmarket.com/en/Pokemon/Products/Singles?idProduct=${idProduct}`

    // Option 2: URL avec recherche par ID (plus fiable)
    return `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${idProduct}`

    // Option 3: URL construite (nécessite plus d'infos)
    // const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    // return `https://www.cardmarket.com/en/Pokemon/Products/Singles/[expansion]/${slug}-${idProduct}`
  }
}
