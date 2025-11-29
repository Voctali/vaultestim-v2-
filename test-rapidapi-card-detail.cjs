/**
 * Test de l'endpoint /pokemon/cards/{id} pour voir si les liens sont différents
 */

const RAPIDAPI_KEY = '523ca9be5emsh10d5931a9d95b87p18cd5cjsn641503bb34b6'
const RAPIDAPI_HOST = 'cardmarket-api-tcg.p.rapidapi.com'
const BASE_URL = 'https://cardmarket-api-tcg.p.rapidapi.com'

async function getCardById(id) {
  console.log(`\n=== Carte ID: ${id} ===`)

  const response = await fetch(`${BASE_URL}/pokemon/cards/${id}`, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  })

  if (!response.ok) {
    console.log('Erreur HTTP:', response.status)
    const text = await response.text()
    console.log('Response:', text.substring(0, 500))
    return
  }

  const data = await response.json()
  console.log('Carte:', data.name || data.data?.name)
  console.log('Links:', JSON.stringify(data.links || data.data?.links, null, 2))
  console.log('tcggo_url:', data.tcggo_url || data.data?.tcggo_url)

  // Afficher toute la réponse pour voir la structure
  console.log('\nStructure complète:')
  console.log(JSON.stringify(data, null, 2).substring(0, 2000))
}

async function main() {
  // Test avec l'ID d'un Charizard
  await getCardById(2062) // Charizard ex sv4pt5-54
  await getCardById(2513) // Charizard ex 151
}

main().catch(console.error)
