/**
 * Formateur de prix avec devise
 * Gère EUR (€) et USD ($) selon la source du prix
 * Prend en compte l'état de la carte (Near Mint, Played, etc.)
 */

import { calculatePriceByCondition } from './cardConditions'

/**
 * Symboles de devises
 */
const CURRENCY_SYMBOLS = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥'
}

/**
 * Mapping des versions utilisateur vers les clés de l'API Pokemon TCG
 */
const VERSION_TO_API_KEY = {
  'normale': 'normal',
  'normal': 'normal',
  'holo': 'holofoil',
  'holofoil': 'holofoil',
  'holographique': 'holofoil',
  'reverse holo': 'reverseHolofoil',
  'reverse': 'reverseHolofoil',
  'reverseholofoil': 'reverseHolofoil',
  'tampon (logo extension)': 'holofoil', // Les cartes tampon utilisent généralement le prix holofoil
  'tampon': 'holofoil',
  '1st edition': '1stEditionHolofoil',
  '1ere edition': '1stEditionHolofoil',
  '1ère édition': '1stEditionHolofoil',
  'unlimited': 'unlimitedHolofoil'
}

/**
 * Formate un prix avec la devise appropriée
 * @param {number|string} price - Le prix à formater
 * @param {string} currency - La devise (EUR, USD, etc.)
 * @param {number} decimals - Nombre de décimales (défaut: 2)
 * @returns {string} - Prix formaté avec devise
 */
export function formatPrice(price, currency = 'EUR', decimals = 2) {
  if (price === null || price === undefined || price === '') {
    return 'Prix N/A'
  }

  const numPrice = parseFloat(price)
  if (isNaN(numPrice)) {
    return 'Prix N/A'
  }

  const formattedNumber = numPrice.toFixed(decimals)
  const symbol = CURRENCY_SYMBOLS[currency] || currency

  return `${formattedNumber}${symbol}`
}

/**
 * Extrait le prix selon la version spécifique de la carte
 * @param {object} card - La carte avec tcgplayer.prices
 * @param {string} version - Version de la carte (Normale, Reverse Holo, etc.)
 * @returns {object} - { price, currency } ou null si non trouvé
 */
function getPriceByVersion(card, version) {
  if (!card || !version) return null

  const versionKey = VERSION_TO_API_KEY[version.toLowerCase()]

  // Priorité 1 : TCGPlayer avec version spécifique
  if (versionKey && card.tcgplayer?.prices?.[versionKey]?.market) {
    return {
      price: card.tcgplayer.prices[versionKey].market,
      currency: 'USD'
    }
  }

  // Priorité 2 : CardMarket (pas de séparation par version, utilise prix moyen)
  if (card.cardmarket?.prices?.averageSellPrice) {
    return {
      price: card.cardmarket.prices.averageSellPrice,
      currency: 'EUR'
    }
  }

  return null
}

/**
 * Formate le prix d'une carte en utilisant ses propriétés
 * Prend en compte l'état de la carte si disponible
 * Prend en compte la VERSION de la carte si fournie (Normale, Reverse Holo, etc.)
 * Utilise les vraies données CardMarket quand disponibles
 * @param {object} card - La carte avec marketPrice, marketPriceCurrency, condition, cardMarketPrice
 * @param {number} decimals - Nombre de décimales
 * @param {string} version - Version de la carte (optionnel)
 * @returns {string} - Prix formaté avec devise
 */
