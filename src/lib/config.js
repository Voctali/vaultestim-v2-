/**
 * Configuration centralisée de l'application
 */

export const config = {
  // URL de l'API backend
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',

  // Clé API RapidAPI pour Pokemon TCG
  RAPIDAPI_KEY: import.meta.env.VITE_RAPIDAPI_KEY,

  // URLs externes RapidAPI
  RAPIDAPI_BASE: 'https://pokemon-tcg-card-prices.p.rapidapi.com',

  // Configuration cache
  CACHE_DURATION: {
    CARDS: 30 * 60 * 1000, // 30 minutes
    SEARCH: 10 * 60 * 1000, // 10 minutes
    SETS: 60 * 60 * 1000,   // 1 heure
  },

  // Limites
  SEARCH_LIMIT_DEFAULT: 50,
  SEARCH_LIMIT_MAX: 250,

  // Environnement
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}