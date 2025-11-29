/**
 * Script pour remplacer les URLs slug par des URLs tcggo.com
 * pour White Flare et Black Bolt
 *
 * Les URLs tcggo.com redirigent correctement vers CardMarket
 * Format: https://www.tcggo.com/external/cm/{id}?language=2
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
const MAX_REQUESTS = 400
const DELAY_MS = 300

let requestCount = 0
let updated = 0
let failed = 0

/**
 * Vérifier si l'URL est un slug (format invalide)
 */
function isSlugUrl(url) {
  if (!url) return false
  // Format slug: /Singles/{Extension}/{Nom-V1-CODE123}
  return /\/Singles\/[^\/]+\/[A-Za-z]/.test(url)
}

/**
 * Rechercher une carte via RapidAPI
 */
async function searchCard(name, extensionName, cardNumber) {
  // Rechercher avec nom + extension en texte clair (ex: "Sewaddle White Flare")
  const query = `${name} ${extensionName}`
  const response = await fetch(`https://${RAPIDAPI_HOST}/pokemon/cards/search?search=${encodeURIComponent(query)}&limit=30`, {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const json = await response.json()
  const cards = json.data || json || []

  if (!Array.isArray(cards)) return null

  // Convertir extensionName en slug pour comparaison (White Flare -> white-flare)
  const expectedSlug = extensionName.toLowerCase().replace(/\s+/g, '-')

  // Trouver la carte avec le bon numéro dans la bonne extension
  for (const card of cards) {
    if (card.episode?.slug === expectedSlug &&
        card.card_number?.toString() === cardNumber?.toString() &&
        card.links?.cardmarket) {
      return card
    }
  }

  // Fallback: juste le numéro dans la bonne extension
  for (const card of cards) {
    if (card.episode?.slug === expectedSlug &&
        card.links?.cardmarket) {
      if (card.card_number?.toString() === cardNumber?.toString()) {
        return card
      }
    }
  }

  return null
}

/**
 * Ajouter le paramètre language=2
 */
function addLanguageParam(url) {
  if (!url) return url
  if (url.includes('language=')) return url
  return url + (url.includes('?') ? '&' : '?') + 'language=2'
}

/**
 * Attendre
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('=== Remplacement URLs slug → tcggo.com ===')
  console.log('Extensions: White Flare & Black Bolt\n')

  const extensions = [
    { prefix: 'rsv10pt5', searchName: 'White Flare', name: 'White Flare' },
    { prefix: 'zsv10pt5', searchName: 'Black Bolt', name: 'Black Bolt' }
  ]

  for (const ext of extensions) {
    if (requestCount >= MAX_REQUESTS) break

    console.log(`\n--- ${ext.name} (${ext.prefix}) ---\n`)

    // Récupérer les cartes avec URL slug
    const { data: cards, error } = await supabase
      .from('discovered_cards')
      .select('id, name, number, cardmarket_url')
      .like('id', `${ext.prefix}%`)
      .order('id')

    if (error) {
      console.error('Erreur:', error.message)
      continue
    }

    // Filtrer celles avec URL slug
    const toFix = cards.filter(c => isSlugUrl(c.cardmarket_url))
    console.log(`Total: ${cards.length} | Avec URL slug: ${toFix.length}`)

    for (const card of toFix) {
      if (requestCount >= MAX_REQUESTS) {
        console.log(`\n⚠️ Quota atteint (${MAX_REQUESTS})`)
        break
      }

      // Extraire le numéro depuis l'ID (format: rsv10pt5-123)
      const cardNumber = card.number || card.id.match(/-(\d+)$/)?.[1]
      if (!cardNumber) {
        failed++
        continue
      }

      try {
        requestCount++
        process.stdout.write(`[${requestCount}] ${card.id.padEnd(18)} ${card.name.substring(0, 14).padEnd(15)}... `)

        const result = await searchCard(card.name, ext.searchName, cardNumber)

        if (!result || !result.links?.cardmarket) {
          console.log('❌ Non trouvé')
          failed++
          await delay(DELAY_MS)
          continue
        }

        const tcggoUrl = addLanguageParam(result.links.cardmarket)

        // Mettre à jour dans Supabase
        const { error: updateError } = await supabase
          .from('discovered_cards')
          .update({ cardmarket_url: tcggoUrl })
          .eq('id', card.id)

        if (updateError) {
          console.log(`❌ ${updateError.message}`)
          failed++
        } else {
          // Extraire l'ID tcggo pour l'affichage
          const tcggoId = tcggoUrl.match(/\/cm\/(\d+)/)?.[1] || '?'
          console.log(`✅ tcggo/${tcggoId}`)
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
  console.log(`Échecs: ${failed}`)

  // Compter les cartes restantes avec URL slug
  let remaining = 0
  for (const ext of extensions) {
    const { data } = await supabase
      .from('discovered_cards')
      .select('id, cardmarket_url')
      .like('id', `${ext.prefix}%`)

    if (data) {
      remaining += data.filter(c => isSlugUrl(c.cardmarket_url)).length
    }
  }
  console.log(`\nRestant avec URL slug: ${remaining} cartes`)
}

main().catch(console.error)
