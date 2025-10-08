/**
 * Routes API pour les statistiques
 */
import express from 'express'
import { db, queries, cache } from '../config/database.js'

const router = express.Router()

/**
 * GET /api/stats
 * Statistiques générales de la base de données
 */
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'stats:general'
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    // Statistiques générales
    const generalStats = await db.query(queries.getStats)
    const general = generalStats.rows[0]

    // Top extensions par nombre de cartes
    const topSetsQuery = `
      SELECT s.name, s.series, s.release_date, COUNT(c.id) as card_count
      FROM sets s
      LEFT JOIN cards c ON s.id = c.set_id
      GROUP BY s.id, s.name, s.series, s.release_date
      ORDER BY card_count DESC
      LIMIT 10
    `
    const topSets = await db.query(topSetsQuery)

    // Répartition par type
    const typeDistributionQuery = `
      SELECT supertype, COUNT(*) as count
      FROM cards
      GROUP BY supertype
      ORDER BY count DESC
    `
    const typeDistribution = await db.query(typeDistributionQuery)

    // Répartition par rareté
    const rarityDistributionQuery = `
      SELECT rarity, COUNT(*) as count
      FROM cards
      WHERE rarity IS NOT NULL
      GROUP BY rarity
      ORDER BY count DESC
    `
    const rarityDistribution = await db.query(rarityDistributionQuery)

    // Cartes par année
    const cardsByYearQuery = `
      SELECT
        EXTRACT(YEAR FROM s.release_date) as year,
        COUNT(c.id) as card_count,
        COUNT(DISTINCT s.id) as set_count
      FROM sets s
      LEFT JOIN cards c ON s.id = c.set_id
      WHERE s.release_date IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM s.release_date)
      ORDER BY year DESC
      LIMIT 20
    `
    const cardsByYear = await db.query(cardsByYearQuery)

    // Prix moyens par rareté
    const pricesByRarityQuery = `
      SELECT
        c.rarity,
        COUNT(DISTINCT c.id) as card_count,
        AVG(p.price_market) as avg_price,
        MAX(p.price_market) as max_price
      FROM cards c
      JOIN LATERAL (
        SELECT price_market
        FROM card_prices
        WHERE card_id = c.id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) p ON true
      WHERE c.rarity IS NOT NULL
      AND p.price_market > 0
      GROUP BY c.rarity
      ORDER BY avg_price DESC
    `
    const pricesByRarity = await db.query(pricesByRarityQuery)

    const response = {
      general: {
        totalSets: parseInt(general.total_sets) || 0,
        totalCards: parseInt(general.total_cards) || 0,
        recentPrices: parseInt(general.recent_prices) || 0,
        cardsWithPrices: parseInt(general.cards_with_prices) || 0,
        pricesCoverage: general.total_cards > 0 ?
          ((general.cards_with_prices / general.total_cards) * 100).toFixed(1) : '0.0'
      },
      topSets: topSets.rows.map(row => ({
        name: row.name,
        series: row.series,
        releaseDate: row.release_date,
        cardCount: parseInt(row.card_count)
      })),
      distribution: {
        types: typeDistribution.rows.map(row => ({
          type: row.supertype,
          count: parseInt(row.count)
        })),
        rarities: rarityDistribution.rows.map(row => ({
          rarity: row.rarity,
          count: parseInt(row.count)
        }))
      },
      timeline: cardsByYear.rows.map(row => ({
        year: parseInt(row.year),
        cardCount: parseInt(row.card_count),
        setCount: parseInt(row.set_count)
      })),
      pricing: {
        byRarity: pricesByRarity.rows.map(row => ({
          rarity: row.rarity,
          cardCount: parseInt(row.card_count),
          averagePrice: parseFloat(row.avg_price).toFixed(2),
          maxPrice: parseFloat(row.max_price).toFixed(2)
        }))
      },
      generatedAt: new Date().toISOString()
    }

    // Cache (30 minutes)
    await cache.set(cacheKey, response, 1800)

    res.json(response)

  } catch (error) {
    console.error('❌ Erreur statistiques:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération' })
  }
})

/**
 * GET /api/stats/sets
 * Statistiques détaillées par extension
 */
