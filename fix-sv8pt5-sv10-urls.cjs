/**
 * Script pour corriger les URLs slug de :
 * - sv8pt5 (Prismatic Evolutions)
 * - sv10 (Destined Rivals)
 * Utilise une recherche par nom uniquement + filtre extension
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
const MAX_REQUESTS = 150
const DELAY_MS = 350

const EXTENSIONS = [
  { prefix: 'sv8pt5', slug: 'prismatic-evolutions', name: 'Prismatic Evolutions' },
  { prefix: 'sv10', slug: 'destined-rivals', name: 'Destined Rivals' }
]

let requestCount = 0
let updated = 0
let failed = 0

/**
 * Vérifier si l'URL est un slug (format invalide)
 */
function isSlugUrl(url) {
  if (!url) return false
  return /\/Singles\/[^\/]+\/[A-Za-z]/.test(url) && !url.includes('tcggo.com')
}

/**
 * Rechercher une carte via RapidAPI (nom seul)
 */
async function searchCard(name, cardNumber, extensionSlug) {
  const response = await fetch(`https://${RAPIDAPI_HOST}/pokemon/cards/search?search=${encodeURIComponent(name)}&limit=50`, {
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

  // Chercher dans l'extension avec le bon slug ET numéro
  for (const card of cards) {
    if (card.episode?.slug === extensionSlug &&
        card.card_number?.toString() === cardNumber?.toString() &&
        card.links?.cardmarket) {
      return card
    }
  }

  // Fallback: juste l'extension
  for (const card of cards) {
    if (card.episode?.slug === extensionSlug &&
        card.links?.cardmarket) {
      return card
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
  console.log('=== Correction URLs slug sv8pt5 & sv10 ===')
  console.log('Stratégie: recherche par nom uniquement + filtre extension\n')

  for (const ext of EXTENSIONS) {
    if (requestCount >= MAX_REQUESTS) break

    console.log(`\n--- ${ext.name} (${ext.prefix}) ---\n`)

    // Récupérer les cartes avec URL slug
    const { data: cards, error } = await supabase
      .from('discovered_cards')
      .select('id, name, number, cardmarket_url')
      .like('id', `${ext.prefix}-%`)
      .order('id')

    if (error) {
      console.error('Erreur:', error.message)
      continue
    }

    // Filtrer celles avec URL slug
    const toFix = cards.filter(c => isSlugUrl(c.cardmarket_url))
    console.log(`Total: ${cards.length} | Avec URL slug: ${toFix.length}`)

    if (toFix.length === 0) {
      console.log('✅ Aucune URL slug à corriger')
      continue
    }

    for (const card of toFix) {
      if (requestCount >= MAX_REQUESTS) {
        console.log(`\n⚠️ Quota atteint (${MAX_REQUESTS})`)
        break
      }

      const cardNumber = card.number || card.id.match(/-(\d+)$/)?.[1]
      if (!cardNumber) {
        failed++
        continue
      }

      try {
        requestCount++
        process.stdout.write(`[${requestCount}] ${card.id.padEnd(15)} ${card.name.substring(0, 16).padEnd(17)}... `)

        const result = await searchCard(card.name, cardNumber, ext.slug)

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

  // Compter les cartes restantes
  let remaining = 0
  for (const ext of EXTENSIONS) {
    const { data } = await supabase
      .from('discovered_cards')
      .select('id, cardmarket_url')
      .like('id', `${ext.prefix}-%`)

    if (data) {
      remaining += data.filter(c => isSlugUrl(c.cardmarket_url)).length
    }
  }
  console.log(`\nRestant avec URL slug: ${remaining} cartes`)
}

main().catch(console.error)
