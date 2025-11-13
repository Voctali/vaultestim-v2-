/**
 * HybridPriceService - Orchestrateur intelligent pour les prix
 *
 * Stratégie :
 * 1. Essaie RapidAPI (CardMarket API TCG) si quota disponible
 *    - Prix précis en EUR par version (Near Mint, DE, FR)
 *    - Prix des cartes gradées (PSA, CGC)
 *    - Moyennes 7j et 30j
 * 2. Fallback sur Pokemon TCG API si quota épuisé ou erreur
 *    - Prix TCGPlayer USD
 *    - Moins précis mais gratuit et illimité
 * 3. Gestion automatique du quota avec compteur localStorage
 * 4. Feature flag pour activer/désactiver RapidAPI
 *
 * Avantages :
 * - Meilleur des deux mondes : précision RapidAPI + couverture Pokemon TCG
 * - Zéro frais supplémentaires : fallback automatique quand quota atteint
 * - Migration progressive : peut être activé/désactivé via .env
 */

import { RapidAPIService } from './RapidAPIService.js'
import { QuotaTracker } from './QuotaTracker.js'

export class HybridPriceService {
  /**
   * Rechercher des cartes avec fallback intelligent
   *
   * @param {string} searchTerm - Terme de recherche
   * @param {number} limit - Nombre de résultats
   * @returns {Promise<Array>} Cartes avec prix
   */
  static async searchCards(searchTerm, limit = 50) {
    console.log(`💰 HybridPrice: Recherche "${searchTerm}"...`)

    // 1. Vérifier si RapidAPI est disponible et activé
    if (!RapidAPIService.isAvailable()) {
      console.log('⏭️ RapidAPI désactivé → Fallback Pokemon TCG API')
      return this.fallbackToPokemonTCGAPI(searchTerm, limit)
    }

    // 2. Vérifier le quota
    const quotaCheck = QuotaTracker.canMakeRequest()
    if (!quotaCheck.allowed) {
      console.log(`⏭️ ${quotaCheck.message} → Fallback Pokemon TCG API`)
      return this.fallbackToPokemonTCGAPI(searchTerm, limit)
    }

    // 3. Essayer RapidAPI
    try {
      console.log(`🚀 Tentative RapidAPI (${quotaCheck.remaining} requêtes restantes)...`)

      const result = await RapidAPIService.searchCards(searchTerm, { limit })

      // Incrémenter le quota
      QuotaTracker.incrementUsage()

      // Convertir au format VaultEstim
      const cards = this.formatRapidAPICards(result.data || [])

      console.log(`✅ ${cards.length} cartes récupérées via RapidAPI`)
      return cards

    } catch (error) {
      console.warn(`⚠️ Erreur RapidAPI: ${error.message}`)
      console.log('⏭️ Fallback sur Pokemon TCG API')
      return this.fallbackToPokemonTCGAPI(searchTerm, limit)
    }
  }

  /**
   * Fallback sur l'API Pokemon TCG officielle
   */
  static async fallbackToPokemonTCGAPI(searchTerm, limit = 50) {
    console.log(`📊 Utilisation Pokemon TCG API pour "${searchTerm}"...`)

    const { TCGdxService } = await import('./TCGdxService')

    try {
      // IMPORTANT: Utiliser searchCardsDirect au lieu de searchCards
      // pour éviter une boucle infinie (searchCards appelle HybridPriceService)
      const cards = await TCGdxService.searchCardsDirect(searchTerm, limit)

      // Ajouter un marqueur de source
      return cards.map(card => ({
        ...card,
        _price_source: 'pokemon-tcg-api'
      }))

    } catch (error) {
      console.error(`❌ Erreur Pokemon TCG API:`, error)
      return []
    }
  }

