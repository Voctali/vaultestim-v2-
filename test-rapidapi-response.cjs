/**
 * Test de la réponse RapidAPI pour voir le format des liens
 */

const RAPIDAPI_KEY = '523ca9be5emsh10d5931a9d95b87p18cd5cjsn641503bb34b6'
const RAPIDAPI_HOST = 'cardmarket-api-tcg.p.rapidapi.com'
const BASE_URL = 'https://cardmarket-api-tcg.p.rapidapi.com'

async function testSearch(searchTerm) {
  console.log(`\n=== Recherche: "${searchTerm}" ===`)

  const params = new URLSearchParams({
    search: searchTerm,
    limit: '3'
  })

  const response = await fetch(`${BASE_URL}/pokemon/cards/search?${params}`, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  })

  if (!response.ok) {
    console.log('Erreur HTTP:', response.status)
    return
  }

  const data = await response.json()

  if (data.data && data.data.length > 0) {
    data.data.forEach((card, i) => {
      console.log(`\n--- Carte ${i + 1}: ${card.name} ---`)
      console.log('ID:', card.id)
      console.log('TCG ID:', card.tcgid)
      console.log('Episode:', card.episode?.name)
      console.log('Links:', JSON.stringify(card.links, null, 2))
      console.log('tcggo_url:', card.tcggo_url)
    })
  } else {
    console.log('Aucun résultat')
  }
}

async function main() {
  // Test avec différentes cartes
  await testSearch('Charizard')
  await testSearch('Pikachu sv1')
  await testSearch('Alakazam base')
}

main().catch(console.error)
