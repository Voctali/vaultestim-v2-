/**
 * Script de test pour vérifier le matching de Amoonguss #11
 * Objectif : Vérifier que le score est ~90% au lieu de 26%
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

/**
 * Extraire les attaques d'une carte
 */
function extractCardAttacks(card) {
  if (card.attacks && Array.isArray(card.attacks)) {
    return card.attacks.map(attack => attack.name || attack)
  }
  return []
}

/**
 * Extraire les attaques depuis le nom CardMarket
 */
function extractAttacksFromName(name) {
  const match = name.match(/\[([^\]]+)\]/)
  if (!match) return []

  return match[1]
    .split('|')
    .map(attack => attack.trim().toLowerCase())
}

/**
 * Calculer le score de matching entre attaques
 */
function calculateAttackMatchScore(cardAttacks, cardmarketAttacks) {
  if (!cardAttacks.length || !cardmarketAttacks.length) return 0

  const normalizedCard = cardAttacks.map(a => a.toLowerCase().trim())
  const normalizedCM = cardmarketAttacks.map(a => a.toLowerCase().trim())

  let matchCount = 0

  normalizedCard.forEach(attack => {
    if (normalizedCM.includes(attack)) {
      matchCount++
    }
  })

  return matchCount / Math.max(normalizedCard.length, normalizedCM.length)
}

/**
 * Calculer la similarité de nom
 */
function calculateNameSimilarity(name1, name2) {
  const n1 = name1.toLowerCase().trim()
  const n2 = name2.toLowerCase().trim()

  if (n1 === n2) return 1.0
  if (n2.includes(n1) || n1.includes(n2)) return 0.8

  // Caractères communs
  const chars1 = n1.split('')
  const chars2 = [...n2.split('')]
  let commonCount = 0

  chars1.forEach(char => {
    const index = chars2.indexOf(char)
    if (index !== -1) {
      commonCount++
      chars2.splice(index, 1)
    }
  })

  return commonCount / Math.max(n1.length, n2.length)
}

/**
 * Vérifier si deux noms ont les mêmes suffixes
 */
function hasSameSuffixes(name1, name2) {
  const suffixes = ['VMAX', 'VSTAR', 'V', 'GX', 'EX', 'ex']

  const suffixes1 = suffixes.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(name1))
  const suffixes2 = suffixes.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(name2))

  if (suffixes1.length !== suffixes2.length) return false
  return suffixes1.every(s => suffixes2.includes(s))
}

