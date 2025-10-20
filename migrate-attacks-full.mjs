/**
 * Script de migration COMPLET pour récupérer les attaques de TOUTES les cartes
 *
 * Améliorations par rapport à migrate-attacks.mjs :
 * - Pagination pour récupérer TOUTES les cartes (pas de limite 1000)
 * - Sauvegarde de progression pour reprendre en cas d'interruption
 * - Logs détaillés avec statistiques en temps réel
 *
 * Usage:
 *   node migrate-attacks-full.mjs
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

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

// Fichier de sauvegarde de progression
const PROGRESS_FILE = 'migrate-attacks-progress.json'

/**
 * Charger la progression sauvegardée
 */
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.warn('⚠️ Impossible de charger la progression:', error.message)
  }
  return { processedIds: [], successCount: 0, errorCount: 0, notFoundCount: 0 }
}

/**
 * Sauvegarder la progression
 */
function saveProgress(progress) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
  } catch (error) {
    console.warn('⚠️ Impossible de sauvegarder la progression:', error.message)
  }
}

/**
 * Récupérer TOUTES les cartes depuis Supabase avec pagination
 */
async function fetchAllCards() {
  console.log('📥 Récupération de TOUTES les cartes depuis Supabase...')

  let allCards = []
  let page = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('discovered_cards')
      .select('id, user_id, name, number, set, attacks')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      throw error
    }

    if (data && data.length > 0) {
      allCards = allCards.concat(data)
      console.log(`  📦 Page ${page + 1}: ${data.length} cartes (total: ${allCards.length})`)
      page++
      hasMore = data.length === pageSize
    } else {
      hasMore = false
    }
  }

  console.log(`✅ ${allCards.length} cartes récupérées au total\n`)
  return allCards
}

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
  console.log('\n🚀 Début migration COMPLÈTE des attaques...\n')
  console.log('⚠️  Ce script va traiter TOUTES les cartes (peut prendre plusieurs heures)\n')

  const startTime = Date.now()

  try {
    // 1. Charger la progression précédente
    const progress = loadProgress()
    console.log(`📂 Progression chargée: ${progress.processedIds.length} cartes déjà traitées`)

    // 2. Récupérer TOUTES les cartes
    const allCards = await fetchAllCards()

    // 3. Filtrer les cartes sans attaques ET non déjà traitées
    const cardsWithoutAttacks = allCards.filter(card =>
      (!card.attacks || (Array.isArray(card.attacks) && card.attacks.length === 0)) &&
      !progress.processedIds.includes(card.id)
    )

    console.log(`📊 Statistiques:`)
    console.log(`   Total cartes: ${allCards.length}`)
    console.log(`   Cartes avec attaques: ${allCards.length - allCards.filter(c => !c.attacks || c.attacks.length === 0).length}`)
    console.log(`   Cartes sans attaques: ${allCards.filter(c => !c.attacks || c.attacks.length === 0).length}`)
    console.log(`   Déjà traitées: ${progress.processedIds.length}`)
    console.log(`   Restantes à traiter: ${cardsWithoutAttacks.length}`)

    // Estimation du temps
    const batchSize = 5
    const delayBetweenBatches = 2000
    const estimatedBatches = Math.ceil(cardsWithoutAttacks.length / batchSize)
    const estimatedSeconds = (estimatedBatches * delayBetweenBatches) / 1000
    const estimatedMinutes = Math.round(estimatedSeconds / 60)

    console.log(`\n⏱️  Temps estimé: ~${estimatedMinutes} minutes (${estimatedBatches} batches de ${batchSize} cartes)\n`)

    console.log(`🔄 Début migration de ${cardsWithoutAttacks.length} cartes...\n`)

    let successCount = progress.successCount
    let errorCount = progress.errorCount
    let notFoundCount = progress.notFoundCount

    // 4. Traiter les cartes par batches
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
            progress.processedIds.push(card.id)
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
            progress.processedIds.push(card.id)
            progress.successCount = successCount
            return { success: true }
          } else {
            console.log(`⏭️  ${card.name} #${card.number} - Aucune donnée à ajouter`)
            progress.processedIds.push(card.id)
            return { success: false, reason: 'no_data' }
          }

        } catch (error) {
          errorCount++
          progress.errorCount = errorCount
          console.error(`❌ Erreur ${card.name} #${card.number}:`, error.message)
          // Ne pas ajouter à processedIds en cas d'erreur pour pouvoir réessayer
          return { success: false, reason: 'error', error }
        }
      })

      // Attendre que le batch soit terminé
      await Promise.all(batchPromises)

      // Progression
      const processed = Math.min(i + batchSize, cardsWithoutAttacks.length)
      const percent = Math.round((processed / cardsWithoutAttacks.length) * 100)
      const totalProcessed = progress.processedIds.length
      const totalPercent = Math.round((totalProcessed / allCards.filter(c => !c.attacks || c.attacks.length === 0).length) * 100)

      console.log(`\n📊 Progression: ${processed}/${cardsWithoutAttacks.length} (${percent}%)`)
      console.log(`📈 Total global: ${totalProcessed} cartes traitées (${totalPercent}% de toutes les cartes sans attaques)`)
      console.log(`✅ Succès: ${successCount} | ❌ Erreurs: ${errorCount} | ⚠️  Non trouvées: ${notFoundCount}\n`)

      // Sauvegarder la progression tous les 10 batches
      if ((i / batchSize) % 10 === 0) {
        saveProgress(progress)
        console.log(`💾 Progression sauvegardée (${totalProcessed} cartes)\n`)
      }

      // Pause entre les batches (sauf pour le dernier)
      if (i + batchSize < cardsWithoutAttacks.length) {
        console.log(`⏸️  Pause ${delayBetweenBatches / 1000}s (rate limiting)...`)
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    // Sauvegarder la progression finale
    saveProgress(progress)

    // 5. Rapport final
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1)

    console.log('\n' + '='.repeat(60))
    console.log('📊 RAPPORT FINAL')
    console.log('='.repeat(60))
    console.log(`✅ Mises à jour réussies: ${successCount}`)
    console.log(`❌ Erreurs: ${errorCount}`)
    console.log(`⚠️  Cartes non trouvées: ${notFoundCount}`)
    console.log(`⏭️  Ignorées (sans données): ${cardsWithoutAttacks.length - successCount - errorCount - notFoundCount}`)
    console.log(`⏱️  Temps total: ${duration} minutes`)
    console.log('='.repeat(60))

    console.log('\n🎉 Migration terminée!')
    console.log(`💾 Fichier de progression: ${PROGRESS_FILE}`)
    console.log('   Vous pouvez le supprimer si vous voulez recommencer depuis zéro\n')

  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error.message)
    console.error(error.stack)

    // Sauvegarder la progression avant de quitter
    saveProgress(progress)
    console.log('\n💾 Progression sauvegardée. Vous pouvez relancer le script pour reprendre.')

    process.exit(1)
  }
}

// Lancer la migration
main()
