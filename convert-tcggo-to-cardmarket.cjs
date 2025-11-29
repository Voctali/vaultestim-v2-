/**
 * Script pour convertir les URLs tcggo.com en URLs CardMarket directes
 * Récupère les infos depuis RapidAPI et construit l'URL directe avec ?language=2
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
const DELAY_MS = 250

// Filtrer uniquement White Flare et Black Bolt
const FILTER_PREFIXES = ['rsv10pt5', 'zsv10pt5']

let requestCount = 0
let converted = 0
let failed = 0

/**
 * Extraire l'ID tcggo depuis l'URL (ou null si URL CardMarket)
 */
function extractTcggoId(url) {
  const match = url.match(/\/cm\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Rechercher une carte par nom et numéro via RapidAPI
 */
async function searchCardByNameAndNumber(name, number, extensionSlug) {
  const searchQuery = `${name} ${extensionSlug}`
  const response = await fetch(`https://${RAPIDAPI_HOST}/pokemon/cards/search?search=${encodeURIComponent(searchQuery)}&limit=20`, {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const json = await response.json()
  const cards = json.data || json

  if (!Array.isArray(cards)) return null

  // Trouver la carte avec le bon numéro
  return cards.find(c =>
    c.card_number?.toString() === number?.toString() &&
    c.episode?.slug === extensionSlug
  )
}

/**
 * Récupérer les infos d'une carte par son ID tcggo
 */
async function getCardById(tcggoId) {
  const response = await fetch(`https://${RAPIDAPI_HOST}/pokemon/cards/${tcggoId}`, {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const json = await response.json()
  // La réponse est dans data.data
  return json.data || json
}

/**
 * Construire l'URL CardMarket directe
 * Utilise cardmarket_id si disponible, sinon construit le slug
 */
function buildCardMarketUrl(cardData) {
  if (!cardData || !cardData.episode) return null

  const expansionSlug = cardData.episode.slug // ex: "mega-evolution"

  // Capitaliser le slug d'expansion (mega-evolution -> Mega-Evolution)
  const capitalizedSlug = expansionSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-')

  // PRIORITÉ 1: Utiliser cardmarket_id si disponible (plus fiable)
  if (cardData.cardmarket_id) {
    return `https://www.cardmarket.com/fr/Pokemon/Products/Singles/${capitalizedSlug}/${cardData.cardmarket_id}?language=2`
  }

  // PRIORITÉ 2: Construire le slug manuellement
  const expansionCode = cardData.episode.code // ex: "MEG"
  const cardNumber = cardData.card_number?.toString().padStart(3, '0') // ex: "017"
  const cardName = cardData.name?.replace(/\s+/g, '-') // ex: "Ninjask" ou "Mega-Kangaskhan-ex"

  if (!expansionCode || !cardNumber || !cardName) {
    return null
  }

  // Format: https://www.cardmarket.com/fr/Pokemon/Products/Singles/Mega-Evolution/Ninjask-V1-MEG017?language=2
  return `https://www.cardmarket.com/fr/Pokemon/Products/Singles/${capitalizedSlug}/${cardName}-V1-${expansionCode}${cardNumber}?language=2`
}

/**
 * Attendre un délai
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('=== Conversion URLs tcggo.com -> CardMarket directes ===\n')

  // Récupérer les cartes White Flare et Black Bolt (toutes, pour re-générer avec cardmarket_id)
  let cards = []
  for (const prefix of FILTER_PREFIXES) {
    const { data, error: err } = await supabase
      .from('discovered_cards')
      .select('id, name, cardmarket_url')
      .like('id', `${prefix}%`)
      .not('cardmarket_url', 'is', null)

    if (!err && data) {
      cards = cards.concat(data)
    }
  }

  const error = null

  if (error) {
    console.error('Erreur Supabase:', error)
    return
  }

  console.log(`Cartes à convertir: ${cards.length}\n`)

  for (const card of cards) {
    if (requestCount >= MAX_REQUESTS) {
      console.log(`\nQuota atteint (${MAX_REQUESTS} requêtes)`)
      break
    }

    const tcggoId = extractTcggoId(card.cardmarket_url)
    if (!tcggoId) {
      console.log(`[SKIP] ${card.id}: Impossible d'extraire l'ID tcggo`)
      failed++
      continue
    }

    try {
      requestCount++
      const cardData = await getCardById(tcggoId)

      const directUrl = buildCardMarketUrl(cardData)
      if (!directUrl) {
        console.log(`[FAIL] ${card.id}: Impossible de construire l'URL`)
        failed++
        continue
      }

      // Mettre à jour dans Supabase
      const { error: updateError } = await supabase
        .from('discovered_cards')
        .update({ cardmarket_url: directUrl })
        .eq('id', card.id)

      if (updateError) {
        console.log(`[ERROR] ${card.id}: ${updateError.message}`)
        failed++
      } else {
        converted++
        console.log(`[OK] ${card.id}: ${directUrl}`)
      }

      await delay(DELAY_MS)

    } catch (err) {
      console.log(`[ERROR] ${card.id}: ${err.message}`)
      failed++
      await delay(DELAY_MS)
    }
  }

  console.log('\n=== Résumé ===')
  console.log(`Requêtes API: ${requestCount}`)
  console.log(`Converties: ${converted}`)
  console.log(`Échecs: ${failed}`)
}

main().catch(console.error)
