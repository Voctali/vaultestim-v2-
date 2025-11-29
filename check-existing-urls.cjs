const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://ubphwlmnfjdaiarbihcx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicGh3bG1uZmpkYWlhcmJpaGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAwMDIsImV4cCI6MjA3NTUxNjAwMn0.7d0303MNw__AVC9wkS7BodK2WG8Rvb2IY2V-0wv0l7Q'
)

async function checkUrls() {
  // Récupérer différents types d'URLs
  const { data: withUrl } = await supabase
    .from('discovered_cards')
    .select('id, name, cardmarket_url')
    .not('cardmarket_url', 'is', null)
    .limit(20)

  console.log('=== Cartes avec URL existante ===\n')

  const types = {
    cardmarket: [],
    tcggo: [],
    other: []
  }

  withUrl.forEach(card => {
    const url = card.cardmarket_url
    if (url.includes('cardmarket.com')) {
      types.cardmarket.push(card)
    } else if (url.includes('tcggo.com')) {
      types.tcggo.push(card)
    } else {
      types.other.push(card)
    }
  })

  console.log(`URLs cardmarket.com: ${types.cardmarket.length}`)
  types.cardmarket.slice(0, 5).forEach(c => {
    console.log(`  - ${c.name}: ${c.cardmarket_url}`)
  })

  console.log(`\nURLs tcggo.com: ${types.tcggo.length}`)
  types.tcggo.slice(0, 5).forEach(c => {
    console.log(`  - ${c.name}: ${c.cardmarket_url}`)
  })

  console.log(`\nAutres URLs: ${types.other.length}`)
  types.other.slice(0, 5).forEach(c => {
    console.log(`  - ${c.name}: ${c.cardmarket_url}`)
  })
}

checkUrls().catch(console.error)
