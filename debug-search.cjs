/**
 * Debug: voir ce qui se passe avec les cartes Base Set
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://ubphwlmnfjdaiarbihcx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicGh3bG1uZmpkYWlhcmJpaGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAwMDIsImV4cCI6MjA3NTUxNjAwMn0.7d0303MNw__AVC9wkS7BodK2WG8Rvb2IY2V-0wv0l7Q'
)

const RAPIDAPI_KEY = '523ca9be5emsh10d5931a9d95b87p18cd5cjsn641503bb34b6'
const RAPIDAPI_HOST = 'cardmarket-api-tcg.p.rapidapi.com'
const BASE_URL = 'https://cardmarket-api-tcg.p.rapidapi.com'

async function searchCard(searchTerm) {
  const params = new URLSearchParams({
    search: searchTerm,
    limit: '5'
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

async function main() {
  // Récupérer les premières cartes (celles de Base Set)
  const { data: cards } = await supabase
    .from('discovered_cards')
    .select('id, name, number, set_id')
    .is('cardmarket_url', null)
    .order('id', { ascending: true })
    .limit(10)

  console.log('=== Debug recherche cartes Base Set ===\n')

  for (const card of cards) {
    console.log(`\n--- Carte: ${card.name} #${card.number || 'AUCUN'} (set: ${card.set_id}) ---`)
    console.log(`ID dans DB: ${card.id}`)

    // Recherche avec numéro
    const searchTermWithNum = `${card.name} ${card.number || ''}`.trim()
    console.log(`Recherche: "${searchTermWithNum}"`)

    try {
      const result = await searchCard(searchTermWithNum)
      console.log(`Resultats: ${result.data?.length || 0}`)

      if (result.data && result.data.length > 0) {
        const first = result.data[0]
        console.log(`  Premier: ${first.name} #${first.card_number} (${first.episode?.name})`)
        console.log(`  Links: ${JSON.stringify(first.links)}`)
      } else {
        // Essayer sans le numéro si pas de résultat
        console.log('  Aucun resultat, essai avec nom seul...')
        const result2 = await searchCard(card.name)
        console.log(`  Resultats avec nom seul: ${result2.data?.length || 0}`)
        if (result2.data && result2.data.length > 0) {
          const first = result2.data[0]
          console.log(`    Premier: ${first.name} #${first.card_number} (${first.episode?.name})`)
          console.log(`    Links: ${JSON.stringify(first.links)}`)
        }
      }
    } catch (error) {
      console.log(`  Erreur: ${error.message}`)
    }

    // Pause
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

main().catch(console.error)
