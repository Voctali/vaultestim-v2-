/**
 * Script d'import de données JSON vers PostgreSQL
 * Usage: node scripts/import-data.js [fichier-export.json]
 */

import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Obtenir le chemin du fichier d'export
const exportFile = process.argv[2] || path.join(__dirname, '../data-export.json')

console.log('🔄 Démarrage de l\'import des données...')
console.log('📂 Fichier source:', exportFile)

// Vérifier que le fichier existe
if (!fs.existsSync(exportFile)) {
  console.error('❌ Erreur: Fichier d\'export introuvable à', exportFile)
  console.log('\n💡 Usage: node scripts/import-data.js [fichier-export.json]')
  process.exit(1)
}

// Vérifier que DATABASE_URL est défini
if (!process.env.DATABASE_URL) {
  console.error('❌ Erreur: Variable d\'environnement DATABASE_URL non définie')
  console.log('\n💡 Définissez DATABASE_URL dans votre fichier .env:')
  console.log('   DATABASE_URL=postgresql://user:password@host:5432/database')
  process.exit(1)
}

console.log('🔗 Connexion à PostgreSQL...')
console.log('   Host:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'hidden')

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function importData() {
  let client

  try {
    // Charger les données
    console.log('📖 Lecture du fichier d\'export...')
    const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf8'))

    if (!exportData.tables) {
      console.error('❌ Format de fichier invalide: pas de données de tables')
      process.exit(1)
    }

    console.log(`✅ ${Object.keys(exportData.tables).length} tables trouvées`)
    console.log(`📅 Export créé le: ${exportData.metadata.exported_at}`)

    // Connexion
    client = await pool.connect()
    console.log('✅ Connecté à PostgreSQL')

    // Démarrer la transaction
    await client.query('BEGIN')
    console.log('\n🔄 Démarrage de la transaction...\n')

    let totalImported = 0

    // Ordre d'import (important pour les clés étrangères)
    const importOrder = [
      'users',
      'discovered_cards',
      'series_database',
      'custom_blocks',
      'custom_extensions'
    ]

    for (const tableName of importOrder) {
      const rows = exportData.tables[tableName]

      if (!rows || rows.length === 0) {
        console.log(`⏭️  Table "${tableName}": Aucune donnée à importer`)
        continue
      }

      console.log(`📊 Import de la table "${tableName}" (${rows.length} lignes)...`)

      // Désactiver temporairement les contraintes de clés étrangères
      if (tableName === 'users') {
        await client.query('SET CONSTRAINTS ALL DEFERRED')
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]

        try {
          if (tableName === 'users') {
            await client.query(`
              INSERT INTO users (id, email, password, name, role, isPremium, cardCount, level, createdAt, lastLogin)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (email) DO UPDATE SET
                password = EXCLUDED.password,
                name = EXCLUDED.name,
                role = EXCLUDED.role,
                isPremium = EXCLUDED.isPremium,
                cardCount = EXCLUDED.cardCount,
                level = EXCLUDED.level,
                lastLogin = EXCLUDED.lastLogin
            `, [row.id, row.email, row.password, row.name, row.role, row.isPremium, row.cardCount, row.level, row.createdAt, row.lastLogin])
          }
          else if (tableName === 'discovered_cards') {
            await client.query(`
              INSERT INTO discovered_cards (userId, cardData, discoveredAt)
              VALUES ($1, $2, $3)
            `, [row.userId, row.cardData, row.discoveredAt])
          }
          else if (tableName === 'series_database') {
            await client.query(`
              INSERT INTO series_database (userId, seriesData, updatedAt)
              VALUES ($1, $2, $3)
            `, [row.userId, row.seriesData, row.updatedAt])
          }
          else if (tableName === 'custom_blocks') {
            await client.query(`
              INSERT INTO custom_blocks (userId, blockData, createdAt)
              VALUES ($1, $2, $3)
            `, [row.userId, row.blockData, row.createdAt])
          }
          else if (tableName === 'custom_extensions') {
            await client.query(`
              INSERT INTO custom_extensions (userId, extensionData, createdAt)
              VALUES ($1, $2, $3)
            `, [row.userId, row.extensionData, row.createdAt])
          }

          totalImported++

          if ((i + 1) % 100 === 0) {
            console.log(`   ⏳ ${i + 1}/${rows.length} lignes importées...`)
          }
        } catch (error) {
          console.error(`   ⚠️  Erreur ligne ${i + 1}:`, error.message)
        }
      }

      console.log(`   ✅ ${rows.length} lignes importées\n`)
    }

    // Mettre à jour les séquences (auto-increment)
    console.log('🔄 Mise à jour des séquences...')
    for (const tableName of importOrder) {
      try {
        await client.query(`
          SELECT setval(pg_get_serial_sequence('${tableName}', 'id'),
            COALESCE((SELECT MAX(id) FROM ${tableName}), 1),
            true
          )
        `)
      } catch (error) {
        // Ignorer si pas de séquence
      }
    }

    // Valider la transaction
    await client.query('COMMIT')
    console.log('✅ Transaction validée')

    // Statistiques finales
    console.log('\n📊 RÉSUMÉ DE L\'IMPORT:')
    console.log('═══════════════════════════════════════')
    console.log(`✅ Total de lignes importées: ${totalImported}`)

    for (const tableName of importOrder) {
      const count = await client.query(`SELECT COUNT(*) FROM ${tableName}`)
      console.log(`   • ${tableName}: ${count.rows[0].count} lignes`)
    }

    console.log('═══════════════════════════════════════')
    console.log('\n🎉 Import terminé avec succès!')

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK')
      console.log('⚠️  Transaction annulée')
    }
    console.error('\n❌ Erreur lors de l\'import:', error)
    process.exit(1)
  } finally {
    if (client) {
      client.release()
    }
    await pool.end()
  }
}

importData()
