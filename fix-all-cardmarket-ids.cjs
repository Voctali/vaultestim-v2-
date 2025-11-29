/**
 * Script pour corriger TOUTES les URLs CardMarket
 * Utilise la recherche par nom pour récupérer le cardmarket_id numérique
 * qui est le seul format d'URL garanti de fonctionner
 *
 * Format correct: https://www.cardmarket.com/fr/Pokemon/Products/Singles/{Extension}/{cardmarket_id}?language=2
 * Format incorrect: https://www.cardmarket.com/fr/Pokemon/Products/Singles/{Extension}/{Card-Name-V1-CODE123}?language=2
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Configuration RapidAPI
const RAPIDAPI_KEY = process.env.VITE_RAPIDAPI_KEY
const RAPIDAPI_HOST = 'cardmarket-api-tcg.p.rapidapi.com'

// Configuration
const MAX_REQUESTS = 400 // Limiter pour ne pas épuiser le quota
const DELAY_MS = 300

// Priorité des extensions à corriger
// (commencer par les plus récentes/problématiques)
const PRIORITY_PREFIXES = [
  // EV 10.5 - White Flare & Black Bolt
  'rsv10pt5', 'zsv10pt5',
  // Surging Sparks
  'sv8',
  // Scarlet & Violet autres
  'sv9', 'sv7', 'sv6', 'sv5', 'sv4', 'sv3', 'sv2', 'sv1',
  // Promos
  'svp',
  // Mega Evolution
  'me1', 'me2', 'mep',
  // Sword & Shield
  'swsh'
]

let requestCount = 0
let updated = 0
let skipped = 0
let failed = 0

/**
 * Vérifier si l'URL utilise un cardmarket_id numérique valide
 */
function hasValidCardmarketIdUrl(url) {
  if (!url) return false
  // Format valide: /Singles/{Extension}/{digits}?language=2
  // Ex: /Singles/White-Flare/835898?language=2
  const match = url.match(/\/Singles\/[^/]+\/(\d+)\?/)
  return match !== null
}

/**
 * Rechercher une carte via RapidAPI
 */
