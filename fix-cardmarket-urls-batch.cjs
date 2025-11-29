/**
 * Script de correction des URLs CardMarket via RapidAPI
 * PRIORITÉ: Scarlet & Violet > Mega Evolution > Sword & Shield > autres
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://ubphwlmnfjdaiarbihcx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicGh3bG1uZmpkYWlhcmJpaGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAwMDIsImV4cCI6MjA3NTUxNjAwMn0.7d0303MNw__AVC9wkS7BodK2WG8Rvb2IY2V-0wv0l7Q'
)

// Configuration RapidAPI
const RAPIDAPI_KEY = '523ca9be5emsh10d5931a9d95b87p18cd5cjsn641503bb34b6'
const RAPIDAPI_HOST = 'cardmarket-api-tcg.p.rapidapi.com'
const BASE_URL = 'https://cardmarket-api-tcg.p.rapidapi.com'

// Configuration
const MAX_REQUESTS = 3000
const DELAY_MS = 200
const BATCH_SIZE = 100

// Priorité des blocs (prefixes de set_id)
const PRIORITY_PREFIXES = [
  // 1. White Flare & Black Bolt (EV 10.5)
  'rsv10pt5', 'zsv10pt5',
  // 2. Scarlet & Violet (le plus récent)
  'sv', 'svp',
  // 3. Mega Evolution
  'me1', 'me2', 'mep',
  // 4. Sword & Shield
  'swsh',
]

let requestCount = 0
let updated = 0
let skipped = 0
let errors = 0

/**
 * Rechercher des cartes par nom uniquement
 */
