/**
 * Script de configuration initiale de la base de données
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { db, initializeDatabase } from '../config/database.js'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function setupDatabase() {
  try {
    console.log('🔄 Configuration de la base de données...')

    // Initialiser les connexions
    await initializeDatabase()

    // Lire le schema SQL
    const schemaPath = path.join(__dirname, '../../database-schema.sql')
    const schema = await fs.readFile(schemaPath, 'utf8')

    // Exécuter le schema
    console.log('📋 Création des tables...')
    await db.query(schema)

    // Créer les index supplémentaires
    console.log('📊 Création des index...')
    await createIndexes()

    // Insérer les données de test
    console.log('📝 Insertion des données de test...')
    await insertSampleData()

    console.log('✅ Base de données configurée avec succès!')

  } catch (error) {
    console.error('❌ Erreur configuration:', error)
    process.exit(1)
  }
}

async function createIndexes() {
  const indexes = [
    // Index pour recherche full-text
    `CREATE INDEX IF NOT EXISTS idx_cards_search ON cards USING gin(to_tsvector('french', name || ' ' || COALESCE(name_fr, '')))`,

    // Index pour prix récents
    `CREATE INDEX IF NOT EXISTS idx_prices_recent ON card_prices(card_id, recorded_at DESC) WHERE recorded_at > NOW() - INTERVAL '30 days'`,

    // Index pour statistiques
    `CREATE INDEX IF NOT EXISTS idx_cards_set_type ON cards(set_id, supertype)`,
    `CREATE INDEX IF NOT EXISTS idx_sets_release ON sets(release_date DESC)`,

    // Index pour collections
    `CREATE INDEX IF NOT EXISTS idx_collections_user ON user_collections(user_id, created_at DESC)`
  ]

  for (const index of indexes) {
    try {
      await db.query(index)
    } catch (error) {
      console.warn('⚠️ Index déjà existant:', error.message.split('\\n')[0])
    }
  }
}

async function insertSampleData() {
  // Insérer quelques extensions de test
  const sampleSets = [
    {
      id: 'sv1',
      name: 'Scarlet & Violet',
      name_fr: 'Écarlate et Violet',
      series: 'Scarlet & Violet',
      block: 'Scarlet & Violet',
      release_date: '2023-03-31',
      total_cards: 198
    },
    {
      id: 'swsh12',
      name: 'Silver Tempest',
      name_fr: 'Tempête d\\'Argent',
      series: 'Sword & Shield',
      block: 'Sword & Shield',
      release_date: '2022-11-11',
      total_cards: 195
    }
  ]

  for (const set of sampleSets) {
    try {
      await db.query(`
        INSERT INTO sets (id, name, name_fr, series, block, release_date, total_cards, images, legalities)
        VALUES ($1, $2, $3, $4, $5, $6, $7, '{}', '{}')
        ON CONFLICT (id) DO NOTHING
      `, [
        set.id, set.name, set.name_fr, set.series, set.block,
        set.release_date, set.total_cards
      ])
    } catch (error) {
      console.warn('⚠️ Extension déjà existante:', set.id)
    }
  }

  // Insérer quelques cartes de test
  const sampleCards = [
    {
      id: 'sv1-1',
      name: 'Sprigatito',
      name_fr: 'Poussacha',
      set_id: 'sv1',
      number: '1',
      supertype: 'Pokémon',
      types: ['Grass'],
      rarity: 'Common',
      hp: 60
    },
    {
      id: 'sv1-25',
      name: 'Pikachu',
      name_fr: 'Pikachu',
      set_id: 'sv1',
      number: '25',
      supertype: 'Pokémon',
      types: ['Lightning'],
      rarity: 'Common',
      hp: 70
    }
  ]

  for (const card of sampleCards) {
    try {
      await db.query(`
        INSERT INTO cards (
          id, name, name_fr, set_id, number, supertype, types,
          rarity, hp, images, legalities
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '{}', '{}')
        ON CONFLICT (id) DO NOTHING
      `, [
        card.id, card.name, card.name_fr, card.set_id, card.number,
        card.supertype, JSON.stringify(card.types), card.rarity, card.hp
      ])
    } catch (error) {
      console.warn('⚠️ Carte déjà existante:', card.id)
    }
  }

  // Insérer quelques prix de test
  const samplePrices = [
    { card_id: 'sv1-25', price: 2.50 },
    { card_id: 'sv1-1', price: 0.25 }
  ]

  for (const price of samplePrices) {
    try {
      await db.query(`
        INSERT INTO card_prices (card_id, source, condition, variant, price_market, currency)
        VALUES ($1, 'test', 'nm', 'normal', $2, 'USD')
      `, [price.card_id, price.price])
    } catch (error) {
      console.warn('⚠️ Prix déjà existant pour:', price.card_id)
    }
  }

  console.log('📝 Données de test insérées')
}

// Lancer le script
setupDatabase()