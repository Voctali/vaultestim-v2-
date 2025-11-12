import { Badge } from '@/components/ui/badge'
import { CosmosHoloBadge } from './CosmosHoloBadge'

/**
 * Mapping des versions vers leurs initiales
 */
const VERSION_INITIALS = {
  'Normale': 'N',
  'Reverse Holo': 'R',
  'Reverse (Pokéball)': 'RPB',
  'Reverse (Masterball)': 'RMB',
  'Holo': 'H',
  'Holo Cosmos': 'HC',
  'Tampon (logo extension)': 'T',
  'Promo': 'P',
  'EX': 'EX',
  'Métal': 'M',
  'Full Art': 'FA',
  'AR': 'AR',
  'Alternate Art': 'AA',
  'Gold': 'G',
  'Méga Hyper Rare': 'MHR'
}

/**
 * Ordre d'affichage des versions (pour le tri)
 */
const VERSION_ORDER = [
  'Normale',
  'Reverse Holo',
  'Reverse (Pokéball)',
  'Reverse (Masterball)',
  'Holo',
  'Holo Cosmos',
  'Tampon (logo extension)',
  'Promo',
  'EX',
  'Métal',
  'Full Art',
  'AR',
  'Alternate Art',
  'Gold',
  'Méga Hyper Rare'
]

/**
 * Composant pour afficher les initiales des versions possédées d'une carte
 *
 * @param {Object} props
 * @param {string} props.cardId - ID de la carte (pour chercher dans collection)
 * @param {Array} props.collection - Collection complète de l'utilisateur
 * @param {Array} props.instances - Instances de cette carte (si déjà regroupées)
 * @param {Object} props.card - La carte (pour afficher badge Holo Cosmos si c'est une carte de base)
 * @param {boolean} props.isUserCopy - true si c'est dans la collection user (pour badge Holo Cosmos)
 * @param {boolean} props.showOnlyDuplicateVersions - true pour afficher uniquement les versions en double (onglet Doublons)
 * @param {string} props.className - Classes CSS additionnelles
 */
export function CardVersionBadges({ cardId, collection, instances, card, isUserCopy = false, showOnlyDuplicateVersions = false, className = '' }) {
  // Récupérer toutes les instances de cette carte
  const cardInstances = instances || collection.filter(c =>
    (c.card_id === cardId || c.id === cardId)
  )

  if (!cardInstances || cardInstances.length === 0) {
    return null
  }

  // Extraire les versions selon le mode
  let uniqueVersions

  if (showOnlyDuplicateVersions) {
    // Mode Doublons : afficher uniquement les versions en double
    const versionCounts = {}

    cardInstances.forEach(instance => {
      const version = instance.version || 'Normale'
      const quantity = instance.quantity || 1

      if (!versionCounts[version]) {
        versionCounts[version] = 0
      }
      versionCounts[version] += quantity
    })

    // Filtrer uniquement les versions avec quantité > 1
    uniqueVersions = Object.keys(versionCounts).filter(version => versionCounts[version] > 1)

    console.log('🔍 [CardVersionBadges] Mode doublons pour:', card?.name || cardId)
    console.log('   Comptage versions:', versionCounts)
    console.log('   Versions en double:', uniqueVersions)
  } else {
    // Mode normal : afficher toutes les versions possédées
    uniqueVersions = [...new Set(
      cardInstances
        .map(card => card.version)
        .filter(Boolean) // Enlever les null/undefined
    )]
  }

  if (uniqueVersions.length === 0) {
    return null
  }

  // Trier les versions selon l'ordre prédéfini
  const sortedVersions = uniqueVersions.sort((a, b) => {
    const indexA = VERSION_ORDER.indexOf(a)
    const indexB = VERSION_ORDER.indexOf(b)
    // Si une version n'est pas dans VERSION_ORDER, la mettre à la fin
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {sortedVersions.map(version => {
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
