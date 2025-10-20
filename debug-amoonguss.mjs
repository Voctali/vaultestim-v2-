import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Chercher toutes les cartes Amoonguss
const { data, error } = await supabase
  .from('cardmarket_singles')
  .select('id_product, name')
  .ilike('name', '%amoonguss%')
  .order('name')

if (error) {
  console.error('❌ Erreur:', error)
  process.exit(1)
}

console.log(`\n📊 Cartes Amoonguss trouvées: ${data.length}\n`)

// Chercher spécifiquement celle avec Dangerous Reaction et Seed Bomb
const withDangerous = data.filter(c =>
  c.name.toLowerCase().includes('dangerous') ||
  c.name.toLowerCase().includes('seed bomb') ||
  c.name.toLowerCase().includes('sporprise')
)

console.log('🎯 Cartes avec Dangerous Reaction, Seed Bomb ou Sporprise:')
if (withDangerous.length > 0) {
  withDangerous.forEach(c => {
    console.log(`  ${c.id_product}: ${c.name}`)
  })
} else {
  console.log('  Aucune trouvée')
}

console.log('\n📋 Toutes les cartes Amoonguss:')
data.forEach(c => {
  console.log(`  ${c.id_product}: ${c.name}`)
})

console.log('\n')
