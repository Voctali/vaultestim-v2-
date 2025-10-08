/**
 * Service pour communiquer avec l'API backend
 * Remplace les anciens services API externes
 */

import { config } from '@/lib/config'

export class DatabaseService {
  static BASE_URL = config.API_BASE_URL

  /**
   * Rechercher des cartes avec filtres avancés
   */
  static async searchCards(options = {}) {
    try {
      const {
        query = '',
        setId = '',
        type = '',
        rarity = '',
        types = [],
        page = 1,
        limit = 50
      } = options

      const params = new URLSearchParams()

      if (query) params.append('q', query)
      if (setId) params.append('set', setId)
      if (type) params.append('type', type)
      if (rarity) params.append('rarity', rarity)
      if (types.length > 0) params.append('types', JSON.stringify(types))
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      const response = await fetch(`${this.BASE_URL}/cards?${params}`)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ ${data.data.length} cartes trouvées (page ${data.pagination.page}/${data.pagination.totalPages})`)

      return data

    } catch (error) {
      console.error('❌ Erreur recherche cartes:', error)
      throw error
    }
  }

  /**
   * Récupérer une carte par ID
   */
  static async getCardById(cardId) {
    try {
      const response = await fetch(`${this.BASE_URL}/cards/${cardId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Carte non trouvée')
        }
        throw new Error(`Erreur API: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Erreur récupération carte:', error)
      throw error
    }
  }

  /**
   * Autocomplétion pour la recherche
   */
  static async getAutocompleteSuggestions(query, limit = 10) {
    try {
      if (!query || query.length < 2) {
        return { suggestions: [] }
      }

      const params = new URLSearchParams({
        q: query,
        limit: limit.toString()
      })

      const response = await fetch(`${this.BASE_URL}/cards/autocomplete?${params}`)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Erreur autocomplétion:', error)
      return { suggestions: [] }
    }
  }

  /**
   * Récupérer toutes les extensions
   */
  static async getSets(filters = {}) {
    try {
      const { series, block, year } = filters
      const params = new URLSearchParams()

      if (series) params.append('series', series)
      if (block) params.append('block', block)
      if (year) params.append('year', year.toString())

      const response = await fetch(`${this.BASE_URL}/sets?${params}`)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Erreur récupération extensions:', error)
      throw error
    }
  }

  /**
   * Récupérer une extension par ID
   */
  static async getSetById(setId) {
    try {
      const response = await fetch(`${this.BASE_URL}/sets/${setId}`)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Erreur récupération extension:', error)
      throw error
    }
  }

  /**
   * Récupérer les cartes d'une extension
   */
  static async getSetCards(setId, options = {}) {
    try {
      const {
        type = '',
        rarity = '',
        sort = 'number',
        order = 'asc',
        page = 1,
        limit = 100
      } = options

      const params = new URLSearchParams()

      if (type) params.append('type', type)
      if (rarity) params.append('rarity', rarity)
      params.append('sort', sort)
      params.append('order', order)
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      const response = await fetch(`${this.BASE_URL}/sets/${setId}/cards?${params}`)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Erreur cartes extension:', error)
      throw error
    }
  }

  /**
   * Récupérer les séries disponibles
   */
  static async getSeries() {
    try {
      const response = await fetch(`${this.BASE_URL}/sets/series`)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Erreur récupération séries:', error)
      throw error
    }
  }

  /**
   * Récupérer les statistiques
   */
  static async getStats() {
    try {
      const response = await fetch(`${this.BASE_URL}/stats`)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Erreur statistiques:', error)
      throw error
    }
  }

  /**
   * Synchronisation
   */
  static async triggerSync(type = 'full') {
    try {
      const response = await fetch(`${this.BASE_URL}/sync/${type}`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Erreur synchronisation:', error)
      throw error
    }
  }

  /**
   * Statut de synchronisation
   */
  static async getSyncStatus() {
    try {
      const response = await fetch(`${this.BASE_URL}/sync/status`)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Erreur statut sync:', error)
      throw error
    }
  }

  /**
   * Collections utilisateur (si authentification implémentée)
   */
  static async getUserCollection(userId) {
    try {
      const response = await fetch(`${this.BASE_URL}/collections/${userId}`)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Erreur collection:', error)
      throw error
    }
  }

  /**
   * Ajouter une carte à la collection
   */
  static async addToCollection(userId, cardData) {
    try {
      const response = await fetch(`${this.BASE_URL}/collections/${userId}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cardData)
      })

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Erreur ajout collection:', error)
      throw error
    }
  }

  /**
   * Formatage et validation
   */
  static formatSearchQuery(query) {
    if (!query) return ''

    // Nettoyer et normaliser la requête
    return query.trim().replace(/\s+/g, ' ')
  }

  static validatePagination(page, limit) {
    const validPage = Math.max(1, parseInt(page) || 1)
    const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 50))

    return { page: validPage, limit: validLimit }
  }

  /**
   * Cache côté client (simple)
   */
  static cache = new Map()
  static CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  static getCached(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  static setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  static clearCache() {
    this.cache.clear()
  }
}