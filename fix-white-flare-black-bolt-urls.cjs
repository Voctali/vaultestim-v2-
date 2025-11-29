/**
 * Script pour ajouter les URLs CardMarket pour White Flare et Black Bolt
 * Sans utiliser RapidAPI - URLs construites manuellement
 *
 * Format CardMarket pour EV 10.5:
 * - White Flare: https://www.cardmarket.com/fr/Pokemon/Products/Singles/White-Flare/{Card-Name}-V1-WHF{number}?language=2
 * - Black Bolt: https://www.cardmarket.com/fr/Pokemon/Products/Singles/Black-Bolt/{Card-Name}-V1-BKB{number}?language=2
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Configuration des extensions
const EXTENSIONS = {
  'rsv10pt5': {
    name: 'White-Flare',
    code: 'WHF'
  },
  'zsv10pt5': {
    name: 'Black-Bolt',
    code: 'BKB'
  }
}

/**
 * Construire l'URL CardMarket pour une carte
 */
function buildCardMarketUrl(card, extensionConfig) {
  if (!card.name || !card.number) return null

  // Slugifier le nom (espaces → tirets, garder la casse)
  const cardSlug = card.name
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')

  // Numéro paddé à 3 chiffres
  const paddedNumber = card.number.toString().padStart(3, '0')

  return `https://www.cardmarket.com/fr/Pokemon/Products/Singles/${extensionConfig.name}/${cardSlug}-V1-${extensionConfig.code}${paddedNumber}?language=2`
}

async function main() {
  console.log('=== Ajout URLs CardMarket pour White Flare & Black Bolt ===\n')

  let totalUpdated = 0
  let totalSkipped = 0

  for (const [prefix, config] of Object.entries(EXTENSIONS)) {
    console.log(`\n--- ${config.name} (${prefix}) ---`)

    // Récupérer toutes les cartes sans URL
    const { data: cards, error } = await supabase
      .from('discovered_cards')
      .select('id, name, number, cardmarket_url')
      .like('id', `${prefix}%`)
      .is('cardmarket_url', null)

    if (error) {
      console.error('Erreur Supabase:', error)
      continue
    }

    console.log(`Cartes sans URL: ${cards.length}`)

    for (const card of cards) {
      const url = buildCardMarketUrl(card, config)

      if (!url) {
        console.log(`[SKIP] ${card.id}: Données manquantes (name=${card.name}, number=${card.number})`)
        totalSkipped++
        continue
      }

      const { error: updateError } = await supabase
        .from('discovered_cards')
        .update({ cardmarket_url: url })
        .eq('id', card.id)

      if (updateError) {
        console.log(`[ERROR] ${card.id}: ${updateError.message}`)
        totalSkipped++
      } else {
        console.log(`[OK] ${card.id}: ${url}`)
        totalUpdated++
      }
    }
  }

  console.log('\n=== Résumé ===')
  console.log(`URLs ajoutées: ${totalUpdated}`)
  console.log(`Ignorées/Erreurs: ${totalSkipped}`)
}

main().catch(console.error)
