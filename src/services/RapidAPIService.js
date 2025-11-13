/**
 * RapidAPIService - Service pour l'API Pokemon TCG via RapidAPI
 *
 * Fonctionnalités :
 * - Récupération des prix détaillés par version (Holo, Reverse, etc.)
 * - Récupération des prix des produits scellés (boosters, coffrets, etc.)
 * - Support des prix CardMarket (EUR) avec versions
 * - Gestion automatique du quota quotidien (100/2500/15000/50000 selon plan)
 *
 * @see https://rapidapi.com/serverjason1/api/pokemon-tcg-api
 */

export class RapidAPIService {
  static BASE_URL = 'https://pokemon-tcg-api.p.rapidapi.com'
  static API_KEY = import.meta.env.VITE_RAPIDAPI_KEY
  static API_HOST = import.meta.env.VITE_RAPIDAPI_HOST
  static DAILY_QUOTA = parseInt(import.meta.env.VITE_RAPIDAPI_DAILY_QUOTA || '100')
  static ENABLED = import.meta.env.VITE_USE_RAPIDAPI_PRICES === 'true'

  /**
   * Vérifier si le service est configuré et activé
   */
  static isAvailable() {
    if (!this.ENABLED) {
      console.log('⏭️ RapidAPI désactivé (VITE_USE_RAPIDAPI_PRICES=false)')
      return false
    }

    if (!this.API_KEY || this.API_KEY === 'YOUR_RAPIDAPI_KEY_HERE') {
      console.warn('⚠️ RapidAPI: Clé API manquante ou invalide')
      return false
    }

    if (!this.API_HOST || this.API_HOST === 'YOUR_API_HOST.p.rapidapi.com') {
      console.warn('⚠️ RapidAPI: Host API manquant ou invalide')
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
   * Rechercher une carte et récupérer ses prix par version
   *
   * @param {string} cardId - ID de la carte (ex: "sv8-226")
   * @returns {Promise<Object>} Détails de la carte avec prix par version
   */
  static async getCardWithPrices(cardId) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      console.log(`🔍 RapidAPI: Récupération de la carte ${cardId}...`)

      const response = await fetch(`${this.BASE_URL}/cards/${cardId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: Carte ${cardId} récupérée`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur récupération carte ${cardId}:`, error)
      throw error
    }
  }

  /**
   * Récupérer l'historique des prix d'une carte (avec versions)
   *
   * @param {string} cardId - ID de la carte
   * @returns {Promise<Object>} Historique des prix par version
   */
  static async getCardPriceHistory(cardId) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      console.log(`📊 RapidAPI: Récupération historique prix ${cardId}...`)

      const response = await fetch(`${this.BASE_URL}/cards/history-prices?cardId=${cardId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: Historique prix ${cardId} récupéré`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur historique prix ${cardId}:`, error)
      throw error
    }
  }

  /**
   * Rechercher des cartes par nom/critères
   *
   * @param {string} query - Terme de recherche
   * @param {Object} options - Options de recherche (limit, page, etc.)
   * @returns {Promise<Array>} Liste des cartes trouvées
   */
  static async searchCards(query, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      console.log(`🔍 RapidAPI: Recherche cartes "${query}"...`)

      const params = new URLSearchParams({
        q: query,
        limit: options.limit || 50,
        page: options.page || 1
      })

      const response = await fetch(`${this.BASE_URL}/cards?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: ${data.length || 0} cartes trouvées`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur recherche cartes:`, error)
      throw error
    }
  }

  /**
   * Récupérer les produits scellés d'une extension
   *
   * @param {string} expansionId - ID de l'extension (ex: "sv8")
   * @returns {Promise<Array>} Liste des produits scellés
   */
  static async getProductsByExpansion(expansionId) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      console.log(`📦 RapidAPI: Récupération produits scellés ${expansionId}...`)

      const response = await fetch(`${this.BASE_URL}/products?expansion=${expansionId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: ${data.length || 0} produits scellés trouvés`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur produits scellés:`, error)
      throw error
    }
  }

  /**
   * Récupérer l'historique des prix d'un produit scellé
   *
   * @param {string} productId - ID du produit
   * @returns {Promise<Object>} Historique des prix
   */
  static async getProductPriceHistory(productId) {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      console.log(`📊 RapidAPI: Récupération historique prix produit ${productId}...`)

      const response = await fetch(`${this.BASE_URL}/products/history-prices?productId=${productId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: Historique prix produit ${productId} récupéré`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur historique prix produit:`, error)
      throw error
    }
  }

  /**
   * Récupérer toutes les extensions disponibles
   *
   * @returns {Promise<Array>} Liste des extensions
   */
  static async getExpansions() {
    if (!this.isAvailable()) {
      throw new Error('RapidAPI non disponible')
    }

    try {
      console.log(`📚 RapidAPI: Récupération liste des extensions...`)

      const response = await fetch(`${this.BASE_URL}/expansions`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: ${data.length || 0} extensions trouvées`)

      return data
    } catch (error) {
      console.error(`❌ RapidAPI: Erreur récupération extensions:`, error)
      throw error
    }
  }
}
