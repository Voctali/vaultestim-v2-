/**
 * Gestion des états de carte et traductions
 */

/**
 * États de carte standard (condition)
 */
export const CARD_CONDITIONS = {
  MINT: 'mint',
  NEAR_MINT: 'near_mint',
  EXCELLENT: 'excellent',
  GOOD: 'good',
  LIGHT_PLAYED: 'light_played',
  PLAYED: 'played',
  POOR: 'poor',
  DAMAGED: 'damaged'
}

/**
 * Traductions français des états de carte
 */
export const CONDITION_TRANSLATIONS = {
  // Anglais vers français
  'mint': 'Mint',
  'near mint': 'Quasi-neuf',
  'near_mint': 'Quasi-neuf',
  'nm': 'Quasi-neuf',
  'excellent': 'Excellent',
  'ex': 'Excellent',
  'good': 'Bon',
  'gd': 'Bon',
  'light played': 'Légèrement joué',
  'light_played': 'Légèrement joué',
  'lightly played': 'Légèrement joué',
  'lp': 'Légèrement joué',
  'played': 'Joué',
  'pl': 'Joué',
  'moderately played': 'Moyennement joué',
  'mp': 'Moyennement joué',
  'heavily played': 'Fortement joué',
  'hp': 'Fortement joué',
  'poor': 'Mauvais état',
  'po': 'Mauvais état',
  'damaged': 'Endommagé',
  'dmg': 'Endommagé'
}

/**
 * Traductions français des raretés
 */
export const RARITY_TRANSLATIONS = {
  // Raretés communes
  'common': 'Commune',
  'uncommon': 'Peu commune',
  'rare': 'Rare',

  // Raretés spéciales
  'rare holo': 'Rare Holo',
  'rare holo v': 'Rare Holo V',
  'rare holo vmax': 'Rare Holo VMAX',
  'rare holo vstar': 'Rare Holo VSTAR',
  'rare holo gx': 'Rare Holo GX',
  'rare holo ex': 'Rare Holo EX',

  // Ultra/Secret Rare
  'rare ultra': 'Ultra Rare',
  'rare secret': 'Secret Rare',
  'rare rainbow': 'Rainbow Rare',
  'rare shiny': 'Shiny Rare',
  'rare shiny gx': 'Shiny Rare GX',

  // Raretés spéciales anciennes
  'rare holo lv.x': 'Rare Holo LV.X',
  'rare prime': 'Rare Prime',
  'rare legend': 'Rare Legend',
  'rare break': 'Rare BREAK',

  // Amazing/Radiant
  'amazing rare': 'Amazing Rare',
  'radiant rare': 'Radiant Rare',
  'illustration rare': 'Illustration Rare',
  'special illustration rare': 'Illustration Spéciale Rare',
  'hyper rare': 'Hyper Rare',

  // Trainer/Energy
  'rare ace': 'Rare ACE',
  'rare prism star': 'Rare Prism Star',
  'promo': 'Promo',

  // Reverse
  'common reverse': 'Commune Reverse',
  'uncommon reverse': 'Peu commune Reverse',
  'rare reverse': 'Rare Reverse',
  'rare holo reverse': 'Rare Holo Reverse'
}

/**
 * Multiplicateurs de prix selon l'état (basés sur standards du marché)
 * Near Mint = 100% (référence)
 */
export const CONDITION_PRICE_MULTIPLIERS = {
  'mint': 1.15,              // +15% pour Mint parfait
  'near_mint': 1.0,          // 100% prix de base (référence)
  'excellent': 0.85,         // -15%
  'light_played': 0.80,      // -20%
  'good': 0.70,              // -30%
  'played': 0.60,            // -40%
  'poor': 0.40,              // -60%
  'damaged': 0.25            // -75%
}

/**
 * Mapping des états utilisés dans l'application (anglais → français)
 */
const APP_CONDITION_MAP = {
  // États en anglais
  'mint': 'Neuf',
  'near mint': 'Proche du neuf',
  'near_mint': 'Proche du neuf',
  'excellent': 'Excellent',
  'good': 'Bon',
  'light played': 'Moyen',
  'light_played': 'Moyen',
  'played': 'Joué',
  'poor': 'Mauvais',
  'damaged': 'Endommagé',

  // États déjà en français (retournés tels quels)
  'neuf': 'Neuf',
  'proche du neuf': 'Proche du neuf',
  'bon': 'Bon',
  'moyen': 'Moyen',
  'joué': 'Joué',
  'mauvais': 'Mauvais',
  'endommagé': 'Endommagé'
}

/**
 * Traduit un état de carte en français
 * @param {string} condition - État en anglais ou français
 * @returns {string} - État en français
 */
