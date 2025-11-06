/**
 * Script de test pour vérifier les traductions de dresseurs
 * À exécuter dans la console du navigateur (F12)
 */

// Importer les fonctions de traduction
import { translateTrainerName } from './src/utils/trainerTranslations.js'

// Tests
const tests = [
  { fr: 'capitaine d\'équipe spark', expected: 'spark' },
  { fr: 'capitaine d equipe spark', expected: 'spark' },
  { fr: 'capitaine d\'équipe blanche', expected: 'blanche' },
  { fr: 'capitaine d equipe blanche', expected: 'blanche' },
  { fr: 'capitaine d\'équipe candela', expected: 'candela' },
  { fr: 'capitaine d equipe candela', expected: 'candela' },
  { fr: 'cardus', expected: 'thorton' },
  { fr: 'carolina', expected: 'skyla' },
  { fr: 'chaz', expected: 'gordie' },
  { fr: 'concentration de cornélia', expected: 'korrina\'s focus' },
  { fr: 'conviction de marion', expected: 'karen\'s conviction' },
  { fr: 'copieuse', expected: 'copycat' }
]

console.log('🧪 Test des traductions de dresseurs\n')

let passed = 0
let failed = 0

tests.forEach(test => {
  const result = translateTrainerName(test.fr)
  const success = result === test.expected

  if (success) {
    console.log(`✅ "${test.fr}" → "${result}"`)
    passed++
  } else {
    console.log(`❌ "${test.fr}" → "${result}" (attendu: "${test.expected}")`)
    failed++
  }
})

console.log(`\n📊 Résultats: ${passed}/${tests.length} tests réussis`)
if (failed > 0) {
  console.log(`⚠️  ${failed} tests échoués`)
}
