/**
 * Routes API pour les cartes
 */
import express from 'express'
import { db, queries, cache } from '../config/database.js'

const router = express.Router()

/**
 * GET /api/cards
 * Recherche avancée de cartes avec filtres
 */
router.get('/', async (req, res) => {
  try {
    const {
      q: query,           // Recherche textuelle
      set: setId,         // Extension
      type: supertype,    // Type (Pokemon, Trainer, Energy)
      rarity,             // Rareté
      types,              // Types Pokemon (JSON array)
      page = 1,
      limit = 50
    } = req.query

    // Validation
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
    const offset = (pageNum - 1) * limitNum

    // Cache key
    const cacheKey = `cards:search:${JSON.stringify({
      query, setId, supertype, rarity, types, page: pageNum, limit: limitNum
    })}`

    // Vérifier le cache
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    // Parser types JSON
    let typesFilter = null
    if (types) {
      try {
        typesFilter = JSON.stringify(Array.isArray(types) ? types : [types])
      } catch (error) {
        return res.status(400).json({ error: 'Format types invalide' })
      }
    }

    // Exécuter la recherche
    const result = await db.query(queries.searchCards, [
      query || null,
      setId || null,
      supertype || null,
      rarity || null,
      typesFilter,
      limitNum,
      offset
    ])

    // Compter le total (pour pagination)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM cards c
      WHERE ($1::text IS NULL OR
             c.name ILIKE '%' || $1 || '%' OR
             c.name_fr ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR c.set_id = $2)
      AND ($3::text IS NULL OR c.supertype = $3)
      AND ($4::text IS NULL OR c.rarity = $4)
      AND ($5::jsonb IS NULL OR c.types @> $5)
    `

    const countResult = await db.query(countQuery, [
      query || null,
      setId || null,
      supertype || null,
      rarity || null,
      typesFilter
    ])

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
        query,
        setId,
        supertype,
        rarity,
        types
      }
    }

    // Mettre en cache (5 minutes)
    await cache.set(cacheKey, response, 300)

    res.json(response)

  } catch (error) {
    console.error('❌ Erreur recherche cartes:', error)
    res.status(500).json({ error: 'Erreur lors de la recherche' })
  }
})

/**
 * GET /api/cards/:id
 * Récupérer une carte spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Cache
    const cacheKey = `card:${id}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    // Récupérer la carte
    const result = await db.query(queries.getCardById, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carte non trouvée' })
    }

    const card = formatCardResponse(result.rows[0])

    // Récupérer l'historique des prix
    const pricesResult = await db.query(queries.getCardPrices, [id])
    card.priceHistory = pricesResult.rows

    // Cache (30 minutes)
    await cache.set(cacheKey, card, 1800)

    res.json(card)

  } catch (error) {
    console.error('❌ Erreur récupération carte:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération' })
  }
})

/**
 * GET /api/cards/:id/similar
 * Cartes similaires (même nom, autres extensions)
 */
router.get('/:id/similar', async (req, res) => {
  try {
    const { id } = req.params

    // Récupérer la carte de référence
    const cardResult = await db.query(queries.getCardById, [id])
    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Carte non trouvée' })
    }

    const referenceCard = cardResult.rows[0]
    const baseName = referenceCard.name.replace(/ (ex|EX|GX|V|VMAX|VSTAR).*$/i, '').trim()

    // Rechercher des cartes similaires
    const similarQuery = `
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
      WHERE c.name ILIKE '%' || $1 || '%'
      AND c.id != $2
      ORDER BY s.release_date DESC, c.name
      LIMIT 20
    `

    const result = await db.query(similarQuery, [baseName, id])

    res.json({
      reference: formatCardResponse(referenceCard),
      similar: result.rows.map(formatCardResponse)
    })

  } catch (error) {
    console.error('❌ Erreur cartes similaires:', error)
    res.status(500).json({ error: 'Erreur lors de la recherche' })
  }
})

/**
 * GET /api/cards/autocomplete
 * Autocomplétion pour la recherche
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query

    if (!query || query.length < 2) {
      return res.json({ suggestions: [] })
    }

    const cacheKey = `autocomplete:${query}:${limit}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    const autocompleteQuery = `
      SELECT DISTINCT name, name_fr, images->>'small' as image
      FROM cards
      WHERE name ILIKE '%' || $1 || '%'
         OR name_fr ILIKE '%' || $1 || '%'
      ORDER BY LENGTH(name), name
      LIMIT $2
    `

    const result = await db.query(autocompleteQuery, [query, parseInt(limit)])

    const response = {
      query,
      suggestions: result.rows.map(row => ({
        name: row.name,
        name_fr: row.name_fr,
        image: row.image
      }))
    }

    // Cache (10 minutes)
    await cache.set(cacheKey, response, 600)

    res.json(response)

  } catch (error) {
    console.error('❌ Erreur autocomplétion:', error)
    res.status(500).json({ error: 'Erreur lors de l\'autocomplétion' })
  }
})

/**
 * Formater la réponse d'une carte
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