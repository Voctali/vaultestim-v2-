import { useMemo } from 'react'
import { useSettings } from '@/hooks/useSettings'

/**
 * Icônes de rareté style Pokémon TCG officiel
 */

// Rond noir avec contour blanc (Common)
function CircleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="currentColor" stroke="white" strokeWidth="1.5" />
    </svg>
  )
}

// Losange/Diamant noir avec contour blanc (Uncommon)
function DiamondIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4L20 12L12 20L4 12Z" fill="currentColor" stroke="white" strokeWidth="1.5" />
    </svg>
  )
}

// Étoile avec contour blanc (Rare, Illustration Rare)
function StarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="white" strokeWidth="1" strokeLinejoin="miter" />
    </svg>
  )
}

// Double étoile avec contour blanc (Double Rare, Ultra Rare, Special Illustration Rare)
function DoubleStarIcon({ className }) {
  return (
    <svg viewBox="0 0 32 24" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Étoile gauche */}
      <path d="M8 2L10.5 7.5L16 8.3L12 12.1L13 17.5L8 14.8L3 17.5L4 12.1L0 8.3L5.5 7.5L8 2Z" fill="currentColor" stroke="white" strokeWidth="1" strokeLinejoin="miter" />
      {/* Étoile droite */}
      <path d="M24 2L26.5 7.5L32 8.3L28 12.1L29 17.5L24 14.8L19 17.5L20 12.1L16 8.3L21.5 7.5L24 2Z" fill="currentColor" stroke="white" strokeWidth="1" strokeLinejoin="miter" />
    </svg>
  )
}

// Triple étoile avec contour blanc (Hyper Rare / Secret Rare)
function TripleStarIcon({ className }) {
  return (
    <svg viewBox="0 0 42 24" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Étoile gauche */}
      <path d="M7 3L9 8L14 8.6L10.5 11.8L11.5 16.5L7 14L2.5 16.5L3.5 11.8L0 8.6L5 8L7 3Z" fill="currentColor" stroke="white" strokeWidth="0.8" strokeLinejoin="miter" />
      {/* Étoile centre */}
      <path d="M21 2L23.5 7.5L29 8.3L25 12.1L26 17.5L21 14.8L16 17.5L17 12.1L13 8.3L18.5 7.5L21 2Z" fill="currentColor" stroke="white" strokeWidth="0.8" strokeLinejoin="miter" />
      {/* Étoile droite */}
      <path d="M35 3L37 8L42 8.6L38.5 11.8L39.5 16.5L35 14L30.5 16.5L31.5 11.8L28 8.6L33 8L35 3Z" fill="currentColor" stroke="white" strokeWidth="0.8" strokeLinejoin="miter" />
    </svg>
  )
}

// Double étoile Noir/Blanc (Black White Rare - SV10.5 Black Bolt / White Flare)
function BlackWhiteStarIcon({ className }) {
  return (
    <svg viewBox="0 0 32 24" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Étoile gauche NOIRE avec contour blanc */}
      <path d="M8 2L10.5 7.5L16 8.3L12 12.1L13 17.5L8 14.8L3 17.5L4 12.1L0 8.3L5.5 7.5L8 2Z" fill="#1f2937" stroke="white" strokeWidth="1" strokeLinejoin="miter" />
      {/* Étoile droite BLANCHE avec contour noir */}
      <path d="M24 2L26.5 7.5L32 8.3L28 12.1L29 17.5L24 14.8L19 17.5L20 12.1L16 8.3L21.5 7.5L24 2Z" fill="white" stroke="#1f2937" strokeWidth="1" strokeLinejoin="miter" />
    </svg>
  )
}

/**
 * Composant d'icônes de rareté avec compteurs individuels
 * Affiche uniquement dans la vue détaillée d'une extension
 *
 * @param {Object} props
 * @param {string} props.setId - ID de l'extension
 * @param {Array} props.collection - Collection de l'utilisateur
 * @param {Array} props.discoveredCards - Toutes les cartes découvertes
 * @param {boolean} props.mastersetMode - Mode Masterset activé
 */
