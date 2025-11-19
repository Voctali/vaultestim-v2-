/**
 * RapidAPIService - Service pour l'API CardMarket API TCG via RapidAPI
 *
 * Fonctionnalités :
 * - Récupération des prix des cartes individuelles avec détails par version
 * - Récupération des prix des produits scellés (boosters, coffrets, ETB, etc.)
 * - Support des prix CardMarket (EUR) avec localisation (DE, FR)
 * - Prix des cartes gradées (PSA, CGC)
 * - Moyennes 7j et 30j
 * - Gestion automatique du quota quotidien (100 requêtes/jour sur plan Basic)
 *
 * @see https://rapidapi.com/tcggopro/api/cardmarket-api-tcg
 */

export class RapidAPIService {
  static BASE_URL = 'https://cardmarket-api-tcg.p.rapidapi.com'
  static API_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '523ca9be5emsh10d5931a9d95b87p18cd5cjsn641503bb34b6'
  static API_HOST = 'cardmarket-api-tcg.p.rapidapi.com'
  static DAILY_QUOTA = parseInt(import.meta.env.VITE_RAPIDAPI_DAILY_QUOTA || '100')
  static ENABLED = import.meta.env.VITE_USE_RAPIDAPI === 'true'

  /**
   * Vérifier si le service est configuré et activé
   */
  static isAvailable() {
    if (!this.ENABLED) {
      console.log('⏭️ RapidAPI désactivé (VITE_USE_RAPIDAPI=false)')
      return false
    }

    if (!this.API_KEY || this.API_KEY === 'YOUR_RAPIDAPI_KEY_HERE') {
      console.warn('⚠️ RapidAPI: Clé API manquante ou invalide')
      return false
    }

    return true
  }

