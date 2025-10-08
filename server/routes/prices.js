/**
 * Routes API pour les prix des cartes
 */
import express from 'express'
import { db, cache } from '../config/database.js'

const router = express.Router()

/**
 * GET /api/prices/:cardId
 * Historique des prix d'une carte
 */
router.get('/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params
    const { source, days = 30 } = req.query

    const cacheKey = `prices:${cardId}:${source || 'all'}:${days}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    let query = `
      SELECT *
      FROM card_prices
      WHERE card_id = $1
      AND recorded_at > NOW() - INTERVAL '${parseInt(days)} days'
    `
    const params = [cardId]

    if (source) {
      query += ` AND source = $2`
      params.push(source)
    }

    query += ` ORDER BY recorded_at DESC`

    const result = await db.query(query, params)

    // Calculer les statistiques
    const prices = result.rows
    const stats = {
      current: prices[0]?.price_market || 0,
      average: prices.length > 0 ?
        prices.reduce((sum, p) => sum + (p.price_market || 0), 0) / prices.length : 0,
      min: Math.min(...prices.map(p => p.price_market || Infinity)),
      max: Math.max(...prices.map(p => p.price_market || 0)),
      trend: calculateTrend(prices)
    }

    const response = {
      cardId,
      prices,
      statistics: stats,
      period: `${days} derniers jours`,
      sources: [...new Set(prices.map(p => p.source))]
    }

    // Cache (10 minutes)
    await cache.set(cacheKey, response, 600)

    res.json(response)

  } catch (error) {
    console.error('❌ Erreur prix carte:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération' })
  }
})

/**
 * GET /api/prices/trending
 * Cartes avec plus fortes variations de prix
 */
router.get('/trending', async (req, res) => {
  try {
    const { period = 7, limit = 20 } = req.query

    const cacheKey = `prices:trending:${period}:${limit}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    const trendingQuery = `
      WITH price_changes AS (
        SELECT
          cp.card_id,
          c.name,
          c.images,
          s.name as set_name,
          FIRST_VALUE(cp.price_market) OVER (
            PARTITION BY cp.card_id
            ORDER BY cp.recorded_at DESC
          ) as current_price,
          FIRST_VALUE(cp.price_market) OVER (
            PARTITION BY cp.card_id
            ORDER BY cp.recorded_at ASC
          ) as old_price,
          COUNT(*) OVER (PARTITION BY cp.card_id) as price_count
        FROM card_prices cp
        JOIN cards c ON cp.card_id = c.id
        JOIN sets s ON c.set_id = s.id
        WHERE cp.recorded_at > NOW() - INTERVAL '${parseInt(period)} days'
        AND cp.price_market > 0
      )
      SELECT DISTINCT
        card_id,
        name,
        images,
        set_name,
        current_price,
        old_price,
        ROUND(
          ((current_price - old_price) / old_price * 100)::numeric,
          2
        ) as price_change_percent,
        (current_price - old_price) as price_change_amount
      FROM price_changes
      WHERE price_count >= 2
      AND old_price > 0
      ORDER BY ABS(price_change_percent) DESC
      LIMIT $1
    `

    const result = await db.query(trendingQuery, [parseInt(limit)])

    const response = {
      trending: result.rows.map(row => ({
        cardId: row.card_id,
        name: row.name,
        images: row.images,
        setName: row.set_name,
        currentPrice: parseFloat(row.current_price),
        oldPrice: parseFloat(row.old_price),
        changePercent: parseFloat(row.price_change_percent),
        changeAmount: parseFloat(row.price_change_amount),
        trend: row.price_change_percent > 0 ? 'up' : 'down'
      })),
      period: `${period} derniers jours`,
      generatedAt: new Date().toISOString()
    }

    // Cache (30 minutes)
    await cache.set(cacheKey, response, 1800)

    res.json(response)

  } catch (error) {
    console.error('❌ Erreur trending prices:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération' })
  }
})

/**
 * GET /api/prices/expensive
 * Cartes les plus chères
 */
