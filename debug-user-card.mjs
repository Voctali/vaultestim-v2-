import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Récupérer la carte Amoonguss de l'utilisateur
// (remplacer par votre user_id réel si nécessaire)
const { data: cards, error } = await supabase
  .from('discovered_cards')
  .select('*')
  .ilike('name', '%amoonguss%')
  .limit(5)

if (error) {
  console.error('❌ Erreur:', error)
  process.exit(1)
}

console.log(`\n📊 Cartes Amoonguss trouvées dans votre collection: ${cards.length}\n`)

cards.forEach((card, index) => {
  console.log(`\n=== Carte ${index + 1} ===`)
  console.log(`ID: ${card.card_id}`)
  console.log(`Nom: ${card.name}`)
  console.log(`Numéro: ${card.number}`)
  console.log(`Extension: ${card.set?.name || 'N/A'}`)

  // Vérifier si les attaques existent
  if (card.attacks && Array.isArray(card.attacks)) {
    console.log(`✅ Attaques trouvées (${card.attacks.length}):`)
    card.attacks.forEach(attack => {
      console.log(`  - ${attack.name || attack}`)
    })
  } else {
    console.log(`❌ Pas d'attaques stockées dans la carte`)
  }

  // Afficher toutes les clés pour debug
  console.log(`\nClés disponibles: ${Object.keys(card).join(', ')}`)
})

console.log('\n')
