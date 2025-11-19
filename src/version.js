/**
 * Version de l'application VaultEstim
 *
 * Format: MAJOR.MINOR.PATCH
 * - MAJOR: Changements incompatibles ou refonte majeure
 * - MINOR: Nouvelles fonctionnalités rétrocompatibles
 * - PATCH: Corrections de bugs
 *
 * Historique:
 * - 1.0.0 (18/11/2025): Version initiale stable
 *   - Gestion de collection de cartes Pokémon
 *   - Système hybride de prix (RapidAPI + Pokemon TCG API)
 *   - Catalogue produits scellés CardMarket
 *   - Cache IndexedDB avec synchronisation Supabase
 *   - Traductions FR/EN (1060+ Pokémon, 230+ Dresseurs)
 *   - Authentification Supabase
 */

export const APP_VERSION = '1.1.2'
export const APP_NAME = 'VaultEstim'
export const BUILD_DATE = '2025-11-19'

// Pour affichage complet
export const getFullVersion = () => `${APP_NAME} v${APP_VERSION}`

// Pour vérification de mise à jour (comparaison sémantique)
export const parseVersion = (version) => {
  const [major, minor, patch] = version.split('.').map(Number)
  return { major, minor, patch }
}

export const compareVersions = (v1, v2) => {
  const a = parseVersion(v1)
  const b = parseVersion(v2)

  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  return a.patch - b.patch
}
