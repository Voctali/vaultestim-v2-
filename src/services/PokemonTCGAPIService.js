/**
 * PokemonTCGAPIService - Service pour l'API Pokemon TCG officielle
 *
 * Alternative gratuite à RapidAPI pour la découverte et l'import d'extensions.
 *
 * Endpoints disponibles :
 * - GET /v2/sets - Liste toutes les extensions
 * - GET /v2/sets/{id} - Détails d'une extension
 * - GET /v2/cards?q=set.id:{setId} - Cartes d'une extension
 *
 * Documentation : https://docs.pokemontcg.io/
 *
 * @note Ce service n'est PAS activé par défaut. Pour l'activer :
 * 1. Mettre VITE_USE_POKEMON_TCG_API=true dans .env
 * 2. Optionnel : Ajouter VITE_POKEMON_TCG_API_KEY pour augmenter le rate limit
 */

// Utiliser le proxy en production pour éviter CORS
const BASE_URL = import.meta.env.DEV
  ? 'https://api.pokemontcg.io/v2'  // Dev: appel direct (proxy Vite)
  : '/api/pokemontcg/v2'             // Production: via proxy Vercel

const API_KEY = import.meta.env.VITE_POKEMON_TCG_API_KEY || ''
const ENABLED = import.meta.env.VITE_USE_POKEMON_TCG_API === 'true'

// Cache pour éviter les appels répétés
let cachedSets = null
let cacheTimestamp = null
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

export class PokemonTCGAPIService {
  /**
   * Vérifier si le service est activé
   */
  static isAvailable() {
    return ENABLED
  }

