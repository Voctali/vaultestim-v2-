/**
 * Script OPTIMISÉ pour corriger les URLs CardMarket
 *
 * STRATÉGIE:
 * 1. URLs tcggo.com/external/cm/{id} → Extraire l'ID et construire l'URL directe (SANS API)
 * 2. URLs slug (Card-Name-V1-CODE123) → Utiliser RapidAPI pour récupérer cardmarket_id
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Configuration RapidAPI (seulement pour les URLs slug)
const RAPIDAPI_KEY = process.env.VITE_RAPIDAPI_KEY
const RAPIDAPI_HOST = 'cardmarket-api-tcg.p.rapidapi.com'

// Configuration
const MAX_API_REQUESTS = 400
const DELAY_MS = 300

// Mapping des slugs d'extension pour construire l'URL CardMarket
const EXTENSION_SLUGS = {
  // Scarlet & Violet
  'sv1': 'Scarlet-Violet',
  'sv2': 'Paldea-Evolved',
  'sv3': 'Obsidian-Flames',
  'sv3pt5': '151',
  'sv4': 'Paradox-Rift',
  'sv4pt5': 'Paldean-Fates',
  'sv5': 'Temporal-Forces',
  'sv6': 'Twilight-Masquerade',
  'sv6pt5': 'Shrouded-Fable',
  'sv7': 'Stellar-Crown',
  'sv8': 'Surging-Sparks',
  'sv8pt5': 'Prismatic-Evolutions',
  'sv9': 'Journey-Together',
  'sv10': 'Destined-Rivals',
  'svp': 'SV-Black-Star-Promos',
  // EV 10.5
  'rsv10pt5': 'White-Flare',
  'zsv10pt5': 'Black-Bolt',
  // Mega Evolution
  'me1': 'Mega-Evolution',
  'me2': 'Mega-Evolution-2',
  'mep': 'Mega-Evolution-Promos',
  // Sword & Shield
  'swsh1': 'Sword-Shield-Base-Set',
  'swsh2': 'Rebel-Clash',
  'swsh3': 'Darkness-Ablaze',
  'swsh4': 'Vivid-Voltage',
  'swsh5': 'Battle-Styles',
  'swsh6': 'Chilling-Reign',
  'swsh7': 'Evolving-Skies',
  'swsh8': 'Fusion-Strike',
  'swsh9': 'Brilliant-Stars',
  'swsh10': 'Astral-Radiance',
  'swsh11': 'Lost-Origin',
  'swsh12': 'Silver-Tempest',
  'swsh12pt5': 'Crown-Zenith',
  'swshp': 'SWSH-Black-Star-Promos'
}

let apiRequestCount = 0
let convertedFromTcggo = 0
let convertedFromApi = 0
let failed = 0

/**
 * Extraire le cardmarket_id depuis une URL tcggo.com
 */
