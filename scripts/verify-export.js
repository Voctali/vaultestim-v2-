/**
 * Script de vérification de l'export
 * Vérifie que les données exportées sont valides et complètes
 * Usage: node scripts/verify-export.js [fichier-export.json]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const exportFile = process.argv[2] || path.join(__dirname, '../data-export.json')

console.log('🔍 Vérification de l\'export...')
console.log('📂 Fichier:', exportFile)
console.log('')

if (!fs.existsSync(exportFile)) {
  console.error('❌ Fichier introuvable:', exportFile)
  process.exit(1)
}

try {
  const data = JSON.parse(fs.readFileSync(exportFile, 'utf8'))

  console.log('📊 RÉSULTATS DE LA VÉRIFICATION:')
  console.log('═══════════════════════════════════════')

  // Vérifier la structure
  const checks = {
    hasMetadata: !!data.metadata,
    hasTables: !!data.tables,
    hasExportDate: !!data.metadata?.exported_at,
    hasStatistics: !!data.metadata?.statistics
  }

  console.log('\n✓ Structure du fichier:')
  console.log(`   ${checks.hasMetadata ? '✅' : '❌'} Métadonnées présentes`)
  console.log(`   ${checks.hasTables ? '✅' : '❌'} Tables présentes`)
  console.log(`   ${checks.hasExportDate ? '✅' : '❌'} Date d'export`)
  console.log(`   ${checks.hasStatistics ? '✅' : '❌'} Statistiques`)

  if (!checks.hasTables) {
    console.error('\n❌ Fichier invalide: pas de données de tables')
    process.exit(1)
  }

  // Vérifier les tables
  const tables = Object.keys(data.tables)
  console.log(`\n✓ Tables trouvées (${tables.length}):`)

  const requiredTables = ['users', 'discovered_cards', 'series_database', 'custom_blocks', 'custom_extensions']
  const missingTables = requiredTables.filter(t => !tables.includes(t))

  for (const table of requiredTables) {
    const exists = tables.includes(table)
    const count = exists ? data.tables[table]?.length || 0 : 0
    console.log(`   ${exists ? '✅' : '⚠️ '} ${table}: ${count} lignes`)
  }

  if (missingTables.length > 0) {
    console.log(`\n⚠️  Tables manquantes: ${missingTables.join(', ')}`)
  }

  // Vérifier l'intégrité des données
  console.log('\n✓ Intégrité des données:')

  let totalRows = 0
  let invalidRows = 0

  for (const [tableName, rows] of Object.entries(data.tables)) {
    if (!Array.isArray(rows)) {
      console.log(`   ⚠️  ${tableName}: Format invalide (pas un tableau)`)
      invalidRows++
      continue
    }

    totalRows += rows.length

    // Vérifier quelques échantillons
    if (rows.length > 0) {
      const sample = rows[0]
      const hasRequiredFields = tableName === 'users'
        ? sample.id && sample.email && sample.password
        : tableName.includes('custom') || tableName.includes('discovered') || tableName.includes('series')
          ? sample.userId
          : true

      if (!hasRequiredFields) {
        console.log(`   ⚠️  ${tableName}: Champs requis manquants`)
        invalidRows++
      }
    }
  }

  console.log(`   ✅ Total de lignes: ${totalRows}`)
  if (invalidRows > 0) {
    console.log(`   ⚠️  Tables avec problèmes: ${invalidRows}`)
  }

  // Statistiques détaillées
  if (data.metadata?.statistics) {
    console.log('\n✓ Statistiques:')
    const stats = data.metadata.statistics
    console.log(`   • Utilisateurs: ${stats.users || 0}`)
    console.log(`   • Cartes découvertes: ${stats.discovered_cards || 0}`)
    console.log(`   • Séries: ${stats.series_database || 0}`)
    console.log(`   • Blocs: ${stats.custom_blocks || 0}`)
    console.log(`   • Extensions: ${stats.custom_extensions || 0}`)
  }

  // Informations sur le fichier
  const fileSize = (fs.statSync(exportFile).size / 1024).toFixed(2)
  console.log('\n✓ Informations fichier:')
  console.log(`   • Taille: ${fileSize} KB`)
  console.log(`   • Date export: ${data.metadata?.exported_at || 'Non définie'}`)
  console.log(`   • Version: ${data.metadata?.version || 'Non définie'}`)

  console.log('\n═══════════════════════════════════════')

  if (invalidRows === 0 && missingTables.length === 0) {
    console.log('\n✅ EXPORT VALIDE - Prêt pour l\'import!')
  } else {
    console.log('\n⚠️  EXPORT AVEC AVERTISSEMENTS - Vérifiez les messages ci-dessus')
  }

} catch (error) {
  console.error('\n❌ Erreur lors de la vérification:', error.message)
  process.exit(1)
}
