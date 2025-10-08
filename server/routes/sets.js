/**
 * Routes API pour les extensions
 */
import express from 'express'
import { db, queries, cache } from '../config/database.js'

const router = express.Router()

/**
 * GET /api/sets
 * Liste de toutes les extensions
 */
router.get('/', async (req, res) => {
  try {
    const { series, block, year } = req.query

    const cacheKey = `sets:list:${JSON.stringify({ series, block, year })}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    let query = queries.getAllSets
    const params = []

    // Ajouter filtres si nécessaire
    if (series || block || year) {
      let whereClause = ' WHERE 1=1'
      let paramIndex = 1

      if (series) {
        whereClause += ` AND s.series = $${paramIndex++}`
        params.push(series)
      }

      if (block) {
        whereClause += ` AND s.block = $${paramIndex++}`
        params.push(block)
      }

      if (year) {
        whereClause += ` AND EXTRACT(YEAR FROM s.release_date) = $${paramIndex++}`
        params.push(parseInt(year))
      }

      // Insérer la clause WHERE avant GROUP BY
      query = query.replace('GROUP BY', whereClause + ' GROUP BY')
    }

    const result = await db.query(query, params)

    const response = {
      data: result.rows.map(formatSetResponse),
      total: result.rows.length,
      filters: { series, block, year }
    }

    // Cache (1 heure)
    await cache.set(cacheKey, response, 3600)

    res.json(response)

  } catch (error) {
    console.error('❌ Erreur récupération extensions:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération' })
  }
})

/**
 * GET /api/sets/:id
 * Détails d'une extension spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const cacheKey = `set:${id}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    const result = await db.query(queries.getSetById, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Extension non trouvée' })
    }

    const set = formatSetResponse(result.rows[0])

    // Statistiques détaillées
    const statsQuery = `
      SELECT
        COUNT(*) as total_cards,
        COUNT(CASE WHEN supertype = 'Pokémon' THEN 1 END) as pokemon_count,
        COUNT(CASE WHEN supertype = 'Trainer' THEN 1 END) as trainer_count,
        COUNT(CASE WHEN supertype = 'Energy' THEN 1 END) as energy_count,
        COUNT(CASE WHEN rarity LIKE '%Rare%' THEN 1 END) as rare_count,
        AVG(CASE WHEN p.price_market > 0 THEN p.price_market END) as avg_price,
        MAX(p.price_market) as max_price
      FROM cards c
      LEFT JOIN LATERAL (
        SELECT price_market
        FROM card_prices
        WHERE card_id = c.id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) p ON true
      WHERE c.set_id = $1
    `

    const statsResult = await db.query(statsQuery, [id])
    set.statistics = statsResult.rows[0]

    // Cache (1 heure)
    await cache.set(cacheKey, set, 3600)

    res.json(set)

  } catch (error) {
    console.error('❌ Erreur récupération extension:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération' })
  }
})

/**
 * GET /api/sets/:id/cards
 * Cartes d'une extension
 */
router.get('/:id/cards', async (req, res) => {
  try {
    const { id } = req.params
    const {
      type: supertype,
      rarity,
      sort = 'number',
      order = 'asc',
      page = 1,
      limit = 100
    } = req.query

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(500, Math.max(1, parseInt(limit)))
    const offset = (pageNum - 1) * limitNum

    // Validation du tri
    const validSorts = ['number', 'name', 'rarity', 'hp']
    const validOrders = ['asc', 'desc']
    const sortField = validSorts.includes(sort) ? sort : 'number'
    const sortOrder = validOrders.includes(order) ? order : 'asc'

    const cacheKey = `set:${id}:cards:${JSON.stringify({
      supertype, rarity, sort: sortField, order: sortOrder, page: pageNum, limit: limitNum
    })}`

    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    let whereClause = 'WHERE c.set_id = $1'
    const params = [id]
    let paramIndex = 2

    if (supertype) {
      whereClause += ` AND c.supertype = $${paramIndex++}`
      params.push(supertype)
    }

    if (rarity) {
      whereClause += ` AND c.rarity = $${paramIndex++}`
      params.push(rarity)
    }

    const cardsQuery = `
      SELECT c.*, s.name as set_name, s.series, s.release_date,
             p.price_market, p.currency, p.recorded_at as price_updated
      FROM cards c
      LEFT JOIN sets s ON c.set_id = s.id
      LEFT JOIN LATERAL (
        SELECT price_market, currency, recorded_at
        FROM card_prices
        WHERE card_id = c.id
        AND source = 'tcgplayer'
        ORDER BY recorded_at DESC
        LIMIT 1
      ) p ON true
      ${whereClause}
      ORDER BY c.${sortField} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `

    params.push(limitNum, offset)

    const result = await db.query(cardsQuery, params)

    // Compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM cards c
      ${whereClause}
    `

    const countResult = await db.query(countQuery, params.slice(0, -2))
    const total = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / limitNum)

    const response = {
      data: result.rows.map(formatCardResponse),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      filters: {
        setId: id,
        supertype,
        rarity,
        sort: sortField,
        order: sortOrder
      }
    }

    // Cache (30 minutes)
    await cache.set(cacheKey, response, 1800)

    res.json(response)

  } catch (error) {
    console.error('❌ Erreur cartes extension:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération' })
  }
})

/**
 * GET /api/sets/series
 * Liste des séries disponibles
 */
router.get('/series', async (req, res) => {
  try {
    const cacheKey = 'sets:series'
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    const seriesQuery = `
      SELECT
        series,
        block,
        COUNT(*) as set_count,
        MIN(release_date) as first_release,
        MAX(release_date) as last_release,
        SUM(total_cards) as total_cards
      FROM sets
      WHERE series IS NOT NULL
      GROUP BY series, block
      ORDER BY MAX(release_date) DESC
    `

    const result = await db.query(seriesQuery)

    const response = {
      data: result.rows,
      total: result.rows.length
    }

    // Cache (6 heures)
    await cache.set(cacheKey, response, 21600)

    res.json(response)

  } catch (error) {
    console.error('❌ Erreur séries:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération' })
  }
})

/**
 * Formater la réponse d'une extension
 */
function formatSetResponse(row) {
  return {
    id: row.id,
    name: row.name,
    name_fr: row.name_fr,
    series: row.series,
    block: row.block,
    releaseDate: row.release_date,
    totalCards: row.total_cards,
    cardCount: parseInt(row.card_count) || 0,
    images: row.images || {},
    legalities: row.legalities || {}
  }
}

/**
 * Formater la réponse d'une carte (réutilisé)
 */
function formatCardResponse(row) {
  return {
    id: row.id,
    name: row.name,
    name_fr: row.name_fr,
    number: row.number,
    set: {
      id: row.set_id,
      name: row.set_name,
      series: row.series,
      releaseDate: row.release_date
    },
    supertype: row.supertype,
    types: row.types || [],
    rarity: row.rarity,
    hp: row.hp,
    images: row.images || {},
    price: {
      market: row.price_market,
      currency: row.currency || 'USD',
      updatedAt: row.price_updated
    },
    artist: row.artist,
    flavorText: row.flavor_text,
    legalities: row.legalities || {}
  }
}

export default router