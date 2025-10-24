import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardImage } from '@/components/features/explore/CardImage'
import { CardMarketLink } from '@/components/features/collection/CardMarketLinks'
import { X, Plus, ExternalLink } from 'lucide-react'

export function CardPreviewModal({ isOpen, onClose, card, onAddToCollection }) {
  if (!card) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto golden-border bg-background">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="golden-glow">
                Aperçu de la carte
              </DialogTitle>
              <DialogDescription>
                Consultez les détails de cette carte
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card Display */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] max-w-sm mx-auto">
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl golden-border">
                <CardImage
                  card={card}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Card Information */}
          <div className="space-y-6">
            {/* Card Basic Info */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold golden-glow">{card.name}</h1>

              {/* Extension et Bloc */}
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  {card.set?.name || card.series || "Extension inconnue"}
                  {card.number && ` • #${card.number}`}
                </p>
                {card.set?.series && (
                  <p className="text-sm text-muted-foreground">
                    Bloc: {card.set.series}
                  </p>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {card.rarity && <Badge variant="secondary">{card.rarity}</Badge>}
                {card.supertype && <Badge variant="outline">{card.supertype}</Badge>}
                {card.types && card.types.length > 0 && card.types.map((type, i) => (
                  <Badge key={`type-${i}-${type}`} variant="outline">{type}</Badge>
                ))}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm pt-4">
                {card.hp && (
                  <div>
                    <span className="font-medium">HP:</span> {card.hp}
                  </div>
                )}
                {card.artist && (
                  <div>
                    <span className="font-medium">Artiste:</span> {card.artist}
                  </div>
                )}
                {card.set?.releaseDate && (
                  <div>
                    <span className="font-medium">Date de sortie:</span>{' '}
                    {new Date(card.set.releaseDate).toLocaleDateString('fr-FR')}
                  </div>
                )}
                {card.set?.code && (
                  <div>
                    <span className="font-medium">Code:</span> {card.set.code}
                  </div>
                )}
              </div>

              {/* Market Price */}
              <div className="text-sm pt-2">
                <span className="font-medium">Prix marché:</span>
                {card.marketPrice ? (
                  <span className="ml-2 font-bold text-green-500">{card.marketPrice}€</span>
                ) : (
                  <span className="ml-2 text-muted-foreground italic">Prix non disponible</span>
                )}
              </div>

              {/* Liens vers les marketplaces */}
              <div className="flex flex-wrap gap-3 text-sm pt-2">
                {/* CardMarket - Composant optimisé avec copie et fallback */}
                <CardMarketLink card={card} />
              </div>

              {/* Subtypes */}
              {card.subtypes && card.subtypes.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Sous-types:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {card.subtypes.map((subtype, i) => (
                      <Badge key={`subtype-${i}`} variant="outline" className="text-xs">
                        {subtype}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add to Collection Button */}
            {onAddToCollection && (
              <div className="pt-4">
                <Button
                  onClick={() => {
                    onAddToCollection(card)
                    onClose()
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter à ma collection
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}