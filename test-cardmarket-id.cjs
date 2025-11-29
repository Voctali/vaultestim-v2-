/**
 * Test pour trouver le format correct des URLs CardMarket
 */

const RAPIDAPI_KEY = '523ca9be5emsh10d5931a9d95b87p18cd5cjsn641503bb34b6'
const RAPIDAPI_HOST = 'cardmarket-api-tcg.p.rapidapi.com'
const BASE_URL = 'https://cardmarket-api-tcg.p.rapidapi.com'

async function searchCards(query, limit = 20) {
  const params = new URLSearchParams({
    search: query,
    limit: limit.toString()
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
  console.log('=== Recherche de cartes avec cardmarket_id ===\n')

  // Chercher des cartes populaires
  const result = await searchCards('Charizard', 50)

  let withId = 0
  let withoutId = 0

  console.log('Cartes avec cardmarket_id:')
  result.data.forEach(card => {
    if (card.cardmarket_id) {
      withId++
      console.log(`  - ${card.name} (${card.episode?.name}): ID=${card.cardmarket_id}`)
      // Construire l'URL directe
      const directUrl = `https://www.cardmarket.com/en/Pokemon/Products/Singles/${card.episode?.code || 'unknown'}/${card.cardmarket_id}`
      console.log(`    URL: ${directUrl}`)
    } else {
      withoutId++
    }
  })

  console.log(`\n=== Résumé ===`)
  console.log(`Avec cardmarket_id: ${withId}`)
  console.log(`Sans cardmarket_id: ${withoutId}`)

  // Test avec Pikachu
  console.log('\n=== Recherche Pikachu ===')
  const pikachuResult = await searchCards('Pikachu', 20)
  let pikachuWithId = 0

  pikachuResult.data.forEach(card => {
    if (card.cardmarket_id) {
      pikachuWithId++
      console.log(`  - ${card.name} #${card.card_number} (${card.episode?.name}): ID=${card.cardmarket_id}`)
    }
  })
  console.log(`Pikachu avec ID: ${pikachuWithId}/${pikachuResult.data.length}`)
}

main().catch(console.error)
