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
 * Formate le prix d'une carte en utilisant ses propriétés
 * Prend en compte l'état de la carte si disponible
 * Utilise les vraies données CardMarket quand disponibles
 * @param {object} card - La carte avec marketPrice, marketPriceCurrency, condition, cardMarketPrice
 * @param {number} decimals - Nombre de décimales
 * @returns {string} - Prix formaté avec devise
 */
export function formatCardPrice(card, decimals = 2) {
  if (!card) return 'Prix N/A'

  // Debug: afficher la structure de la carte (seulement pour les 3 premières cartes)
  if (!window._priceDebugCount) window._priceDebugCount = 0
  if (window._priceDebugCount < 3) {
    console.log('💰 [formatCardPrice] Debug carte:', {
      name: card.name,
      marketPrice: card.marketPrice,
      value: card.value,
      cardmarket: card.cardmarket,
      tcgplayer: card.tcgplayer,
      allKeys: Object.keys(card)
    })
    window._priceDebugCount++
  }

  // Essayer d'extraire le prix depuis différentes sources
  let price = card.marketPrice || card.value || null
  let currency = card.marketPriceCurrency || 'EUR'

  // Si pas de prix direct, chercher dans les structures de l'API Pokemon TCG
  if (!price) {
    // Priorité 1 : CardMarket (EUR)
    if (card.cardmarket?.prices?.averageSellPrice) {
      price = card.cardmarket.prices.averageSellPrice
      currency = 'EUR'
      console.log(`💰 Prix trouvé (CardMarket): ${price}€ pour ${card.name}`)
    }
    // Priorité 2 : TCGPlayer (USD)
    else if (card.tcgplayer?.prices?.holofoil?.market) {
      price = card.tcgplayer.prices.holofoil.market
      currency = 'USD'
      console.log(`💰 Prix trouvé (TCGPlayer holofoil): ${price}$ pour ${card.name}`)
    }
    // Priorité 3 : TCGPlayer normal
    else if (card.tcgplayer?.prices?.normal?.market) {
      price = card.tcgplayer.prices.normal.market
      currency = 'USD'
      console.log(`💰 Prix trouvé (TCGPlayer normal): ${price}$ pour ${card.name}`)
    }
    // Priorité 4 : TCGPlayer reverseHolofoil
    else if (card.tcgplayer?.prices?.reverseHolofoil?.market) {
      price = card.tcgplayer.prices.reverseHolofoil.market
      currency = 'USD'
      console.log(`💰 Prix trouvé (TCGPlayer reverse): ${price}$ pour ${card.name}`)
    }
    // Priorité 5 : TCGPlayer 1stEditionHolofoil
    else if (card.tcgplayer?.prices?.['1stEditionHolofoil']?.market) {
      price = card.tcgplayer.prices['1stEditionHolofoil'].market
      currency = 'USD'
      console.log(`💰 Prix trouvé (TCGPlayer 1st): ${price}$ pour ${card.name}`)
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
 * Formate le prix d'une carte avec état spécifique (override)
 * Utilise les vraies données CardMarket quand disponibles
 * @param {object} card - La carte
 * @param {string} condition - État à utiliser pour le calcul
 * @param {number} decimals - Nombre de décimales
 * @returns {string} - Prix formaté avec devise
 */
export function formatCardPriceWithCondition(card, condition, decimals = 2) {
  if (!card) return 'Prix N/A'

  // Essayer d'extraire le prix depuis différentes sources
  let basePrice = card.marketPrice || card.value || null
  let currency = card.marketPriceCurrency || 'EUR'

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