async function searchCards(name) {
  const params = new URLSearchParams({
    search: name,
    limit: '50'
  })

  const response = await fetch(`${BASE_URL}/pokemon/cards/search?${params}`, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Ajouter le paramètre language=2 (français)
 */
function addLanguageParam(url) {
  if (!url) return url
  try {
    const urlObj = new URL(url)
    urlObj.searchParams.set('language', '2')
    return urlObj.toString()
  } catch {
    return url
  }
}

/**
 * Trouver la meilleure correspondance parmi les résultats
 */
function findBestMatch(results, cardName, cardNumber) {
  if (!results || results.length === 0) return null

  const withLink = results.filter(r => r.links?.cardmarket)
  if (withLink.length === 0) return null

  // 1. Match exact nom + numéro
  for (const r of withLink) {
    if (r.name?.toLowerCase() === cardName.toLowerCase() &&
        cardNumber && r.card_number?.toString() === cardNumber.toString()) {
      return r
    }
  }

  // 2. Match partiel nom + numéro exact
  for (const r of withLink) {
    if (r.name?.toLowerCase().includes(cardName.toLowerCase()) &&
        cardNumber && r.card_number?.toString() === cardNumber.toString()) {
      return r
    }
  }

  // 3. Match exact nom
  for (const r of withLink) {
    if (r.name?.toLowerCase() === cardName.toLowerCase()) {
      return r
    }
  }

  // 4. Match partiel nom
  for (const r of withLink) {
    if (r.name?.toLowerCase().includes(cardName.toLowerCase())) {
      return r
    }
  }

  return withLink[0]
}

/**
 * Traiter une carte
 */
async function processCard(card) {
  try {
    const result = await searchCards(card.name)
    requestCount++

    if (result.data && result.data.length > 0) {
      const bestMatch = findBestMatch(result.data, card.name, card.number)

      if (bestMatch?.links?.cardmarket) {
        const cardmarketUrl = addLanguageParam(bestMatch.links.cardmarket)

        const { error: updateError } = await supabase
          .from('discovered_cards')
          .update({ cardmarket_url: cardmarketUrl })
          .eq('id', card.id)

        if (updateError) {
          errors++
          return { status: 'error', message: updateError.message }
        }

        updated++
        return { status: 'updated', match: `${bestMatch.name} #${bestMatch.card_number}` }
      } else {
        skipped++
        return { status: 'skipped', reason: 'Pas de lien' }
      }
    } else {
      skipped++
      return { status: 'skipped', reason: 'Aucun résultat' }
    }
  } catch (error) {
    errors++
    requestCount++
    return { status: 'error', message: error.message }
  }
}

/**
 * Afficher la progression
 */
function showProgress(current, total, cardName, setId, lastStatus, matchInfo) {
  const percent = ((requestCount / MAX_REQUESTS) * 100).toFixed(1)
  const statusIcon = lastStatus === 'updated' ? '✓' : lastStatus === 'skipped' ? '-' : '✗'
  const info = matchInfo || ''
  const set = setId ? `[${setId}]` : ''
  process.stdout.write(`\r[${requestCount}/${MAX_REQUESTS}] ${percent}% | OK: ${updated} | Skip: ${skipped} | Err: ${errors} | ${statusIcon} ${set.padEnd(12)} ${cardName.substring(0, 18).padEnd(18)} ${info.substring(0, 20)}`)
}

/**
 * Récupérer les cartes prioritaires
 */
async function getCardsByPriority(prefix, lastId = '') {
  // Construire le filtre pour ce prefix
  let query = supabase
    .from('discovered_cards')
    .select('id, name, number, set_id')
    .is('cardmarket_url', null)
    .order('id', { ascending: true })
    .limit(BATCH_SIZE)

  // Filtrer par prefix de set_id
  if (prefix === 'sv') {
    // sv mais pas svp (promos séparés)
    query = query.like('set_id', 'sv%').not('set_id', 'like', 'svp%')
  } else {
    query = query.like('set_id', `${prefix}%`)
  }

  if (lastId) {
    query = query.gt('id', lastId)
  }

  const { data, error } = await query

  if (error) {
    console.error(`Erreur récupération cartes ${prefix}:`, error.message)
    return []
  }

  return data || []
}

/**
 * Compter les cartes par bloc
 */
async function countCardsByBlock() {
  const counts = {}

  for (const prefix of PRIORITY_PREFIXES) {
    let query = supabase
      .from('discovered_cards')
      .select('id')
      .is('cardmarket_url', null)
      .limit(10000)

    if (prefix === 'sv') {
      query = query.like('set_id', 'sv%').not('set_id', 'like', 'svp%')
    } else {
      query = query.like('set_id', `${prefix}%`)
    }

    const { data } = await query
    counts[prefix] = data ? data.length : 0
  }

  // Autres cartes
  const { data: allWithoutUrl } = await supabase
    .from('discovered_cards')
    .select('id')
    .is('cardmarket_url', null)
    .limit(20000)

  const priorityTotal = Object.values(counts).reduce((a, b) => a + b, 0)
  counts['autres'] = (allWithoutUrl ? allWithoutUrl.length : 0) - priorityTotal

  return counts
}

/**
 * Fonction principale
 */
async function main() {
  console.log('=== Correction des URLs CardMarket ===')
  console.log(`Quota: ${MAX_REQUESTS} requetes`)
  console.log('Priorite: Scarlet & Violet > Mega Evolution > Sword & Shield > autres\n')

  // Compter les cartes par bloc
  console.log('Comptage des cartes par bloc...')
  const counts = await countCardsByBlock()
  console.log('\nCartes sans URL par bloc:')
  console.log(`  - Scarlet & Violet (sv): ${counts['sv']}`)
  console.log(`  - SV Promos (svp): ${counts['svp']}`)
  console.log(`  - Mega Evolution (me1/me2/mep): ${counts['me1'] + counts['me2'] + counts['mep']}`)
  console.log(`  - Sword & Shield (swsh): ${counts['swsh']}`)
  console.log(`  - Autres: ${counts['autres']}`)
  console.log('')

  // Traiter par priorité
  for (const prefix of PRIORITY_PREFIXES) {
    if (requestCount >= MAX_REQUESTS) break

    console.log(`\n>>> Traitement bloc: ${prefix.toUpperCase()} <<<`)

    let lastId = ''
    let blockProcessed = 0

    while (requestCount < MAX_REQUESTS) {
      const cards = await getCardsByPriority(prefix, lastId)

      if (!cards || cards.length === 0) {
        console.log(`\n✅ Bloc ${prefix} termine (${blockProcessed} cartes)`)
        break
      }

      for (const card of cards) {
        if (requestCount >= MAX_REQUESTS) {
          console.log('\n\n⚠️ Quota atteint!')
          break
        }

        const result = await processCard(card)
        blockProcessed++
        lastId = card.id

        showProgress(blockProcessed, counts[prefix], card.name, card.set_id, result.status, result.match || result.reason)

        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
      }
    }
  }

  // Si quota restant, traiter les autres cartes
  if (requestCount < MAX_REQUESTS) {
    console.log('\n\n>>> Traitement des autres cartes <<<')

    let lastId = ''

    while (requestCount < MAX_REQUESTS) {
      const { data: cards, error } = await supabase
        .from('discovered_cards')
        .select('id, name, number, set_id')
        .is('cardmarket_url', null)
        .order('id', { ascending: true })
        .gt('id', lastId)
        .limit(BATCH_SIZE)

      if (error || !cards || cards.length === 0) {
        console.log('\n✅ Toutes les cartes ont ete traitees!')
        break
      }

      for (const card of cards) {
        if (requestCount >= MAX_REQUESTS) {
          console.log('\n\n⚠️ Quota atteint!')
          break
        }

        const result = await processCard(card)
        lastId = card.id

        showProgress(0, 0, card.name, card.set_id, result.status, result.match || result.reason)

        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
      }
    }
  }

  // Résumé
  console.log('\n\n=== RESUME ===')
  console.log(`Requetes: ${requestCount}/${MAX_REQUESTS}`)
  console.log(`Mises a jour: ${updated}`)
  console.log(`Ignorees: ${skipped}`)
  console.log(`Erreurs: ${errors}`)

  const { data: remaining } = await supabase
    .from('discovered_cards')
    .select('id')
    .is('cardmarket_url', null)
    .limit(20000)

  console.log(`\nRestant: ${remaining ? remaining.length : '?'} cartes sans URL`)
}

main().catch(console.error)