router.get('/sets', async (req, res) => {
  try {
    const { series, limit = 50 } = req.query

    const cacheKey = `stats:sets:${series || 'all'}:${limit}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    let whereClause = ''
    const params = [parseInt(limit)]
    let paramIndex = 2

    if (series) {
      whereClause = 'WHERE s.series = $' + paramIndex++
      params.push(series)
    }

    const setStatsQuery = `
      SELECT
        s.id,
        s.name,
        s.series,
        s.release_date,
        s.total_cards,
        COUNT(c.id) as actual_cards,
        COUNT(CASE WHEN c.supertype = 'Pokémon' THEN 1 END) as pokemon_count,
        COUNT(CASE WHEN c.supertype = 'Trainer' THEN 1 END) as trainer_count,
        COUNT(CASE WHEN c.supertype = 'Energy' THEN 1 END) as energy_count,
        COUNT(CASE WHEN c.rarity LIKE '%Rare%' THEN 1 END) as rare_count,
        AVG(CASE WHEN p.price_market > 0 THEN p.price_market END) as avg_price,
        MAX(p.price_market) as max_price,
        COUNT(CASE WHEN p.price_market > 0 THEN 1 END) as cards_with_prices
      FROM sets s
      LEFT JOIN cards c ON s.id = c.set_id
      LEFT JOIN LATERAL (
        SELECT price_market
        FROM card_prices
        WHERE card_id = c.id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) p ON true
      ${whereClause}
      GROUP BY s.id, s.name, s.series, s.release_date, s.total_cards
      ORDER BY s.release_date DESC
      LIMIT $1
    `

    const result = await db.query(setStatsQuery, params)

    const response = {
      sets: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        series: row.series,
        releaseDate: row.release_date,
        totalCards: row.total_cards,
        actualCards: parseInt(row.actual_cards),
        completionRate: row.total_cards > 0 ?
          ((row.actual_cards / row.total_cards) * 100).toFixed(1) : '0.0',
        breakdown: {
          pokemon: parseInt(row.pokemon_count) || 0,
          trainer: parseInt(row.trainer_count) || 0,
          energy: parseInt(row.energy_count) || 0,
          rare: parseInt(row.rare_count) || 0
        },
        pricing: {
          averagePrice: row.avg_price ? parseFloat(row.avg_price).toFixed(2) : '0.00',
          maxPrice: row.max_price ? parseFloat(row.max_price).toFixed(2) : '0.00',
          cardsWithPrices: parseInt(row.cards_with_prices) || 0,
          priceCoverage: row.actual_cards > 0 ?
            ((row.cards_with_prices / row.actual_cards) * 100).toFixed(1) : '0.0'
        }
      })),
      filters: { series, limit: parseInt(limit) },
      total: result.rows.length
    }

    // Cache (1 heure)
    await cache.set(cacheKey, response, 3600)

    res.json(response)

  } catch (error) {
    console.error('❌ Erreur stats sets:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération' })
  }
})

/**
 * GET /api/stats/sync
 * Statistiques de synchronisation
 */
router.get('/sync', async (req, res) => {
  try {
    const cacheKey = 'stats:sync'
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    // Historique des synchronisations (si table sync_logs existe)
    const syncHistoryQuery = `
      SELECT
        source_id,
        status,
        cards_processed,
        cards_updated,
        cards_added,
        duration_seconds,
        started_at,
        completed_at
      FROM sync_logs
      ORDER BY started_at DESC
      LIMIT 20
    `

    let syncHistory = []
    try {
      const syncResult = await db.query(syncHistoryQuery)
      syncHistory = syncResult.rows
    } catch (err) {
      // Table n'existe pas encore
      console.warn('Table sync_logs non trouvée')
    }

    // Statistiques des sources de données
    const sourcesQuery = `
      SELECT
        'cards' as source_type,
        COUNT(*) as total_records,
        MAX(created_at) as last_update
      FROM cards
      UNION ALL
      SELECT
        'sets' as source_type,
        COUNT(*) as total_records,
        MAX(created_at) as last_update
      FROM sets
      UNION ALL
      SELECT
        'prices' as source_type,
        COUNT(*) as total_records,
        MAX(recorded_at) as last_update
      FROM card_prices
    `

    const sourcesResult = await db.query(sourcesQuery)

    // Fraîcheur des données
    const freshnessQuery = `
      SELECT
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as last_day,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_week,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as last_month,
        COUNT(*) as total
      FROM cards
    `

    const freshnessResult = await db.query(freshnessQuery)
    const freshness = freshnessResult.rows[0]

    const response = {
      syncHistory: syncHistory.map(row => ({
        sourceId: row.source_id,
        status: row.status,
        cardsProcessed: parseInt(row.cards_processed) || 0,
        cardsUpdated: parseInt(row.cards_updated) || 0,
        cardsAdded: parseInt(row.cards_added) || 0,
        duration: parseInt(row.duration_seconds) || 0,
        startedAt: row.started_at,
        completedAt: row.completed_at
      })),
      sources: sourcesResult.rows.map(row => ({
        type: row.source_type,
        totalRecords: parseInt(row.total_records),
        lastUpdate: row.last_update
      })),
      freshness: {
        lastDay: parseInt(freshness.last_day) || 0,
        lastWeek: parseInt(freshness.last_week) || 0,
        lastMonth: parseInt(freshness.last_month) || 0,
        total: parseInt(freshness.total) || 0
      },
      generatedAt: new Date().toISOString()
    }

    // Cache (15 minutes)
    await cache.set(cacheKey, response, 900)

    res.json(response)

  } catch (error) {
    console.error('❌ Erreur stats sync:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération' })
  }
})

export default router