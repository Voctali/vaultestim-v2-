/**
 * PriceRefreshService - Service d'actualisation intelligente des prix
 *
 * Stratégie :
 * - Actualisation quotidienne automatique au démarrage (si > 24h)
 * - Par batch de 150 cartes/jour pour éviter surcharge API
 * - Rotation équitable : cycle complet en ~3 mois pour 14,000 cartes
 * - Priorise les cartes consultées récemment ou avec valeur élevée
 */

import { TCGdxService } from './TCGdxService'
import { CardCacheService } from './CardCacheService'
import { SupabaseService } from './SupabaseService'

export class PriceRefreshService {
  // Configuration
  static BATCH_SIZE = 150 // Nombre de cartes à actualiser par batch
  static REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 heures
  static MIN_PRICE_THRESHOLD = 0.10 // Skip cartes < 0.10€ (peu de variation)
  static PRIORITY_PRICE_THRESHOLD = 5.00 // Cartes > 5€ sont prioritaires

  /**
   * Vérifier si une actualisation est nécessaire
   */
  static async shouldRefresh() {
    try {
      const lastRefresh = localStorage.getItem('vaultestim_last_price_refresh')
      if (!lastRefresh) return true

      const timeSinceRefresh = Date.now() - parseInt(lastRefresh)
      const shouldRefresh = timeSinceRefresh > this.REFRESH_INTERVAL_MS

      console.log(`🔍 Dernière actualisation des prix: ${new Date(parseInt(lastRefresh)).toLocaleString('fr-FR')}`)
      console.log(`⏰ Temps écoulé: ${Math.round(timeSinceRefresh / 1000 / 60 / 60)}h`)
      console.log(`${shouldRefresh ? '✅' : '❌'} Actualisation ${shouldRefresh ? 'nécessaire' : 'pas nécessaire'}`)

      return shouldRefresh
    } catch (error) {
      console.warn('⚠️ Erreur vérification actualisation:', error)
      return false
    }
  }

  /**
   * Sélectionner les cartes à actualiser (batch intelligent)
   */
  static selectCardsForRefresh(allCards) {
    console.log(`🎯 Sélection intelligente de ${this.BATCH_SIZE} cartes parmi ${allCards.length}`)

    // Trier par priorité décroissante
    const sortedCards = [...allCards].sort((a, b) => {
      const scoreA = this.calculateRefreshPriority(a)
      const scoreB = this.calculateRefreshPriority(b)
      return scoreB - scoreA
    })

    // Prendre les N premières cartes
    const selectedCards = sortedCards.slice(0, this.BATCH_SIZE)

    // Statistiques
    const highValueCount = selectedCards.filter(c => (c.marketPrice || 0) > this.PRIORITY_PRICE_THRESHOLD).length
    const recentlyViewedCount = selectedCards.filter(c => c._last_viewed).length

    console.log(`📊 Batch sélectionné:`)
    console.log(`  💎 ${highValueCount} cartes à forte valeur (> ${this.PRIORITY_PRICE_THRESHOLD}€)`)
    console.log(`  👀 ${recentlyViewedCount} cartes consultées récemment`)
    console.log(`  📅 Anciennes actualisations prioritaires`)

    return selectedCards
  }

  /**
   * Calculer le score de priorité pour l'actualisation
   * Plus le score est élevé, plus la carte doit être actualisée en priorité
   */
  static calculateRefreshPriority(card) {
    let score = 0

    // 1. Ancienneté de l'actualisation (0-100 points)
    const priceUpdatedAt = card._price_updated_at ? new Date(card._price_updated_at).getTime() : 0
    const ageInDays = priceUpdatedAt ? (Date.now() - priceUpdatedAt) / (1000 * 60 * 60 * 24) : 999
    score += Math.min(ageInDays * 2, 100) // Max 100 points

    // 2. Valeur de la carte (0-50 points)
    const price = card.marketPrice || 0
    if (price > this.PRIORITY_PRICE_THRESHOLD) {
      score += Math.min(price * 5, 50) // Cartes chères = priorité
    }

    // 3. Consultation récente (0-30 points)
    if (card._last_viewed) {
      const viewedAt = new Date(card._last_viewed).getTime()
      const daysSinceView = (Date.now() - viewedAt) / (1000 * 60 * 60 * 24)
      if (daysSinceView < 7) {
        score += 30 - (daysSinceView * 4) // Plus récent = plus de points
      }
    }

    // 4. Pénalité pour cartes très peu chères (skip automatique)
    if (price < this.MIN_PRICE_THRESHOLD && price > 0) {
      score -= 50 // Moins prioritaire
    }

    return score
  }

  /**
   * Actualiser les prix d'un batch de cartes
   */
  static async refreshBatch(cards, onProgress) {
    const results = {
      success: 0,
      errors: 0,
      skipped: 0,
      total: cards.length
    }

    console.log(`🔄 Début actualisation de ${cards.length} cartes...`)

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]

