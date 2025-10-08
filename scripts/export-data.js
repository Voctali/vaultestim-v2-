/**
 * Script d'export de toutes les données SQLite vers JSON
 * Usage: node scripts/export-data.js
 */

import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '../backend/vaultestim.db')
const EXPORT_PATH = path.join(__dirname, '../data-export.json')
const BACKUP_DIR = path.join(__dirname, '../backups')

console.log('🔄 Démarrage de l\'export des données...')
console.log('📂 Base de données:', DB_PATH)

// Vérifier que la base de données existe
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Erreur: Base de données introuvable à', DB_PATH)
  process.exit(1)
}

// Créer le dossier de backups s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

try {
  const db = new Database(DB_PATH, { readonly: true })

  console.log('📊 Lecture des données...')

  // Récupérer toutes les tables
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    AND name NOT LIKE 'sqlite_%'
  `).all()

  console.log(`📋 Tables trouvées: ${tables.map(t => t.name).join(', ')}`)

  const exportData = {
    metadata: {
      exported_at: new Date().toISOString(),
      database_path: DB_PATH,
      total_tables: tables.length,
      version: '1.0.0'
    },
    tables: {}
  }

  // Exporter chaque table
  for (const table of tables) {
    const tableName = table.name
    console.log(`  📄 Export de la table "${tableName}"...`)

    try {
      const rows = db.prepare(`SELECT * FROM ${tableName}`).all()
      exportData.tables[tableName] = rows

      console.log(`    ✅ ${rows.length} lignes exportées`)
    } catch (error) {
      console.error(`    ❌ Erreur lors de l'export de ${tableName}:`, error.message)
      exportData.tables[tableName] = {
        error: error.message,
        data: []
      }
    }
  }

  db.close()

  // Calculer les statistiques
  const stats = {
    users: exportData.tables.users?.length || 0,
    discovered_cards: exportData.tables.discovered_cards?.length || 0,
    series_database: exportData.tables.series_database?.length || 0,
    custom_blocks: exportData.tables.custom_blocks?.length || 0,
    custom_extensions: exportData.tables.custom_extensions?.length || 0
  }

  exportData.metadata.statistics = stats

  // Sauvegarder le fichier d'export principal
  fs.writeFileSync(EXPORT_PATH, JSON.stringify(exportData, null, 2))
  console.log('\n✅ Export principal créé:', EXPORT_PATH)

  // Créer aussi un backup daté
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.json`)
  fs.writeFileSync(backupPath, JSON.stringify(exportData, null, 2))
  console.log('✅ Backup créé:', backupPath)

  // Afficher le résumé
  console.log('\n📊 RÉSUMÉ DE L\'EXPORT:')
  console.log('═══════════════════════════════════════')
  console.log(`📅 Date: ${exportData.metadata.exported_at}`)
  console.log(`📋 Tables exportées: ${tables.length}`)
  console.log(`\n📈 Statistiques:`)
  console.log(`   • Utilisateurs: ${stats.users}`)
  console.log(`   • Cartes découvertes: ${stats.discovered_cards}`)
  console.log(`   • Séries: ${stats.series_database}`)
  console.log(`   • Blocs personnalisés: ${stats.custom_blocks}`)
  console.log(`   • Extensions personnalisées: ${stats.custom_extensions}`)

  const fileSize = (fs.statSync(EXPORT_PATH).size / 1024).toFixed(2)
  console.log(`\n💾 Taille du fichier: ${fileSize} KB`)
  console.log('═══════════════════════════════════════')
  console.log('\n🎉 Export terminé avec succès!')
  console.log('📁 Fichiers créés:')
  console.log(`   • ${EXPORT_PATH}`)
  console.log(`   • ${backupPath}`)

} catch (error) {
  console.error('❌ Erreur lors de l\'export:', error)
  process.exit(1)
}
