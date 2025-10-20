/**
 * Script pour vérifier le nombre réel de cartes dans discovered_cards
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkCardsCount() {
  console.log('🔍 Vérification du nombre de cartes dans discovered_cards...\n')

  try {
    // 1. Compter le total de cartes
    const { count: totalCount, error: totalError } = await supabase
      .from('discovered_cards')
      .select('*', { count: 'exact', head: true })

    if (totalError) throw totalError

    console.log(`📊 Total de cartes: ${totalCount}`)

    // 2. Compter les cartes avec attaques
    const { count: withAttacks, error: withError } = await supabase
      .from('discovered_cards')
      .select('*', { count: 'exact', head: true })
      .not('attacks', 'is', null)
      .neq('attacks', '[]')

    if (withError) throw withError

    console.log(`✅ Cartes avec attaques: ${withAttacks}`)

    // 3. Compter les cartes sans attaques
    const withoutAttacks = totalCount - withAttacks

    console.log(`❌ Cartes sans attaques: ${withoutAttacks}`)

    // 4. Pourcentage
    const percent = ((withAttacks / totalCount) * 100).toFixed(1)
    console.log(`📈 Pourcentage avec attaques: ${percent}%`)

    // 5. Vérifier le nombre d'utilisateurs distincts
    const { data: users, error: usersError } = await supabase
      .from('discovered_cards')
      .select('user_id')

    if (usersError) throw usersError

    const uniqueUsers = new Set(users.map(u => u.user_id))
    console.log(`\n👥 Nombre d'utilisateurs: ${uniqueUsers.size}`)

    // 6. Afficher par utilisateur
    console.log('\n📊 Répartition par utilisateur:')
    for (const userId of uniqueUsers) {
      const { count: userCount, error: userError } = await supabase
        .from('discovered_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (userError) {
        console.error(`❌ Erreur pour utilisateur ${userId}:`, userError)
        continue
      }

      console.log(`  - Utilisateur ${userId}: ${userCount} cartes`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Vérification terminée')

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

checkCardsCount()
