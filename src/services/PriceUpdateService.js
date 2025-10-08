/**
 * Service de mise à jour quotidienne des prix
 * Met à jour les prix des cartes une fois par jour au chargement de l'application
 */

import { IndexedDBService } from './IndexedDBService'
import { TCGdxService } from './TCGdxService'

export class PriceUpdateService {
  static LAST_UPDATE_KEY = 'vaultestim_last_price_update'
  static UPDATE_INTERVAL = 24 * 60 * 60 * 1000 // 24 heures en millisecondes
  static BATCH_SIZE = 50 // Mettre à jour 50 cartes à la fois
  static DELAY_BETWEEN_BATCHES = 2000 // 2 secondes entre chaque batch

  /**
   * Vérifier si une mise à jour des prix est nécessaire
   */
  static needsUpdate() {
    const lastUpdate = localStorage.getItem(this.LAST_UPDATE_KEY)

    if (!lastUpdate) {
      console.log('💰 Aucune mise à jour de prix enregistrée')
      return true
    }

    const lastUpdateTime = parseInt(lastUpdate, 10)
    const timeSinceUpdate = Date.now() - lastUpdateTime
    const hoursAgo = Math.floor(timeSinceUpdate / (60 * 60 * 1000))

    console.log(`💰 Dernière mise à jour des prix: il y a ${hoursAgo}h`)

    return timeSinceUpdate >= this.UPDATE_INTERVAL
  }

  /**
   * Enregistrer la date de dernière mise à jour
   */
  static markUpdated() {
    localStorage.setItem(this.LAST_UPDATE_KEY, Date.now().toString())
    console.log('✅ Date de mise à jour des prix enregistrée')
  }

  /**
   * Obtenir la date de dernière mise à jour
   */
  static getLastUpdateInfo() {
    const lastUpdate = localStorage.getItem(this.LAST_UPDATE_KEY)

    if (!lastUpdate) {
      return {
        lastUpdate: null,
        nextUpdate: null,
        hoursAgo: null
      }
    }

    const lastUpdateTime = parseInt(lastUpdate, 10)
    const nextUpdateTime = lastUpdateTime + this.UPDATE_INTERVAL
    const timeSinceUpdate = Date.now() - lastUpdateTime
    const hoursAgo = Math.floor(timeSinceUpdate / (60 * 60 * 1000))

    return {
      lastUpdate: new Date(lastUpdateTime),
      nextUpdate: new Date(nextUpdateTime),
      hoursAgo,
      needsUpdate: this.needsUpdate()
    }
  }

  /**
   * Mettre à jour les prix de toutes les cartes dans IndexedDB
   */
  static async updateAllPrices(onProgress = null) {
    console.log('💰 Début de la mise à jour des prix...')

    try {
      // 1. Charger toutes les cartes depuis IndexedDB
      const allCards = await IndexedDBService.loadDiscoveredCards()

      if (!allCards || allCards.length === 0) {
        console.log('⚠️ Aucune carte à mettre à jour')
        return { updated: 0, failed: 0 }
      }

      console.log(`💰 ${allCards.length} cartes à mettre à jour`)

      let updated = 0
      let failed = 0

      // 2. Mettre à jour par batch pour éviter de surcharger l'API
      for (let i = 0; i < allCards.length; i += this.BATCH_SIZE) {
        const batch = allCards.slice(i, i + this.BATCH_SIZE)
        const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1
        const totalBatches = Math.ceil(allCards.length / this.BATCH_SIZE)

        console.log(`💰 Batch ${batchNumber}/${totalBatches}: ${batch.length} cartes`)

        // Mettre à jour chaque carte du batch
        const batchResults = await Promise.allSettled(
          batch.map(card => this.updateCardPrice(card))
        )

        // Compter les succès et échecs
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            updated++
          } else {
            failed++
          }
        })

        // Notifier la progression
        if (onProgress) {
          const progress = Math.min(100, Math.round(((i + batch.length) / allCards.length) * 100))
          onProgress({
            progress,
            current: i + batch.length,
            total: allCards.length,
            updated,
            failed
          })
        }

        // Attendre avant le prochain batch (sauf pour le dernier)
        if (i + this.BATCH_SIZE < allCards.length) {
          await this.sleep(this.DELAY_BETWEEN_BATCHES)
        }
      }

      // 3. Sauvegarder toutes les cartes mises à jour
      await IndexedDBService.saveDiscoveredCards(allCards)

      // 4. Marquer comme mis à jour
      this.markUpdated()

      console.log(`✅ Mise à jour terminée: ${updated} succès, ${failed} échecs`)

      return { updated, failed, total: allCards.length }

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des prix:', error)
      throw error
    }
  }

  /**
   * Mettre à jour le prix d'une carte spécifique
   */
  static async updateCardPrice(card) {
    try {
      // Récupérer les informations complètes de la carte depuis l'API
      const updatedCard = await TCGdxService.getCardById(card.id)

      if (updatedCard && updatedCard.marketPrice !== undefined) {
        // Mettre à jour les informations de prix
        card.marketPrice = updatedCard.marketPrice
        card.marketPriceDetails = updatedCard.marketPriceDetails
        card.tcgPlayerPrice = updatedCard.tcgPlayerPrice
        card.cardMarketPrice = updatedCard.cardMarketPrice
        card._priceUpdatedAt = Date.now()

        return true
      }

      return false
    } catch (error) {
      console.warn(`⚠️ Impossible de mettre à jour le prix de ${card.name}:`, error.message)
      return false
    }
  }

  /**
   * Forcer une mise à jour immédiate
   */
  static async forceUpdate(onProgress = null) {
    console.log('💰 Mise à jour forcée des prix...')

    // Supprimer la date de dernière mise à jour pour forcer
    localStorage.removeItem(this.LAST_UPDATE_KEY)

    return await this.updateAllPrices(onProgress)
  }

  /**
   * Mettre à jour les prix au chargement de l'application (si nécessaire)
   */
  static async updateOnAppLoad(onProgress = null) {
    if (!this.needsUpdate()) {
      const info = this.getLastUpdateInfo()
      console.log(`💰 Pas de mise à jour nécessaire (dernière MAJ: il y a ${info.hoursAgo}h)`)
      return null
    }

    console.log('💰 Mise à jour des prix au chargement...')
    return await this.updateAllPrices(onProgress)
  }

  /**
   * Utilitaire pour attendre
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Obtenir les statistiques de mise à jour
   */
  static async getUpdateStats() {
    const allCards = await IndexedDBService.loadDiscoveredCards()
    const info = this.getLastUpdateInfo()

    const cardsWithPrices = allCards.filter(card =>
      card.marketPrice !== null && card.marketPrice !== undefined
    ).length

    const cardsWithoutPrices = allCards.length - cardsWithPrices

    return {
      ...info,
      totalCards: allCards.length,
      cardsWithPrices,
      cardsWithoutPrices,
      pricesCoverage: allCards.length > 0
        ? Math.round((cardsWithPrices / allCards.length) * 100)
        : 0
    }
  }
}
