/**
 * Mapping des catégories CardMarket vers termes de recherche RapidAPI
 */

export const CATEGORY_SEARCH_TERMS = {
  // Boosters
  'Booster Boxes': 'booster box',
  'Booster Packs': 'booster pack',
  'Pokémon Blisters': 'blister',

  // Collections
  'Elite Trainer Boxes': 'elite trainer box',
  'Premium Collections': 'premium collection',
  'Collection Boxes': 'collection box',
  'Premium Trainer Boxes': 'trainer box',

  // Decks
  'Theme Decks': 'theme deck',
  'Battle Decks': 'battle deck',
  'Starter Decks': 'starter deck',
  'Build & Battle Boxes': 'build battle',

  // Cases & Displays
  'Booster Cases': 'booster case',
  'Elite Trainer Box Cases': 'elite trainer box',

  // Autres
  'Pin Collections': 'pin collection',
  'Tins': 'tin',
  'Special Editions': 'special edition',
  'Accessories': 'accessory',
}

/**
 * Obtenir le terme de recherche optimal pour une catégorie
 * @param {string} category - Nom de la catégorie
 * @returns {string} Terme de recherche pour RapidAPI
 */
export function getCategorySearchTerm(category) {
  // 1. Chercher dans le mapping
  if (CATEGORY_SEARCH_TERMS[category]) {
    return CATEGORY_SEARCH_TERMS[category]
  }

  // 2. Fallback: simplifier le nom
  return category
    .toLowerCase()
    .replace(/pokémon/gi, '')
    .replace(/pokemon/gi, '')
    .trim()
}

/**
 * Vérifier si une catégorie a des résultats probables dans RapidAPI
 * @param {string} category - Nom de la catégorie
 * @returns {boolean}
 */
export function isCategorySearchable(category) {
  // Certaines catégories Supabase n'existent pas dans RapidAPI
  const unsearchableCategories = [
    'Accessories',
    'Miscellaneous'
  ]

  return !unsearchableCategories.includes(category)
}
