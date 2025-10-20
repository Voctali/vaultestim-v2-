/**
 * Script de migration pour récupérer les attaques de toutes les cartes
 *
 * Usage:
 *   node migrate-attacks.mjs
 *
 * Prérequis:
 *   - Compte Supabase configuré
 *   - Variables d'environnement VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: Variables d\'environnement manquantes')
  console.error('   Vérifiez que VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont dans .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Récupérer les données d'une carte depuis l'API Pokemon TCG
 */
async function fetchCardFromAPI(cardId) {
  try {
    const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, {
      headers: {
        'X-Api-Key': process.env.VITE_POKEMON_TCG_API_KEY || ''
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null // Carte non trouvée
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error(`❌ Erreur fetch API pour ${cardId}:`, error.message)
    return null
  }
}

/**
 * Fonction principale de migration
 */
async function main() {
  console.log('\n🚀 Début migration des attaques...\n')
  const startTime = Date.now()

  try {
    // 1. Récupérer toutes les cartes
    console.log('📥 Récupération des cartes depuis Supabase...')

    const { data: allCards, error: fetchError } = await supabase
      .from('discovered_cards')
      .select('id, user_id, name, number, set, attacks')

    if (fetchError) {
      throw fetchError
    }

    console.log(`✅ ${allCards.length} cartes récupérées\n`)

    // 2. Filtrer les cartes sans attaques
    const cardsWithoutAttacks = allCards.filter(card => !card.attacks || (Array.isArray(card.attacks) && card.attacks.length === 0))

    console.log(`📊 Statistiques:`)
    console.log(`   Total cartes: ${allCards.length}`)
    console.log(`   Cartes avec attaques: ${allCards.length - cardsWithoutAttacks.length}`)
    console.log(`   Cartes sans attaques: ${cardsWithoutAttacks.length}`)
    console.log(`\n🔄 Migration de ${cardsWithoutAttacks.length} cartes...\n`)

    let successCount = 0
    let errorCount = 0
    let notFoundCount = 0

    // 3. Traiter les cartes par batches de 5 (rate limiting API)
    const batchSize = 5
    const delayBetweenBatches = 2000 // 2 secondes entre les batches

    for (let i = 0; i < cardsWithoutAttacks.length; i += batchSize) {
      const batch = cardsWithoutAttacks.slice(i, i + batchSize)

      // Traiter le batch en parallèle
      const batchPromises = batch.map(async (card) => {
        try {
          // Récupérer les données depuis l'API
          const apiCard = await fetchCardFromAPI(card.id)

          if (!apiCard) {
            notFoundCount++
            console.log(`⚠️  Carte non trouvée dans l'API: ${card.name} (${card.id})`)
            return { success: false, reason: 'not_found' }
          }

          // Extraire les champs manquants
          const updates = {}

          if (apiCard.attacks && apiCard.attacks.length > 0) {
            updates.attacks = apiCard.attacks
          }

          if (apiCard.abilities && apiCard.abilities.length > 0) {
            updates.abilities = apiCard.abilities
          }

          if (apiCard.weaknesses) {
            updates.weaknesses = apiCard.weaknesses
          }

          if (apiCard.resistances) {
            updates.resistances = apiCard.resistances
          }

          if (apiCard.retreatCost) {
            updates.retreat_cost = apiCard.retreatCost
          }

          // Mettre à jour dans Supabase si on a des données
          if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
              .from('discovered_cards')
              .update(updates)
              .eq('id', card.id)

            if (updateError) {
              throw updateError
            }

            successCount++
            console.log(`✅ ${card.name} #${card.number} - ${updates.attacks?.length || 0} attaques`)
            return { success: true }
          } else {
            console.log(`⏭️  ${card.name} #${card.number} - Aucune donnée à ajouter`)
            return { success: false, reason: 'no_data' }
          }

        } catch (error) {
          errorCount++
          console.error(`❌ Erreur ${card.name} #${card.number}:`, error.message)
          return { success: false, reason: 'error', error }
        }
      })

      // Attendre que le batch soit terminé
      await Promise.all(batchPromises)

      // Progression
      const processed = Math.min(i + batchSize, cardsWithoutAttacks.length)
      const percent = Math.round((processed / cardsWithoutAttacks.length) * 100)
      console.log(`\n📊 Progression: ${processed}/${cardsWithoutAttacks.length} (${percent}%)\n`)

      // Pause entre les batches (sauf pour le dernier)
      if (i + batchSize < cardsWithoutAttacks.length) {
        console.log(`⏸️  Pause ${delayBetweenBatches / 1000}s (rate limiting)...`)
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    // 4. Rapport final
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('\n' + '='.repeat(60))
    console.log('📊 RAPPORT FINAL')
    console.log('='.repeat(60))
    console.log(`✅ Mises à jour réussies: ${successCount}`)
    console.log(`❌ Erreurs: ${errorCount}`)
    console.log(`⚠️  Cartes non trouvées: ${notFoundCount}`)
    console.log(`⏭️  Ignorées: ${cardsWithoutAttacks.length - successCount - errorCount - notFoundCount}`)
    console.log(`⏱️  Temps total: ${duration}s`)
    console.log('='.repeat(60))

    console.log('\n🎉 Migration terminée!\n')

  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Lancer la migration
main()
