import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardVersionBadges } from '@/components/features/collection/CardVersionBadges'
import { PriceSourceBadge } from '@/components/ui/PriceSourceBadge'
import { translateCardName } from '@/utils/cardTranslations'
import { translateCardType } from '@/utils/typeTranslations'
import { formatCardPrice } from '@/utils/priceFormatter'
import { Database, Plus, Heart, List } from 'lucide-react'

/**
 * Composant carte pour la page Explore - Optimisé avec React.memo
 * Évite les re-renders inutiles lors de l'ajout massif de cartes
 */
export const ExploreCard = memo(function ExploreCard({
  card,
  cardIndex,
  isInCollection,
  isFavorite,
  isInWishlist,
  onCardClick,
  onQuickAdd,
  onToggleFavorite,
  onToggleWishlist,
  cardInstances = [] // Instances de cette carte dans la collection (pré-filtrées)
}) {
  return (
    <Card
      className="golden-border card-hover cursor-pointer group overflow-hidden"
      onClick={() => onCardClick(card)}
    >
      <CardContent className="p-4">
        <div className="relative aspect-[3/4] mb-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-200">
          {card.images?.small || card.image ? (
            <img
              src={card.images?.small || card.image}
              alt={card.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div className="w-full h-full flex items-center justify-center text-muted-foreground" style={{ display: card.images?.small || card.image ? 'none' : 'flex' }}>
            <Database className="w-8 h-8" />
          </div>

          {/* Overlay obscurci si carte non possédée */}
          {!isInCollection && (
            <div className="absolute inset-0 bg-black/60 pointer-events-none" />
          )}

          {/* Bouton d'ajout rapide à la collection */}
          <div className="absolute top-2 right-2">
            <Button
              size="sm"
              className="w-8 h-8 p-0 bg-green-500 hover:bg-green-600 text-white"
              onClick={(e) => {
                e.stopPropagation()
                onQuickAdd(card)
              }}
              title="Ajout rapide (état quasi-neuf)"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Icônes favoris et wishlist en bas à gauche */}
          <div className="absolute bottom-2 left-2 flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 bg-black/50 text-white hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(card)
              }}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 bg-black/50 text-white hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation()
                onToggleWishlist(card)
              }}
            >
              <List className={`w-4 h-4 ${isInWishlist ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Badges des versions possédées */}
        <CardVersionBadges
          cardId={card.id}
          instances={cardInstances}
          card={card}
          isUserCopy={false}
          className="mb-2"
        />

        {/* Card Info */}
        <div className="space-y-1">
          <h4 className="font-semibold text-sm golden-glow truncate" title={translateCardName(card.name)}>
            {translateCardName(card.name)}
          </h4>

          {/* Informations principales */}
          <div className="space-y-0.5">
            {/* Numéro de carte */}
            {card.number ? (
              <p className="text-xs text-muted-foreground">
                #{card.number}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/40 italic">
                Sans numéro
              </p>
            )}

            {/* Rareté */}
            {card.rarity ? (
              <p className="text-xs text-muted-foreground truncate" title={card.rarity}>
                {card.rarity}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/40 italic">
                Rareté inconnue
              </p>
            )}

            {/* Types Pokémon */}
            {card.types && card.types.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {card.types.slice(0, 2).map((type, i) => (
                  <Badge key={`type-${cardIndex}-${i}-${type}`} variant="outline" className="text-xs py-0">
                    {translateCardType(type)}
                  </Badge>
                ))}
                {card.types.length > 2 && (
                  <Badge variant="outline" className="text-xs py-0">
                    +{card.types.length - 2}
                  </Badge>
                )}
              </div>
            ) : card.supertype === 'Pokémon' ? (
              <p className="text-xs text-muted-foreground/40 italic">
                Type inconnu
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {card.supertype || 'Carte'}
              </p>
            )}
          </div>

          {/* Prix de la carte */}
          <div className="mt-2">
            <div className="flex items-center justify-between gap-2">
              <PriceSourceBadge source={card._price_source} size="small" />
              <p className="font-semibold text-green-500 text-sm">{formatCardPrice(card)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter les re-renders inutiles
  // On ne re-render que si les props importantes changent

  // Comparaison rapide des props simples
  if (
    prevProps.card.id !== nextProps.card.id ||
    prevProps.isInCollection !== nextProps.isInCollection ||
    prevProps.isFavorite !== nextProps.isFavorite ||
    prevProps.isInWishlist !== nextProps.isInWishlist ||
    prevProps.cardIndex !== nextProps.cardIndex
  ) {
    return false // Re-render
  }

  // Comparaison des instances (pour mise à jour des badges)
  const prevInstances = prevProps.cardInstances || []
  const nextInstances = nextProps.cardInstances || []

  // Si la référence du tableau est différente, vérifier le contenu
  // (Fix bug mobile : forcer re-render si la référence change)
  if (prevInstances !== nextInstances) {
    // Si le nombre d'instances change, re-render
    if (prevInstances.length !== nextInstances.length) {
      return false
    }

    // Comparaison complète des instances (ID + version + quantité)
    // Utiliser l'ID unique de chaque instance pour détecter les changements
    const prevKey = prevInstances.map(i => `${i.id || i.card_id || ''}-${i.version || 'Normale'}-${i.quantity || 1}`).sort().join('|')
    const nextKey = nextInstances.map(i => `${i.id || i.card_id || ''}-${i.version || 'Normale'}-${i.quantity || 1}`).sort().join('|')

    if (prevKey !== nextKey) {
      return false
    }
  }

  return true // Pas de re-render nécessaire
})
