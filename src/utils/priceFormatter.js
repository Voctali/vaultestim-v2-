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

  let price = card.marketPrice || card.value || null
  const currency = card.marketPriceCurrency || 'EUR'
  const condition = card.condition || 'near_mint'

  // Ajuster le prix selon l'état (seulement si pas déjà ajusté)
  if (price && condition && condition !== 'near_mint' && !card._priceAdjusted) {
    // Passer les données CardMarket complètes pour utiliser les vrais prix
    price = calculatePriceByCondition(price, condition, card.cardMarketPrice)
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

  const basePrice = card.marketPrice || card.value || null
  const currency = card.marketPriceCurrency || 'EUR'

  if (!basePrice) return 'Prix N/A'

  // Passer les données CardMarket complètes pour utiliser les vrais prix
  const adjustedPrice = calculatePriceByCondition(basePrice, condition, card.cardMarketPrice)

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
