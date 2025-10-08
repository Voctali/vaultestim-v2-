/**
 * Service de synchronisation de base de données
 * Agrège les données de multiples sources pour créer une DB complète
 */

import { TCGdxService } from './TCGdxService'

export class DatabaseSyncService {
  static SYNC_SOURCES = {
    POKEMON_TCG: 'pokemontcg',
    LIMITLESS: 'limitless',
    TYRADEX: 'tyradex'
  }

  static SYNC_INTERVALS = {
    DAILY: 24 * 60 * 60 * 1000,      // Cartes et prix
    WEEKLY: 7 * 24 * 60 * 60 * 1000,  // Extensions
    MONTHLY: 30 * 24 * 60 * 60 * 1000 // Nettoyage cache
  }

  /**
   * Synchroniser toutes les données
   */
  static async fullSync() {
    console.log('🔄 Démarrage synchronisation complète')

    const results = {
      sets: { added: 0, updated: 0, errors: 0 },
      cards: { added: 0, updated: 0, errors: 0 },
      prices: { added: 0, updated: 0, errors: 0 },
      images: { cached: 0, errors: 0 }
    }

    try {
      // 1. Synchroniser les extensions
      console.log('📦 Synchronisation des extensions...')
      const setsResult = await this.syncSets()
      results.sets = setsResult

      // 2. Synchroniser les cartes
      console.log('🃏 Synchronisation des cartes...')
      const cardsResult = await this.syncCards()
      results.cards = cardsResult

      // 3. Synchroniser les prix
      console.log('💰 Synchronisation des prix...')
      const pricesResult = await this.syncPrices()
      results.prices = pricesResult

      // 4. Cache des images
      console.log('🖼️ Cache des images...')
      const imagesResult = await this.cacheImages()
      results.images = imagesResult

      console.log('✅ Synchronisation terminée:', results)
      return results

    } catch (error) {
      console.error('❌ Erreur synchronisation:', error)
      throw error
    }
  }

  /**
   * Synchroniser les extensions depuis multiple sources
   */
  static async syncSets() {
    const results = { added: 0, updated: 0, errors: 0 }

    try {
      // Récupérer depuis RapidAPI
      const pokemonSets = [] // RapidAPI ne fournit pas de méthode getSets directement

      for (const set of pokemonSets) {
        try {
          await this.upsertSet({
            id: set.id,
            name: set.name,
            name_fr: await this.translateSetName(set.name),
            series: set.series,
            block: this.resolveBlock(set.series),
            release_date: set.releaseDate,
            total_cards: set.total,
            images: set.images,
            legalities: set.legalities,
            source: 'pokemontcg'
          })
          results.added++
        } catch (error) {
          console.warn(`⚠️ Erreur set ${set.id}:`, error.message)
          results.errors++
        }
      }

      return results
    } catch (error) {
      console.error('❌ Erreur sync sets:', error)
      throw error
    }
  }