export function RarityProgressIcons({
  setId,
  collection = [],
  discoveredCards = [],
  mastersetMode = false
}) {
  const { settings } = useSettings()

  // Early return if admin disabled rarity icons
  if (settings.showRarityIcons === false) {
    return null
  }

  const rarityStats = useMemo(() => {
    // Filtrer les cartes de l'extension
    const cardsInSet = discoveredCards.filter(card =>
      (card.set?.id === setId || card.extension === setId)
    )

    if (cardsInSet.length === 0) return []

    // Debug: Afficher toutes les raretés uniques trouvées
    const uniqueRarities = new Set(cardsInSet.map(card => card.rarity).filter(Boolean))
    const raritiesArray = Array.from(uniqueRarities).sort()
    console.log(`🎯 [RarityIcons] Extension ${setId} - ${raritiesArray.length} raretés trouvées:`)
    raritiesArray.forEach(r => console.log(`   - "${r}"`))

    // Debug: Afficher le mapping de normalisation
    const rarityMapping = {}
    raritiesArray.forEach(r => {
      rarityMapping[r] = normalizeRarity(r)
    })
    console.log(`🔄 [RarityIcons] Mapping des raretés:`, rarityMapping)

    // Grouper par rareté
    const rarityGroups = {}

    cardsInSet.forEach(card => {
      const rarity = card.rarity || 'Unknown'
      const rarityKey = normalizeRarity(rarity)

      if (!rarityGroups[rarityKey]) {
        rarityGroups[rarityKey] = {
          rarity: rarity,
          icon: getRarityIcon(rarityKey),
          color: getRarityColor(rarityKey),
          totalCards: [],
          ownedCards: new Set()
        }
      }

      rarityGroups[rarityKey].totalCards.push(card.id)

      // Vérifier si l'utilisateur possède cette carte
      const hasCard = collection.some(c =>
        c.card_id === card.id &&
        (c.set?.id === setId || c.extension === setId)
      )

      if (hasCard) {
        rarityGroups[rarityKey].ownedCards.add(card.id)
      }
    })

    // Convertir en tableau et trier par ordre de rareté
    const rarityOrder = ['common', 'uncommon', 'rare', 'rare_holo', 'double_rare', 'black_white_rare', 'ultra_rare', 'illustration_rare', 'special_illustration_rare', 'secret_rare', 'promo']

    return Object.entries(rarityGroups)
      .map(([key, data]) => ({
        key,
        rarity: data.rarity,
        icon: data.icon,
        color: data.color,
        owned: data.ownedCards.size,
        total: data.totalCards.length
      }))
      .sort((a, b) => {
        const indexA = rarityOrder.indexOf(a.key)
        const indexB = rarityOrder.indexOf(b.key)
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })
  }, [setId, collection, discoveredCards, mastersetMode])

  if (rarityStats.length === 0) return null

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {rarityStats.map((stat) => (
        <div
          key={stat.key}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/30"
          title={stat.rarity}
        >
          {stat.icon}
          <span className="text-xs font-medium text-muted-foreground">
            {stat.owned}/{stat.total}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Normalise le nom de rareté pour regroupement
 */
function normalizeRarity(rarity) {
  const lower = rarity.toLowerCase()

  // IMPORTANT: Vérifier du plus spécifique au plus général pour éviter les faux positifs

  // Secret Rare (Rainbow, Gold, Hyper Rare)
  if (lower.includes('secret') || lower.includes('rainbow') || lower.includes('gold') || lower.includes('hyper rare')) {
    return 'secret_rare'
  }

  // Special Illustration Rare (double étoile dorée) - DOIT être vérifié EN PREMIER
  if (
    lower.includes('special illustration rare') ||
    lower.includes('special illustration') ||
    lower.includes('illustration spéciale rare') ||
    lower.includes('illustration speciale rare') ||
    lower.includes('illustration spéciale') ||
    lower.includes('illustration speciale')
  ) {
    return 'special_illustration_rare'
  }

  // Illustration Rare (étoile dorée simple) - APRÈS Special Illustration
  if (lower.includes('illustration rare')) {
    return 'illustration_rare'
  }

  // Ultra Rare (Full Art, V, VMAX, VSTAR, GX, EX Full Art, etc.)
  if (
    lower.includes('ultra rare') ||
    lower.includes('rare ultra')
  ) {
    return 'ultra_rare'
  }

  // Black White Rare (SV10.5 Black Bolt / White Flare)
  if (
    lower.includes('black white rare') ||
    lower.includes('black & white rare') ||
    lower.includes('noir blanc rare') ||
    lower.includes('noir & blanc rare')
  ) {
    return 'black_white_rare'
  }

  // Double Rare (cartes EX, etc.) - AVANT "rare" générique
  if (lower.includes('double rare') || lower === 'double rare') {
    return 'double_rare'
  }

  // Promo
  if (lower.includes('promo')) {
    return 'promo'
  }

  // Rare Holo (toutes les variantes avec "holo" sauf reverse)
  if (
    lower.includes('rare holo') ||
    (lower.includes('holo') && lower.includes('rare') && !lower.includes('reverse'))
  ) {
    return 'rare_holo'
  }

  // Uncommon (vérifier AVANT common)
  if (lower.includes('uncommon') || lower.includes('peu commune')) {
    return 'uncommon'
  }

  // Common
  if (lower.includes('common') || lower.includes('commune')) {
    return 'common'
  }

  // Rare (catch-all pour "rare" sans autre qualificatif)
  if (lower.includes('rare')) {
    return 'rare'
  }

  return 'other'
}

/**
 * Retourne l'icône correspondant à la rareté
 */
function getRarityIcon(rarityKey) {
  switch (rarityKey) {
    case 'common':
      // ● Rond noir
      return <CircleIcon className="w-4 h-4 text-gray-900" />
    case 'uncommon':
      // ◆ Losange noir
      return <DiamondIcon className="w-4 h-4 text-gray-900" />
    case 'rare':
      // ★ Étoile noire
      return <StarIcon className="w-4 h-4 text-gray-900" />
    case 'rare_holo':
      // ★ Étoile noire (même que rare, car holo est visuel de la carte)
      return <StarIcon className="w-4 h-4 text-gray-900" />
    case 'double_rare':
      // ★★ Double étoile noire (cartes EX)
      return <DoubleStarIcon className="w-4 h-4 text-gray-900" />
    case 'black_white_rare':
      // ★(noir)★(blanc) Double étoile Noir/Blanc (Black Bolt / White Flare)
      return <BlackWhiteStarIcon className="w-4 h-4" />
    case 'ultra_rare':
      // ★★ Double étoile grise (Full Art)
      return <DoubleStarIcon className="w-4 h-4 text-gray-400" />
    case 'illustration_rare':
      // ★ Étoile dorée
      return <StarIcon className="w-4 h-4 text-amber-500" />
    case 'special_illustration_rare':
      // ★★ Double étoile dorée
      return <DoubleStarIcon className="w-4 h-4 text-amber-500" />
    case 'secret_rare':
      // ★★★ Triple étoile dorée (Hyper Rare)
      return <TripleStarIcon className="w-4 h-4 text-amber-500" />
    case 'promo':
      // ★ Étoile noire avec badge promo
      return <StarIcon className="w-4 h-4 text-pink-500" />
    default:
      return <CircleIcon className="w-4 h-4 text-gray-400" />
  }
}

/**
 * Retourne la couleur correspondant à la rareté
 */
function getRarityColor(rarityKey) {
  switch (rarityKey) {
    case 'common': return 'text-gray-900'
    case 'uncommon': return 'text-gray-900'
    case 'rare': return 'text-gray-900'
    case 'rare_holo': return 'text-gray-900'
    case 'double_rare': return 'text-gray-900'
    case 'black_white_rare': return 'text-gray-700' // Mixte noir/blanc
    case 'ultra_rare': return 'text-gray-400'
    case 'illustration_rare': return 'text-amber-500'
    case 'special_illustration_rare': return 'text-amber-500'
    case 'secret_rare': return 'text-amber-500'
    case 'promo': return 'text-pink-500'
    default: return 'text-muted-foreground'
  }
}