  /**
   * Headers pour les requêtes
   */
  static getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }
    if (API_KEY) {
      headers['X-Api-Key'] = API_KEY
    }
    return headers
  }

  /**
   * Récupérer toutes les extensions
   *
   * @param {Object} options - Options de filtrage
   * @param {string} options.query - Filtre (ex: "legalities.standard:legal")
   * @param {number} options.page - Page (défaut: 1)
   * @param {number} options.pageSize - Taille de page (défaut: 250, max: 250)
   * @returns {Promise<Object>} { data: Array, page, pageSize, count, totalCount }
   */
  static async getAllSets(options = {}) {
    console.log('📚 Pokemon TCG API: Récupération des extensions...')

    try {
      // Vérifier le cache
      if (!options.query && cachedSets && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
        console.log(`✨ Cache: ${cachedSets.length} extensions`)
        return { data: cachedSets, fromCache: true }
      }

      const params = new URLSearchParams()
      if (options.query) params.append('q', options.query)
      if (options.page) params.append('page', options.page.toString())
      params.append('pageSize', (options.pageSize || 250).toString())

      const url = `${BASE_URL}/sets?${params}`
      console.log(`📡 URL: ${url}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const sets = result.data || []

      // Trier par date de sortie (plus récentes en premier)
      sets.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))

      // Mettre en cache si pas de filtre
      if (!options.query) {
        cachedSets = sets
        cacheTimestamp = Date.now()
      }

      console.log(`✅ Pokemon TCG API: ${sets.length} extensions récupérées`)

      return {
        data: sets,
        page: result.page || 1,
        pageSize: result.pageSize || 250,
        count: result.count || sets.length,
        totalCount: result.totalCount || sets.length
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout: L\'API Pokemon TCG met trop de temps à répondre (>30s)')
      }
      console.error('❌ Pokemon TCG API: Erreur getAllSets:', error)
      throw error
    }
  }

  /**
   * Récupérer les détails d'une extension
   *
   * @param {string} setId - ID de l'extension (ex: "sv8", "swsh12")
   * @returns {Promise<Object>} Détails de l'extension
   */
  static async getSet(setId) {
    console.log(`📦 Pokemon TCG API: Récupération extension ${setId}...`)

    try {
      const response = await fetch(`${BASE_URL}/sets/${setId}`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Extension "${setId}" non trouvée`)
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ Extension: ${result.data.name}`)

      return result.data
    } catch (error) {
      console.error(`❌ Pokemon TCG API: Erreur getSet(${setId}):`, error)
      throw error
    }
  }

  /**
   * Récupérer toutes les cartes d'une extension
   *
   * @param {string} setId - ID de l'extension
   * @param {Function} onProgress - Callback de progression
   * @returns {Promise<Array>} Liste des cartes
   */
  static async getCardsBySet(setId, onProgress = null) {
    console.log(`🎴 Pokemon TCG API: Récupération cartes de ${setId}...`)

    try {
      // D'abord récupérer les infos de l'extension pour avoir le total
      const setInfo = await this.getSet(setId)
      const totalCards = setInfo.total || 0

      if (onProgress) {
        onProgress({ current: 0, total: totalCards, setName: setInfo.name })
      }

      const allCards = []
      let page = 1
      const pageSize = 250

      while (true) {
        const params = new URLSearchParams({
          q: `set.id:${setId}`,
          page: page.toString(),
          pageSize: pageSize.toString()
        })

        const url = `${BASE_URL}/cards?${params}`
        console.log(`📄 Page ${page}: ${url}`)

        const response = await fetch(url, {
          headers: this.getHeaders()
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        const cards = result.data || []

        if (cards.length === 0) break

        allCards.push(...cards)

        console.log(`✅ Page ${page}: ${cards.length} cartes (Total: ${allCards.length}/${totalCards})`)

        if (onProgress) {
          onProgress({
            current: allCards.length,
            total: totalCards,
            setName: setInfo.name,
            page
          })
        }

        if (cards.length < pageSize) break
        page++

        // Pause entre les pages pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log(`🎉 ${allCards.length} cartes importées depuis ${setInfo.name}`)
      return allCards
    } catch (error) {
      console.error(`❌ Pokemon TCG API: Erreur getCardsBySet(${setId}):`, error)
      throw error
    }
  }

  /**
   * Rechercher des cartes
   *
   * @param {string} query - Requête de recherche (ex: "name:charizard", "set.id:sv8 rarity:rare")
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} { data: Array, page, pageSize, count, totalCount }
   */
  static async searchCards(query, options = {}) {
    console.log(`🔍 Pokemon TCG API: Recherche "${query}"...`)

    try {
      const params = new URLSearchParams({
        q: query,
        page: (options.page || 1).toString(),
        pageSize: (options.pageSize || 50).toString()
      })

      if (options.orderBy) {
        params.append('orderBy', options.orderBy)
      }

      const response = await fetch(`${BASE_URL}/cards?${params}`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ ${result.data?.length || 0} cartes trouvées`)

      return {
        data: result.data || [],
        page: result.page || 1,
        pageSize: result.pageSize || 50,
        count: result.count || 0,
        totalCount: result.totalCount || 0
      }
    } catch (error) {
      console.error('❌ Pokemon TCG API: Erreur searchCards:', error)
      throw error
    }
  }

  /**
   * Récupérer les extensions légales en Standard
   *
   * @returns {Promise<Array>} Extensions légales
   */
  static async getStandardLegalSets() {
    const result = await this.getAllSets({ query: 'legalities.standard:legal' })
    return result.data
  }

  /**
   * Récupérer les extensions légales en Expanded
   *
   * @returns {Promise<Array>} Extensions légales
   */
  static async getExpandedLegalSets() {
    const result = await this.getAllSets({ query: 'legalities.expanded:legal' })
    return result.data
  }

  /**
   * Récupérer les extensions d'une série spécifique
   *
   * @param {string} seriesName - Nom de la série (ex: "Scarlet & Violet", "Sword & Shield")
   * @returns {Promise<Array>} Extensions de la série
   */
  static async getSetsBySeries(seriesName) {
    const result = await this.getAllSets({ query: `series:"${seriesName}"` })
    return result.data
  }

  /**
   * Vider le cache
   */
  static clearCache() {
    cachedSets = null
    cacheTimestamp = null
    console.log('🗑️ Cache Pokemon TCG API vidé')
  }
}

export default PokemonTCGAPIService