  /**
   * Synchroniser les cartes avec enrichissement multi-sources
   */
  static async syncCards() {
    const results = { added: 0, updated: 0, errors: 0 }

    try {
      // Récupérer la liste des extensions
      const sets = await this.getStoredSets()

      for (const set of sets) {
        console.log(`🔄 Sync cartes ${set.name}...`)

        try {
          // Rechercher les cartes de cette extension
          const cards = await TCGdxService.searchCards(set.name, 500)

          for (const card of cards) {
            try {
              // Enrichir avec données françaises
              const enrichedCard = await this.enrichCard(card)

              await this.upsertCard(enrichedCard)
              results.added++

              // Délai pour respecter les rate limits
              await this.delay(100)

            } catch (error) {
              console.warn(`⚠️ Erreur carte ${card.id}:`, error.message)
              results.errors++
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erreur set ${set.id}:`, error.message)
          results.errors++
        }
      }

      return results
    } catch (error) {
      console.error('❌ Erreur sync cards:', error)
      throw error
    }
  }

  /**
   * Enrichir une carte avec données de sources multiples
   */
  static async enrichCard(card) {
    const enriched = { ...card }

    try {
      // Traduction française via Tyradex
      if (card.name) {
        enriched.name_fr = await this.getFrenchName(card.name)
      }

      // Prix depuis LimitlessTCG
      const limitlessData = await this.getLimitlessCardData(card.name)
      if (limitlessData) {
        enriched.limitless_price = limitlessData.marketPrice
        enriched.limitless_images = limitlessData.images
      }

      // Images de backup
      enriched.images_backup = await this.getBackupImages(card.name)

      return enriched
    } catch (error) {
      console.warn(`⚠️ Erreur enrichissement ${card.name}:`, error.message)
      return enriched
    }
  }

  /**
   * Synchroniser les prix depuis TCGPlayer/Cardmarket
   */
  static async syncPrices() {
    const results = { added: 0, updated: 0, errors: 0 }

    try {
      // Récupérer cartes sans prix récent
      const cardsNeedingPrices = await this.getCardsNeedingPrices()

      for (const card of cardsNeedingPrices) {
        try {
          // Prix TCGPlayer
          const tcgPrice = await this.getTCGPlayerPrice(card.id)
          if (tcgPrice) {
            await this.insertPrice({
              card_id: card.id,
              source: 'tcgplayer',
              ...tcgPrice
            })
            results.added++
          }

          // Prix Cardmarket
          const cmPrice = await this.getCardmarketPrice(card.name)
          if (cmPrice) {
            await this.insertPrice({
              card_id: card.id,
              source: 'cardmarket',
              ...cmPrice
            })
            results.added++
          }

          await this.delay(1000) // Rate limiting
        } catch (error) {
          console.warn(`⚠️ Erreur prix ${card.id}:`, error.message)
          results.errors++
        }
      }

      return results
    } catch (error) {
      console.error('❌ Erreur sync prices:', error)
      throw error
    }
  }

  /**
   * Cache local des images pour performance
   */
  static async cacheImages() {
    const results = { cached: 0, errors: 0 }

    try {
      const cardsNeedingImages = await this.getCardsNeedingImages()

      for (const card of cardsNeedingImages) {
        try {
          if (card.images?.large) {
            const localPath = await this.downloadAndCacheImage(
              card.images.large,
              `cards/${card.id}-large.jpg`
            )

            await this.updateCardImageCache(card.id, 'large', localPath)
            results.cached++
          }

          if (card.images?.small) {
            const localPath = await this.downloadAndCacheImage(
              card.images.small,
              `cards/${card.id}-small.jpg`
            )

            await this.updateCardImageCache(card.id, 'small', localPath)
            results.cached++
          }

          await this.delay(500)
        } catch (error) {
          console.warn(`⚠️ Erreur cache image ${card.id}:`, error.message)
          results.errors++
        }
      }

      return results
    } catch (error) {
      console.error('❌ Erreur cache images:', error)
      throw error
    }
  }

  /**
   * Programmer synchronisations automatiques
   */
  static startScheduledSync() {
    console.log('📅 Démarrage synchronisations programmées')

    // Sync quotidienne des prix
    setInterval(async () => {
      console.log('🔄 Sync quotidienne des prix')
      await this.syncPrices()
    }, this.SYNC_INTERVALS.DAILY)

    // Sync hebdomadaire des nouvelles cartes
    setInterval(async () => {
      console.log('🔄 Sync hebdomadaire des cartes')
      await this.syncCards()
    }, this.SYNC_INTERVALS.WEEKLY)

    // Nettoyage mensuel
    setInterval(async () => {
      console.log('🧹 Nettoyage mensuel')
      await this.cleanupOldData()
    }, this.SYNC_INTERVALS.MONTHLY)
  }

  // Méthodes utilitaires (à implémenter selon votre DB)
  static async upsertSet(setData) {
    // INSERT ON CONFLICT UPDATE
  }

  static async upsertCard(cardData) {
    // INSERT ON CONFLICT UPDATE
  }

  static async insertPrice(priceData) {
    // INSERT INTO card_prices
  }

  static async getStoredSets() {
    // SELECT FROM sets
  }

  static async getCardsNeedingPrices() {
    // SELECT cards sans prix récent
  }

  static async getCardsNeedingImages() {
    // SELECT cards sans images cachées
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static async translateSetName(englishName) {
    // Logique traduction français
    const translations = {
      'Base Set': 'Édition de Base',
      'Scarlet & Violet': 'Écarlate et Violet',
      'Sword & Shield': 'Épée et Bouclier'
    }
    return translations[englishName] || englishName
  }

  static resolveBlock(series) {
    // Mapper série vers bloc
    if (series?.includes('Scarlet')) return 'Scarlet & Violet'
    if (series?.includes('Sword')) return 'Sword & Shield'
    return series
  }
}