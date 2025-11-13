/**
 * HybridPriceService - Orchestrateur intelligent pour les prix
 *
 * Stratégie :
 * 1. Essaie RapidAPI (prix précis par version) si quota disponible
 * 2. Fallback sur PriceRefreshService (prix moyens) si quota épuisé ou erreur
 * 3. Gestion automatique du quota avec compteur localStorage
 * 4. Feature flag pour activer/désactiver RapidAPI
 *
 * Avantages :
 * - Meilleur des deux mondes : précision RapidAPI + couverture PriceRefreshService
 * - Zéro frais supplémentaires : fallback automatique quand quota atteint
 * - Migration progressive : peut être activé/désactivé via .env
 */

import { RapidAPIService } from './RapidAPIService'
import { PriceRefreshService } from './PriceRefreshService'
import { QuotaTracker } from './QuotaTracker'

export class HybridPriceService {
  /**
   * Récupérer les prix d'une carte avec fallback intelligent
   *
   * @param {Object} card - La carte dont on veut les prix
   * @returns {Promise<Object>} Carte avec prix mis à jour
   */
  static async getCardPrices(card) {
    console.log(`💰 HybridPrice: Récupération prix pour ${card.name}...`)

    // 1. Vérifier si RapidAPI est disponible et activé
    if (!RapidAPIService.isAvailable()) {
      console.log('⏭️ RapidAPI désactivé → Fallback PriceRefreshService')
      return this.fallbackToPriceRefreshService(card)
    }

    // 2. Vérifier le quota
    const quotaCheck = QuotaTracker.canMakeRequest()
    if (!quotaCheck.allowed) {
      console.log(`⏭️ ${quotaCheck.message} → Fallback PriceRefreshService`)
      return this.fallbackToPriceRefreshService(card)
    }

    // 3. Essayer RapidAPI
    try {
      console.log(`🚀 Tentative RapidAPI (${quotaCheck.remaining} requêtes restantes)...`)

      const rapidApiData = await RapidAPIService.getCardWithPrices(card.id)

      // Incrémenter le quota
      QuotaTracker.incrementUsage()

      // Formatter les données RapidAPI au format VaultEstim
      const formattedCard = this.formatRapidAPIData(card, rapidApiData)

      console.log(`✅ Prix RapidAPI récupérés pour ${card.name}`)
      return formattedCard

    } catch (error) {
      console.warn(`⚠️ Erreur RapidAPI: ${error.message}`)
      console.log('⏭️ Fallback sur PriceRefreshService')
      return this.fallbackToPriceRefreshService(card)
    }
  }

  /**
   * Fallback sur l'ancien système de prix
   */
  static async fallbackToPriceRefreshService(card) {
    console.log(`📊 Utilisation PriceRefreshService pour ${card.name}...`)

    // Le PriceRefreshService utilise TCGdxService qui interroge l'API Pokemon TCG
    // et récupère les prix moyens (pas de distinction par version)
    const { TCGdxService } = await import('./TCGdxService')

    try {
      const searchResults = await TCGdxService.searchCards(card.name, 100)
      const updatedCard = searchResults.find(c => c.id === card.id)

      if (updatedCard && (updatedCard.cardmarket || updatedCard.tcgplayer)) {
        return {
          ...card,
          marketPrice: updatedCard.marketPrice,
          marketPriceDetails: updatedCard.marketPriceDetails,
          cardmarket: updatedCard.cardmarket,
          tcgplayer: updatedCard.tcgplayer,
          _price_updated_at: new Date().toISOString(),
          _price_source: 'pokemon-tcg-api'
        }
      }

      console.warn(`⚠️ Aucun prix trouvé pour ${card.name}`)
      return card

    } catch (error) {
      console.error(`❌ Erreur PriceRefreshService:`, error)
      return card
    }
  }

  /**
   * Formatter les données RapidAPI au format VaultEstim
   *
   * @param {Object} originalCard - Carte originale
   * @param {Object} rapidApiData - Données RapidAPI
   * @returns {Object} Carte formatée
   */
  static formatRapidAPIData(originalCard, rapidApiData) {
    // TODO: Adapter selon le format réel de l'API RapidAPI
    // Pour l'instant, on suppose que l'API retourne des prix par version

    const formatted = {
      ...originalCard,
      _price_updated_at: new Date().toISOString(),
      _price_source: 'rapidapi'
    }

    // Si l'API retourne des prix CardMarket
    if (rapidApiData.cardmarket) {
      formatted.cardmarket = rapidApiData.cardmarket
      formatted.marketPrice = rapidApiData.cardmarket.averagePrice || rapidApiData.cardmarket.trendPrice
    }

    // Si l'API retourne des prix TCGPlayer
    if (rapidApiData.tcgplayer) {
      formatted.tcgplayer = rapidApiData.tcgplayer
    }

    // Prix par version (si disponible)
    if (rapidApiData.pricesByVersion) {
      formatted.pricesByVersion = rapidApiData.pricesByVersion
    }

    return formatted
  }

  /**
   * Actualiser les prix d'un batch de cartes (version hybride)
   *
   * @param {Array} cards - Cartes à actualiser
   * @param {Function} onProgress - Callback de progression
   * @returns {Promise<Object>} Résultats
   */
  static async refreshBatch(cards, onProgress) {
    const results = {
      rapidapi: 0,
      fallback: 0,
      errors: 0,
      total: cards.length
    }

    console.log(`\n🔄 HybridPrice: Actualisation de ${cards.length} cartes...`)
    QuotaTracker.logStats()

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]

      try {
        const updatedCard = await this.getCardPrices(card)

        if (updatedCard._price_source === 'rapidapi') {
          results.rapidapi++
        } else {
          results.fallback++
        }

        // Callback de progression
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: cards.length,
            percentage: Math.round(((i + 1) / cards.length) * 100),
            currentCard: card.name,
            results
          })
        }

        // Pause entre requêtes (respect rate limiting)
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        results.errors++
        console.error(`❌ Erreur actualisation ${card.name}:`, error)
      }
    }

    console.log(`\n📊 Résultats actualisation hybride:`)
    console.log(`  🚀 ${results.rapidapi} via RapidAPI`)
    console.log(`  📊 ${results.fallback} via PriceRefreshService (fallback)`)
    console.log(`  ❌ ${results.errors} erreurs`)

    QuotaTracker.logStats()

    return results
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
      recommendation: this.getRecommendation(quotaStats)
    }
  }

  /**
   * Obtenir une recommandation d'utilisation
   */
  static getRecommendation(quotaStats) {
    if (!RapidAPIService.isAvailable()) {
      return 'RapidAPI désactivé. Activez-le dans .env pour des prix plus précis.'
    }

    if (quotaStats.isExhausted) {
      return `Quota épuisé. Utilisation du fallback jusqu'à ${quotaStats.resetAt.toLocaleTimeString('fr-FR')}.`
    }

    if (quotaStats.isNearLimit) {
      return `Proche de la limite (${quotaStats.percentUsed}%). Utilisation recommandée pour cartes à forte valeur uniquement.`
    }

    return `${quotaStats.remaining} requêtes disponibles. Utilisation optimale.`
  }
}
