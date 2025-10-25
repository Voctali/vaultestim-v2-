/**
 * Traductions unifiées pour l'affichage des noms de cartes
 *
 * Ce fichier fournit une fonction centrale pour traduire les noms de cartes
 * de l'anglais (API Pokemon TCG) vers le français (affichage utilisateur).
 */

import { POKEMON_TRANSLATIONS } from './pokemonTranslations'
import TRAINER_TRANSLATIONS from './trainerTranslations'

/**
 * Crée un dictionnaire inverse Anglais → Français à partir des traductions
 * @param {Object} translations - Dictionnaire Français → Anglais
 * @returns {Object} - Dictionnaire Anglais → Français
 */
function reverseTranslations(translations) {
  const reversed = {}
  for (const [french, english] of Object.entries(translations)) {
    reversed[english.toLowerCase()] = french
  }
  return reversed
}

// Créer les dictionnaires inversés pour l'affichage
const POKEMON_TO_FRENCH = reverseTranslations(POKEMON_TRANSLATIONS)
const TRAINER_TO_FRENCH = reverseTranslations(TRAINER_TRANSLATIONS)

// Les dictionnaires inversés sont créés automatiquement au chargement du module

/**
 * Traduit un nom de carte de l'anglais vers le français
 * Détecte automatiquement si c'est un Pokémon ou un Dresseur
 *
 * @param {string} englishName - Nom de la carte en anglais (ex: "Charizard", "Professor Oak")
 * @returns {string} - Nom traduit en français ou nom original si pas de traduction
 *
 * @example
 * translateCardName("Charizard") // → "Dracaufeu"
 * translateCardName("Pikachu VMAX") // → "Pikachu VMAX"
 * translateCardName("Bill's Transfer") // → "Transfert de Léo"
 */
export function translateCardName(englishName) {
  // Debug premier appel
  if (!window.__translationInitialized) {
    console.log(`✅ [CardTranslations] ${Object.keys(POKEMON_TO_FRENCH).length} Pokémon + ${Object.keys(TRAINER_TO_FRENCH).length} Dresseurs chargés`)
    window.__translationInitialized = true
  }

  if (!englishName) return englishName

  const nameLower = englishName.toLowerCase().trim()

  // Étape 1 : Chercher une traduction exacte (nom complet)
  // Essayer d'abord dans les Pokémon
  if (POKEMON_TO_FRENCH[nameLower]) {
    return capitalizeFirst(POKEMON_TO_FRENCH[nameLower])
  }

  // Ensuite dans les Dresseurs
  if (TRAINER_TO_FRENCH[nameLower]) {
    return capitalizeFirst(TRAINER_TO_FRENCH[nameLower])
  }

  // Étape 2 : Chercher une correspondance partielle (pour les cartes avec suffixes)
  // Ex: "Charizard ex" → chercher "charizard" puis ajouter " ex"

  // Extraire le nom de base (avant le premier espace ou tiret)
  const baseNameMatch = nameLower.match(/^([a-z-]+)/i)
  if (baseNameMatch) {
    const baseName = baseNameMatch[1]

    // Chercher le nom de base dans les Pokémon
    if (POKEMON_TO_FRENCH[baseName]) {
      const translatedBase = capitalizeFirst(POKEMON_TO_FRENCH[baseName])
      // Remplacer le nom de base par sa traduction, garder le reste
      return englishName.replace(new RegExp(`^${baseName}`, 'i'), translatedBase)
    }

    // Chercher le nom de base dans les Dresseurs
    if (TRAINER_TO_FRENCH[baseName]) {
      const translatedBase = capitalizeFirst(TRAINER_TO_FRENCH[baseName])
      return englishName.replace(new RegExp(`^${baseName}`, 'i'), translatedBase)
    }
  }

  // Étape 3 : Cas spéciaux - cartes avec préfixes (ex: "Galarian Perrserker")
  // Chercher dans tout le nom si un mot correspond à une traduction
  const words = nameLower.split(/\s+/)
  for (const word of words) {
    if (POKEMON_TO_FRENCH[word]) {
      const translatedWord = capitalizeFirst(POKEMON_TO_FRENCH[word])
      return englishName.replace(new RegExp(word, 'i'), translatedWord)
    }
    if (TRAINER_TO_FRENCH[word]) {
      const translatedWord = capitalizeFirst(TRAINER_TO_FRENCH[word])
      return englishName.replace(new RegExp(word, 'i'), translatedWord)
    }
  }

  // Aucune traduction trouvée, retourner le nom original
  return englishName
}

/**
 * Capitalise la première lettre d'une chaîne
 * Gère les cas spéciaux comme "M. Glaquette", "Type: Null", etc.
 *
 * @param {string} str - Chaîne à capitaliser
 * @returns {string} - Chaîne capitalisée
 */
function capitalizeFirst(str) {
  if (!str) return str

  // Cas spéciaux qui doivent rester en minuscules
  const lowerCaseWords = ['de', 'du', 'des', 'le', 'la', 'les', 'et']

  // Séparer par espaces et capitaliser chaque mot sauf les mots de liaison
  const words = str.split(' ')
  return words.map((word, index) => {
    // Le premier mot est toujours capitalisé
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1)
    }
    // Les mots de liaison restent en minuscules
    if (lowerCaseWords.includes(word.toLowerCase())) {
      return word.toLowerCase()
    }
    // Les autres mots sont capitalisés
    return word.charAt(0).toUpperCase() + word.slice(1)
  }).join(' ')
}

/**
 * Vérifie si une traduction existe pour ce nom de carte
 * @param {string} englishName - Nom en anglais à vérifier
 * @returns {boolean}
 */
export function hasCardTranslation(englishName) {
  if (!englishName) return false
  const nameLower = englishName.toLowerCase().trim()

  // Vérifier traduction exacte
  if (POKEMON_TO_FRENCH[nameLower] || TRAINER_TO_FRENCH[nameLower]) {
    return true
  }

  // Vérifier nom de base
  const baseNameMatch = nameLower.match(/^([a-z-]+)/i)
  if (baseNameMatch) {
    const baseName = baseNameMatch[1]
    if (POKEMON_TO_FRENCH[baseName] || TRAINER_TO_FRENCH[baseName]) {
      return true
    }
  }

  return false
}

/**
 * Retourne les statistiques des traductions disponibles
 * @returns {Object} - Nombre de traductions Pokémon et Dresseur
 */
export function getTranslationStats() {
  return {
    pokemon: Object.keys(POKEMON_TO_FRENCH).length,
    trainers: Object.keys(TRAINER_TO_FRENCH).length,
    total: Object.keys(POKEMON_TO_FRENCH).length + Object.keys(TRAINER_TO_FRENCH).length
  }
}

// Export par défaut
export default {
  translateCardName,
  hasCardTranslation,
  getTranslationStats
}
