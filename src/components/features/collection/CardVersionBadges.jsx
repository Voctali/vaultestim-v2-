import { Badge } from '@/components/ui/badge'
import { CosmosHoloBadge } from './CosmosHoloBadge'

/**
 * Mapping des versions vers leurs initiales
 */
const VERSION_INITIALS = {
  'Normale': 'N',
  'Reverse Holo': 'R',
  'Holo': 'H',
  'Holo Cosmos': 'HC',
  'Tampon (logo extension)': 'T',
  'EX': 'EX',
  'Full Art': 'FA',
  'AR': 'AR',
  'Alternate Art': 'AA',
  'Gold': 'G',
  'Méga Hyper Rare': 'MHR'
}

/**
 * Composant pour afficher les initiales des versions possédées d'une carte
 *
 * @param {Object} props
 * @param {string} props.cardId - ID de la carte (pour chercher dans collection)
 * @param {Array} props.collection - Collection complète de l'utilisateur
 * @param {Array} props.instances - Instances de cette carte (si déjà regroupées)
 * @param {Object} props.card - La carte (pour afficher badge Holo Cosmos si c'est une carte de base)
 * @param {boolean} props.isUserCopy - true si c'est dans la collection user (pour badge Holo Cosmos)
 * @param {string} props.className - Classes CSS additionnelles
 */
export function CardVersionBadges({ cardId, collection, instances, card, isUserCopy = false, className = '' }) {
  // Récupérer toutes les instances de cette carte
  const cardInstances = instances || collection.filter(c =>
    (c.card_id === cardId || c.id === cardId)
  )

  if (!cardInstances || cardInstances.length === 0) {
    return null
  }

  // Extraire les versions uniques possédées
  const uniqueVersions = [...new Set(
    cardInstances
      .map(card => card.version)
      .filter(Boolean) // Enlever les null/undefined
  )]

  if (uniqueVersions.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {uniqueVersions.map(version => {
        const initial = VERSION_INITIALS[version] || version.charAt(0).toUpperCase()

        return (
          <Badge
            key={version}
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 bg-primary/20 text-primary border-primary/30"
            title={`Version ${version} dans votre collection`}
          >
            {initial}
          </Badge>
        )
      })}

      {/* Badge Holo Cosmos après les initiales */}
      {card && <CosmosHoloBadge card={card} isUserCopy={isUserCopy} />}
    </div>
  )
}
