const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
  const prefixes = ['rsv10pt5', 'zsv10pt5', 'sv8', 'sv9', 'sv3pt5', 'sv1', 'svp']

  console.log('État des URLs CardMarket par extension:\n')

  for (const prefix of prefixes) {
    const { data } = await supabase
      .from('discovered_cards')
      .select('id, cardmarket_url')
      .like('id', prefix + '%')
      .limit(200)

    if (!data) continue

    const withTcggo = data.filter(c => c.cardmarket_url && c.cardmarket_url.includes('tcggo.com')).length
    const withCardmarketId = data.filter(c => c.cardmarket_url && /\/Singles\/[^\/]+\/\d+\?/.test(c.cardmarket_url)).length
    const withSlug = data.filter(c => c.cardmarket_url && /\/Singles\/[^\/]+\/[A-Za-z]/.test(c.cardmarket_url) && !/\/Singles\/[^\/]+\/\d+\?/.test(c.cardmarket_url)).length
    const noUrl = data.filter(c => !c.cardmarket_url).length

    console.log(prefix.toUpperCase().padEnd(12), '| Total:', data.length.toString().padStart(3))
    console.log('               tcggo:', withTcggo.toString().padStart(3), '| ID numérique:', withCardmarketId.toString().padStart(3), '| Slug:', withSlug.toString().padStart(3), '| Sans URL:', noUrl.toString().padStart(3))

    const example = data.find(c => c.cardmarket_url)
    if (example) {
      console.log('               Ex:', example.cardmarket_url.substring(0, 85) + (example.cardmarket_url.length > 85 ? '...' : ''))
    }
    console.log()
  }
}

check().catch(console.error)
