/**
 * Configuration de base de données PostgreSQL
 */
import pg from 'pg'
import redis from 'redis'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// Configuration PostgreSQL
export const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

// Pool de connexions PostgreSQL
export const db = new Pool(dbConfig)

// Configuration Redis
export const redisClient = redis.createClient({
  url: process.env.REDIS_URL
})

redisClient.on('error', (err) => {
  console.error('❌ Erreur Redis:', err)
})

redisClient.on('connect', () => {
  console.log('✅ Redis connecté')
})

// Initialisation des connexions
export async function initializeDatabase() {
  try {
    // Test connexion PostgreSQL
    const client = await db.connect()
    console.log('✅ PostgreSQL connecté')
    client.release()

    // Connexion Redis
    await redisClient.connect()

    return true
  } catch (error) {
    console.error('❌ Erreur connexion base de données:', error)
    throw error
  }
}

// Requêtes préparées courantes
export const queries = {
  // Extensions
  getAllSets: `
    SELECT s.*, COUNT(c.id) as card_count
    FROM sets s
    LEFT JOIN cards c ON s.id = c.set_id
    GROUP BY s.id
    ORDER BY s.release_date DESC
  `,

  getSetById: `
    SELECT s.*, COUNT(c.id) as card_count
    FROM sets s
    LEFT JOIN cards c ON s.id = c.set_id
    WHERE s.id = $1
    GROUP BY s.id
  `,

  // Cartes
  searchCards: `
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
    WHERE ($1::text IS NULL OR
           c.name ILIKE '%' || $1 || '%' OR
           c.name_fr ILIKE '%' || $1 || '%')
    AND ($2::text IS NULL OR c.set_id = $2)
    AND ($3::text IS NULL OR c.supertype = $3)
    AND ($4::text IS NULL OR c.rarity = $4)
    AND ($5::jsonb IS NULL OR c.types @> $5)
    ORDER BY c.name
    LIMIT $6 OFFSET $7
  `,

  getCardById: `
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
    WHERE c.id = $1
  `,

  // Prix
  getCardPrices: `
    SELECT *
    FROM card_prices
    WHERE card_id = $1
    ORDER BY recorded_at DESC
    LIMIT 10
  `,

  insertCardPrice: `
    INSERT INTO card_prices (card_id, source, condition, variant, price_market, currency)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `,

  // Statistiques
  getStats: `
    SELECT
      (SELECT COUNT(*) FROM sets) as total_sets,
      (SELECT COUNT(*) FROM cards) as total_cards,
      (SELECT COUNT(*) FROM card_prices WHERE recorded_at > NOW() - INTERVAL '24 hours') as recent_prices,
      (SELECT COUNT(DISTINCT card_id) FROM card_prices) as cards_with_prices
  `,

  // Collections utilisateur
  getUserCollection: `
    SELECT uc.*, c.name, c.images, c.set_id, s.name as set_name,
           p.price_market as current_price
    FROM user_collections uc
    JOIN cards c ON uc.card_id = c.id
    JOIN sets s ON c.set_id = s.id
    LEFT JOIN LATERAL (
      SELECT price_market
      FROM card_prices
      WHERE card_id = c.id
      ORDER BY recorded_at DESC
      LIMIT 1
    ) p ON true
    WHERE uc.user_id = $1
    ORDER BY uc.created_at DESC
  `,

  addToCollection: `
    INSERT INTO user_collections (user_id, card_id, quantity, condition, variant, price_paid, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id, card_id, condition, variant)
    DO UPDATE SET quantity = user_collections.quantity + $3
    RETURNING *
  `
}

// Cache Redis helpers
export const cache = {
  async get(key) {
    try {
      const value = await redisClient.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.warn('⚠️ Cache get error:', error)
      return null
    }
  },

  async set(key, value, ttlSeconds = 3600) {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn('⚠️ Cache set error:', error)
      return false
    }
  },

  async delete(key) {
    try {
      await redisClient.del(key)
      return true
    } catch (error) {
      console.warn('⚠️ Cache delete error:', error)
      return false
    }
  },

  async flush() {
    try {
      await redisClient.flushAll()
      return true
    } catch (error) {
      console.warn('⚠️ Cache flush error:', error)
      return false
    }
  }
}