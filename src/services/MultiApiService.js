/**
 * Service Multi-API avec TCGdx comme source unique
 * Gestion simplifiée avec fallback vers données de démonstration
 */

import { TCGdxService } from './TCGdxService'
import { CacheService } from './CacheService'

export class MultiApiService {
  static API_SOURCES = {
    POKEMON_TCG: 'pokemon-tcg'
  }

  static API_PRIORITY = [
    this.API_SOURCES.POKEMON_TCG
  ]

  static API_STATUS = {
    [this.API_SOURCES.POKEMON_TCG]: {
      available: true,
      lastError: null,
      errorCount: 0,
      lastSuccess: Date.now()
    }
  }

  static ERROR_THRESHOLD = 3  // Désactiver l'API après 3 erreurs consécutives
  static RECOVERY_TIME = 5 * 60 * 1000  // Réessayer après 5 minutes

  /**
   * Rechercher des cartes avec fallback automatique
   */
  static async searchCards(query, limit = 50) {
    console.log(`🔍 Recherche Pokemon TCG: "${query}"`)

    // 1. Vérifier le cache d'abord
    const cachedResults = CacheService.getCacheSearch(query)
    if (cachedResults) {
      console.log(`⚡ Résultats depuis le cache: ${cachedResults.length} cartes`)
      return cachedResults
    }

    // 2. Essayer chaque API dans l'ordre de priorité
    const availableApis = this.getAvailableApis()
    let lastError = null
    let apiSucceeded = false

    for (const apiSource of availableApis) {
      try {
        console.log(`📡 Tentative avec ${apiSource}...`)
        const results = await this.searchWithApi(apiSource, query, limit)

        // Succès - l'API a répondu (même si 0 résultats)
        apiSucceeded = true
        this.markApiSuccess(apiSource)

        if (results && results.length > 0) {
          // Des cartes trouvées - mettre en cache
          CacheService.setCacheSearch(query, results)

          // Mettre en cache chaque carte individuellement
          results.forEach(card => {
            if (card.id) {
              CacheService.setCacheCard(card.id, card)
            }
          })

          console.log(`✅ Succès avec ${apiSource}: ${results.length} cartes`)
          return results
        } else {
          // L'API a répondu mais 0 résultats - ce n'est PAS une erreur
          console.log(`ℹ️ ${apiSource}: Aucun résultat pour "${query}"`)
          return []
        }
      } catch (error) {
        console.warn(`⚠️ Échec ${apiSource}:`, error.message)
        this.markApiError(apiSource, error)
        lastError = error
      }
    }

    // 3. Échec total - toutes les APIs ont échoué (erreurs réseau/serveur)
    if (!apiSucceeded) {
      console.error(`❌ Toutes les APIs ont échoué pour: "${query}"`)
      throw lastError || new Error('API Pokemon TCG indisponible. Veuillez réessayer plus tard.')
    }

    // Si on arrive ici, les APIs ont répondu mais 0 résultats
    return []
  }

  /**
   * Rechercher avec une API spécifique
   */
  static async searchWithApi(apiSource, query, limit) {
    switch (apiSource) {
      case this.API_SOURCES.POKEMON_TCG:
        return await TCGdxService.searchCards(query, limit)

      default:
        throw new Error(`API inconnue: ${apiSource}`)
    }
  }



  /**
   * Rechercher dans le cache local
   */
  static searchInCache(query) {
    const results = []
    const queryLower = query.toLowerCase()

    // Parcourir le localStorage pour trouver des cartes cachées
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key && key.startsWith(CacheService.CACHE_KEYS.CARDS)) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const cacheEntry = JSON.parse(cached)

