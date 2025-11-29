/**
 * Script pour corriger les URLs slug restantes
 * Extensions: 151 (sv3pt5), Scarlet-Violet (sv1), Surging Sparks (sv8),
 *             Journey Together (sv9), SV Promos (svp)
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

// Extensions à corriger avec leur nom de recherche
const EXTENSIONS = [
  { prefix: 'sv3pt5', searchName: '151', name: '151' },
  { prefix: 'sv1', searchName: 'Scarlet Violet', name: 'Scarlet-Violet' },
  { prefix: 'sv8', searchName: 'Surging Sparks', name: 'Surging Sparks' },
  { prefix: 'sv9', searchName: 'Journey Together', name: 'Journey Together' },
  { prefix: 'svp', searchName: 'SV Black Star Promos', name: 'SV Promos' }
]

let requestCount = 0
let updated = 0
let failed = 0

/**
 * Vérifier si l'URL est un slug (format invalide)
 */
function isSlugUrl(url) {
  if (!url) return false
  // Format slug: /Singles/{Extension}/{Nom-V1-CODE123}
  return /\/Singles\/[^\/]+\/[A-Za-z]/.test(url) && !url.includes('tcggo.com')
}

/**
 * Rechercher une carte via RapidAPI
 */
async function searchCard(name, extensionName, cardNumber) {
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

  // Convertir extensionName en slug pour comparaison
  const expectedSlug = extensionName.toLowerCase().replace(/\s+/g, '-')

  // Trouver la carte avec le bon numéro dans la bonne extension
  for (const card of cards) {
    if (card.card_number?.toString() === cardNumber?.toString() &&
        card.links?.cardmarket) {
      return card
    }
  }

  // Fallback: premier résultat avec cardmarket link
  for (const card of cards) {
    if (card.links?.cardmarket) {
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
  console.log('=== Correction URLs slug restantes ===')
  console.log('Extensions: 151, Scarlet-Violet, Surging Sparks, Journey Together, SV Promos\n')

  for (const ext of EXTENSIONS) {
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

    if (toFix.length === 0) {
      console.log('✅ Aucune URL slug à corriger')
      continue
    }

    for (const card of toFix) {
      if (requestCount >= MAX_REQUESTS) {
        console.log(`\n⚠️ Quota atteint (${MAX_REQUESTS})`)
        break
      }

      // Extraire le numéro depuis l'ID
      const cardNumber = card.number || card.id.match(/-(\d+)$/)?.[1]
      if (!cardNumber) {
        failed++
        continue
      }

      try {
        requestCount++
        process.stdout.write(`[${requestCount}] ${card.id.padEnd(15)} ${card.name.substring(0, 14).padEnd(15)}... `)

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
  for (const ext of EXTENSIONS) {
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
