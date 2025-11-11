/**
 * Détermine les versions disponibles pour une carte selon sa rareté
 *
 * Règles :
 * - Cartes normales : Normale, Reverse Holo, Holo, Holo Cosmos, Tampon
 * - Cartes EX (★★ noires) : Uniquement "EX"
 * - Full Art (★★ grises) : Uniquement "Full Art"
 * - AR (★ dorée) : Uniquement "AR"
 * - Alternative (★★ dorées) : Uniquement "Alternate Art"
 * - Gold (★★★ dorées) : Uniquement "Gold"
 *
 * @param {Object} card - La carte
 * @returns {Array} Liste des versions disponibles { value, label }
 */
export function getAvailableVersions(card) {
  if (!card) return []

  const rarity = card.rarity?.toLowerCase() || ''
  const name = card.name?.toLowerCase() || ''

  // Détection des raretés spéciales
  // EX (2 étoiles noires)
  if (
    rarity.includes('rare ultra') ||
    rarity.includes('ultra rare') ||
    name.includes(' ex') ||
    name.includes('-ex')
  ) {
    return [{ value: 'EX', label: 'EX (★★ noires)' }]
  }

  // Full Art (2 étoiles grises)
  if (
    rarity.includes('rare holo gx') ||
    rarity.includes('rare holo v') ||
    rarity.includes('rare holo vmax') ||
    rarity.includes('full art') ||
    name.includes('full art')
  ) {
    return [{ value: 'Full Art', label: 'Full Art (★★ grises)' }]
  }

  // AR - Illustration Rare (1 étoile dorée)
  if (
    rarity.includes('illustration rare') ||
    rarity === 'rare illustration' ||
    rarity === 'illustration'
  ) {
    return [{ value: 'AR', label: 'AR (★ dorée)' }]
  }

  // Alternate Art (2 étoiles dorées)
  if (
    rarity.includes('special illustration rare') ||
    rarity.includes('alternate') ||
    rarity.includes('alt art') ||
    name.includes('alt art')
  ) {
    return [{ value: 'Alternate Art', label: 'Alternate Art (★★ dorées)' }]
  }

  // Gold (3 étoiles dorées)
  if (
    rarity.includes('hyper rare') ||
    rarity.includes('secret rare') ||
    rarity.includes('rainbow rare') ||
    rarity.includes('gold')
  ) {
    return [{ value: 'Gold', label: 'Gold (★★★ dorées)' }]
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