router.get('/expensive', async (req, res) => {
  try {
    const { limit = 50, minPrice = 0 } = req.query

    const cacheKey = `prices:expensive:${limit}:${minPrice}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    const expensiveQuery = `
      SELECT DISTINCT ON (c.id)
        c.id,
        c.name,
        c.images,
        c.rarity,
        s.name as set_name,
        s.series,
        cp.price_market,
        cp.currency,
        cp.recorded_at
      FROM cards c
      JOIN sets s ON c.set_id = s.id
      JOIN card_prices cp ON c.id = cp.card_id
      WHERE cp.price_market >= $2
      ORDER BY c.id, cp.recorded_at DESC, cp.price_market DESC
      LIMIT $1
    `

    const result = await db.query(expensiveQuery, [parseInt(limit), parseFloat(minPrice)])

    // Trier par prix décroissant
    const sorted = result.rows.sort((a, b) => b.price_market - a.price_market)

    const response = {
      expensive: sorted.map(row => ({
        cardId: row.id,
        name: row.name,
        images: row.images,
        rarity: row.rarity,
        setName: row.set_name,
        series: row.series,
        price: parseFloat(row.price_market),
        currency: row.currency,
        updatedAt: row.recorded_at
      })),
      filters: { limit: parseInt(limit), minPrice: parseFloat(minPrice) },
      generatedAt: new Date().toISOString()
    }

    // Cache (1 heure)
    await cache.set(cacheKey, response, 3600)

    res.json(response)

  } catch (error) {
    console.error('❌ Erreur expensive cards:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération' })
  }
})

/**
 * POST /api/prices/:cardId
 * Ajouter un prix manuellement (admin seulement)
 */
router.post('/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params
    const {
      source = 'manual',
      condition = 'nm',
      variant = 'normal',
      price_market,
      currency = 'USD'
    } = req.body

    // Validation
    if (!price_market || price_market <= 0) {
      return res.status(400).json({ error: 'Prix invalide' })
    }

    // Vérifier que la carte existe
    const cardCheck = await db.query('SELECT id FROM cards WHERE id = $1', [cardId])
    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Carte non trouvée' })
    }

    // Insérer le prix
    const insertQuery = `
      INSERT INTO card_prices (card_id, source, condition, variant, price_market, currency)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `

    const result = await db.query(insertQuery, [
      cardId,
      source,
      condition,
      variant,
      parseFloat(price_market),
      currency
    ])

    // Nettoyer le cache
    await cache.delete(`prices:${cardId}:all:30`)
    await cache.delete(`card:${cardId}`)

    res.status(201).json({
      message: 'Prix ajouté avec succès',
      price: result.rows[0]
    })

  } catch (error) {
    console.error('❌ Erreur ajout prix:', error)
    res.status(500).json({ error: 'Erreur lors de l\'ajout' })
  }
})

/**
 * GET /api/prices/sources
 * Liste des sources de prix disponibles
 */
router.get('/sources', async (req, res) => {
  try {
    const cacheKey = 'prices:sources'
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    const sourcesQuery = `
      SELECT
        source,
        COUNT(*) as price_count,
        MAX(recorded_at) as last_update,
        AVG(price_market) as avg_price
      FROM card_prices
      WHERE recorded_at > NOW() - INTERVAL '30 days'
      GROUP BY source
      ORDER BY price_count DESC
    `

    const result = await db.query(sourcesQuery)

    const response = {
      sources: result.rows.map(row => ({
        name: row.source,
        priceCount: parseInt(row.price_count),
        lastUpdate: row.last_update,
        averagePrice: parseFloat(row.avg_price).toFixed(2)
      })),
      total: result.rows.length
    }

    // Cache (1 heure)
    await cache.set(cacheKey, response, 3600)

    res.json(response)

  } catch (error) {
    console.error('❌ Erreur sources prix:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération' })
  }
})

/**
 * Calculer la tendance des prix
 */
function calculateTrend(prices) {
  if (prices.length < 2) return 'stable'

  const recent = prices.slice(0, Math.floor(prices.length / 2))
  const older = prices.slice(Math.floor(prices.length / 2))

  const recentAvg = recent.reduce((sum, p) => sum + (p.price_market || 0), 0) / recent.length
  const olderAvg = older.reduce((sum, p) => sum + (p.price_market || 0), 0) / older.length

  const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100

  if (changePercent > 10) return 'up'
  if (changePercent < -10) return 'down'
  return 'stable'
}

export default router