async function testAmoongussMatching() {
  console.log('🧪 Test du matching pour Amoonguss #11\n')
  console.log('=' .repeat(60))

  try {
    // 1. Chercher Amoonguss #11 dans discovered_cards
    console.log('\n📋 Étape 1: Recherche de Amoonguss #11 dans la base...')

    const { data: cards, error: cardsError } = await supabase
      .from('discovered_cards')
      .select('*')
      .ilike('name', 'Amoonguss')
      .eq('number', '11')

    if (cardsError) {
      console.error('❌ Erreur recherche carte:', cardsError)
      return
    }

    if (!cards || cards.length === 0) {
      console.error('❌ Amoonguss #11 non trouvé dans discovered_cards')
      console.log('💡 Assurez-vous que cette carte a été ajoutée à votre collection')
      return
    }

    const amoonguss = cards[0]
    console.log(`✅ Carte trouvée: ${amoonguss.name} #${amoonguss.number}`)
    console.log(`   Extension: ${amoonguss.set?.name || 'N/A'}`)

    // Vérifier les attaques
    const cardAttacks = extractCardAttacks(amoonguss)
    console.log(`   Attaques: ${cardAttacks.length > 0 ? cardAttacks.join(', ') : '⚠️ AUCUNE'}`)

    if (cardAttacks.length === 0) {
      console.warn('\n⚠️ PROBLÈME: Cette carte n\'a pas d\'attaques !')
      console.log('   La migration des attaques n\'a peut-être pas atteint cette carte.')
      console.log('   Score de matching attendu: FAIBLE (basé uniquement sur le nom)')
    }

    // 2. Rechercher les candidats CardMarket
    console.log('\n📋 Étape 2: Recherche des candidats CardMarket...')

    const { data: candidates, error: cmError } = await supabase
      .from('cardmarket_singles')
      .select('*')
      .ilike('name', 'Amoonguss%')
      .limit(50)

    if (cmError) {
      console.error('❌ Erreur recherche CardMarket:', cmError)
      return
    }

    console.log(`✅ ${candidates.length} candidats trouvés`)

    // 3. Calculer les scores pour chaque candidat
    console.log('\n📊 Étape 3: Calcul des scores de matching...\n')

    const scoredCandidates = candidates.map(candidate => {
      const cmAttacks = extractAttacksFromName(candidate.name)

      let score = 0
      let details = {
        attackScore: 0,
        nameScore: 0,
        suffixBonus: 0
      }

      // Score attaques (70%)
      if (cardAttacks.length > 0 && cmAttacks.length > 0) {
        details.attackScore = calculateAttackMatchScore(cardAttacks, cmAttacks)
        score += details.attackScore * 0.7
      }

      // Score nom (20%)
      details.nameScore = calculateNameSimilarity(amoonguss.name, candidate.name)
      score += details.nameScore * 0.2

      // Bonus suffixes (10%)
      if (hasSameSuffixes(amoonguss.name, candidate.name)) {
        details.suffixBonus = 0.1
        score += 0.1
      }

      return {
        ...candidate,
        matchScore: Math.min(score, 1),
        details
      }
    })

    // Trier par score
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore)

    // Afficher le top 5
    console.log('🏆 Top 5 des meilleurs matchs:\n')

    scoredCandidates.slice(0, 5).forEach((candidate, index) => {
      const cmAttacks = extractAttacksFromName(candidate.name)
      const percent = (candidate.matchScore * 100).toFixed(1)
      const attackPercent = (candidate.details.attackScore * 100).toFixed(0)
      const namePercent = (candidate.details.nameScore * 100).toFixed(0)
      const suffixPercent = (candidate.details.suffixBonus * 100).toFixed(0)

      console.log(`${index + 1}. ${candidate.name}`)
      console.log(`   📍 Score total: ${percent}%`)
      console.log(`   ⚔️  Attaques (70%): ${attackPercent}% - [${cmAttacks.join(', ') || 'N/A'}]`)
      console.log(`   📝 Nom (20%): ${namePercent}%`)
      console.log(`   ✨ Suffixes (10%): ${suffixPercent}%`)
      console.log(`   🔗 ID: ${candidate.id_product}`)
      console.log('')
    })

    // 4. Résultat final
    const bestMatch = scoredCandidates[0]
    const finalScore = (bestMatch.matchScore * 100).toFixed(1)

    console.log('=' .repeat(60))
    console.log('\n🎯 RÉSULTAT FINAL:')
    console.log(`   Meilleure correspondance: ${bestMatch.name}`)
    console.log(`   Score: ${finalScore}%`)
    console.log(`   URL: https://www.cardmarket.com/en/Pokemon/Products/Singles?idProduct=${bestMatch.id_product}`)

    if (cardAttacks.length === 0) {
      console.log('\n⚠️  Score basé uniquement sur le nom (pas d\'attaques)')
      console.log('   Pour améliorer le score, complétez la migration des attaques.')
    } else if (bestMatch.matchScore >= 0.8) {
      console.log('\n✅ EXCELLENT! Le matching fonctionne parfaitement.')
    } else if (bestMatch.matchScore >= 0.5) {
      console.log('\n✓  BON score. Peut être amélioré avec plus d\'attaques correspondantes.')
    } else {
      console.log('\n⚠️  Score faible. Vérifiez que les attaques correspondent.')
    }

    console.log('\n' + '=' .repeat(60))

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

// Exécuter le test
testAmoongussMatching()
