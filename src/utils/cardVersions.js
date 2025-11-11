/**
 * Détermine les versions disponibles pour une carte selon sa rareté
 *
 * Règles :
 * - Cartes normales : Normale, Reverse Holo, Holo, Holo Cosmos, Tampon
 * - Cartes Promo : Uniquement "Promo"
 * - Cartes EX (★★ noires) : Uniquement "EX"
 * - Full Art (★★ grises) : Uniquement "Full Art"
 * - AR (★ dorée) : Uniquement "AR"
 * - Alternative (★★ dorées) : Uniquement "Alternate Art"
 * - Gold (★★★ dorées) : Uniquement "Gold"
 * - Méga Hyper Rare (★ noire/dorée) : Uniquement "Méga Hyper Rare"
 *
 * @param {Object} card - La carte
 * @returns {Array} Liste des versions disponibles { value, label }
 */
export function getAvailableVersions(card) {
  if (!card) return []

  const rarity = card.rarity?.toLowerCase() || ''
  const name = card.name?.toLowerCase() || ''

  // Détection des raretés spéciales
  // ORDRE IMPORTANT: Du plus spécifique au plus général

  // 0. Cartes Promo - Rareté unique
  if (rarity.includes('promo')) {
    return [{ value: 'Promo', label: 'Promo' }]
  }

  // 1. Méga Hyper Rare (M-Pokémon-EX avec Hyper Rare) - ★ noire/dorée
  if (
    (name.includes('m ') || name.includes('mega ') || name.startsWith('m-')) &&
    rarity.includes('hyper rare')
  ) {
    return [{ value: 'Méga Hyper Rare', label: 'Méga Hyper Rare (★ noire/dorée)' }]
  }

  // 2. Gold / Hyper Rare (3 étoiles dorées ou Rainbow)
  if (
    rarity.includes('hyper rare') ||
    rarity.includes('secret rare') ||
    rarity.includes('rainbow rare') ||
    rarity.includes('gold')
  ) {
    return [{ value: 'Gold', label: 'Gold (★★★ dorées)' }]
  }

  // 3. Alternate Art / Special Illustration Rare (2 étoiles dorées)
  if (
    rarity.includes('special illustration rare') ||
    rarity.includes('alternate') ||
    rarity.includes('alt art') ||
    name.includes('alt art')
  ) {
    return [{ value: 'Alternate Art', label: 'Alternate Art (★★ dorées)' }]
  }

  // 4. AR - Illustration Rare (1 étoile dorée)
  if (
    rarity.includes('illustration rare') ||
    rarity === 'rare illustration' ||
    rarity === 'illustration'
  ) {
    return [{ value: 'AR', label: 'AR (★ dorée)' }]
  }

  // 5. Full Art (2 étoiles grises) - GX, V, VMAX, VSTAR
  if (
    rarity.includes('rare holo gx') ||
    rarity.includes('rare holo v') ||
    rarity.includes('rare holo vmax') ||
    rarity.includes('rare holo vstar') ||
    rarity.includes('full art') ||
    name.includes('full art') ||
    name.includes(' gx') ||
    name.includes('-gx') ||
    (name.includes(' v') && !name.includes(' vmax') && !name.includes(' vstar')) ||
    (name.includes('-v') && !name.includes('-vmax') && !name.includes('-vstar')) ||
    name.includes(' vmax') ||
    name.includes('-vmax') ||
    name.includes(' vstar') ||
    name.includes('-vstar')
  ) {
    return [{ value: 'Full Art', label: 'Full Art (★★ grises)' }]
  }

  // 6. EX (2 étoiles noires) - Uniquement les vraies cartes EX
  if (
    name.includes(' ex') ||
    name.includes('-ex')
  ) {
    return [{ value: 'EX', label: 'EX (★★ noires)' }]
  }

  // Cartes normales : toutes les versions standard
  return [
    { value: 'Normale', label: 'Normale' },
    { value: 'Reverse Holo', label: 'Reverse Holo' },
    { value: 'Holo', label: 'Holo' },
    { value: 'Holo Cosmos', label: '✨ Holo Cosmos' },
    { value: 'Tampon (logo extension)', label: 'Tampon (logo extension)' }
  ]
}

/**
 * Obtient la version par défaut pour une carte
 * @param {Object} card - La carte
 * @returns {string} Version par défaut
 */
export function getDefaultVersion(card) {
  const versions = getAvailableVersions(card)
  return versions.length > 0 ? versions[0].value : 'Normale'
}
