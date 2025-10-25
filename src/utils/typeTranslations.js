/**
 * Traductions Anglais → Français pour les types de cartes Pokémon
 *
 * Ce fichier contient les traductions des types de cartes du TCG Pokémon
 * de l'anglais vers le français.
 */

const TYPE_TRANSLATIONS = {
  // Types de cartes Pokémon
  'Fire': 'Feu',
  'Grass': 'Plante',
  'Water': 'Eau',
  'Lightning': 'Électrique',
  'Fighting': 'Combat',
  'Psychic': 'Psy',
  'Colorless': 'Incolore',
  'Darkness': 'Obscurité',
  'Metal': 'Métal',
  'Dragon': 'Dragon',
  'Fairy': 'Fée',

  // Variantes minuscules (pour compatibilité)
  'fire': 'Feu',
  'grass': 'Plante',
  'water': 'Eau',
  'lightning': 'Électrique',
  'fighting': 'Combat',
  'psychic': 'Psy',
  'colorless': 'Incolore',
  'darkness': 'Obscurité',
  'metal': 'Métal',
  'dragon': 'Dragon',
  'fairy': 'Fée'
}

/**
 * Traduit un type de carte anglais vers le français
 * @param {string} englishType - Type anglais de la carte
 * @returns {string} - Type français ou type original si pas de traduction
 */
export function translateCardType(englishType) {
  if (!englishType) return ''
  return TYPE_TRANSLATIONS[englishType] || englishType
}

/**
 * Traduit un tableau de types de cartes
 * @param {string[]} types - Tableau de types en anglais
 * @returns {string[]} - Tableau de types en français
 */
export function translateCardTypes(types) {
  if (!Array.isArray(types)) return []
  return types.map(type => translateCardType(type))
}

/**
 * Retourne toutes les traductions de types
 * @returns {Object}
 */
export function getAllTypeTranslations() {
  return { ...TYPE_TRANSLATIONS }
}

export default TYPE_TRANSLATIONS
