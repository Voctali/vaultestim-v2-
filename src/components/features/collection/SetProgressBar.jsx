import { useMemo } from 'react'

/**
 * Composant de barre de progression pour une extension
 * Affiche le nombre de cartes possédées / total avec une barre de progression dorée
 *
 * @param {Object} props
 * @param {string} props.setId - ID de l'extension (ex: "sv8", "base1")
 * @param {Array} props.collection - Collection de l'utilisateur
 * @param {Array} props.discoveredCards - Toutes les cartes découvertes dans la base
 * @param {boolean} props.mastersetMode - Mode Masterset activé (toutes les versions)
 * @param {string} props.size - Taille de la barre ("small", "medium", "large")
 */
export function SetProgressBar({
  setId,
  collection = [],
  discoveredCards = [],
  mastersetMode = false,
  size = 'medium'
}) {
  const progress = useMemo(() => {
    // Filtrer les cartes de l'extension dans discovered_cards (total disponible)
    const totalCardsInSet = discoveredCards.filter(card =>
      (card.set?.id === setId || card.extension === setId)
    )

    if (totalCardsInSet.length === 0) {
      return {
        owned: 0,
        total: 0,
        percentage: 0
      }
    }

    if (mastersetMode) {
      // MODE MASTERSET : Compter toutes les versions de chaque carte
      let totalVersionsOwned = 0
      let totalVersionsPossible = 0

      totalCardsInSet.forEach(card => {
        // Filtrer les cartes de la collection pour cette carte spécifique
        const userCopies = collection.filter(c =>
          c.card_id === card.id &&
          (c.set?.id === setId || c.extension === setId)
        )

        // Obtenir les versions disponibles pour cette carte
        const availableVersions = getAvailableVersionsForCard(card)
        totalVersionsPossible += availableVersions.length

        // Compter combien de versions l'utilisateur possède
        const ownedVersions = new Set(userCopies.map(c => c.version || 'Normale'))
        totalVersionsOwned += ownedVersions.size
      })

      const percentage = totalVersionsPossible > 0
        ? (totalVersionsOwned / totalVersionsPossible) * 100
        : 0

      return {
        owned: totalVersionsOwned,
        total: totalVersionsPossible,
        percentage: Math.round(percentage)
      }
    } else {
      // MODE BASE : Compter 1 exemplaire par carte unique (peu importe les versions)
      const ownedCardIds = new Set(
        collection
          .filter(c => c.set?.id === setId || c.extension === setId)
          .map(c => c.card_id)
      )

      const owned = ownedCardIds.size
      const total = totalCardsInSet.length
      const percentage = total > 0 ? (owned / total) * 100 : 0

      return {
        owned,
        total,
        percentage: Math.round(percentage)
      }
    }
  }, [setId, collection, discoveredCards, mastersetMode])

  // Tailles de barre
  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  }

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }

  const barHeight = sizeClasses[size] || sizeClasses.medium
  const textSize = textSizeClasses[size] || textSizeClasses.medium

  return (
    <div className="w-full space-y-1">
      {/* Barre de progression */}
      <div className="relative w-full bg-secondary/50 rounded-full overflow-hidden" style={{ height: barHeight === 'h-2' ? '8px' : barHeight === 'h-3' ? '12px' : '16px' }}>
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-500 ease-out"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Compteur et pourcentage */}
      <div className={`flex items-center justify-end gap-2 ${textSize} font-medium`}>
        <span className="text-muted-foreground">
          {progress.owned}/{progress.total}
        </span>
        <span className="text-primary">
          {progress.percentage}%
        </span>
      </div>
    </div>
  )
}

/**
 * Obtient les versions disponibles pour une carte (simplifié)
 * TODO: Utiliser la vraie logique de cardVersions.js
 */
function getAvailableVersionsForCard(card) {
  const rarity = card.rarity?.toLowerCase() || ''
  const name = card.name?.toLowerCase() || ''

  // Cartes spéciales avec version unique
  if (
    rarity.includes('promo') ||
    rarity.includes('ace spec') ||
    rarity.includes('double rare') ||
    name.includes(' ex') ||
    name.includes('-ex') ||
    rarity.includes('illustration rare') ||
    rarity.includes('special illustration') ||
    rarity.includes('hyper rare') ||
    rarity.includes('secret rare')
  ) {
    return ['Unique']
  }

  // Cartes normales avec toutes les versions possibles
  return ['Normale', 'Reverse Holo', 'Holo', 'Holo Cosmos', 'Tampon']
}