function extractIdFromTcggoUrl(url) {
  if (!url) return null
  // Format: https://www.tcggo.com/external/cm/21443?language=2
  const match = url.match(/\/cm\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Vérifier si l'URL est déjà au format CardMarket avec ID numérique
 */
function isValidCardmarketIdUrl(url) {
  if (!url) return false
  // Format valide: /Singles/{Extension}/{digits}?
  return /\/Singles\/[^/]+\/\d+\?/.test(url)
}

/**
 * Vérifier si c'est une URL tcggo.com
 */
function isTcggoUrl(url) {
  return url?.includes('tcggo.com/external/cm/')
}

/**
 * Vérifier si c'est une URL slug CardMarket
 */
function isSlugUrl(url) {
  if (!url) return false
  // Format: /Singles/{Extension}/{Nom-Carte-V1-CODE123}?
  return /\/Singles\/[^/]+\/[A-Za-z]/.test(url) && !isValidCardmarketIdUrl(url)
}

/**
 * Extraire le préfixe d'extension depuis un card_id
 */
function getExtensionPrefix(cardId) {
  // Format: sv8-123, rsv10pt5-1, me1-45
  const match = cardId?.match(/^([a-z]+\d*(?:pt\d+)?)/i)
  return match ? match[1].toLowerCase() : null
}

/**
 * Construire l'URL CardMarket directe depuis un ID numérique
 */
function buildDirectUrl(cardmarketId, extensionPrefix) {
  const extensionSlug = EXTENSION_SLUGS[extensionPrefix]
  if (!extensionSlug) return null
  return `https://www.cardmarket.com/fr/Pokemon/Products/Singles/${extensionSlug}/${cardmarketId}?language=2`
}

/**
 * Rechercher une carte via RapidAPI pour obtenir son cardmarket_id
 */
async function searchCardForId(name, cardNumber) {
  const response = await fetch(`https://${RAPIDAPI_HOST}/pokemon/cards/search?search=${encodeURIComponent(name)}&limit=30`, {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const json = await response.json()
  const results = json.data || json || []

  // Trouver la meilleure correspondance
  for (const r of results) {
    if (r.card_number?.toString() === cardNumber?.toString() && r.cardmarket_id) {
      return r
    }
  }

  // Fallback: premier résultat avec cardmarket_id
  return results.find(r => r.cardmarket_id) || null
}

/**
 * Délai
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('=== Correction OPTIMISÉE des URLs CardMarket ===\n')

  // ÉTAPE 1: Convertir les URLs tcggo.com (sans API)
  console.log('📥 ÉTAPE 1: Conversion des URLs tcggo.com (sans API)...\n')

  const { data: tcggoCards, error: err1 } = await supabase
    .from('discovered_cards')
    .select('id, cardmarket_url')
    .like('cardmarket_url', '%tcggo.com/external/cm/%')
    .limit(5000)

  if (err1) {
    console.error('Erreur:', err1.message)
    return
  }

  console.log(`Cartes avec URL tcggo.com: ${tcggoCards.length}`)

  const updates = []
  for (const card of tcggoCards) {
    const cardmarketId = extractIdFromTcggoUrl(card.cardmarket_url)
    const prefix = getExtensionPrefix(card.id)

    if (cardmarketId && prefix) {
      const directUrl = buildDirectUrl(cardmarketId, prefix)
      if (directUrl) {
        updates.push({ id: card.id, url: directUrl })
      }
    }
  }

  console.log(`URLs à convertir: ${updates.length}`)

  // Mettre à jour par batch de 100
  for (let i = 0; i < updates.length; i += 100) {
    const batch = updates.slice(i, i + 100)

    for (const u of batch) {
      const { error: updateError } = await supabase
        .from('discovered_cards')
        .update({ cardmarket_url: u.url })
        .eq('id', u.id)

      if (!updateError) {
        convertedFromTcggo++
      } else {
        failed++
      }
    }

    process.stdout.write(`\r  Progression: ${Math.min(i + 100, updates.length)}/${updates.length}`)
  }

  console.log(`\n\n✅ Converties depuis tcggo.com: ${convertedFromTcggo}`)

  // ÉTAPE 2: Convertir les URLs slug via RapidAPI
  console.log('\n📡 ÉTAPE 2: Conversion des URLs slug via RapidAPI...\n')

  // Récupérer les cartes avec URLs slug (White Flare, Black Bolt principalement)
  const prefixesToFix = ['rsv10pt5', 'zsv10pt5']
  let slugCards = []

  for (const prefix of prefixesToFix) {
    const { data, error } = await supabase
      .from('discovered_cards')
      .select('id, name, number, cardmarket_url')
      .like('id', `${prefix}%`)
      .not('cardmarket_url', 'is', null)

    if (!error && data) {
      // Filtrer celles qui ont des URLs slug (pas d'ID numérique)
      const toFix = data.filter(c => isSlugUrl(c.cardmarket_url))
      slugCards = slugCards.concat(toFix)
    }
  }

  console.log(`Cartes avec URL slug à corriger: ${slugCards.length}`)

  if (slugCards.length === 0) {
    console.log('✅ Aucune URL slug à corriger')
  } else {
    console.log(`(Limite: ${MAX_API_REQUESTS} requêtes API)\n`)

    for (const card of slugCards) {
      if (apiRequestCount >= MAX_API_REQUESTS) {
        console.log(`\n⚠️ Quota API atteint (${MAX_API_REQUESTS})`)
        break
      }

      const cardNumber = card.number || card.id.match(/-(\d+)$/)?.[1]
      if (!cardNumber) {
        failed++
        continue
      }

      try {
        apiRequestCount++
        process.stdout.write(`[${apiRequestCount}] ${card.id.padEnd(18)} ${card.name.substring(0, 15).padEnd(16)}... `)

        const result = await searchCardForId(card.name, cardNumber)

        if (!result?.cardmarket_id) {
          console.log('❌ Non trouvé')
          failed++
          await delay(DELAY_MS)
          continue
        }

        const prefix = getExtensionPrefix(card.id)
        const directUrl = buildDirectUrl(result.cardmarket_id, prefix)

        if (!directUrl) {
          console.log('❌ Extension non mappée')
          failed++
          await delay(DELAY_MS)
          continue
        }

        const { error: updateError } = await supabase
          .from('discovered_cards')
          .update({ cardmarket_url: directUrl })
          .eq('id', card.id)

        if (updateError) {
          console.log(`❌ ${updateError.message}`)
          failed++
        } else {
          console.log(`✅ ${result.cardmarket_id}`)
          convertedFromApi++
        }

        await delay(DELAY_MS)

      } catch (err) {
        console.log(`❌ ${err.message}`)
        failed++
        await delay(DELAY_MS)
      }
    }
  }

  // RÉSUMÉ
  console.log('\n\n=== RÉSUMÉ ===')
  console.log(`Converties depuis tcggo.com: ${convertedFromTcggo} (sans API)`)
  console.log(`Converties depuis RapidAPI: ${convertedFromApi} (${apiRequestCount} requêtes)`)
  console.log(`Échecs: ${failed}`)
  console.log(`Total mises à jour: ${convertedFromTcggo + convertedFromApi}`)

  // Compter les cartes restantes
  let remaining = 0
  for (const prefix of [...prefixesToFix, 'sv8', 'sv9', 'me1']) {
    const { data } = await supabase
      .from('discovered_cards')
      .select('id, cardmarket_url')
      .like('id', `${prefix}%`)

    if (data) {
      remaining += data.filter(c => !isValidCardmarketIdUrl(c.cardmarket_url)).length
    }
  }
  console.log(`\nRestant à corriger: ${remaining} cartes`)
}

main().catch(console.error)
