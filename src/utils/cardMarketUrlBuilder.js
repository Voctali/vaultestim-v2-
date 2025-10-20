/**
 * Générateur d'URLs CardMarket optimisées
 * Gère les fallbacks et optimisations pour améliorer la précision des recherches
 */

/**
 * Nettoie un nom de carte pour CardMarket
 * - Retire les caractères spéciaux problématiques
 * - Simplifie les noms pour améliorer les résultats
 */
function cleanCardName(name) {
  if (!name) return ''

  return name
    // Conserver les caractères de base et tirets
    .replace(/[^\w\s\-']/g, ' ')
    // Normaliser les espaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Construit l'URL CardMarket optimale pour une carte
 * Utilise plusieurs stratégies de fallback pour maximiser les chances de succès
 *
 * @param {object} card - La carte avec cardmarket, name, number, set
 * @param {string} strategy - 'direct' | 'set-precise' | 'precise' | 'simple' | 'minimal' | 'number'
 * @returns {string} - URL CardMarket
 */
export function buildCardMarketUrl(card, strategy = 'auto') {
  if (!card) return null

  // Priorité 1 : URL directe de l'API (TOUJOURS la plus rapide et précise)
  if (card.cardmarket?.url) {
    return card.cardmarket.url
  }

  // Si pas d'URL directe, construire une recherche optimisée
  const cleanName = cleanCardName(card.name)
  const setName = card.set?.name || card.extension || ''
  const number = card.number || ''

  // Stratégie automatique : choisir la meilleure approche
  if (strategy === 'auto') {
    // Si on a un numéro, utiliser recherche précise (nom + numéro)
    // Note: On n'inclut PAS l'extension par défaut car CardMarket peut utiliser
    // des noms d'extensions différents (ex: "BW - Boundaries Crossed" vs "Boundaries Crossed")
    if (number) {
      strategy = 'precise'
    } else {
      strategy = 'simple'
    }
  }

  let searchString = ''

  switch (strategy) {
    case 'set-precise':
      // NOUVEAU : Recherche ultra-précise avec nom + numéro + code extension
      // Utilise le code court de l'extension (ex: "BW4") au lieu du nom complet
      // pour éviter les problèmes de nommage différent sur CardMarket
      // Exemple: "Amoonguss 11 BW4" au lieu de "Amoonguss 11 Boundaries Crossed"
      searchString = `${cleanName} ${number}`
      if (card.set?.id) {
        // Préférer le code court (bw4 → BW4)
        searchString += ` ${card.set.id.toUpperCase()}`
      } else if (setName) {
        // Fallback sur le nom complet si pas de code
        searchString += ` ${setName}`
      }
      break

    case 'precise':
      // Recherche précise avec nom + numéro (sans extension)
      // Plus précis mais peut retourner plusieurs résultats si le même Pokémon
      // a le même numéro dans différentes extensions
      searchString = cleanName
      if (number) searchString += ` ${number}`
      break

    case 'simple':
      // Recherche simple par nom uniquement
      // Plus de résultats mais moins précis
      searchString = cleanName
      break

    case 'minimal':
      // Recherche minimale : juste le nom de base sans suffixes (ex: "Pikachu" au lieu de "Pikachu V")
      // Utile pour les cartes avec variantes
      searchString = cleanName.split(' ')[0]
      break

    case 'number':
      // Recherche par numéro + extension (utile si le nom est problématique)
      if (number && setName) {
        searchString = `${number} ${setName}`
      } else {
        searchString = cleanName
      }
      break

    default:
      searchString = cleanName
  }

  // Encoder pour l'URL
  const encodedSearch = encodeURIComponent(searchString.trim())

  // IMPORTANT : Utiliser /Products/Search (recherche globale rapide)
  // au lieu de /Products/Singles (catalogue complet très lent)
  return `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodedSearch}`
}

/**
 * Génère plusieurs URLs de fallback pour une carte
 * Utile pour tester différentes stratégies si la première échoue
 *
 * @param {object} card - La carte
 * @returns {array} - Liste d'objets {url, strategy, label}
 */
export function buildCardMarketFallbackUrls(card) {
  const urls = []

  // URL directe (si disponible)
  if (card.cardmarket?.url) {
    urls.push({
      url: card.cardmarket.url,
      strategy: 'direct',
      label: 'Lien direct API',
      speed: 'fast'
    })
  }

  // Recherche ultra-précise avec code d'extension (ex: "Pikachu 25 SV3")
  // Utile si la recherche précise retourne trop de résultats
  if (card.number && (card.set?.id || card.set?.name || card.extension)) {
    const setCode = card.set?.id ? card.set.id.toUpperCase() : (card.set?.name || card.extension)
    urls.push({
      url: buildCardMarketUrl(card, 'set-precise'),
      strategy: 'set-precise',
      label: `${card.name} ${card.number} ${setCode}`,
      speed: 'medium',
      recommended: false // Pas recommandé par défaut car peut ne pas matcher CardMarket
    })
  }

  // Recherche précise (nom + numéro sans extension) - RECOMMANDÉ
  // C'est le meilleur compromis entre précision et compatibilité
  if (card.number) {
    urls.push({
      url: buildCardMarketUrl(card, 'precise'),
      strategy: 'precise',
      label: `${card.name} ${card.number}`,
      speed: 'medium',
      recommended: true
    })
  }

  // Recherche par numéro + extension (sans nom de Pokémon)
  if (card.number && card.set?.name) {
    urls.push({
      url: buildCardMarketUrl(card, 'number'),
      strategy: 'number',
      label: `#${card.number} ${card.set.name}`,
      speed: 'medium'
    })
  }

  // Recherche simple (nom uniquement)
  urls.push({
    url: buildCardMarketUrl(card, 'simple'),
    strategy: 'simple',
    label: card.name,
    speed: 'medium'
  })

  // Recherche minimale (nom de base seulement)
  urls.push({
    url: buildCardMarketUrl(card, 'minimal'),
    strategy: 'minimal',
    label: card.name.split(' ')[0],
    speed: 'medium'
  })

  return urls
}

/**
 * Génère une string de recherche pour copier-coller manuel
 * Format optimisé pour CardMarket
 *
 * @param {object} card - La carte
 * @returns {string} - String de recherche optimale
 */
export function getCardMarketSearchString(card) {
  const cleanName = cleanCardName(card.name)
  const parts = [cleanName]

  // Ajouter le numéro (sans #) pour meilleure compatibilité
  if (card.number) parts.push(card.number)

  // Note: On n'ajoute PAS l'extension par défaut car CardMarket peut utiliser
  // des noms différents. L'utilisateur peut l'ajouter manuellement si besoin.

  return parts.join(' ')
}

/**
 * Estime le temps de chargement d'une URL CardMarket
 * Basé sur le type d'URL et la stratégie
 *
 * @param {object} card - La carte
 * @param {string} strategy - La stratégie utilisée
 * @returns {string} - Estimation : 'fast' | 'medium' | 'slow'
 */
export function estimateCardMarketLoadTime(card, strategy = 'auto') {
  // URL directe de l'API = rapide (page spécifique)
  if (card.cardmarket?.url) return 'fast'

  // Recherche = moyen (environ 5-15 secondes)
  // Note : CardMarket peut être lent à cause de leur système anti-bot
  return 'medium'
}
