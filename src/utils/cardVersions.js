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
 * - Cas spéciaux :
 *   - Amphinobi EX 106/167 Twilight Mascarade (versions EX + Métal)
 *   - Kyurem EX 048/191 Surging Sparks (versions EX + Tampon)
 * - Extensions spéciales SV8.5, SV11B, SV11W :
 *   - Prismatic Evolution / Évolutions Prismatiques (SV8.5)
 *   - Black Bolt / Foudre Noire (SV11B)
 *   - White Flare / Flamme Blanche (SV11W)
 *   → Cartes Common/Uncommon ont Reverse (Pokéball) + Reverse (Masterball)
 *
 * @param {Object} card - La carte
 * @returns {Array} Liste des versions disponibles { value, label }
 */
export function getAvailableVersions(card) {
  if (!card) return []

  const rarity = card.rarity?.toLowerCase() || ''
  const name = card.name?.toLowerCase() || ''
  const number = card.number || ''
  const setId = card.set?.id?.toLowerCase() || card.extension?.toLowerCase() || ''
  const setName = card.set?.name?.toLowerCase() || card.extension?.toLowerCase() || ''

  // Détection des raretés spéciales
  // ORDRE IMPORTANT: Du plus spécifique au plus général

  // 0. Cartes Promo - Rareté unique
  if (rarity.includes('promo')) {
    return [{ value: 'Promo', label: 'Promo' }]
  }

  // 0.1. Cas spécial : Amphinobi EX 106/167 (Twilight Mascarade) - Version Métal
  if (
    (name.includes('greninja') || name.includes('amphinobi')) &&
    name.includes('ex') &&
    number === '106' &&
    (setName.includes('twilight masquerade') || setName.includes('mascarade') || setId.includes('tmp'))
  ) {
    return [
      { value: 'EX', label: 'EX (★★ noires)' },
      { value: 'Métal', label: 'Métal' }
    ]
  }

  // 0.2. Cas spécial : Kyurem EX 048/191 (Surging Sparks) - Version Tampon
  if (
    (name.includes('kyurem') || name.includes('hekran')) &&
    name.includes('ex') &&
    number === '048' &&
    (setName.includes('surging sparks') || setId.includes('sv08') || setId.includes('ssp'))
  ) {
    return [
      { value: 'EX', label: 'EX (★★ noires)' },
      { value: 'Tampon (logo extension)', label: 'Tampon (logo extension)' }
    ]
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

  // 7. Cas spécial : Extensions Black Bolt, White Flare, Prismatic Evolution
  // Pour les cartes Common et Uncommon : ajouter Reverse (Pokéball) et Reverse (Masterball)
  const specialSets = [
    'sv8.5', 'sv85', 'sv8-5', // Prismatic Evolution / Évolutions Prismatiques
    'sv11b', 'sv-11b', // Black Bolt / Foudre Noire
    'sv11w', 'sv-11w', // White Flare / Flamme Blanche
    'black bolt', 'foudre noire', 'foudre-noire',
    'white flare', 'flamme blanche', 'flamme-blanche',
    'prismatic evolution', 'evolutions prismatiques', 'évolutions prismatiques'
  ]
  const isSpecialSet = specialSets.some(set =>
    setId.includes(set) || setName.includes(set)
  )

  if (
    isSpecialSet &&
    (rarity.includes('common') || rarity.includes('uncommon'))
  ) {
    return [
      { value: 'Normale', label: 'Normale' },
      { value: 'Reverse Holo', label: 'Reverse Holo' },
      { value: 'Reverse (Pokéball)', label: 'Reverse (Pokéball)' },
      { value: 'Reverse (Masterball)', label: 'Reverse (Masterball)' },
      { value: 'Holo', label: 'Holo' },
      { value: 'Holo Cosmos', label: '✨ Holo Cosmos' },
      { value: 'Tampon (logo extension)', label: 'Tampon (logo extension)' }
    ]
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
