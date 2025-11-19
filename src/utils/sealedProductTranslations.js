// Dictionnaire de traduction Français → Anglais pour les produits scellés
// Utilisé pour rechercher les produits avec l'API CardMarket en anglais

// Version du dictionnaire - Incrémenter à chaque ajout/modification pour invalider le cache
export const SEALED_PRODUCT_TRANSLATIONS_VERSION = '1.0.0' // Dernière mise à jour: 2025-01-15

export const SEALED_PRODUCT_TRANSLATIONS = {
  // Formats spécifiques (traiter en premier pour éviter les doublons)
  'booster sous blister': 'sleeved booster',
  'boosters sous blister': 'sleeved booster',
  'display de 36 boosters': 'booster box',
  'display 36 boosters': 'booster box',
  'boite de 36 boosters': 'booster box',
  'carton de 6 displays': '6 booster box case',
  'carton 6 displays': '6 booster box case',

  // Types de produits
  'coffret dresseur d\'élite': 'elite trainer box',
  'coffret dresseur elite': 'elite trainer box',
  'coffret dresseur': 'elite trainer box',
  'coffret elite': 'elite trainer box',
  'etb': 'elite trainer box',
  'premium collection': 'premium collection',
  'pokebox': 'tin',
  'poké-box': 'tin',
  'poke-box': 'tin',
  'pokébox': 'tin',
  'display': 'booster box',
  'booster': 'booster',
  'boosters': 'booster',
  'coffret': 'box',
  'collection': 'collection',
  'lot': 'bundle',
  'bundle': 'bundle',
  'case': 'case',
  'boite': 'box',
  'carton': 'case',

  // Variantes
  'sous blister': 'sleeved',
  'scellé': 'sealed',
  'scelle': 'sealed',

  // Lieux (Pokemon Center)
  'pokemon center': 'pokemon center',
  'pokémon center': 'pokemon center',
  'centre pokemon': 'pokemon center',
}

/**
 * Traduire un terme français de produit scellé vers l'anglais
 *
 * @param {string} frenchTerm - Terme en français
 * @returns {string} Terme en anglais (ou terme original si pas de traduction)
 */
export function translateSealedProduct(frenchTerm) {
  if (!frenchTerm) return ''

  const normalized = frenchTerm.toLowerCase().trim()

  // Essayer une correspondance exacte
  const exactMatch = SEALED_PRODUCT_TRANSLATIONS[normalized]
  if (exactMatch) {
    return exactMatch
  }

  // Essayer de trouver des correspondances partielles (mots-clés)
  // Ex: "coffret dresseur écarlate" → détecte "coffret dresseur" → "elite trainer box"
  for (const [frKey, enValue] of Object.entries(SEALED_PRODUCT_TRANSLATIONS)) {
    if (normalized.includes(frKey)) {
      // Remplacer le mot-clé français par sa traduction anglaise
      return normalized.replace(frKey, enValue)
    }
  }

  // Si aucune traduction trouvée, retourner le terme original
  return frenchTerm
}

/**
 * Traduire une recherche complète de produit scellé
 * Gère les termes multiples et les noms d'extensions
 *
 * @param {string} searchQuery - Requête de recherche en français
 * @returns {string} Requête traduite en anglais
 */
export function translateSealedProductSearch(searchQuery) {
  if (!searchQuery) return ''

  const normalized = searchQuery.toLowerCase().trim()

  // Liste des termes français trouvés
  const foundTranslations = []
  const remainingTerms = []

  // Diviser en mots
  const words = normalized.split(/\s+/)

  // Essayer de traduire chaque mot
  let translatedParts = []
  let i = 0

  while (i < words.length) {
    // Essayer d'abord des expressions de 4 mots
    if (i + 3 < words.length) {
      const fourWords = words.slice(i, i + 4).join(' ')
      if (SEALED_PRODUCT_TRANSLATIONS[fourWords]) {
        translatedParts.push(SEALED_PRODUCT_TRANSLATIONS[fourWords])
        i += 4
        continue
      }
    }

    // Essayer des expressions de 3 mots
    if (i + 2 < words.length) {
      const threeWords = words.slice(i, i + 3).join(' ')
      if (SEALED_PRODUCT_TRANSLATIONS[threeWords]) {
        translatedParts.push(SEALED_PRODUCT_TRANSLATIONS[threeWords])
        i += 3
        continue
      }
    }

    // Essayer des expressions de 2 mots
    if (i + 1 < words.length) {
      const twoWords = words.slice(i, i + 2).join(' ')
      if (SEALED_PRODUCT_TRANSLATIONS[twoWords]) {
        translatedParts.push(SEALED_PRODUCT_TRANSLATIONS[twoWords])
        i += 2
        continue
      }
    }

    // Essayer un seul mot
    const word = words[i]
    if (SEALED_PRODUCT_TRANSLATIONS[word]) {
      translatedParts.push(SEALED_PRODUCT_TRANSLATIONS[word])
    } else {
      // Garder le mot original (probablement un nom d'extension)
      translatedParts.push(word)
    }

    i++
  }

  return translatedParts.join(' ')
}
