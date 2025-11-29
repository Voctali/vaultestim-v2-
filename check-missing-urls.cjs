const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://ubphwlmnfjdaiarbihcx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicGh3bG1uZmpkYWlhcmJpaGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAwMDIsImV4cCI6MjA3NTUxNjAwMn0.7d0303MNw__AVC9wkS7BodK2WG8Rvb2IY2V-0wv0l7Q'
)

async function countAll(table, column, filter = null) {
  let total = 0
  let lastId = ''
  const batchSize = 1000

  while (true) {
    let query = supabase
      .from(table)
      .select(column)
      .order(column, { ascending: true })
      .gt(column, lastId)
      .limit(batchSize)

    if (filter === 'null') {
      query = query.is('cardmarket_url', null)
    } else if (filter === 'not_null') {
      query = query.not('cardmarket_url', 'is', null)
    }

    const { data, error } = await query

    if (error) {
      console.log('Erreur:', error.message)
      break
    }

    if (!data || data.length === 0) break

    total += data.length
    lastId = data[data.length - 1][column]

    if (data.length < batchSize) break
  }

  return total
}

async function checkMissingUrls() {
  console.log('=== Statistiques liens CardMarket (comptage complet) ===\n')

  // Cartes
  console.log('Comptage des cartes...')
  const totalCards = await countAll('discovered_cards', 'id')
  const cardsWithUrl = await countAll('discovered_cards', 'id', 'not_null')
  const cardsWithoutUrl = totalCards - cardsWithUrl

  console.log('Total cartes:', totalCards)
  console.log('Cartes avec URL:', cardsWithUrl)
  console.log('Cartes sans URL:', cardsWithoutUrl)

  // Quelques exemples de cartes avec URL correcte
  const { data: sampleWithUrl } = await supabase
    .from('discovered_cards')
    .select('id, name, cardmarket_url')
    .not('cardmarket_url', 'is', null)
    .like('cardmarket_url', '%cardmarket.com%')
    .limit(5)

  if (sampleWithUrl && sampleWithUrl.length > 0) {
    console.log('\nExemples de cartes avec URL CardMarket valide:')
    sampleWithUrl.forEach(c => {
      console.log('  -', c.name, ':', c.cardmarket_url.substring(0, 70) + '...')
    })
  }

  // Exemples de cartes avec URL incorrecte (tcggo.com)
  const { data: sampleBadUrl } = await supabase
    .from('discovered_cards')
    .select('id, name, cardmarket_url')
    .not('cardmarket_url', 'is', null)
    .like('cardmarket_url', '%tcggo.com%')
    .limit(5)

  if (sampleBadUrl && sampleBadUrl.length > 0) {
    console.log('\nExemples de cartes avec URL tcggo (a corriger):')
    sampleBadUrl.forEach(c => {
      console.log('  -', c.name, ':', c.cardmarket_url.substring(0, 70) + '...')
    })
  }

  // Catalogue produits
  console.log('\nComptage catalogue produits...')
  const catalogTotal = await countAll('cardmarket_nonsingles', 'id_product')
  const catalogWithUrl = await countAll('cardmarket_nonsingles', 'id_product', 'not_null')
  const catalogWithoutUrl = catalogTotal - catalogWithUrl

  console.log('Total catalogue:', catalogTotal)
  console.log('Avec URL:', catalogWithUrl)
  console.log('Sans URL:', catalogWithoutUrl)

  console.log('\n=== RESUME ===')
  console.log('Cartes a corriger:', cardsWithoutUrl)
  console.log('Produits catalogue a corriger:', catalogWithoutUrl)
  console.log('TOTAL:', cardsWithoutUrl + catalogWithoutUrl)
}

checkMissingUrls().catch(console.error)
