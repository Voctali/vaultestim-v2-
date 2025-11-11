/**
 * Service pour importer automatiquement toutes les cartes d'une extension Pokemon TCG
 *
 * Ce service permet d'importer en masse toutes les cartes d'une extension
 * directement depuis l'API Pokemon TCG, facilitant l'ajout de nouvelles extensions
 * sans avoir à rechercher manuellement chaque carte.
 */

const BASE_URL = '/api/pokemontcg/v2'

// Cache simple pour éviter de recharger les extensions à chaque fois
let cachedSets = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

class SetImportService {
  /**
   * Récupère la liste de toutes les extensions disponibles
   * @param {Object} options - Options de recherche (series, year, etc.)
   * @returns {Promise<Array>} Liste des extensions triées par date de sortie (plus récentes en premier)
   */
  static async getAllSets(options = {}) {
    try {
      // Vérifier le cache si pas de filtres
      if (!options.series && !options.legalStandardOnly) {
        if (cachedSets && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
          console.log(`✨ Utilisation du cache (${cachedSets.length} extensions)`)
          return cachedSets
        }
      }

      console.log('📚 Récupération de la liste des extensions depuis l\'API...')

      // Construire la query si des filtres sont fournis
      let query = ''
      if (options.series) {
        query = `series:"${options.series}"`
      }
      if (options.legalStandardOnly) {
        query += (query ? ' ' : '') + 'legalities.standard:legal'
      }

      const queryParam = query ? `?q=${encodeURIComponent(query)}&pageSize=250` : '?pageSize=250'
      const url = `${BASE_URL}/sets${queryParam}`

      console.log(`📡 URL: ${url}`)

      // Fetch avec timeout de 15 secondes
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      try {
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        const sets = result.data || []

        // Trier par date de sortie (plus récentes en premier)
        sets.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))

        // Sauvegarder dans le cache si pas de filtres
        if (!options.series && !options.legalStandardOnly) {
          cachedSets = sets
          cacheTimestamp = Date.now()
          console.log(`✅ ${sets.length} extensions trouvées et mises en cache`)
        } else {
          console.log(`✅ ${sets.length} extensions trouvées`)
        }

        return sets
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout: L\'API met trop de temps à répondre (>15s). Utilisez la recherche par ID si vous connaissez l\'extension.')
        }
        throw fetchError
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des extensions:', error)
      throw error
    }
  }

  /**
   * Import toutes les cartes d'une extension spécifique
   * @param {string} setId - ID de l'extension (ex: "sv2", "sv8")
   * @param {Function} onProgress - Callback pour suivre la progression (count, total)
   * @param {AbortSignal} signal - Signal pour annuler l'import
   * @returns {Promise<Array>} Toutes les cartes de l'extension
   */
  static async importSetCards(setId, onProgress = null, signal = null) {
    try {
      console.log(`📦 Import de l'extension: ${setId}`)

      // Récupérer les infos de l'extension d'abord
      const setInfo = await this.getSetInfo(setId)
      console.log(`📋 Extension: ${setInfo.name} (${setInfo.total} cartes)`)

      if (onProgress) {
        onProgress({ count: 0, total: setInfo.total, setName: setInfo.name })
      }

      // Récupérer toutes les cartes avec pagination
      const allCards = []
      let page = 1
      const pageSize = 250 // Maximum autorisé par l'API

      while (true) {
        // Vérifier si annulé
        if (signal?.aborted) {
          console.log('🛑 Import annulé par l\'utilisateur')
          throw new Error('Import annulé')
        }

        const url = `${BASE_URL}/cards?q=set.id:${setId}&page=${page}&pageSize=${pageSize}`
        console.log(`📄 Page ${page}: ${url}`)

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        const cards = result.data || []

        if (cards.length === 0) {
          break // Plus de cartes à récupérer
        }

        allCards.push(...cards)

        console.log(`✅ Page ${page}: ${cards.length} cartes récupérées (Total: ${allCards.length}/${setInfo.total})`)

        if (onProgress) {
          onProgress({
            count: allCards.length,
            total: setInfo.total,
            setName: setInfo.name,
            page
          })
        }

        // Si on a récupéré moins de cartes que le pageSize, c'est la dernière page
        if (cards.length < pageSize) {
          break
        }

        page++
      }

      console.log(`🎉 Import terminé: ${allCards.length} cartes importées depuis ${setInfo.name}`)
      return allCards
    } catch (error) {
      console.error(`❌ Erreur lors de l'import de l'extension ${setId}:`, error)
      throw error
    }
  }

  /**
   * Récupère les informations détaillées d'une extension
   * @param {string} setId - ID de l'extension
   * @returns {Promise<Object>} Informations de l'extension
   */
  static async getSetInfo(setId) {
    try {
      const url = `${BASE_URL}/sets/${setId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Extension ${setId} non trouvée`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération de l'extension ${setId}:`, error)
      throw error
    }
  }

  /**
   * Récupère les extensions d'une série spécifique (ex: "Scarlet & Violet")
   * @param {string} seriesName - Nom de la série
   * @returns {Promise<Array>} Liste des extensions de cette série
   */
  static async getSetsBySeries(seriesName) {
    try {
      const allSets = await this.getAllSets({ series: seriesName })
      return allSets
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des extensions de ${seriesName}:`, error)
      throw error
    }
  }

  /**
   * Récupère toutes les séries disponibles (Scarlet & Violet, Sword & Shield, etc.)
   * @returns {Promise<Array>} Liste unique des séries
   */
  static async getAllSeries() {
    try {
      const allSets = await this.getAllSets()
      const seriesSet = new Set(allSets.map(set => set.series))
      return Array.from(seriesSet).sort()
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des séries:', error)
      throw error
    }
  }
}

export default SetImportService
