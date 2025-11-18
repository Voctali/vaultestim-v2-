/**
 * Détecter la catégorie d'un produit scellé depuis son nom
 * Utilisé pour organiser les produits par type (Booster, Display, ETB, etc.)
 */

/**
 * Ordre de priorité des catégories (du plus spécifique au plus général)
 * Important : L'ordre détermine quelle catégorie est détectée en premier
 */
const CATEGORY_PATTERNS = [
  // Elite Trainer Box (ETB)
  {
    category: 'Elite Trainer Box',
    patterns: [
      /elite\s+trainer\s+box/i,
      /\betb\b/i,
    ],
    priority: 10
  },

  // Premium Collection (Pokébox)
  {
    category: 'Premium Collection',
    patterns: [
      /premium\s+collection/i,
      /ultra[-\s]?premium/i,
      /super[-\s]?premium/i,
    ],
    priority: 9
  },

  // Coffrets spéciaux (Treasure Chest, Gift Box, Special Box, etc.)
  {
    category: 'Coffrets',
    patterns: [
      /treasure\s+chest/i,
      /gift\s+box/i,
      /special\s+box/i,
      /deluxe\s+box/i,
      /collector['']?s?\s+chest/i,
      /celebration\s+box/i,
    ],
    priority: 9
  },

  // Collection Box (générique)
  {
    category: 'Collection Box',
    patterns: [
      /collection\s+box/i,
    ],
    priority: 8
  },

  // Booster Bundle (lots de boosters)
  {
    category: 'Booster Bundle',
    patterns: [
      /booster\s+bundle/i,
      /bundle/i,
    ],
    priority: 7
  },

  // Booster Box (Display)
  {
    category: 'Booster Box',
    patterns: [
      /booster\s+box/i,
      /(\d+)\s+boosters/i, // Ex: "36 Boosters"
      /display/i,
    ],
    priority: 6
  },

  // Sleeved Booster (boosters sous blister - uniquement si "sleeved" est présent)
  // Priorité haute pour détecter "24 Sleeved Booster Case" avant Case et Booster Box
  {
    category: 'Sleeved Booster',
    patterns: [
      /sleeved\s+booster/i,
    ],
    priority: 8
  },

  // 3-Pack Blister (tripacks avec 3 boosters + carte promo)
  // Priorité haute pour détecter avant Blister générique
  {
    category: '3-Pack Blister',
    patterns: [
      /3[\s-]?pack/i,        // "3-pack", "3 pack", "3pack"
      /tripack/i,            // "tripack"
      /triple\s+pack/i,      // "triple pack"
    ],
    priority: 7
  },

  // Case (cartons) - Priorité plus basse que Sleeved Booster
  {
    category: 'Case',
    patterns: [
      /\bcase\b/i,
      /(\d+)\s+booster\s+box\s+case/i,
    ],
    priority: 5
  },

  // Boosters Promo & Duopacks (1-2 boosters + carte promo, sans 3-pack ni sleeved)
  // Détecte les blisters simples de RapidAPI
  {
    category: 'Boosters Promo & Duopacks',
    patterns: [
      /\bblister\b/i,           // Tous les blisters (sauf 3-pack détecté avant)
      /\b2[\s-]?pack\b/i,       // "2-pack", "2 pack"
      /\bduopack\b/i,           // "duopack"
      /\bduo\s+pack\b/i,        // "duo pack"
      /\bchecklane\b/i,         // "checklane blister"
    ],
    priority: 4
  },

  // Booster (simple)
  {
    category: 'Booster',
    patterns: [
      /\bbooster\b/i,
    ],
    priority: 3
  },

  // Deck / Theme Deck
  {
    category: 'Deck',
    patterns: [
      /\bdeck\b/i,
      /theme\s+deck/i,
      /battle\s+deck/i,
    ],
    priority: 2
  },

  // Tin / Box (autres boîtes métalliques)
  {
    category: 'Tin',
    patterns: [
      /\btin\b/i,
    ],
    priority: 1
  },
]

/**
 * Normaliser le nom d'une catégorie (convertir variations en forme canonique)
 *
 * @param {string} categoryName - Nom de la catégorie
 * @returns {string} Nom normalisé
 */
