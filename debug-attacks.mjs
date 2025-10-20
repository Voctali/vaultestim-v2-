import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Récupérer la carte Amoonguss #11 de Black Bolt
const { data: cards, error } = await supabase
  .from('discovered_cards')
  .select('*')
  .eq('name', 'Amoonguss')
  .eq('number', '11')
  .limit(1)

if (error) {
  console.error('❌ Erreur:', error)
  process.exit(1)
}

if (cards.length === 0) {
  console.log('❌ Aucune carte Amoonguss #11 trouvée')
  process.exit(1)
}

const card = cards[0]

console.log('\n=== Amoonguss #11 ===')
console.log(`Nom: ${card.name}`)
console.log(`Numéro: ${card.number}`)
console.log(`Extension: ${card.set?.name || 'N/A'}`)
console.log(`\nValeur de card.attacks:`)
console.log(JSON.stringify(card.attacks, null, 2))
console.log(`\nType: ${typeof card.attacks}`)
console.log(`Est un tableau: ${Array.isArray(card.attacks)}`)
console.log(`Longueur: ${card.attacks?.length || 0}`)

console.log('\n')
