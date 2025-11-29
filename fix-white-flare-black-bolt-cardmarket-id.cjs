/**
 * Script pour corriger les URLs CardMarket de White Flare et Black Bolt
 * Utilise la recherche par nom+numéro pour récupérer le cardmarket_id
 * puis construit l'URL directe avec l'ID numérique
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
const MAX_REQUESTS = 300 // Limiter pour ne pas épuiser le quota
const DELAY_MS = 350

// Extensions à corriger
const EXTENSIONS = {
  'rsv10pt5': {
    name: 'White-Flare',
    slug: 'white-flare'
  },
  'zsv10pt5': {
    name: 'Black-Bolt',
    slug: 'black-bolt'
  }
}

let requestCount = 0
let updated = 0
let skipped = 0
let failed = 0

/**
 * Vérifier si l'URL utilise déjà un cardmarket_id numérique
 */
function hasNumericCardmarketId(url) {
  if (!url) return false
  // Format correct: /Singles/White-Flare/835898?language=2
  const match = url.match(/\/Singles\/[^/]+\/(\d+)\?/)
  return match !== null
}

/**
 * Rechercher une carte par nom et extension via RapidAPI
 */
async function searchCard(name, extensionSlug) {
  const searchQuery = `${name} ${extensionSlug}`
  const response = await fetch(`https://${RAPIDAPI_HOST}/pokemon/cards/search?search=${encodeURIComponent(searchQuery)}&limit=30`, {
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
function findBestMatch(results, cardName, cardNumber, extensionSlug) {
  if (!Array.isArray(results) || results.length === 0) return null

  // Filtrer par extension d'abord
  const sameExtension = results.filter(r =>
    r.episode?.slug === extensionSlug
  )

  const searchIn = sameExtension.length > 0 ? sameExtension : results

  // 1. Match exact numéro + extension
  for (const r of searchIn) {
    if (r.card_number?.toString() === cardNumber?.toString() &&
        r.episode?.slug === extensionSlug) {
      return r
    }
  }

  // 2. Match par nom similaire + numéro
  for (const r of searchIn) {
    const rName = r.name?.toLowerCase() || ''
    const cName = cardName?.toLowerCase() || ''
    if (rName.includes(cName) || cName.includes(rName)) {
      if (r.card_number?.toString() === cardNumber?.toString()) {
        return r
      }
    }
  }

  // 3. Match par numéro seul dans la bonne extension
  for (const r of searchIn) {
    if (r.card_number?.toString() === cardNumber?.toString()) {
      return r
    }
  }

  return null
}

/**
 * Construire l'URL CardMarket avec le cardmarket_id
 */
function buildCardMarketUrl(cardData, extensionDisplayName) {
  if (!cardData?.cardmarket_id) return null

  return `https://www.cardmarket.com/fr/Pokemon/Products/Singles/${extensionDisplayName}/${cardData.cardmarket_id}?language=2`
}

/**
 * Extraire le numéro de carte depuis l'ID
 */
function extractNumberFromId(cardId) {
  // Format: rsv10pt5-123 ou zsv10pt5-45
  const match = cardId.match(/-(\d+)$/)
  return match ? match[1] : null
}

/**
 * Attendre un délai
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('=== Correction URLs CardMarket (cardmarket_id) ===')
  console.log('Extensions: White Flare & Black Bolt\n')

  for (const [prefix, config] of Object.entries(EXTENSIONS)) {
    if (requestCount >= MAX_REQUESTS) break

    console.log(`\n--- ${config.name} (${prefix}) ---\n`)

    // Récupérer toutes les cartes de cette extension
    const { data: cards, error } = await supabase
      .from('discovered_cards')
      .select('id, name, number, cardmarket_url')
      .like('id', `${prefix}%`)
      .order('id')

    if (error) {
      console.error('Erreur Supabase:', error)
      continue
    }

    console.log(`Total cartes: ${cards.length}`)

    // Filtrer celles qui n'ont pas encore d'ID numérique
    const cardsToFix = cards.filter(c => !hasNumericCardmarketId(c.cardmarket_url))
    console.log(`À corriger: ${cardsToFix.length}\n`)

    for (const card of cardsToFix) {
      if (requestCount >= MAX_REQUESTS) {
        console.log(`\n⚠️ Quota atteint (${MAX_REQUESTS} requêtes)`)
        break
      }

      const cardNumber = card.number || extractNumberFromId(card.id)
      if (!cardNumber) {
        console.log(`[SKIP] ${card.id}: Pas de numéro`)
        skipped++
        continue
      }

      try {
        requestCount++
        process.stdout.write(`[${requestCount}/${MAX_REQUESTS}] ${card.id} (${card.name} #${cardNumber})... `)

        const results = await searchCard(card.name, config.slug)
        const bestMatch = findBestMatch(results, card.name, cardNumber, config.slug)

        if (!bestMatch) {
          console.log('❌ Non trouvé')
          failed++
          await delay(DELAY_MS)
          continue
        }

        if (!bestMatch.cardmarket_id) {
          console.log('❌ Pas de cardmarket_id')
          failed++
          await delay(DELAY_MS)
          continue
        }

        const directUrl = buildCardMarketUrl(bestMatch, config.name)
        if (!directUrl) {
          console.log('❌ URL invalide')
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

  console.log('\n\n=== RÉSUMÉ ===')
  console.log(`Requêtes API: ${requestCount}/${MAX_REQUESTS}`)
  console.log(`Mises à jour: ${updated}`)
  console.log(`Ignorées: ${skipped}`)
  console.log(`Échecs: ${failed}`)

  // Compter les cartes restantes sans ID numérique
  let remaining = 0
  for (const prefix of Object.keys(EXTENSIONS)) {
    const { data } = await supabase
      .from('discovered_cards')
      .select('id, cardmarket_url')
      .like('id', `${prefix}%`)

    if (data) {
      remaining += data.filter(c => !hasNumericCardmarketId(c.cardmarket_url)).length
    }
  }
  console.log(`\nRestant à corriger: ${remaining} cartes`)
}

main().catch(console.error)
