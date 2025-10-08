/**
 * Service de synchronisation automatique
 * Agrège les données depuis multiples APIs
 */
import fetch from 'node-fetch'
import cron from 'node-cron'
import { db, cache } from '../config/database.js'
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class SyncService {
  static isRunning = false
  static lastSync = null
  static stats = {
    sets: { added: 0, updated: 0, errors: 0 },
    cards: { added: 0, updated: 0, errors: 0 },
    prices: { added: 0, updated: 0, errors: 0 },
    images: { cached: 0, errors: 0 }
  }

  /**
   * Synchronisation complète
   */
  static async fullSync() {
    if (this.isRunning) {
      throw new Error('Synchronisation déjà en cours')
    }

    this.isRunning = true
    console.log('🔄 Démarrage synchronisation complète...')

    try {
      // Reset des stats
      this.stats = {
        sets: { added: 0, updated: 0, errors: 0 },
        cards: { added: 0, updated: 0, errors: 0 },
        prices: { added: 0, updated: 0, errors: 0 },
        images: { cached: 0, errors: 0 }
      }

      // 1. Synchroniser les extensions
      console.log('📦 Sync extensions...')
      await this.syncSets()

      // 2. Synchroniser les cartes
      console.log('🃏 Sync cartes...')
      await this.syncCards()

      // 3. Synchroniser les prix
      console.log('💰 Sync prix...')
      await this.syncPrices()

      // 4. Cache des images
      console.log('🖼️ Cache images...')
      await this.cacheImages()

      this.lastSync = new Date()
      console.log('✅ Synchronisation terminée:', this.stats)

      // Nettoyer le cache
      await cache.flush()

      return this.stats

    } catch (error) {
      console.error('❌ Erreur synchronisation:', error)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Synchroniser les extensions depuis Pokemon TCG API
   */
  static async syncSets() {
    try {
      const response = await fetch('https://api.pokemontcg.io/v2/sets?orderBy=releaseDate', {
        headers: {
          'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
        }
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      console.log(`📦 ${data.data.length} extensions trouvées`)

      for (const set of data.data) {
        try {
          await this.upsertSet({
            id: set.id,
            name: set.name,
            name_fr: this.translateSetName(set.name),
            series: set.series,
            block: this.resolveBlock(set.series),
            release_date: set.releaseDate,
            total_cards: set.total,
            images: set.images || {},
            legalities: set.legalities || {}
          })

          this.stats.sets.added++
          await this.delay(100) // Rate limiting

        } catch (error) {
          console.warn(`⚠️ Erreur set ${set.id}:`, error.message)
          this.stats.sets.errors++
        }
      }

    } catch (error) {
      console.error('❌ Erreur sync sets:', error)
      this.stats.sets.errors++
    }
  }

  /**
   * Synchroniser les cartes par lots
   */
  static async syncCards() {
    try {
      // Récupérer les extensions stockées
      const setsResult = await db.query('SELECT id, name FROM sets ORDER BY release_date DESC')
      const sets = setsResult.rows

      for (const set of sets) {
        console.log(`🔄 Sync cartes ${set.name}...`)

        try {
          // Récupérer les cartes de cette extension
          const response = await fetch(
            `https://api.pokemontcg.io/v2/cards?q=set.id:${set.id}&pageSize=250`,
            {
              headers: {
                'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
              }
            }
          )

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`)
          }

          const data = await response.json()
          console.log(`  📋 ${data.data.length} cartes trouvées`)

          for (const card of data.data) {
            try {
              // Enrichir avec données françaises
              const enrichedCard = await this.enrichCard(card)
              await this.upsertCard(enrichedCard)

              this.stats.cards.added++
              await this.delay(50) // Rate limiting

            } catch (error) {
              console.warn(`  ⚠️ Erreur carte ${card.id}:`, error.message)
              this.stats.cards.errors++
            }
          }

          await this.delay(1000) // Délai entre extensions

        } catch (error) {
          console.warn(`⚠️ Erreur extension ${set.id}:`, error.message)
          this.stats.cards.errors++
        }
      }

    } catch (error) {
      console.error('❌ Erreur sync cards:', error)
    }
  }

  /**
   * Enrichir une carte avec traductions et données supplémentaires
   */
  static async enrichCard(card) {
    const enriched = { ...card }

    try {
      // Traduction française du nom
      enriched.name_fr = await this.getFrenchName(card.name)

      // Traduction française de la rareté
      enriched.rarity_fr = this.translateRarity(card.rarity)

      return enriched

    } catch (error) {
      console.warn(`⚠️ Erreur enrichissement ${card.name}:`, error.message)
      return enriched
    }
  }

  /**
   * Synchroniser les prix depuis TCGPlayer
   */
  static async syncPrices() {
    try {
      // Récupérer les cartes sans prix récent (> 24h)
      const cardsQuery = `
        SELECT c.id, c.name
        FROM cards c
        LEFT JOIN card_prices p ON c.id = p.card_id
          AND p.source = 'tcgplayer'
          AND p.recorded_at > NOW() - INTERVAL '24 hours'
        WHERE p.id IS NULL
        ORDER BY RANDOM()
        LIMIT 1000
      `

      const result = await db.query(cardsQuery)
      console.log(`💰 ${result.rows.length} cartes nécessitent une mise à jour des prix`)

      for (const card of result.rows) {
        try {
          const price = await this.getTCGPlayerPrice(card.id)

          if (price && price.market > 0) {
            await this.insertPrice({
              card_id: card.id,
              source: 'tcgplayer',
              condition: 'nm',
              variant: 'normal',
              price_market: price.market,
              currency: 'USD'
            })

            this.stats.prices.added++
          }

          await this.delay(200) // Rate limiting TCGPlayer

        } catch (error) {
          console.warn(`⚠️ Erreur prix ${card.id}:`, error.message)
          this.stats.prices.errors++
        }
      }

    } catch (error) {
      console.error('❌ Erreur sync prices:', error)
    }
  }

  /**
   * Cache local des images pour performance
   */
  static async cacheImages() {
    try {
      // Créer le dossier images s'il n'existe pas
      const imagesDir = path.join(__dirname, '../public/images/cards')
      await fs.mkdir(imagesDir, { recursive: true })

      // Récupérer les cartes sans images cachées
      const cardsQuery = `
        SELECT c.id, c.images
        FROM cards c
        LEFT JOIN card_images ci ON c.id = ci.card_id AND ci.is_cached = true
        WHERE c.images IS NOT NULL
        AND ci.id IS NULL
        ORDER BY RANDOM()
        LIMIT 500
      `

      const result = await db.query(cardsQuery)
      console.log(`🖼️ ${result.rows.length} images à mettre en cache`)

      for (const card of result.rows) {
        try {
          const images = card.images || {}

          // Cache image large
          if (images.large) {
            const largePath = await this.downloadAndOptimizeImage(
              images.large,
              path.join(imagesDir, `${card.id}-large.webp`)
            )

            if (largePath) {
              await this.insertCardImage(card.id, 'large', largePath)
              this.stats.images.cached++
            }
          }

          // Cache image small
          if (images.small) {
            const smallPath = await this.downloadAndOptimizeImage(
              images.small,
              path.join(imagesDir, `${card.id}-small.webp`)
            )

            if (smallPath) {
              await this.insertCardImage(card.id, 'small', smallPath)
              this.stats.images.cached++
            }
          }

          await this.delay(100)

        } catch (error) {
          console.warn(`⚠️ Erreur cache image ${card.id}:`, error.message)
          this.stats.images.errors++
        }
      }

    } catch (error) {
      console.error('❌ Erreur cache images:', error)
    }
  }

  /**
   * Télécharger et optimiser une image
   */
  static async downloadAndOptimizeImage(url, outputPath) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const buffer = await response.buffer()

      // Optimiser avec Sharp (WebP, compression)
      await sharp(buffer)
        .webp({ quality: 85 })
        .resize(400, 558, { // Taille carte standard
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFile(outputPath)

      return outputPath

    } catch (error) {
      console.warn(`⚠️ Erreur téléchargement image ${url}:`, error.message)
      return null
    }
  }

  /**
   * Obtenir le prix TCGPlayer d'une carte
   */
  static async getTCGPlayerPrice(cardId) {
    try {
      // Simulation - à remplacer par vraie API TCGPlayer
      const randomPrice = Math.random() * 50 + 0.5
      return {
        market: parseFloat(randomPrice.toFixed(2)),
        low: parseFloat((randomPrice * 0.8).toFixed(2)),
        mid: parseFloat((randomPrice * 1.1).toFixed(2)),
        high: parseFloat((randomPrice * 1.3).toFixed(2))
      }

    } catch (error) {
      console.warn(`⚠️ Erreur prix TCGPlayer ${cardId}:`, error.message)
      return null
    }
  }

  /**
   * Méthodes de base de données
   */
  static async upsertSet(setData) {
    const query = `
      INSERT INTO sets (id, name, name_fr, series, block, release_date, total_cards, images, legalities)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        name_fr = EXCLUDED.name_fr,
        series = EXCLUDED.series,
        block = EXCLUDED.block,
        total_cards = EXCLUDED.total_cards,
        images = EXCLUDED.images,
        legalities = EXCLUDED.legalities,
        updated_at = NOW()
    `

    await db.query(query, [
      setData.id,
      setData.name,
      setData.name_fr,
      setData.series,
      setData.block,
      setData.release_date,
      setData.total_cards,
      JSON.stringify(setData.images),
      JSON.stringify(setData.legalities)
    ])
  }

  static async upsertCard(cardData) {
    const query = `
      INSERT INTO cards (
        id, name, name_fr, set_id, number, supertype, types, subtypes,
        rarity, rarity_fr, hp, artist, flavor_text, abilities, attacks,
        weaknesses, resistances, retreat_cost, legalities, images
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        name_fr = EXCLUDED.name_fr,
        rarity_fr = EXCLUDED.rarity_fr,
        images = EXCLUDED.images,
        updated_at = NOW()
    `

    await db.query(query, [
      cardData.id,
      cardData.name,
      cardData.name_fr,
      cardData.set?.id,
      cardData.number,
      cardData.supertype,
      JSON.stringify(cardData.types),
      JSON.stringify(cardData.subtypes),
      cardData.rarity,
      cardData.rarity_fr,
      cardData.hp,
      cardData.artist,
      cardData.flavorText,
      JSON.stringify(cardData.abilities),
      JSON.stringify(cardData.attacks),
      JSON.stringify(cardData.weaknesses),
      JSON.stringify(cardData.resistances),
      JSON.stringify(cardData.retreatCost),
      JSON.stringify(cardData.legalities),
      JSON.stringify(cardData.images)
    ])
  }

  static async insertPrice(priceData) {
    const query = `
      INSERT INTO card_prices (card_id, source, condition, variant, price_market, currency)
      VALUES ($1, $2, $3, $4, $5, $6)
    `

    await db.query(query, [
      priceData.card_id,
      priceData.source,
      priceData.condition,
      priceData.variant,
      priceData.price_market,
      priceData.currency
    ])
  }

  static async insertCardImage(cardId, size, localPath) {
    const query = `
      INSERT INTO card_images (card_id, size, local_path, is_cached)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (card_id, size) DO UPDATE SET
        local_path = EXCLUDED.local_path,
        is_cached = true
    `

    await db.query(query, [cardId, size, localPath])
  }

  /**
   * Utilitaires
   */
  static translateSetName(name) {
    const translations = {
      'Base Set': 'Édition de Base',
      'Scarlet & Violet': 'Écarlate et Violet',
      'Sword & Shield': 'Épée et Bouclier',
      'Sun & Moon': 'Soleil et Lune',
      'XY': 'XY',
      'Black & White': 'Noir et Blanc'
    }
    return translations[name] || name
  }

  static translateRarity(rarity) {
    const translations = {
      'Common': 'Commune',
      'Uncommon': 'Peu commune',
      'Rare': 'Rare',
      'Rare Holo': 'Rare Holo',
      'Ultra Rare': 'Ultra Rare',
      'Secret Rare': 'Secret Rare'
    }
    return translations[rarity] || rarity
  }

  static resolveBlock(series) {
    if (series?.includes('Scarlet')) return 'Scarlet & Violet'
    if (series?.includes('Sword')) return 'Sword & Shield'
    if (series?.includes('Sun')) return 'Sun & Moon'
    return series
  }

  static async getFrenchName(englishName) {
    // Traductions statiques courantes
    const translations = {
      'Pikachu': 'Pikachu',
      'Charizard': 'Dracaufeu',
      'Blastoise': 'Tortank',
      'Venusaur': 'Florizarre',
      'Mewtwo': 'Mewtwo',
      'Mew': 'Mew'
    }

    return translations[englishName] || englishName
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Statistiques de synchronisation
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSync,
      stats: this.stats
    }
  }
}

/**
 * Démarrer les synchronisations programmées
 */
export function startScheduledSync() {
  console.log('📅 Configuration synchronisations automatiques...')

  // Sync complète quotidienne à 2h du matin
  cron.schedule('0 2 * * *', async () => {
    console.log('🌙 Synchronisation quotidienne programmée')
    try {
      await SyncService.fullSync()
    } catch (error) {
      console.error('❌ Erreur sync programmée:', error)
    }
  })

  // Sync prix toutes les 6 heures
  cron.schedule('0 */6 * * *', async () => {
    console.log('💰 Synchronisation prix programmée')
    try {
      await SyncService.syncPrices()
    } catch (error) {
      console.error('❌ Erreur sync prix:', error)
    }
  })

  console.log('✅ Synchronisations programmées configurées')
}