/**
 * Détermine les versions disponibles pour une carte selon sa rareté
 *
 * Règles :
 * - Cartes normales : Normale, Reverse Holo, Holo, Holo Cosmos, Tampon
 * - Cartes Promo : Uniquement "Promo"
 * - Cartes ACE SPEC RARE : Uniquement "Normale"
 * - Cartes EX (★★ noires) : Uniquement "EX"
 * - Full Art (★★ grises) : Uniquement "Full Art"
 * - AR (★ dorée) : Uniquement "AR"
 * - Alternative (★★ dorées) : Uniquement "Alternate Art"
 * - Gold (★★★ dorées) : Uniquement "Gold"
 * - Méga Hyper Rare (★ noire/dorée) : Uniquement "Méga Hyper Rare"
 * - Cas spéciaux :
 *   - Miascarade 15/198, Flamigator 38/198, Plamaval 54/198 Scarlet & Violet (versions normales + Holo étoile)
 *   - Amphinobi EX 106/167 Twilight Mascarade (versions EX + Métal)
 *   - Kyurem EX 048/191 Surging Sparks (versions EX + Tampon)
 * - Extensions spéciales SV8.5, SV10.5 :
 *   - Prismatic Evolution / Évolutions Prismatiques (SV8.5 = sv8pt5)
 *   - Black Bolt / Foudre Noire (SV10.5 = zsv10pt5)
 *   - White Flare / Flamme Blanche (SV10.5 = zsv10pt5)
 *   → Cartes Common/Uncommon/Rare ont Reverse (Pokéball) + Reverse (Masterball)
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

  // 0. PRIORITÉ MAX : Extensions spéciales avec Reverse Pokéball/Masterball
  // DOIT être vérifié EN PREMIER pour cartes Common/Uncommon/Rare de Prismatic Evolution, Black Bolt, White Flare
  const specialSets = [
    'sv8pt5', // Prismatic Evolution (ID réel trouvé)
    'zsv10pt5', // Black Bolt + White Flare (ID réel trouvé)
    'black bolt', 'foudre noire', 'foudre-noire',
    'white flare', 'flamme blanche', 'flamme-blanche',
    'prismatic evolution', 'evolutions prismatiques', 'évolutions prismatiques'
  ]
  const isSpecialSet = specialSets.some(set =>
    setId.includes(set) || setName.includes(set)
  )

  // Cartes Common/Uncommon/Rare des extensions spéciales avec Reverse Pokéball/Masterball
  const isBasicRarity = rarity.includes('common') || rarity.includes('uncommon') ||
    rarity.includes('commune') || rarity.includes('peu commune') ||
    (rarity.includes('rare') && !rarity.includes('ultra') && !rarity.includes('secret') &&
     !rarity.includes('illustration') && !rarity.includes('hyper') && !rarity.includes('ace spec'))

  if (isSpecialSet && isBasicRarity) {
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

  // 1. Cartes Promo - Rareté unique
  if (rarity.includes('promo')) {
    return [{ value: 'Promo', label: 'Promo' }]
  }

  // 1b. Cartes ACE SPEC RARE - Uniquement version Normale
  if (rarity.includes('ace spec') || rarity.includes('ace-spec')) {
    return [{ value: 'Normale', label: 'Normale' }]
  }

  // 2. Cas spécial : Starters Scarlet & Violet avec Holo étoile
  // Miascarade 15/198, Flamigator 38/198, Plamaval 54/198
  const isScarletVioletBase = setId.includes('sv1') || setId.includes('sv01') ||
    setName.includes('scarlet & violet') || setName.includes('écarlate et violet')

  if (isScarletVioletBase) {
    // Miascarade / Meowscarada 15/198
    if ((name.includes('meowscarada') || name.includes('miascarade')) && number === '15') {
      return [
        { value: 'Normale', label: 'Normale' },
        { value: 'Reverse Holo', label: 'Reverse Holo' },
        { value: 'Holo', label: 'Holo' },
        { value: 'Holo étoile', label: 'Holo étoile ⭐' },
        { value: 'Holo Cosmos', label: '✨ Holo Cosmos' },
        { value: 'Tampon (logo extension)', label: 'Tampon (logo extension)' }
      ]
    }
    // Flamigator / Skeledirge 38/198
    if ((name.includes('skeledirge') || name.includes('flamigator')) && number === '38') {
      return [
        { value: 'Normale', label: 'Normale' },
        { value: 'Reverse Holo', label: 'Reverse Holo' },
        { value: 'Holo', label: 'Holo' },
        { value: 'Holo étoile', label: 'Holo étoile ⭐' },
        { value: 'Holo Cosmos', label: '✨ Holo Cosmos' },
        { value: 'Tampon (logo extension)', label: 'Tampon (logo extension)' }
      ]
    }
    // Plamaval / Quaquaval 54/198
    if ((name.includes('quaquaval') || name.includes('plamaval')) && number === '54') {
      return [
        { value: 'Normale', label: 'Normale' },
        { value: 'Reverse Holo', label: 'Reverse Holo' },
        { value: 'Holo', label: 'Holo' },
        { value: 'Holo étoile', label: 'Holo étoile ⭐' },
        { value: 'Holo Cosmos', label: '✨ Holo Cosmos' },
        { value: 'Tampon (logo extension)', label: 'Tampon (logo extension)' }
      ]
    }
  }

  // 3. Cas spécial : Amphinobi EX 106/167 (Twilight Mascarade) - Version Métal
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

  // 3. Cas spécial : Kyurem EX 048/191 (Surging Sparks) - Version Tampon
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

  // 4. Méga Hyper Rare (M-Pokémon-EX avec Hyper Rare) - ★ noire/dorée
  if (
    (name.includes('m ') || name.includes('mega ') || name.startsWith('m-')) &&
    rarity.includes('hyper rare')
  ) {
    return [{ value: 'Méga Hyper Rare', label: 'Méga Hyper Rare (★ noire/dorée)' }]
  }

  // 5. Gold / Hyper Rare (3 étoiles dorées ou Rainbow)
  if (
    rarity.includes('hyper rare') ||
    rarity.includes('secret rare') ||
    rarity.includes('rainbow rare') ||
    rarity.includes('gold')
  ) {
    return [{ value: 'Gold', label: 'Gold (★★★ dorées)' }]
  }

  // 6. Alternate Art / Special Illustration Rare (2 étoiles dorées)
  if (
    rarity.includes('special illustration rare') ||
    rarity.includes('alternate') ||
    rarity.includes('alt art') ||
    name.includes('alt art')
  ) {
    return [{ value: 'Alternate Art', label: 'Alternate Art (★★ dorées)' }]
  }

  // 7. AR - Illustration Rare (1 étoile dorée)
  if (
    rarity.includes('illustration rare') ||
    rarity === 'rare illustration' ||
    rarity === 'illustration'
  ) {
    return [{ value: 'AR', label: 'AR (★ dorée)' }]
  }

  // 8. Full Art (2 étoiles grises) - GX, V, VMAX, VSTAR
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

  // 9. EX (2 étoiles noires) - Uniquement les vraies cartes EX
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
