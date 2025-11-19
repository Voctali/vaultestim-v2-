/**
 * PriceRefreshService - Service d'actualisation intelligente des prix
 *
 * Stratégie :
 * - Actualisation quotidienne automatique au démarrage (si > 24h)
 * - Par batch de 1500 cartes/jour pour actualisation accélérée
 * - Rotation équitable : cycle complet en ~12 jours pour 17,400 cartes
 * - Priorise les cartes consultées récemment ou avec valeur élevée
 */

import { TCGdxService } from './TCGdxService'
import { CardCacheService } from './CardCacheService'
import { SupabaseService } from './SupabaseService'

export class PriceRefreshService {
  // Configuration
  static BATCH_SIZE = 1500 // Nombre de cartes à actualiser par batch (augmenté pour accélérer la rotation)
  static REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 heures
  static MIN_PRICE_THRESHOLD = 0.10 // Skip cartes < 0.10€ (peu de variation)
  static PRIORITY_PRICE_THRESHOLD = 5.00 // Cartes > 5€ sont prioritaires
  static REQUEST_DELAY_MS = 1000 // Pause de 1s entre chaque requête pour éviter rate limiting
  static STORAGE_KEY_PROGRESS = 'vaultestim_price_refresh_progress' // Clé localStorage pour la progression
  static STORAGE_KEY_DAILY_REQUESTS = 'vaultestim_price_refresh_daily_requests' // Clé localStorage pour le compteur de requêtes

  /**
   * Obtenir la progression sauvegardée
   */
  static getProgress() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_PROGRESS)
      if (!stored) return null

      const progress = JSON.parse(stored)
      return progress
    } catch (error) {
      console.warn('⚠️ Erreur lecture progression:', error)
      return null
    }
  }

  /**
   * Sauvegarder la progression actuelle
   */
  static saveProgress(current, total) {
    try {
      const progress = {
        current,
        total,
        percentage: Math.round((current / total) * 100),
        lastUpdated: Date.now()
      }
      localStorage.setItem(this.STORAGE_KEY_PROGRESS, JSON.stringify(progress))
    } catch (error) {
      console.warn('⚠️ Erreur sauvegarde progression:', error)
    }
  }

  /**
   * Réinitialiser la progression
   */
  static clearProgress() {
    try {
      localStorage.removeItem(this.STORAGE_KEY_PROGRESS)
    } catch (error) {
      console.warn('⚠️ Erreur réinitialisation progression:', error)
    }
  }

  /**
   * Obtenir le compteur de requêtes quotidiennes
   */
  static getDailyRequests() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_DAILY_REQUESTS)
      const today = new Date().toDateString()

      if (!stored) {
        // Initialiser et persister
        const newData = { count: 0, date: today }
        localStorage.setItem(this.STORAGE_KEY_DAILY_REQUESTS, JSON.stringify(newData))
        return newData
      }

      const data = JSON.parse(stored)

      // Réinitialiser si on a changé de jour ET persister
      if (data.date !== today) {
        const resetData = { count: 0, date: today }
        localStorage.setItem(this.STORAGE_KEY_DAILY_REQUESTS, JSON.stringify(resetData))
        console.log('🔄 PriceRefreshService: Nouveau jour détecté, reset du compteur de requêtes')
        return resetData
      }

      return data
    } catch (error) {
      console.warn('⚠️ Erreur lecture compteur requêtes:', error)
      return { count: 0, date: new Date().toDateString() }
    }
  }

  /**
   * Incrémenter le compteur de requêtes quotidiennes
   */
  static incrementDailyRequests() {
    try {
      const current = this.getDailyRequests()
      current.count++
      localStorage.setItem(this.STORAGE_KEY_DAILY_REQUESTS, JSON.stringify(current))
      return current.count
    } catch (error) {
      console.warn('⚠️ Erreur incrémentation compteur requêtes:', error)
      return 0
    }
  }

  /**
   * Réinitialiser le compteur de requêtes quotidiennes
   */
  static resetDailyRequests() {
    try {
      const data = { count: 0, date: new Date().toDateString() }
      localStorage.setItem(this.STORAGE_KEY_DAILY_REQUESTS, JSON.stringify(data))
    } catch (error) {
      console.warn('⚠️ Erreur réinitialisation compteur requêtes:', error)
    }
  }

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
    // Récupérer la progression sauvegardée (si actualisation de page)
    const savedProgress = this.getProgress()
    const startIndex = savedProgress && savedProgress.total === cards.length ? savedProgress.current : 0

    const results = {
      success: 0,
      errors: 0,
      skipped: 0,
      total: cards.length
    }

    if (startIndex > 0) {
      console.log(`🔄 Reprise de l'actualisation à la carte ${startIndex + 1}/${cards.length}`)
    } else {
      console.log(`🔄 Début actualisation de ${cards.length} cartes...`)
    }

    const remainingCards = cards.length - startIndex
    console.log(`⏱️ Durée estimée: ~${Math.round((remainingCards * this.REQUEST_DELAY_MS) / 1000 / 60)} minutes`)

    // Obtenir le compteur de requêtes quotidiennes
    const dailyRequests = this.getDailyRequests()
    console.log(`📊 Requêtes API aujourd'hui (${dailyRequests.date}): ${dailyRequests.count}`)

    for (let i = startIndex; i < cards.length; i++) {
      const card = cards[i]

      try {
        // Rechercher la carte mise à jour depuis l'API
        const searchResults = await TCGdxService.searchCards(card.name, 100)

        // Incrémenter le compteur de requêtes
        const requestCount = this.incrementDailyRequests()

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

          console.log(`✅ [${i + 1}/${cards.length}] ${card.name}: ${oldPrice}€ → ${newPrice}€ (${diff > 0 ? '+' : ''}${diff}€) | Requêtes: ${requestCount}`)
        } else {
          results.skipped++
          console.log(`⏭️ [${i + 1}/${cards.length}] ${card.name}: Aucun prix trouvé, carte skippée | Requêtes: ${requestCount}`)
        }

        // Sauvegarder la progression
        this.saveProgress(i + 1, cards.length)

        // Callback de progression
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: cards.length,
            percentage: Math.round(((i + 1) / cards.length) * 100),
            currentCard: card.name,
            results,
            dailyRequestCount: requestCount
          })
        }

        // Pause de 1s entre chaque requête pour éviter rate limiting
        await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY_MS))

      } catch (error) {
        results.errors++
        console.error(`❌ [${i + 1}/${cards.length}] Erreur actualisation ${card.name}:`, error)
      }
    }

    const finalRequestCount = this.getDailyRequests().count
    console.log(`\n📊 Résultats actualisation:`)
    console.log(`  ✅ ${results.success} prix mis à jour`)
    console.log(`  ⏭️ ${results.skipped} cartes skippées`)
    console.log(`  ❌ ${results.errors} erreurs`)
    console.log(`  📡 ${finalRequestCount} requêtes API aujourd'hui`)

    // Réinitialiser la progression (batch terminé)
    this.clearProgress()

    return results
  }

  /**
   * Actualiser les prix automatiquement (appelé au démarrage)
   */
  static async autoRefresh(allCards, onProgress) {
    try {
      // Vérifier si l'actualisation est activée
      const enabled = localStorage.getItem('vaultestim_price_refresh_enabled')
      if (enabled === 'false') {
        console.log('⏭️ Actualisation prix cartes désactivée par l\'utilisateur')
        return { skipped: true, reason: 'disabled' }
      }

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
