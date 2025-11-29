// Script rapide pour checker les extensions GG/TG dans Supabase
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ubphwlmnfjdaiarbihcx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicGh3bG1uZmpkYWlhcmJpaGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NDAwMDIsImV4cCI6MjA3NTUxNjAwMn0.7d0303MNw__AVC9wkS7BodK2WG8Rvb2IY2V-0wv0l7Q'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function checkGGExtensions() {
  console.log('🔍 Recherche des extensions GG/TG dans Supabase...\n')

  // Charger TOUTES les cartes avec pagination
  let allCards = []
  let from = 0
  const pageSize = 1000

  while (true) {
    console.log(`   Chargement batch ${Math.floor(from / pageSize) + 1} (${from} à ${from + pageSize})...`)

    const { data: cards, error } = await supabase
      .from('discovered_cards')
      .select('id, name, number, set')
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('❌ Erreur:', error.message)
      return
    }

    if (!cards || cards.length === 0) break

    allCards = allCards.concat(cards)
    console.log(`   → ${cards.length} cartes reçues (total: ${allCards.length})`)

    if (cards.length < pageSize) break
    from += pageSize
  }

  const cards = allCards
  console.log(`\n✅ ${cards.length} cartes chargées AU TOTAL\n`)

  // Grouper par extension
  const extensionGroups = {}
  cards.forEach(card => {
    const setId = card.set?.id || 'unknown'
    if (!extensionGroups[setId]) {
      extensionGroups[setId] = {
        id: setId,
        name: card.set?.name || 'Inconnu',
        series: card.set?.series || 'Inconnu',
        cards: []
      }
    }
    extensionGroups[setId].cards.push(card)
  })

  // Trouver toutes les extensions GG et TG
  const galleryExtensions = Object.keys(extensionGroups)
    .filter(id => id.endsWith('gg') || id.endsWith('tg'))
    .sort()

  console.log(`📊 Extensions Gallery trouvées: ${galleryExtensions.length}\n`)

  galleryExtensions.forEach(galleryId => {
    const gallery = extensionGroups[galleryId]

    // Tester différentes stratégies de parent
    const strategies = [
      { name: 'Enlever gg/tg (2 chars)', parentId: galleryId.slice(0, -2) },
      { name: 'Enlever pt5gg (5 chars)', parentId: galleryId.endsWith('pt5gg') ? galleryId.slice(0, -5) : null },
      { name: 'Enlever pt5tg (5 chars)', parentId: galleryId.endsWith('pt5tg') ? galleryId.slice(0, -5) : null }
    ]

    console.log(`\n🎴 ${galleryId} (${gallery.cards.length} cartes)`)
    console.log(`   Nom: ${gallery.name}`)
    console.log(`   Série: ${gallery.series}`)

    strategies.forEach(strategy => {
      if (!strategy.parentId) return

      const parentExists = extensionGroups[strategy.parentId] !== undefined
      const status = parentExists ? '✅' : '❌'
      const info = parentExists
        ? `${extensionGroups[strategy.parentId].name} (${extensionGroups[strategy.parentId].cards.length} cartes)`
        : 'NON TROUVÉ'

      console.log(`   ${status} ${strategy.name} → ${strategy.parentId} : ${info}`)
    })
  })

  // Liste toutes les extensions Sword & Shield
  const swshExtensions = Object.keys(extensionGroups)
    .filter(id => id.startsWith('swsh'))
    .sort()

  console.log(`\n\n📋 Toutes les extensions Sword & Shield (${swshExtensions.length}):`)
  swshExtensions.forEach(id => {
    const ext = extensionGroups[id]
    console.log(`   ${id.padEnd(20)} → ${ext.name.padEnd(40)} (${ext.cards.length} cartes)`)
  })
}

checkGGExtensions().catch(console.error)
