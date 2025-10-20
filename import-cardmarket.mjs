/**
 * Script d'import des données CardMarket vers Supabase
 *
 * Usage:
 *   node import-cardmarket.mjs
 *
 * Prérequis:
 *   - Les tables Supabase doivent être créées (supabase-cardmarket-schema.sql)
 *   - Les fichiers JSON doivent être dans F:\Logiciels\Appli Vaultestim\Données\cardmarket
 *   - Variables d'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY configurées
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Obtenir __dirname en ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Charger les variables d'environnement depuis .env
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '.env') })

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
// IMPORTANT: Utiliser la service_role key pour bypass RLS durant l'import
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: Variables d\'environnement manquantes')
  console.error('   Vérifiez que VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont dans .env')
  process.exit(1)
}

if (supabaseKey === process.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️  ATTENTION: Utilisation de la clé ANON au lieu de SERVICE_ROLE')
  console.warn('   L\'import peut échouer à cause de RLS')
  console.warn('   Ajoutez SUPABASE_SERVICE_ROLE_KEY dans votre .env')
  console.warn('')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Chemins des fichiers JSON
const DATA_DIR = 'F:\\Logiciels\\Appli Vaultestim\\Données\\cardmarket'
const FILES = {
  singles: path.join(DATA_DIR, 'products_singles_6.json'),
  nonsingles: path.join(DATA_DIR, 'products_nonsingles_6.json'),
  prices: path.join(DATA_DIR, 'price_guide_6.json')
}

/**
 * Charger un fichier JSON
 */
function loadJSON(filePath) {
  console.log(`📂 Chargement: ${path.basename(filePath)}`)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const data = JSON.parse(content)

  console.log(`✅ Chargé: ${path.basename(filePath)}`)
  return data
}

/**
 * Importer par batches pour éviter les timeouts
 */
async function importInBatches(tableName, data, batchSize, transformer) {
  const total = data.length
  console.log(`📦 Import ${total} entrées dans ${tableName} (batches de ${batchSize})...`)

  let imported = 0
  let errors = 0

  for (let i = 0; i < total; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    const transformedBatch = batch.map(transformer)

    try {
      const { error } = await supabase
        .from(tableName)
        .upsert(transformedBatch, { onConflict: 'id_product' })

      if (error) {
        console.error(`❌ Erreur batch ${i}-${i + batch.length}:`, error.message)
        errors++
      } else {
        imported += batch.length
        const percent = Math.round((imported / total) * 100)
        process.stdout.write(`\r  ⏳ ${imported}/${total} (${percent}%)`)
      }

      // Petite pause pour éviter rate limiting
      if (i + batchSize < total) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }

    } catch (err) {
      console.error(`❌ Exception batch ${i}-${i + batch.length}:`, err.message)
      errors++
    }
  }

  console.log(`\n✅ ${tableName}: ${imported}/${total} importés (${errors} erreurs)`)
  return { imported, errors }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n🚀 Début import CardMarket vers Supabase...\n')
  const startTime = Date.now()

  try {
    // 1. Charger les fichiers JSON
    console.log('📥 ÉTAPE 1/4: Chargement des fichiers JSON\n')

    const singlesData = loadJSON(FILES.singles)
    const nonsinglesData = loadJSON(FILES.nonsingles)
    const pricesData = loadJSON(FILES.prices)

    console.log('\n📊 Statistiques:')
    console.log(`   Singles: ${singlesData.products?.length || 0}`)
    console.log(`   NonSingles: ${nonsinglesData.products?.length || 0}`)
    console.log(`   Prix: ${pricesData.priceGuides?.length || 0}`)
    console.log(`   Version: ${singlesData.version || 'N/A'}`)
    console.log(`   Créé le: ${singlesData.createdAt || 'N/A'}\n`)

    // 2. Importer les singles
    console.log('📥 ÉTAPE 2/4: Import cartes singles\n')

    await importInBatches(
      'cardmarket_singles',
      singlesData.products || [],
      1000,
      (p) => ({
        id_product: p.idProduct,
        name: p.name,
        id_category: p.idCategory,
        category_name: p.categoryName,
        id_expansion: p.idExpansion,
        id_metacard: p.idMetacard,
        date_added: p.dateAdded !== '0000-00-00 00:00:00' ? p.dateAdded : null
      })
    )

    // 3. Importer les produits scellés
    console.log('\n📥 ÉTAPE 3/4: Import produits scellés\n')

    await importInBatches(
      'cardmarket_nonsingles',
      nonsinglesData.products || [],
      500,
      (p) => ({
        id_product: p.idProduct,
        name: p.name,
        id_category: p.idCategory,
        category_name: p.categoryName,
        id_expansion: p.idExpansion,
        id_metacard: p.idMetacard,
        date_added: p.dateAdded !== '0000-00-00 00:00:00' ? p.dateAdded : null
      })
    )

    // 4. Importer les prix
    console.log('\n💰 ÉTAPE 4/4: Import guides de prix\n')

    await importInBatches(
      'cardmarket_prices',
      pricesData.priceGuides || [],
      1000,
      (p) => ({
        id_product: p.idProduct,
        id_category: p.idCategory,
        avg: p.avg,
        low: p.low,
        trend: p.trend,
        avg1: p.avg1,
        avg7: p.avg7,
        avg30: p.avg30,
        avg_holo: p['avg-holo'],
        low_holo: p['low-holo'],
        trend_holo: p['trend-holo'],
        avg1_holo: p['avg1-holo'],
        avg7_holo: p['avg7-holo'],
        avg30_holo: p['avg30-holo']
      })
    )

    // 5. Vérifier les statistiques finales
    console.log('\n📊 Vérification finale...\n')

    const { data: stats } = await supabase
      .from('cardmarket_stats')
      .select('*')
      .single()

    if (stats) {
      console.log('✅ Statistiques Supabase:')
      console.log(`   Singles: ${stats.total_singles}`)
      console.log(`   NonSingles: ${stats.total_nonsingles}`)
      console.log(`   Prix: ${stats.total_prices}`)
      console.log(`   Dernière MAJ prix: ${stats.last_price_update || 'N/A'}`)
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n🎉 Import terminé avec succès en ${duration}s!\n`)

  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Lancer l'import
main()