async function searchCard(name, extensionName) {
  const searchQuery = `${name} ${extensionName || ''}`
  const response = await fetch(`https://${RAPIDAPI_HOST}/pokemon/cards/search?search=${encodeURIComponent(searchQuery.trim())}&limit=30`, {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const json = await response.json()
  return json.data || json || []
}

/**
 * Trouver la meilleure correspondance parmi les résultats
 */
function findBestMatch(results, cardName, cardNumber) {
  if (!Array.isArray(results) || results.length === 0) return null

  // Normaliser le nom pour comparaison
  const normalizedName = cardName?.toLowerCase().trim() || ''

  // 1. Match exact nom + numéro
  for (const r of results) {
    const rName = r.name?.toLowerCase().trim() || ''
    if (rName === normalizedName &&
        r.card_number?.toString() === cardNumber?.toString()) {
      if (r.cardmarket_id) return r
    }
  }

  // 2. Match nom contenu + numéro exact
  for (const r of results) {
    const rName = r.name?.toLowerCase().trim() || ''
    if ((rName.includes(normalizedName) || normalizedName.includes(rName)) &&
        r.card_number?.toString() === cardNumber?.toString()) {
      if (r.cardmarket_id) return r
    }
  }

  // 3. Match par numéro seul (si résultats limités)
  if (results.length <= 10) {
    for (const r of results) {
      if (r.card_number?.toString() === cardNumber?.toString()) {
        if (r.cardmarket_id) return r
      }
    }
  }

  // 4. Premier résultat avec cardmarket_id
  for (const r of results) {
    if (r.cardmarket_id) return r
  }

  return null
}

/**
 * Construire l'URL CardMarket avec le cardmarket_id
 */
function buildCardMarketUrl(cardData) {
  if (!cardData?.cardmarket_id || !cardData?.episode?.slug) return null

  // Capitaliser le slug d'extension (white-flare -> White-Flare)
  const extensionDisplayName = cardData.episode.slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-')

  return `https://www.cardmarket.com/fr/Pokemon/Products/Singles/${extensionDisplayName}/${cardData.cardmarket_id}?language=2`
}

/**
 * Extraire le numéro de carte depuis l'ID de la carte
 */
function extractNumberFromId(cardId) {
  // Format: sv8-123 ou rsv10pt5-45 ou swsh1-123
  const match = cardId.match(/-(\d+)(?:-|$)/)
  return match ? match[1] : null
}

/**
 * Attendre un délai
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Traiter un lot de cartes pour un préfixe donné
 */
async function processPrefix(prefix) {
  console.log(`\n>>> ${prefix.toUpperCase()} <<<\n`)

  // Récupérer toutes les cartes de ce préfixe
  const { data: cards, error } = await supabase
    .from('discovered_cards')
    .select('id, name, number, cardmarket_url')
    .like('id', `${prefix}%`)
    .order('id')

  if (error) {
    console.error('Erreur Supabase:', error.message)
    return
  }

  // Filtrer celles qui n'ont pas d'URL avec cardmarket_id valide
  const cardsToFix = cards.filter(c => !hasValidCardmarketIdUrl(c.cardmarket_url))

  console.log(`Total: ${cards.length} | À corriger: ${cardsToFix.length}`)

  if (cardsToFix.length === 0) {
    console.log('✅ Toutes les cartes ont déjà un cardmarket_id valide')
    return
  }

  for (const card of cardsToFix) {
    if (requestCount >= MAX_REQUESTS) {
      console.log(`\n⚠️ Quota atteint (${MAX_REQUESTS})`)
      return
    }

    const cardNumber = card.number || extractNumberFromId(card.id)
    if (!cardNumber) {
      skipped++
      continue
    }

    try {
      requestCount++
      process.stdout.write(`[${requestCount}] ${card.id.padEnd(20)} ${card.name.substring(0, 15).padEnd(16)}... `)

      const results = await searchCard(card.name, '')
      const bestMatch = findBestMatch(results, card.name, cardNumber)

      if (!bestMatch) {
        console.log('❌ Non trouvé')
        failed++
        await delay(DELAY_MS)
        continue
      }

      const directUrl = buildCardMarketUrl(bestMatch)
      if (!directUrl) {
        console.log('❌ Pas de cardmarket_id')
        failed++
        await delay(DELAY_MS)
        continue
      }

      // Mettre à jour dans Supabase
      const { error: updateError } = await supabase
        .from('discovered_cards')
        .update({ cardmarket_url: directUrl })
        .eq('id', card.id)

      if (updateError) {
        console.log(`❌ ${updateError.message}`)
        failed++
      } else {
        console.log(`✅ ${bestMatch.cardmarket_id}`)
        updated++
      }

      await delay(DELAY_MS)

    } catch (err) {
      console.log(`❌ ${err.message}`)
      failed++
      await delay(DELAY_MS)
    }
  }
}

async function main() {
  console.log('=== Correction URLs CardMarket (cardmarket_id) ===')
  console.log(`Quota: ${MAX_REQUESTS} requêtes | Délai: ${DELAY_MS}ms\n`)

  // Compter les cartes à corriger par préfixe
  console.log('Analyse des cartes à corriger...\n')

  const stats = {}
  for (const prefix of PRIORITY_PREFIXES) {
    const { data } = await supabase
      .from('discovered_cards')
      .select('id, cardmarket_url')
      .like('id', `${prefix}%`)

    if (data) {
      const toFix = data.filter(c => !hasValidCardmarketIdUrl(c.cardmarket_url))
      stats[prefix] = { total: data.length, toFix: toFix.length }
      if (toFix.length > 0) {
        console.log(`  ${prefix.padEnd(10)} : ${toFix.length}/${data.length} à corriger`)
      }
    }
  }

  console.log('\nDémarrage du traitement...')

  // Traiter chaque préfixe par priorité
  for (const prefix of PRIORITY_PREFIXES) {
    if (requestCount >= MAX_REQUESTS) break
    if (stats[prefix]?.toFix > 0) {
      await processPrefix(prefix)
    }
  }

  console.log('\n\n=== RÉSUMÉ ===')
  console.log(`Requêtes: ${requestCount}/${MAX_REQUESTS}`)
  console.log(`Mises à jour: ${updated}`)
  console.log(`Ignorées: ${skipped}`)
  console.log(`Échecs: ${failed}`)

  // Compter les cartes restantes
  let remaining = 0
  for (const prefix of PRIORITY_PREFIXES) {
    const { data } = await supabase
      .from('discovered_cards')
      .select('id, cardmarket_url')
      .like('id', `${prefix}%`)

    if (data) {
      remaining += data.filter(c => !hasValidCardmarketIdUrl(c.cardmarket_url)).length
    }
  }
  console.log(`\nRestant (extensions prioritaires): ${remaining} cartes`)
}

main().catch(console.error)
