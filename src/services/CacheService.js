/**
 * Service de cache intelligent pour les données Pokémon
 * Gère le cache local avec TTL et compression
 */

export class CacheService {
  static CACHE_KEYS = {
    CARDS: 'vaultestim_cards_cache',
    PRICES: 'vaultestim_prices_cache',
    IMAGES: 'vaultestim_images_cache',
    SEARCH_RESULTS: 'vaultestim_search_cache',
    METADATA: 'vaultestim_cache_metadata'
  }

  static TTL = {
    CARD_DATA: 7 * 24 * 60 * 60 * 1000,     // 7 jours
    PRICES: 24 * 60 * 60 * 1000,            // 1 jour
    IMAGES: 30 * 24 * 60 * 60 * 1000,       // 30 jours
    SEARCH_RESULTS: 60 * 60 * 1000,         // 1 heure
    POPULAR_CARDS: 3 * 60 * 60 * 1000       // 3 heures
  }

  static MAX_CACHE_SIZE = {
    CARDS: 1000,        // Max 1000 cartes en cache
    SEARCH: 100,        // Max 100 recherches en cache
    IMAGES: 500         // Max 500 images en cache
  }

  /**
   * Stocker des données dans le cache avec TTL
   */
  static setCache(key, data, ttl = this.TTL.CARD_DATA) {
    try {
      const cacheEntry = {
        data: data,
        timestamp: Date.now(),
        expires: Date.now() + ttl,
        size: JSON.stringify(data).length
      }

      localStorage.setItem(key, JSON.stringify(cacheEntry))
      this.updateMetadata(key, cacheEntry.size)

      console.log(`💾 Cache mis à jour: ${key} (TTL: ${ttl / 1000 / 60}min)`)
      return true
    } catch (error) {
      console.error('❌ Erreur cache:', error)
      return false
    }
  }

  /**
   * Récupérer des données du cache si elles sont valides
   */
  static getCache(key) {
    try {
      const cached = localStorage.getItem(key)
      if (!cached) return null

      const cacheEntry = JSON.parse(cached)
      const now = Date.now()

      // Vérifier si le cache a expiré
      if (now > cacheEntry.expires) {
        console.log(`⏰ Cache expiré: ${key}`)
        this.removeCache(key)
        return null
      }

      // Vérifier la fraîcheur (warning si proche de l'expiration)
      const timeLeft = cacheEntry.expires - now
      if (timeLeft < (cacheEntry.expires - cacheEntry.timestamp) * 0.1) {
        console.log(`⚠️ Cache bientôt expiré: ${key} (${Math.round(timeLeft / 1000 / 60)}min restantes)`)
      }

      console.log(`✅ Cache hit: ${key}`)
      return cacheEntry.data
    } catch (error) {
      console.error('❌ Erreur lecture cache:', error)
      return null
    }
  }

  /**
   * Cache spécialisé pour les cartes avec compression
   */
  static setCacheCard(cardId, cardData) {
    const key = `${this.CACHE_KEYS.CARDS}_${cardId}`

    // Compresser les données en gardant seulement l'essentiel
    const compressedData = {
      id: cardData.id,
      name: cardData.name,
      set: cardData.set,
      number: cardData.number,
      images: cardData.images,
      hp: cardData.hp,
      types: cardData.types,
      rarity: cardData.rarity,
      tcgplayer: cardData.tcgplayer,
      marketPrice: cardData.marketPrice,
      cached_at: Date.now()
    }

    return this.setCache(key, compressedData, this.TTL.CARD_DATA)
  }

  /**
   * Récupérer une carte du cache
   */
  static getCacheCard(cardId) {
    const key = `${this.CACHE_KEYS.CARDS}_${cardId}`
    return this.getCache(key)
  }

  /**
   * Cache pour les résultats de recherche
   */
  static setCacheSearch(query, results) {
    const normalizedQuery = query.toLowerCase().trim()
    const key = `${this.CACHE_KEYS.SEARCH_RESULTS}_${normalizedQuery}`

    // Limiter le nombre de résultats cachés
    const limitedResults = results.slice(0, 50)

    return this.setCache(key, limitedResults, this.TTL.SEARCH_RESULTS)
  }

  /**
   * Récupérer les résultats de recherche du cache
   */
  static getCacheSearch(query) {
    const normalizedQuery = query.toLowerCase().trim()
    const key = `${this.CACHE_KEYS.SEARCH_RESULTS}_${normalizedQuery}`
    return this.getCache(key)
  }

