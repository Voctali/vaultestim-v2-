/**
 * Analyser quelles cartes ont des liens CardMarket dans RapidAPI
 */

const RAPIDAPI_KEY = '523ca9be5emsh10d5931a9d95b87p18cd5cjsn641503bb34b6'
const RAPIDAPI_HOST = 'cardmarket-api-tcg.p.rapidapi.com'
const BASE_URL = 'https://cardmarket-api-tcg.p.rapidapi.com'

async function searchCards(query, limit = 50) {
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

  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function main() {
  console.log('=== Analyse liens CardMarket - recherches précises ===\n')

  const tests = [
    { name: 'Charizard exact', query: 'Charizard' },
    { name: 'Pikachu exact', query: 'Pikachu' },
    { name: 'Arceus exact', query: 'Arceus' },
    { name: 'Arcanine exact', query: 'Arcanine' },
  ]

  for (const test of tests) {
    console.log(`\n=== ${test.name}: "${test.query}" ===`)
    const result = await searchCards(test.query, 50)

    let withCM = 0
    let withoutCM = 0
    const withCMExamples = []
    const withoutCMExamples = []

    if (result.data) {
      result.data.forEach(card => {
        if (card.links?.cardmarket) {
          withCM++
          if (withCMExamples.length < 3) {
            withCMExamples.push(`${card.name} (${card.episode?.name})`)
          }
        } else {
          withoutCM++
          if (withoutCMExamples.length < 3) {
            withoutCMExamples.push(`${card.name} (${card.episode?.name})`)
          }
        }
      })
      console.log(`  Avec CardMarket: ${withCM}/${result.data.length} (${Math.round(withCM/result.data.length*100)}%)`)

      if (withCMExamples.length) {
        console.log(`  Exemples avec:`, withCMExamples.join(', '))
      }
      if (withoutCMExamples.length) {
        console.log(`  Exemples sans:`, withoutCMExamples.join(', '))
      }
    }

    await new Promise(r => setTimeout(r, 300))
  }
}

main().catch(console.error)
