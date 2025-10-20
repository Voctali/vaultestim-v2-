import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Récupérer UNE carte pour voir la structure
const { data, error } = await supabase
  .from('discovered_cards')
  .select('*')
  .limit(1)

if (error) {
  console.error('❌ Erreur:', error)
  process.exit(1)
}

if (data.length === 0) {
  console.log('❌ Aucune carte trouvée')
  process.exit(1)
}

console.log('\n📋 Structure de la table discovered_cards:\n')
console.log('Colonnes disponibles:')
Object.keys(data[0]).forEach(key => {
  console.log(`  - ${key}`)
})

console.log('\n📊 Exemple de carte:')
console.log(JSON.stringify(data[0], null, 2))