export function formatCardPrice(card, decimals = 2, version = null) {
  if (!card) return 'Prix N/A'

  // Si une version est spécifiée, utiliser le prix de cette version
  let price = null
  let currency = 'EUR'

  if (version) {
    const priceByVersion = getPriceByVersion(card, version)
    if (priceByVersion) {
      price = priceByVersion.price
      currency = priceByVersion.currency
      console.log(`💰 Prix trouvé pour ${card.name} (${version}): ${price}${currency === 'EUR' ? '€' : '$'}`)
    }
  }

  // Sinon, utiliser le prix général ou le premier disponible
  if (!price) {
    price = card.marketPrice || card.value || null
    currency = card.marketPriceCurrency || 'EUR'

    // Si pas de prix direct, chercher dans les structures de l'API Pokemon TCG
    if (!price) {
      // Priorité 1 : CardMarket (EUR)
      if (card.cardmarket?.prices?.averageSellPrice) {
        price = card.cardmarket.prices.averageSellPrice
        currency = 'EUR'
      }
      // Priorité 2 : TCGPlayer (USD) - Ordre : holofoil, normal, reverse
      else if (card.tcgplayer?.prices?.holofoil?.market) {
        price = card.tcgplayer.prices.holofoil.market
        currency = 'USD'
      }
      else if (card.tcgplayer?.prices?.normal?.market) {
        price = card.tcgplayer.prices.normal.market
        currency = 'USD'
      }
      else if (card.tcgplayer?.prices?.reverseHolofoil?.market) {
        price = card.tcgplayer.prices.reverseHolofoil.market
        currency = 'USD'
      }
      else if (card.tcgplayer?.prices?.['1stEditionHolofoil']?.market) {
        price = card.tcgplayer.prices['1stEditionHolofoil'].market
        currency = 'USD'
      }
    }
  }

  const condition = card.condition || 'near_mint'

  // Ajuster le prix selon l'état (seulement si pas déjà ajusté)
  if (price && condition && condition !== 'near_mint' && !card._priceAdjusted) {
    // Passer les données CardMarket complètes pour utiliser les vrais prix
    price = calculatePriceByCondition(price, condition, card.cardmarket)
  }

  return formatPrice(price, currency, decimals)
}

/**
 * Formate le prix d'une carte avec état et version spécifiques (override)
 * Utilise les vraies données CardMarket quand disponibles
 * @param {object} card - La carte
 * @param {string} condition - État à utiliser pour le calcul
 * @param {number} decimals - Nombre de décimales
 * @param {string} version - Version de la carte (optionnel)
 * @returns {string} - Prix formaté avec devise
 */
export function formatCardPriceWithCondition(card, condition, decimals = 2, version = null) {
  if (!card) return 'Prix N/A'

  // Si une version est spécifiée, utiliser le prix de cette version
  let basePrice = null
  let currency = 'EUR'

  if (version) {
    const priceByVersion = getPriceByVersion(card, version)
    if (priceByVersion) {
      basePrice = priceByVersion.price
      currency = priceByVersion.currency
    }
  }

  // Sinon, utiliser le prix général ou le premier disponible
  if (!basePrice) {
    basePrice = card.marketPrice || card.value || null
    currency = card.marketPriceCurrency || 'EUR'

    // Si pas de prix direct, chercher dans les structures de l'API Pokemon TCG
    if (!basePrice) {
      // Priorité 1 : CardMarket (EUR)
      if (card.cardmarket?.prices?.averageSellPrice) {
        basePrice = card.cardmarket.prices.averageSellPrice
        currency = 'EUR'
      }
      // Priorité 2 : TCGPlayer (USD)
      else if (card.tcgplayer?.prices?.holofoil?.market) {
        basePrice = card.tcgplayer.prices.holofoil.market
        currency = 'USD'
      }
      // Priorité 3 : TCGPlayer normal
      else if (card.tcgplayer?.prices?.normal?.market) {
        basePrice = card.tcgplayer.prices.normal.market
        currency = 'USD'
      }
      // Priorité 4 : TCGPlayer reverseHolofoil
      else if (card.tcgplayer?.prices?.reverseHolofoil?.market) {
        basePrice = card.tcgplayer.prices.reverseHolofoil.market
        currency = 'USD'
      }
      // Priorité 5 : TCGPlayer 1stEditionHolofoil
      else if (card.tcgplayer?.prices?.['1stEditionHolofoil']?.market) {
        basePrice = card.tcgplayer.prices['1stEditionHolofoil'].market
        currency = 'USD'
      }
    }
  }

  if (!basePrice) return 'Prix N/A'

  // Passer les données CardMarket complètes pour utiliser les vrais prix
  const adjustedPrice = calculatePriceByCondition(basePrice, condition, card.cardmarket)

  return formatPrice(adjustedPrice, currency, decimals)
}

/**
 * Obtient le symbole de devise
 * @param {string} currency - Code de devise (EUR, USD, etc.)
 * @returns {string} - Symbole de devise
 */
export function getCurrencySymbol(currency = 'EUR') {
  return CURRENCY_SYMBOLS[currency] || currency
}