export function translateCondition(condition) {
  if (!condition) return 'Proche du neuf' // Par défaut

  const normalized = condition.toLowerCase().trim()

  // Vérifier d'abord dans le mapping de l'application
  if (APP_CONDITION_MAP[normalized]) {
    return APP_CONDITION_MAP[normalized]
  }

  // Sinon utiliser le mapping complet
  return CONDITION_TRANSLATIONS[normalized] || condition
}

/**
 * Traduit une rareté en français
 * @param {string} rarity - Rareté en anglais
 * @returns {string} - Rareté en français
 */
export function translateRarity(rarity) {
  if (!rarity) return 'Inconnue'

  const normalized = rarity.toLowerCase().trim()
  return RARITY_TRANSLATIONS[normalized] || rarity
}

/**
 * Obtient le multiplicateur de prix pour un état donné
 * @param {string} condition - État de la carte
 * @returns {number} - Multiplicateur (ex: 0.85 pour Excellent)
 */
export function getConditionMultiplier(condition) {
  if (!condition) return 1.0 // Near Mint par défaut

  // Normaliser l'état
  const normalized = condition.toLowerCase().trim().replace(/\s+/g, '_')

  // Mapper vers les clés connues
  const conditionKey = Object.keys(CARD_CONDITIONS).find(key =>
    CARD_CONDITIONS[key] === normalized ||
    normalized.includes(CARD_CONDITIONS[key]) ||
    CARD_CONDITIONS[key].includes(normalized)
  )

  if (conditionKey) {
    return CONDITION_PRICE_MULTIPLIERS[CARD_CONDITIONS[conditionKey]] || 1.0
  }

  return 1.0 // Par défaut Near Mint
}

/**
 * Calcule le prix ajusté selon l'état
 * Utilise les VRAIES données CardMarket quand disponibles, sinon applique les %
 * @param {number} basePrice - Prix de base (Near Mint)
 * @param {string} condition - État de la carte
 * @param {object} cardMarketPrices - Données complètes CardMarket (optionnel)
 * @returns {number} - Prix ajusté
 */
export function calculatePriceByCondition(basePrice, condition = 'near_mint', cardMarketPrices = null) {
  if (!basePrice || isNaN(basePrice)) return null

  // Si on a les données CardMarket complètes, utiliser les VRAIS prix du marché
  if (cardMarketPrices && cardMarketPrices.prices) {
    const cm = cardMarketPrices.prices

    switch (condition) {
      case 'mint':
        // Mint = meilleur que Near Mint → estimation +15%
        return basePrice * 1.15

      case 'near_mint':
        // Near Mint = référence (trendPrice ou averageSellPrice)
        return basePrice

      case 'excellent':
        // VRAIE DONNÉE: lowPriceExPlus = prix le plus bas pour Excellent+
        if (cm.lowPriceExPlus) {
          console.log(`✅ Prix Excellent réel (CardMarket): ${cm.lowPriceExPlus}€`)
          return cm.lowPriceExPlus
        }
        break

      case 'light_played':
      case 'good':
        // Utiliser lowPrice si disponible (prix le plus bas du marché)
        if (cm.lowPrice && cm.lowPrice < basePrice) {
          console.log(`✅ Prix ${condition} réel (CardMarket lowPrice): ${cm.lowPrice}€`)
          return cm.lowPrice
        }
        break

      case 'played':
      case 'poor':
      case 'damaged':
        // Pour les mauvais états, lowPrice est une bonne approximation
        if (cm.lowPrice) {
          console.log(`✅ Prix ${condition} réel (CardMarket lowPrice): ${cm.lowPrice}€`)
          return cm.lowPrice
        }
        break
    }
  }

  // FALLBACK: Utiliser les multiplicateurs si pas de données réelles
  console.log(`⚠️ Prix ${condition} estimé (% approximation)`)
  const multiplier = getConditionMultiplier(condition)
  return basePrice * multiplier
}

/**
 * Liste des états disponibles pour sélection (trié par qualité)
 */
export const AVAILABLE_CONDITIONS = [
  { value: 'mint', label: 'Mint', multiplier: 1.15 },
  { value: 'near_mint', label: 'Quasi-neuf (NM)', multiplier: 1.0 },
  { value: 'excellent', label: 'Excellent (EX)', multiplier: 0.85 },
  { value: 'light_played', label: 'Légèrement joué (LP)', multiplier: 0.80 },
  { value: 'good', label: 'Bon (GD)', multiplier: 0.70 },
  { value: 'played', label: 'Joué (PL)', multiplier: 0.60 },
  { value: 'poor', label: 'Mauvais état (PO)', multiplier: 0.40 },
  { value: 'damaged', label: 'Endommagé (DMG)', multiplier: 0.25 }
]