            // Vérifier si pas expiré
            if (Date.now() <= cacheEntry.expires) {
              const card = cacheEntry.data

              // Vérifier si correspond à la recherche (word boundary pour éviter faux positifs)
              if (card.name) {
                const cardNameLower = card.name.toLowerCase()

                // Recherche par mot complet pour éviter "bea" dans "beautifly"
                const matchesExact = cardNameLower === queryLower
                const matchesWordBoundary = (
                  cardNameLower === queryLower ||
                  cardNameLower.startsWith(queryLower + ' ') ||
                  cardNameLower.includes(' ' + queryLower + ' ') ||
                  cardNameLower.endsWith(' ' + queryLower)
                )

                if (matchesExact || matchesWordBoundary) {
                  results.push(card)
                }
              }
            }
          }
        } catch (error) {
          // Ignorer les entrées corrompues
        }
      }
    }

    return results.slice(0, 50) // Limiter les résultats
  }

  /**
   * Marquer une API comme ayant réussi
   */
  static markApiSuccess(apiSource) {
    const status = this.API_STATUS[apiSource]
    if (status) {
      status.available = true
      status.errorCount = 0
      status.lastSuccess = Date.now()
      status.lastError = null
      console.log(`✅ ${apiSource} marquée comme disponible`)
    }
  }

  /**
   * Marquer une API comme ayant échoué
   */
  static markApiError(apiSource, error) {
    const status = this.API_STATUS[apiSource]
    if (status) {
      status.errorCount++
      status.lastError = error.message

      if (status.errorCount >= this.ERROR_THRESHOLD) {
        status.available = false
        console.warn(`❌ ${apiSource} désactivée après ${status.errorCount} erreurs`)

        // Programmer une récupération
        setTimeout(() => {
          this.attemptApiRecovery(apiSource)
        }, this.RECOVERY_TIME)
      }
    }
  }

  /**
   * Tentative de récupération d'une API
   */
  static async attemptApiRecovery(apiSource) {
    console.log(`🔄 Tentative de récupération API: ${apiSource}`)

    try {
      // Test simple avec une carte populaire
      await this.searchWithApi(apiSource, 'Pikachu', 1)
      this.markApiSuccess(apiSource)
      console.log(`✅ API récupérée avec succès`)
    } catch (error) {
      console.warn(`❌ Récupération API échouée:`, error.message)

      // Programmer une nouvelle tentative
      setTimeout(() => {
        this.attemptApiRecovery(apiSource)
      }, this.RECOVERY_TIME)
    }
  }

  /**
   * Obtenir la liste des APIs disponibles triées par priorité
   */
  static getAvailableApis() {
    const now = Date.now()

    return this.API_PRIORITY.filter(apiSource => {
      const status = this.API_STATUS[apiSource]
      return status.available || (now - status.lastSuccess) > this.RECOVERY_TIME
    })
  }

  /**
   * Obtenir le statut de toutes les APIs
   */
  static getApiStatus() {
    return Object.entries(this.API_STATUS).map(([name, status]) => ({
      name,
      available: status.available,
      errorCount: status.errorCount,
      lastError: status.lastError,
      lastSuccess: new Date(status.lastSuccess).toLocaleString()
    }))
  }

  /**
   * Forcer la vérification de toutes les APIs
   */
  static async checkAllApis() {
    console.log('🔄 Vérification de toutes les APIs...')

    const results = []

    for (const apiSource of this.API_PRIORITY) {
      try {
        await this.searchWithApi(apiSource, 'Pikachu', 1)
        this.markApiSuccess(apiSource)
        results.push({ api: apiSource, status: 'OK' })
      } catch (error) {
        this.markApiError(apiSource, error)
        results.push({ api: apiSource, status: 'ERROR', error: error.message })
      }
    }

    return results
  }

  /**
   * Obtenir les statistiques globales
   */
  static getStats() {
    const cacheStats = CacheService.getCacheStats()
    const apiStatus = this.getApiStatus()

    return {
      cache: cacheStats,
      apis: apiStatus,
      availableApis: this.getAvailableApis().length,
      totalApis: this.API_PRIORITY.length
    }
  }
}

// Pas de vérification automatique - seulement sur demande