      try {
        // Rechercher la carte mise à jour depuis l'API
        const searchResults = await TCGdxService.searchCards(card.name, 100)

        // Trouver la carte correspondante (même ID)
        const updatedCard = searchResults.find(c => c.id === card.id)

        if (updatedCard && (updatedCard.cardmarket || updatedCard.tcgplayer)) {
          // Mettre à jour la carte avec les nouveaux prix
          const cardWithUpdatedPrice = {
            ...card,
            marketPrice: updatedCard.marketPrice,
            marketPriceDetails: updatedCard.marketPriceDetails,
            cardmarket: updatedCard.cardmarket,
            tcgplayer: updatedCard.tcgplayer,
            _price_updated_at: new Date().toISOString(),
            _timestamp: Date.now()
          }

          // Sauvegarder dans IndexedDB
          await CardCacheService.saveCards([cardWithUpdatedPrice])

          // Sauvegarder dans Supabase
          await SupabaseService.addDiscoveredCards([cardWithUpdatedPrice])

          results.success++

          const oldPrice = card.marketPrice || 'N/A'
          const newPrice = updatedCard.marketPrice || 'N/A'
          const diff = oldPrice !== 'N/A' && newPrice !== 'N/A' ? (newPrice - oldPrice).toFixed(2) : '?'

          console.log(`✅ ${card.name}: ${oldPrice}€ → ${newPrice}€ (${diff > 0 ? '+' : ''}${diff}€)`)
        } else {
          results.skipped++
          console.log(`⏭️ ${card.name}: Aucun prix trouvé, carte skippée`)
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

        // Pause de 500ms entre chaque requête pour éviter rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        results.errors++
        console.error(`❌ Erreur actualisation ${card.name}:`, error)
      }
    }

    console.log(`\n📊 Résultats actualisation:`)
    console.log(`  ✅ ${results.success} prix mis à jour`)
    console.log(`  ⏭️ ${results.skipped} cartes skippées`)
    console.log(`  ❌ ${results.errors} erreurs`)

    return results
  }

  /**
   * Actualiser les prix automatiquement (appelé au démarrage)
   */
  static async autoRefresh(allCards, onProgress) {
    try {
      // Vérifier si actualisation nécessaire
      if (!await this.shouldRefresh()) {
        console.log('⏭️ Actualisation pas nécessaire (< 24h)')
        return { skipped: true, reason: 'too_recent' }
      }

      // Sélectionner le batch de cartes
      const cardsToRefresh = this.selectCardsForRefresh(allCards)

      if (cardsToRefresh.length === 0) {
        console.log('⚠️ Aucune carte à actualiser')
        return { skipped: true, reason: 'no_cards' }
      }

      // Actualiser le batch
      const results = await this.refreshBatch(cardsToRefresh, onProgress)

      // Enregistrer le timestamp de dernière actualisation
      localStorage.setItem('vaultestim_last_price_refresh', Date.now().toString())

      console.log('✅ Actualisation automatique terminée')
      return { ...results, skipped: false }

    } catch (error) {
      console.error('❌ Erreur actualisation automatique:', error)
      throw error
    }
  }

  /**
   * Forcer l'actualisation manuelle de toutes les cartes
   */
  static async forceRefreshAll(allCards, onProgress) {
    console.log('🔄 Actualisation manuelle forcée de TOUTES les cartes...')

    // Diviser en batches de BATCH_SIZE
    const batches = []
    for (let i = 0; i < allCards.length; i += this.BATCH_SIZE) {
      batches.push(allCards.slice(i, i + this.BATCH_SIZE))
    }

    console.log(`📦 ${batches.length} batches de ${this.BATCH_SIZE} cartes`)

    let totalResults = {
      success: 0,
      errors: 0,
      skipped: 0,
      total: allCards.length
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      console.log(`\n📦 Batch ${batchIndex + 1}/${batches.length}`)

      const batchResults = await this.refreshBatch(batches[batchIndex], (progress) => {
        if (onProgress) {
          onProgress({
            ...progress,
            batch: batchIndex + 1,
            totalBatches: batches.length,
            overallProgress: Math.round(((batchIndex * this.BATCH_SIZE + progress.current) / allCards.length) * 100)
          })
        }
      })

      totalResults.success += batchResults.success
      totalResults.errors += batchResults.errors
      totalResults.skipped += batchResults.skipped

      // Pause entre batches (2 secondes)
      if (batchIndex < batches.length - 1) {
        console.log('⏸️ Pause 2s avant prochain batch...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Enregistrer le timestamp
    localStorage.setItem('vaultestim_last_price_refresh', Date.now().toString())

    return totalResults
  }

  /**
   * Obtenir les statistiques d'actualisation
   */
  static getRefreshStats(allCards) {
    const now = Date.now()
    const stats = {
      total: allCards.length,
      withPrices: 0,
      withoutPrices: 0,
      recentlyUpdated: 0, // < 7 jours
      needsUpdate: 0, // > 30 jours ou jamais
      lastRefresh: null,
      nextRefresh: null
    }

    allCards.forEach(card => {
      const hasPrice = card.cardmarket || card.tcgplayer || card.marketPrice
      if (hasPrice) {
        stats.withPrices++
      } else {
        stats.withoutPrices++
      }

      const priceUpdatedAt = card._price_updated_at ? new Date(card._price_updated_at).getTime() : 0
      if (priceUpdatedAt) {
        const ageInDays = (now - priceUpdatedAt) / (1000 * 60 * 60 * 24)

        if (ageInDays < 7) {
          stats.recentlyUpdated++
        } else if (ageInDays > 30) {
          stats.needsUpdate++
        }
      } else {
        stats.needsUpdate++
      }
    })

    // Dernière actualisation globale
    const lastRefresh = localStorage.getItem('vaultestim_last_price_refresh')
    if (lastRefresh) {
      stats.lastRefresh = new Date(parseInt(lastRefresh))
      stats.nextRefresh = new Date(parseInt(lastRefresh) + this.REFRESH_INTERVAL_MS)
    }

    return stats
  }
}