  /**
   * Cache pour les prix avec timestamp
   */
  static setCachePrice(cardId, priceData) {
    const key = `${this.CACHE_KEYS.PRICES}_${cardId}`
    const priceEntry = {
      ...priceData,
      lastUpdated: Date.now()
    }

    return this.setCache(key, priceEntry, this.TTL.PRICES)
  }

  /**
   * Récupérer les prix du cache
   */
  static getCachePrice(cardId) {
    const key = `${this.CACHE_KEYS.PRICES}_${cardId}`
    return this.getCache(key)
  }

  /**
   * Supprimer une entrée du cache
   */
  static removeCache(key) {
    localStorage.removeItem(key)
    this.updateMetadata(key, 0, true)
  }

  /**
   * Nettoyer le cache expiré
   */
  static cleanExpiredCache() {
    let cleaned = 0
    const now = Date.now()

    // Parcourir toutes les clés de cache
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)

      if (key && (
        key.startsWith(this.CACHE_KEYS.CARDS) ||
        key.startsWith(this.CACHE_KEYS.PRICES) ||
        key.startsWith(this.CACHE_KEYS.SEARCH_RESULTS)
      )) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const cacheEntry = JSON.parse(cached)
            if (now > cacheEntry.expires) {
              localStorage.removeItem(key)
              cleaned++
            }
          }
        } catch (error) {
          // Supprimer les entrées corrompues
          localStorage.removeItem(key)
          cleaned++
        }
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Nettoyage cache: ${cleaned} entrées supprimées`)
    }

    return cleaned
  }

  /**
   * Obtenir les statistiques du cache
   */
  static getCacheStats() {
    let totalSize = 0
    let totalEntries = 0
    const stats = {
      cards: 0,
      searches: 0,
      prices: 0,
      expired: 0
    }

    const now = Date.now()

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key && (
        key.startsWith(this.CACHE_KEYS.CARDS) ||
        key.startsWith(this.CACHE_KEYS.PRICES) ||
        key.startsWith(this.CACHE_KEYS.SEARCH_RESULTS)
      )) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const cacheEntry = JSON.parse(cached)
            totalSize += cached.length
            totalEntries++

            if (now > cacheEntry.expires) {
              stats.expired++
            } else if (key.startsWith(this.CACHE_KEYS.CARDS)) {
              stats.cards++
            } else if (key.startsWith(this.CACHE_KEYS.SEARCH_RESULTS)) {
              stats.searches++
            } else if (key.startsWith(this.CACHE_KEYS.PRICES)) {
              stats.prices++
            }
          }
        } catch (error) {
          // Ignorer les entrées corrompues
        }
      }
    }

    return {
      ...stats,
      totalEntries,
      totalSize: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    }
  }

  /**
   * Forcer l'expiration du cache pour une clé
   */
  static invalidateCache(key) {
    const cached = this.getCache(key)
    if (cached) {
      // Marquer comme expiré
      const cacheEntry = JSON.parse(localStorage.getItem(key))
      cacheEntry.expires = Date.now() - 1
      localStorage.setItem(key, JSON.stringify(cacheEntry))
      console.log(`❌ Cache invalidé: ${key}`)
    }
  }

  /**
   * Mettre à jour les métadonnées du cache
   */
  static updateMetadata(key, size, removed = false) {
    try {
      const metadata = JSON.parse(localStorage.getItem(this.CACHE_KEYS.METADATA) || '{}')

      if (removed) {
        delete metadata[key]
      } else {
        metadata[key] = {
          size: size,
          lastUpdated: Date.now()
        }
      }

      localStorage.setItem(this.CACHE_KEYS.METADATA, JSON.stringify(metadata))
    } catch (error) {
      console.error('❌ Erreur métadonnées cache:', error)
    }
  }

  /**
   * Nettoyer les données des anciennes APIs (TCGdx, RapidAPI) - Version agressive
   */
  static cleanLegacyApiData() {
    let cleaned = 0
    const keysToRemove = []

    // Parcourir toutes les clés du localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key && (
        key.includes('tcgdx') ||
        key.includes('rapidapi') ||
        key.includes('RapidAPI') ||
        key.includes('TCGdx') ||
        key.includes('demo-') || // Données de démo
        key.includes('_demo_') ||
        key.includes('tyradex') // Anciennes données Tyradex corrompues
      )) {
        keysToRemove.push(key)
      }
    }

    // Nettoyer aussi les cartes avec _source ancien ou données corrompues
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key && (key.startsWith(this.CACHE_KEYS.CARDS) || key.startsWith(this.CACHE_KEYS.SEARCH_RESULTS))) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const cacheEntry = JSON.parse(cached)

            // Pour les caches de cartes individuelles
            if (cacheEntry.data && (
              cacheEntry.data._source === 'tcgdx' ||
              cacheEntry.data._source === 'rapidapi' ||
              cacheEntry.data._source === 'demo' ||
              cacheEntry.data._source === 'tyradex' ||
              !cacheEntry.data.image || // Cartes sans images
              cacheEntry.data.image === '' || // Cartes avec images vides
              cacheEntry.data.image.includes('tyradex') || // Images Tyradex
              !cacheEntry.data._source || // Cartes sans source définie
              (cacheEntry.data.name_fr && !cacheEntry.data.name) // Données incohérentes
            )) {
              keysToRemove.push(key)
            }

            // Pour les caches de recherche avec résultats mixtes
            if (Array.isArray(cacheEntry.data)) {
              let hasCorruptedData = false
              cacheEntry.data.forEach(card => {
                if (card && (
                  card._source === 'tcgdx' ||
                  card._source === 'rapidapi' ||
                  card._source === 'demo' ||
                  card._source === 'tyradex' ||
                  !card.image ||
                  card.image === '' ||
                  card.image.includes('tyradex') ||
                  !card._source
                )) {
                  hasCorruptedData = true
                }
              })
              if (hasCorruptedData) {
                keysToRemove.push(key)
              }
            }
          }
        } catch (error) {
          // Entrée corrompue, la supprimer aussi
          keysToRemove.push(key)
        }
      }
    }

    // Nettoyer aussi les cache de recherche spécifiques
    const searchCachesToClean = ['dracaufeu', 'charizard', 'amphinobi', 'greninja', 'fezandipiti', 'lépidonille', 'lepidonille', 'pérégrain', 'peregrain', 'scatterbug', 'spewpa']
    searchCachesToClean.forEach(searchTerm => {
      const cacheKey = `${this.CACHE_KEYS.SEARCH_RESULTS}_${searchTerm}`
      if (localStorage.getItem(cacheKey)) {
        keysToRemove.push(cacheKey)
        console.log(`🧹 Suppression cache recherche "${searchTerm}" pour rafraîchissement`)
      }
    })

    // Supprimer toutes les clés identifiées
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      cleaned++
    })

    if (cleaned > 0) {
      console.log(`🧹 Nettoyage legacy APIs (agressif): ${cleaned} entrées supprimées`)
    }

    return cleaned
  }

  /**
   * Vider tout le cache
   */
  /**
   * Vider tous les caches de recherche
   */
  static clearSearchCache() {
    const keys = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith(this.CACHE_KEYS.SEARCH_RESULTS) ||
        key.startsWith('vaultestim_search_cache_') ||
        key.startsWith('tcg_search_')
      )) {
        keys.push(key)
      }
    }

    keys.forEach(key => localStorage.removeItem(key))
    console.log(`🗑️ Cache de recherche vidé: ${keys.length} entrées supprimées`)

    return keys.length
  }

  static clearAllCache() {
    const keys = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith(this.CACHE_KEYS.CARDS) ||
        key.startsWith(this.CACHE_KEYS.PRICES) ||
        key.startsWith(this.CACHE_KEYS.SEARCH_RESULTS) ||
        key === this.CACHE_KEYS.METADATA
      )) {
        keys.push(key)
      }
    }

    keys.forEach(key => localStorage.removeItem(key))
    console.log(`🗑️ Cache vidé: ${keys.length} entrées supprimées`)

    return keys.length
  }

  /**
   * Pré-charger les cartes populaires
   */
  static async preloadPopularCards() {
    const popularCards = [
      'Charizard', 'Pikachu', 'Mewtwo', 'Lugia', 'Rayquaza',
      'Gyarados', 'Dragonite', 'Alakazam', 'Gengar', 'Machamp'
    ]

    console.log('🚀 Pré-chargement des cartes populaires...')

    for (const cardName of popularCards) {
      const cached = this.getCacheSearch(cardName)
      if (!cached) {
        // Déclencher une recherche en arrière-plan si pas en cache
        // Sera implémenté avec le service multi-API
        console.log(`📦 À pré-charger: ${cardName}`)
      }
    }
  }
}

// Auto-nettoyage au démarrage
if (typeof window !== 'undefined') {
  // Nettoyer le cache expiré au démarrage
  setTimeout(() => {
    CacheService.cleanExpiredCache()
  }, 1000)

  // Nettoyer le cache expiré toutes les heures
  setInterval(() => {
    CacheService.cleanExpiredCache()
  }, 60 * 60 * 1000)
}