import { Badge } from '@/components/ui/badge'

/**
 * Badge pour indiquer les versions Holo Cosmos
 *
 * @param {Object} props
 * @param {Object} props.card - La carte à vérifier
 * @param {boolean} props.isUserCopy - true si c'est un exemplaire de collection, false si base commune
 * @param {string} props.className - Classes CSS additionnelles
 */
export function CosmosHoloBadge({ card, isUserCopy = false, className = '' }) {
  // Vérifier si le badge doit être affiché
  const shouldShow = isUserCopy
    ? card?.version === 'Holo Cosmos'  // Exemplaire user avec version Holo Cosmos
    : card?.has_cosmos_holo === true // Carte existe en version cosmos

  if (!shouldShow) return null

  return (
    <Badge
      className={`
        bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600
        dark:from-purple-500 dark:via-pink-400 dark:to-purple-500
        text-white
        border-purple-400 dark:border-purple-300
        shadow-lg shadow-purple-500/50
        animate-pulse
        ${className}
      `}
      variant="outline"
    >
      ✨ Holo Cosmos
    </Badge>
  )
}
