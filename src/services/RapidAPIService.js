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

    try {
      const limit = options.limit || 50
      const sort = options.sort || 'episode_newest'

      console.log(`🔍 RapidAPI: Recherche cartes "${searchTerm}"...`)

      const params = new URLSearchParams({
        search: searchTerm,
        limit: limit.toString(),
        sort
      })

      const response = await fetch(`${this.BASE_URL}/pokemon/cards/search?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: ${data.data?.length || 0} cartes trouvées`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur recherche cartes "${searchTerm}":`, error)
      throw error
    }
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
   * Lister les cartes d'une extension
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

      console.log(`📦 RapidAPI: Récupération cartes de "${expansionSlug}"...`)

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
      console.log(`✅ RapidAPI: ${data.data?.length || 0} cartes de "${expansionSlug}" récupérées`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur cartes extension "${expansionSlug}":`, error)
      throw error
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
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: Produit ${data.name} récupéré`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur récupération produit ${productId}:`, error)
      throw error
    }
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

      const response = await fetch(`${this.BASE_URL}/pokemon/expansions?${params}`, {
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

      const response = await fetch(`${this.BASE_URL}/pokemon/expansions/search?${params}`, {
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