export function normalizeCategoryName(categoryName) {
  if (!categoryName) return 'Autre'

  // Mapping des variations vers la forme canonique
  const mappings = {
    // Elite Trainer Box (singulier - RapidAPI)
    'Elite Trainer Box': 'Elite Trainer Box',
    'Pokémon Elite Trainer Box': 'Elite Trainer Box',

    // Elite Trainer Boxes (pluriel - CardMarket, catégorie SÉPARÉE)
    'Elite Trainer Boxes': 'Elite Trainer Boxes',
    'Pokémon Elite Trainer Boxes': 'Elite Trainer Boxes',

    // Booster Box variations
    'Booster Boxes': 'Booster Box',
    'Booster Box': 'Booster Box',
    'Pokémon Booster Boxes': 'Booster Box',
    'Pokémon Booster Box': 'Booster Box',

    // Collection Box variations
    'Collection Boxes': 'Collection Box',
    'Collection Box': 'Collection Box',
    'Pokémon Collection Boxes': 'Collection Box',
    'Pokémon Collection Box': 'Collection Box',

    // Box Set variations
    'Box Sets': 'Box Set',
    'Box Set': 'Box Set',
    'Pokémon Box Sets': 'Box Set',
    'Pokémon Box Set': 'Box Set',

    // Premium Collection variations
    'Premium Collections': 'Premium Collection',
    'Premium Collection': 'Premium Collection',
    'Pokémon Premium Collections': 'Premium Collection',
    'Pokémon Premium Collection': 'Premium Collection',

    // Tin (singulier - RapidAPI)
    'Tin': 'Tin',
    'Pokémon Tin': 'Tin',

    // Tins (pluriel - CardMarket, catégorie SÉPARÉE)
    'Tins': 'Tins',
    'Pokémon Tins': 'Tins',

    // Deck (singulier - RapidAPI)
    'Deck': 'Deck',
    'Pokémon Deck': 'Deck',

    // Decks (pluriel - CardMarket, catégorie SÉPARÉE)
    'Decks': 'Decks',
    'Pokémon Decks': 'Decks',

    // Theme Deck (CardMarket, catégorie SÉPARÉE de Deck)
    'Theme Deck': 'Theme Deck',
    'Theme Decks': 'Theme Deck',
    'Pokémon Theme Deck': 'Theme Deck',
    'Pokémon Theme Decks': 'Theme Deck',

    // Booster variations
    'Boosters': 'Booster',
    'Booster': 'Booster',
    'Pokémon Boosters': 'Booster',

    // Sleeved Booster variations
    'Sleeved Boosters': 'Sleeved Booster',
    'Sleeved Booster': 'Sleeved Booster',

    // Blisters variations (catégorie SÉPARÉE de Sleeved Booster)
    'Blisters': 'Blister',
    'Blister': 'Blister',
    'Pokémon Blisters': 'Blister',
    'Pokémon Blister': 'Blister',

    // Case variations
    'Cases': 'Case',
    'Case': 'Case',
    'Pokémon Cases': 'Case',
    'Pokémon Case': 'Case',

    // Display variations
    'Displays': 'Display',
    'Display': 'Display',
    'Pokémon Displays': 'Display',
    'Pokémon Display': 'Display',

    // Lot variations
    'Lots': 'Lot',
    'Lot': 'Lot',
    'Pokémon Lots': 'Lot',
    'Pokémon Lot': 'Lot',

    // Coins variations
    'Coins': 'Coins',
    'Coin': 'Coins',
    'Pokémon Coins': 'Coins',
    'Pokémon Coin': 'Coins',

    // Coffrets variations
    'Coffrets': 'Coffrets',
    'Coffret': 'Coffrets',
    'Pokémon Coffrets': 'Coffrets',
    'Pokémon Coffret': 'Coffrets',

    // Booster Bundle variations
    'Booster Bundles': 'Booster Bundle',
    'Booster Bundle': 'Booster Bundle',
    'Pokémon Booster Bundles': 'Booster Bundle',
    'Pokémon Booster Bundle': 'Booster Bundle',
  }

  return mappings[categoryName] || categoryName
}

/**
 * Détecter la catégorie d'un produit scellé depuis son nom
 *
 * @param {string} productName - Nom du produit
 * @returns {string} Catégorie détectée ou 'Autre'
 */
export function detectSealedProductCategory(productName) {
  if (!productName) return 'Autre'

  // Trier par priorité décroissante
  const sortedCategories = [...CATEGORY_PATTERNS].sort((a, b) => b.priority - a.priority)

  // Tester chaque catégorie dans l'ordre de priorité
  for (const { category, patterns } of sortedCategories) {
    for (const pattern of patterns) {
      if (pattern.test(productName)) {
        return category
      }
    }
  }

  // Si aucune catégorie détectée
  return 'Autre'
}

/**
 * Ordre d'affichage des catégories dans l'interface
 * (pour tri et filtres)
 */
export const CATEGORY_DISPLAY_ORDER = [
  'Booster',
  'Sleeved Booster',
  'Boosters Promo & Duopacks',
  '3-Pack Blister',
  'Booster Bundle',
  'Booster Box',
  'Case',
  'Elite Trainer Box',
  'Premium Collection',
  'Coffrets',
  'Collection Box',
  'Deck',
  'Tin',
  'Autre',
]

/**
 * Trier les produits par catégorie selon l'ordre d'affichage
 *
 * @param {Array} products - Liste de produits avec {name, category_name}
 * @returns {Array} Produits triés par catégorie
 */
export function sortProductsByCategory(products) {
  return products.sort((a, b) => {
    const catA = a.category_name || detectSealedProductCategory(a.name)
    const catB = b.category_name || detectSealedProductCategory(b.name)

    const indexA = CATEGORY_DISPLAY_ORDER.indexOf(catA)
    const indexB = CATEGORY_DISPLAY_ORDER.indexOf(catB)

    // Si catégorie non trouvée dans l'ordre, mettre à la fin
    const orderA = indexA === -1 ? 999 : indexA
    const orderB = indexB === -1 ? 999 : indexB

    // Trier par ordre de catégorie
    if (orderA !== orderB) {
      return orderA - orderB
    }

    // Si même catégorie, trier par nom alphabétique
    return (a.name || '').localeCompare(b.name || '')
  })
}