  /**
   * Headers communs pour toutes les requêtes RapidAPI
   */
  static getHeaders() {
    return {
      'X-RapidAPI-Key': this.API_KEY,
      'X-RapidAPI-Host': this.API_HOST,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Rechercher des cartes par nom
   *
   * @param {string} searchTerm - Terme de recherche (nom de la carte)
   * @param {Object} options - Options de recherche
   * @param {number} options.limit - Nombre de résultats (défaut: 50)
   * @param {string} options.sort - Tri (episode_newest, episode_oldest, price_lowest, price_highest)
   * @returns {Promise<Object>} { data: Array, paging: Object }
   *
   * Format de réponse :
   * {
   *   data: [
   *     {
   *       id: number,
   *       name: string,
   *       card_number: number,
   *       hp: number,
   *       rarity: string,
   *       supertype: string,
   *       tcgid: string,
   *       prices: {
   *         cardmarket: {
   *           currency: "EUR",
   *           lowest_near_mint: number,
   *           lowest_near_mint_DE: number,
   *           lowest_near_mint_FR: number,
   *           "30d_average": number,
   *           "7d_average": number,
   *           graded: {
   *             psa: { psa10: number, psa9: number },
   *             cgc: { cgc9: number }
   *           }
   *         },
   *         tcg_player: {
   *           currency: "EUR",
   *           market_price: number,
   *           mid_price: number
   *         }
   *       },
   *       episode: { id, name, slug, code, logo, ... },
   *       artist: { id, name, slug },
   *       image: string,
   *       tcggo_url: string,
   *       links: { cardmarket: string }
   *     }
   *   ],
   *   paging: { current: 1, total: 10, per_page: 50 }
   * }
   */
  static async searchCards(searchTerm, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    const limit = options.limit || 50
    const page = options.page || 1
    const sort = options.sort || 'episode_newest'
    const maxRetries = 2 // Retry 2 fois pour erreurs serveur transitoires

    console.log(`🔍 RapidAPI: Recherche cartes "${searchTerm}" (page ${page})...`)

    const params = new URLSearchParams({
      search: searchTerm,
      limit: limit.toString(),
      page: page.toString(),
      sort
    })

    let lastError = null

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        if (attempt > 1) {
          const delay = attempt * 500 // 500ms, 1000ms, 1500ms
          console.log(`🔄 Tentative ${attempt}/${maxRetries + 1} après ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const response = await fetch(`${this.BASE_URL}/pokemon/cards/search?${params}`, {
          method: 'GET',
          headers: this.getHeaders()
        })

        if (!response.ok) {
          const errorText = await response.text()
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
          error.status = response.status
          error.responseText = errorText

          // Retry uniquement pour erreurs serveur transitoires (500, 502, 503)
          if ([500, 502, 503].includes(response.status) && attempt <= maxRetries) {
            console.warn(`⚠️ Erreur ${response.status} (transitoire), retry...`)
            lastError = error
            continue // Retry
          }

          // Pour autres erreurs (400, 401, 404, etc.), throw immédiatement
          throw error
        }

        const data = await response.json()
        console.log(`✅ RapidAPI: ${data.data?.length || 0} cartes trouvées`)

        return data

      } catch (error) {
        lastError = error

        // Si c'est une erreur réseau (fetch failed), retry
        if (error.message.includes('fetch') && attempt <= maxRetries) {
          console.warn(`⚠️ Erreur réseau, retry...`)
          continue
        }

        // Si c'est une erreur HTTP non-transitory, throw immédiatement
        if (error.status && ![500, 502, 503].includes(error.status)) {
          throw error
        }

        // Si dernier attempt, throw
        if (attempt > maxRetries) {
          break
        }
      }
    }

    // Si on arrive ici, toutes les tentatives ont échoué
    console.error(`❌ RapidAPI: Échec après ${maxRetries + 1} tentatives pour "${searchTerm}":`, lastError)
    throw lastError
  }

  /**
   * Obtenir une carte par son ID
   *
   * @param {number} cardId - ID de la carte
   * @returns {Promise<Object>} Détails complets de la carte
   */
  static async getCard(cardId) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      console.log(`🔍 RapidAPI: Récupération carte ID ${cardId}...`)

      const response = await fetch(`${this.BASE_URL}/pokemon/cards/${cardId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: Carte ${data.name} récupérée`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur récupération carte ${cardId}:`, error)
      throw error
    }
  }

  /**
   * Lister les cartes d'une extension (une page)
   *
   * @param {string} expansionSlug - Slug de l'extension (ex: "paldean-fates")
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} { data: Array, paging: Object }
   */
  static async getCardsByExpansion(expansionSlug, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      const page = options.page || 1
      const limit = options.limit || 100

      console.log(`📦 RapidAPI: Récupération cartes de "${expansionSlug}" (page ${page})...`)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      const response = await fetch(`${this.BASE_URL}/pokemon/cards/expansion/${expansionSlug}?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: ${data.data?.length || 0} cartes de "${expansionSlug}" récupérées (page ${page})`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur cartes extension "${expansionSlug}":`, error)
      throw error
    }
  }

  /**
   * Importer TOUTES les cartes d'une extension avec pagination automatique
   *
   * @param {string} expansionSlug - Slug de l'extension (ex: "phantasmal-flames")
   * @param {Function} onProgress - Callback de progression (count, total)
   * @returns {Promise<Array>} Toutes les cartes de l'extension au format app
   */
  static async importAllCardsByExpansion(expansionSlug, onProgress = null) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      console.log(`📦 RapidAPI: Import complet de l'extension "${expansionSlug}"...`)

      // Étape 1: Trouver l'ID de l'extension via la recherche
      // Convertir le slug en terme de recherche (phantasmal-flames -> phantasmal flames)
      const searchTerm = expansionSlug.replace(/-/g, ' ')
      console.log(`🔍 Recherche de l'extension "${searchTerm}"...`)
      const searchResult = await this.searchExpansions(searchTerm, { limit: 10 })

      if (!searchResult.data || searchResult.data.length === 0) {
        throw new Error(`Extension "${expansionSlug}" non trouvée sur RapidAPI`)
      }

      // Trouver l'extension qui correspond au slug
      const extension = searchResult.data.find(ext =>
        ext.slug === expansionSlug ||
        ext.slug === expansionSlug.toLowerCase() ||
        ext.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) || searchResult.data[0]

      const episodeId = extension.id
      const extensionName = extension.name
      console.log(`✅ Extension trouvée: "${extensionName}" (ID: ${episodeId})`)

      // Étape 2: Récupérer toutes les cartes avec episode_id
      const allCards = []
      let currentPage = 1
      const perPage = 100 // Maximum par page
      let totalPages = 1
      let totalResults = 0

      while (currentPage <= totalPages) {
        const params = new URLSearchParams({
          episode_id: episodeId.toString(),
          page: currentPage.toString(),
          limit: perPage.toString()
        })

        console.log(`📄 Page ${currentPage}: Récupération...`)

        const response = await fetch(`${this.BASE_URL}/pokemon/cards/search?${params}`, {
          method: 'GET',
          headers: this.getHeaders()
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const result = await response.json()
        const cards = result.data || []

        if (cards.length === 0) {
          break
        }

        allCards.push(...cards)

        // Récupérer les infos de pagination
        if (result.paging) {
          totalPages = result.paging.total || 1
        }
        if (result.results) {
          totalResults = result.results
        }

        console.log(`✅ Page ${currentPage}/${totalPages}: ${cards.length} cartes (Total: ${allCards.length}/${totalResults})`)

        if (onProgress) {
          onProgress({
            count: allCards.length,
            total: totalResults,
            page: currentPage,
            totalPages,
            setName: extensionName
          })
        }

        // Continuer tant qu'on n'a pas atteint la dernière page
        // Note: RapidAPI limite à 20 cartes par page même si on demande 100
        if (currentPage >= totalPages) {
          break
        }

        currentPage++

        // Petit délai entre les requêtes pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log(`🎉 RapidAPI: Import terminé - ${allCards.length} cartes de "${extensionName}"`)

      // Transformer les cartes au format compatible avec l'application
      // Passer les infos de l'extension pour avoir les bonnes métadonnées (série, logo, etc.)
      return allCards.map(card => this.transformCardToAppFormat(card, expansionSlug, extension))
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur import extension "${expansionSlug}":`, error)
      throw error
    }
  }

  /**
   * Transformer une carte RapidAPI au format de l'application
   *
   * @param {Object} rapidApiCard - Carte au format RapidAPI
   * @param {string} expansionSlug - Slug de l'extension
   * @param {Object} extensionInfo - Infos de l'extension trouvée (optionnel)
   */
  static transformCardToAppFormat(rapidApiCard, expansionSlug, extensionInfo = null) {
    const episode = rapidApiCard.episode || {}

    // Extraire le set.id depuis le tcgid (format: "xxx-123" -> "xxx")
    // Exemple: "me02-001" -> "me02", "sv8pt5-001" -> "sv8pt5"
    let setId = expansionSlug
    if (rapidApiCard.tcgid) {
      const match = rapidApiCard.tcgid.match(/^([a-zA-Z0-9]+)-/)
      if (match) {
        setId = match[1].toLowerCase()
      }
    }

    // Fallback sur episode.code si disponible
    if (!setId || setId === expansionSlug) {
      setId = episode.code?.toLowerCase() || extensionInfo?.code?.toLowerCase() || expansionSlug
    }

    // Déterminer la série
    let series = 'Unknown'
    if (episode.serie?.name) {
      series = episode.serie.name
    } else if (extensionInfo?.serie?.name) {
      series = extensionInfo.serie.name
    } else if (extensionInfo?.serie) {
      // Parfois serie est directement le nom
      series = typeof extensionInfo.serie === 'string' ? extensionInfo.serie : 'Unknown'
    }

    // Mapping des séries connues par setId
    const knownSeries = {
      'me1': 'Mega Evolution',
      'me2': 'Mega Evolution',
      'mep': 'Mega Evolution',
      'sv1': 'Scarlet & Violet',
      'sv2': 'Scarlet & Violet',
      'sv3': 'Scarlet & Violet',
      'sv4': 'Scarlet & Violet',
      'sv5': 'Scarlet & Violet',
      'sv6': 'Scarlet & Violet',
      'sv7': 'Scarlet & Violet',
      'sv8': 'Scarlet & Violet',
      'sv9': 'Scarlet & Violet',
      'swsh1': 'Sword & Shield',
      'swsh2': 'Sword & Shield',
      'swsh3': 'Sword & Shield',
      'swsh4': 'Sword & Shield',
      'swsh5': 'Sword & Shield',
      'swsh6': 'Sword & Shield',
      'swsh7': 'Sword & Shield',
      'swsh8': 'Sword & Shield',
      'swsh9': 'Sword & Shield',
      'swsh10': 'Sword & Shield',
      'swsh11': 'Sword & Shield',
      'swsh12': 'Sword & Shield',
    }

    // Utiliser le mapping si la série est Unknown
    if (series === 'Unknown' && knownSeries[setId]) {
      series = knownSeries[setId]
      console.log(`📍 Série détectée via mapping: ${setId} -> ${series}`)
    }

    console.log(`🔄 Transform: ${rapidApiCard.name} -> set.id: ${setId} (tcgid: ${rapidApiCard.tcgid})`)

    return {
      id: rapidApiCard.tcgid || `rapidapi-${rapidApiCard.id}`,
      name: rapidApiCard.name,
      number: rapidApiCard.card_number?.toString() || '',
      supertype: rapidApiCard.supertype || 'Pokémon',
      subtypes: rapidApiCard.subtypes || [],
      hp: rapidApiCard.hp?.toString() || '',
      types: rapidApiCard.types || [],
      rarity: rapidApiCard.rarity || '',
      artist: rapidApiCard.artist?.name || '',
      images: {
        small: rapidApiCard.image || '',
        large: rapidApiCard.image || ''
      },
      set: {
        id: setId,
        name: episode.name || extensionInfo?.name || expansionSlug,
        series: series,
        releaseDate: episode.release_date || extensionInfo?.release_date || new Date().toISOString(),
        logo: episode.logo || extensionInfo?.logo || ''
      },
      // Prix CardMarket
      cardmarket: rapidApiCard.prices?.cardmarket ? {
        url: rapidApiCard.links?.cardmarket || '',
        updatedAt: new Date().toISOString(),
        prices: {
          averageSellPrice: rapidApiCard.prices.cardmarket['30d_average'] || null,
          avg1: rapidApiCard.prices.cardmarket['1d_average'] || null,
          avg7: rapidApiCard.prices.cardmarket['7d_average'] || null,
          avg30: rapidApiCard.prices.cardmarket['30d_average'] || null,
          lowPrice: rapidApiCard.prices.cardmarket.lowest_near_mint || null,
          trendPrice: rapidApiCard.prices.cardmarket['7d_average'] || null
        }
      } : null,
      // Prix TCGPlayer
      tcgplayer: rapidApiCard.prices?.tcg_player ? {
        url: '',
        updatedAt: new Date().toISOString(),
        prices: {
          normal: {
            market: rapidApiCard.prices.tcg_player.market_price || null,
            mid: rapidApiCard.prices.tcg_player.mid_price || null
          }
        }
      } : null,
      // Lien CardMarket direct
      cardmarket_url: rapidApiCard.links?.cardmarket || '',
      // Métadonnées
      _source: 'rapidapi',
      _timestamp: new Date().toISOString()
    }
  }

  /**
   * Rechercher des produits scellés
   *
   * @param {string} searchTerm - Terme de recherche
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} { data: Array, paging: Object }
   *
   * Format de réponse :
   * {
   *   data: [
   *     {
   *       id: number,
   *       name: string,
   *       slug: string,
   *       prices: {
   *         cardmarket: {
   *           currency: "EUR",
   *           lowest: number,
   *           lowest_DE: number,
   *           lowest_FR: number
   *         }
   *       },
   *       episode: { id, name, slug, logo, code, ... },
   *       image: string,
   *       tcggo_url: string,
   *       links: { cardmarket: string }
   *     }
   *   ]
   * }
   */
  static async searchProducts(searchTerm, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      const limit = options.limit || 50
      const sort = options.sort || 'episode_newest'

      console.log(`📦 RapidAPI: Recherche produits "${searchTerm}"...`)

      // Si limit <= 20, une seule requête suffit
      if (limit <= 20) {
        const params = new URLSearchParams({
          search: searchTerm,
          limit: limit.toString(),
          sort
        })

        const response = await fetch(`${this.BASE_URL}/pokemon/products/search?${params}`, {
          method: 'GET',
          headers: this.getHeaders()
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.json()
        console.log(`✅ RapidAPI: ${data.data?.length || 0} produits trouvés`)

        return data
      }

      // Si limit > 20, pagination automatique
      console.log(`📄 Pagination activée (limit=${limit}, max 20/page)`)

      let allProducts = []
      let currentPage = 1
      const perPage = 20

      while (allProducts.length < limit) {
        const params = new URLSearchParams({
          search: searchTerm,
          limit: perPage.toString(),
          page: currentPage.toString(),
          sort
        })

        console.log(`  📄 Page ${currentPage}...`)

        const response = await fetch(`${this.BASE_URL}/pokemon/products/search?${params}`, {
          method: 'GET',
          headers: this.getHeaders()
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const pageData = await response.json()
        const products = pageData.data || []

        console.log(`  ✅ ${products.length} produits`)

        allProducts.push(...products)

        // Arrêter si moins de 20 résultats (dernière page)
        if (products.length < perPage) break

        currentPage++

        // Sécurité : max 50 pages
        if (currentPage > 50) {
          console.warn(`⚠️ Limite sécurité atteinte (50 pages)`)
          break
        }
      }

      const finalProducts = allProducts.slice(0, limit)
      console.log(`✅ RapidAPI: ${finalProducts.length} produits total (${currentPage} pages)`)

      return {
        data: finalProducts,
        paging: {
          current: 1,
          total: Math.ceil(allProducts.length / perPage),
          per_page: perPage
        },
        results: allProducts.length
      }
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur recherche produits "${searchTerm}":`, error)
      throw error
    }
  }

  /**
   * Obtenir un produit par son ID
   *
   * @param {number} productId - ID du produit
   * @returns {Promise<Object>} Détails complets du produit
   */
  static async getProduct(productId) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      console.log(`📦 RapidAPI: Récupération produit ID ${productId}...`)

      const response = await fetch(`${this.BASE_URL}/pokemon/products/${productId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()

      // L'API retourne { data: { id, name, prices, ... } }
      if (!responseData.data) {
        console.log(`⏭️ Produit ${productId} non trouvé dans RapidAPI`)
        return null
      }

      const product = responseData.data
      console.log(`✅ RapidAPI: Produit ${product.name || product.id || productId} récupéré (${product.prices?.cardmarket?.lowest || 'N/A'}€)`)

      return product
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur récupération produit ${productId}:`, error)
      throw error
    }
  }

  /**
   * Alias pour getProduct (compatibilité)
   */
  static async getProductById(productId) {
    return this.getProduct(productId)
  }

  /**
   * Lister les produits scellés d'une extension
   *
   * @param {string} expansionSlug - Slug de l'extension
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} { data: Array, paging: Object }
   */
  static async getProductsByExpansion(expansionSlug, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      const page = options.page || 1
      const limit = options.limit || 50

      console.log(`📦 RapidAPI: Récupération produits de "${expansionSlug}"...`)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      const response = await fetch(`${this.BASE_URL}/pokemon/products/expansion/${expansionSlug}?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: ${data.data?.length || 0} produits de "${expansionSlug}" récupérés`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur produits extension "${expansionSlug}":`, error)
      throw error
    }
  }

  /**
   * Lister toutes les extensions disponibles
   *
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} { data: Array, paging: Object }
   */
  static async getExpansions(options = {}) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      const page = options.page || 1
      const limit = options.limit || 100

      console.log(`📚 RapidAPI: Récupération liste des extensions...`)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      const response = await fetch(`${this.BASE_URL}/pokemon/episodes?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: ${data.data?.length || 0} extensions récupérées`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur récupération extensions:`, error)
      throw error
    }
  }

  /**
   * Rechercher des extensions
   *
   * @param {string} searchTerm - Terme de recherche
   * @param {Object} options - Options
   * @returns {Promise<Object>} { data: Array }
   */
  static async searchExpansions(searchTerm, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      const limit = options.limit || 50

      console.log(`📚 RapidAPI: Recherche extensions "${searchTerm}"...`)

      const params = new URLSearchParams({
        search: searchTerm,
        limit: limit.toString()
      })

      const response = await fetch(`${this.BASE_URL}/pokemon/episodes/search?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: ${data.data?.length || 0} extensions trouvées`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur recherche extensions:`, error)
      throw error
    }
  }
}