  /**
   * Formatter les données RapidAPI au format VaultEstim
   *
   * @param {Array} rapidApiCards - Cartes depuis RapidAPI
   * @returns {Array} Cartes formatées pour VaultEstim
   */
  static formatRapidAPICards(rapidApiCards) {
    return rapidApiCards.map(card => {
      // Extraire les prix CardMarket
      const cm = card.prices?.cardmarket || {}
      const tcp = card.prices?.tcg_player || {}

      // Déterminer le prix principal (Near Mint ou moyenne 30j)
      const marketPrice = cm.lowest_near_mint || cm['30d_average'] || cm['7d_average'] || 0

      return {
        // Identifiants
        id: card.tcgid || `rapid-${card.id}`,
        name: card.name,

        // Détails carte
        number: card.card_number?.toString() || '',
        hp: card.hp,
        rarity: card.rarity,
        supertype: card.supertype,

        // Extension
        set: {
          id: card.episode?.slug || '',
          name: card.episode?.name || '',
          series: card.episode?.series?.name || '',
          printedTotal: card.episode?.cards_printed_total || 0,
          total: card.episode?.cards_total || 0,
          releaseDate: card.episode?.released_at || '',
          images: {
            logo: card.episode?.logo || '',
            symbol: card.episode?.logo || ''
          },
          ptcgoCode: card.episode?.code || null
        },

        // Artiste
        artist: card.artist?.name || '',

        // Images
        images: {
          small: card.image || '',
          large: card.image || ''
        },

        // Prix CardMarket (EUR)
        cardmarket: {
          url: card.links?.cardmarket || '',
          updatedAt: new Date().toISOString(),
          prices: {
            averageSellPrice: cm['30d_average'] || null,
            lowPrice: cm.lowest_near_mint || null,
            trendPrice: cm['7d_average'] || null,
            germanProLow: cm.lowest_near_mint_DE || null,
            suggestedPrice: cm.lowest_near_mint_FR || null,
            reverseHoloSell: null,
            reverseHoloLow: null,
            reverseHoloTrend: null,
            lowPriceExPlus: null,
            avg1: cm['7d_average'] || null,
            avg7: cm['7d_average'] || null,
            avg30: cm['30d_average'] || null,
            reverseHoloAvg1: null,
            reverseHoloAvg7: null,
            reverseHoloAvg30: null
          }
        },

        // Prix TCGPlayer (USD converti en EUR)
        tcgplayer: tcp.market_price ? {
          url: '',
          updatedAt: new Date().toISOString(),
          prices: {
            normal: {
              low: null,
              mid: tcp.mid_price || null,
              high: null,
              market: tcp.market_price || null,
              directLow: null
            },
            holofoil: null,
            reverseHolofoil: null,
            '1stEditionHolofoil': null,
            '1stEditionNormal': null
          }
        } : undefined,

        // Prix gradées (uniquement disponible avec RapidAPI)
        gradedPrices: cm.graded ? {
          psa: {
            psa10: cm.graded.psa?.psa10 || null,
            psa9: cm.graded.psa?.psa9 || null
          },
          cgc: {
            cgc10: null,
            cgc9: cm.graded.cgc?.cgc9 || null
          }
        } : null,

        // Prix principal pour affichage
        marketPrice: marketPrice,
        marketPriceDetails: {
          currency: 'EUR',
          source: 'cardmarket',
          nearMint: cm.lowest_near_mint || null,
          nearMint_DE: cm.lowest_near_mint_DE || null,
          nearMint_FR: cm.lowest_near_mint_FR || null,
          avg7d: cm['7d_average'] || null,
          avg30d: cm['30d_average'] || null
        },

        // Métadonnées
        _price_updated_at: new Date().toISOString(),
        _price_source: 'rapidapi',
        _rapidapi_id: card.id
      }
    })
  }

  /**
   * Obtenir les statistiques du service hybride
   */
  static getStats() {
    const quotaStats = QuotaTracker.getStats()
    const rapidApiAvailable = RapidAPIService.isAvailable()

    return {
      rapidApiEnabled: rapidApiAvailable,
      quota: quotaStats,
      recommendation: this.getRecommendation(quotaStats, rapidApiAvailable)
    }
  }

  /**
   * Obtenir une recommandation d'utilisation
   */
  static getRecommendation(quotaStats, rapidApiAvailable) {
    if (!rapidApiAvailable) {
      return 'RapidAPI désactivé. Activez VITE_USE_RAPIDAPI=true dans .env pour des prix plus précis en EUR.'
    }

    if (quotaStats.isExhausted) {
      return `Quota épuisé (${quotaStats.used}/${quotaStats.limit}). Utilisation du fallback Pokemon TCG API jusqu'à ${quotaStats.resetAt.toLocaleTimeString('fr-FR')}.`
    }

    if (quotaStats.isNearLimit) {
      return `Proche de la limite (${quotaStats.percentUsed}%). ${quotaStats.remaining} requêtes restantes. Utilisez pour les recherches importantes.`
    }

    return `${quotaStats.remaining} requêtes RapidAPI disponibles sur ${quotaStats.limit}. Utilisation optimale.`
  }

  /**
   * Forcer l'utilisation de RapidAPI (pour tests)
   */
  static async forceRapidAPI(searchTerm, limit = 10) {
    if (!RapidAPIService.isAvailable()) {
      throw new Error('RapidAPI non disponible (vérifiez .env)')
    }

    const result = await RapidAPIService.searchCards(searchTerm, { limit })
    QuotaTracker.incrementUsage()

    return this.formatRapidAPICards(result.data || [])
  }

  /**
   * Forcer l'utilisation de Pokemon TCG API (pour tests)
   */
  static async forcePokemonTCGAPI(searchTerm, limit = 10) {
    return this.fallbackToPokemonTCGAPI(searchTerm, limit)
  }
}
