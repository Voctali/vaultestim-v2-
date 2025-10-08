import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardImage } from '@/components/features/explore/CardImage'
import { AddToCollectionModal } from '@/components/features/collection/AddToCollectionModal'
import { useCollection } from '@/hooks/useCollection.jsx'
import { Plus, Heart, List, CheckCircle, AlertCircle, Info } from 'lucide-react'

export function ScanResults({ results }) {
  const [selectedCard, setSelectedCard] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const { addToCollection, toggleFavorite, toggleWishlist, favorites, wishlist, collection } = useCollection()

  if (!results || results.length === 0) {
    return null
  }

  const handleAddToCollection = (card) => {
    setSelectedCard(card)
    setShowAddModal(true)
  }

  const handleQuickAdd = (cardData) => {
    addToCollection(cardData)
    setShowAddModal(false)
    setSelectedCard(null)
  }

  const getConfidenceInfo = (confidence) => {
    if (confidence >= 0.8) {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        label: 'Très fiable',
        description: 'Identification très précise'
      }
    } else if (confidence >= 0.6) {
      return {
        icon: Info,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        label: 'Fiable',
        description: 'Identification probable'
      }
    } else {
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        label: 'Incertain',
        description: 'Vérifiez manuellement'
      }
    }
  }

  const getDetectionMethods = (card) => {
    const methods = []
    if (card.detectedBy?.includes('name')) methods.push('Nom')
    if (card.detectedBy?.includes('number')) methods.push('Numéro')
    if (card.detectedBy?.includes('series')) methods.push('Série')
    if (card.detectedBy?.includes('illustration')) methods.push('Illustration')
    if (card.detectedBy?.includes('logo')) methods.push('Logo')
    if (card.detectedBy?.includes('acronym')) methods.push('Acronyme')
    return methods
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, index) => {
          const confidenceInfo = getConfidenceInfo(result.confidence || 0.5)
          const ConfidenceIcon = confidenceInfo.icon
          const detectionMethods = getDetectionMethods(result)
          const isFavorite = favorites.find(fav => fav.id === result.id)
          const isInWishlist = wishlist.find(wish => wish.id === result.id)
          const isInCollection = collection.find(card => card.id === result.id)

          return (
            <Card
              key={`${result.id}-${index}`}
              className="golden-border card-hover group overflow-hidden"
            >
              <CardContent className="p-4">
                {/* Card Image */}
                <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 group-hover:scale-105 transition-transform duration-200">
                  <CardImage
                    card={result}
                    className="w-full h-full object-cover"
                  />

                  {/* Confidence Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${confidenceInfo.bgColor} ${confidenceInfo.color}`}>
                    <div className="flex items-center gap-1">
                      <ConfidenceIcon className="w-3 h-3" />
                      {Math.round((result.confidence || 0.5) * 100)}%
                    </div>
                  </div>

                  {/* Collection Status */}
                  {isInCollection && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      ✓ Possédée
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 bg-black/50 text-white hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(result)
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
                        toggleWishlist(result)
                      }}
                    >
                      <List className={`w-4 h-4 ${isInWishlist ? 'fill-blue-500 text-blue-500' : ''}`} />
                    </Button>
                  </div>

                  <div className="absolute bottom-2 right-2">
                    <Button
                      size="sm"
                      className="w-8 h-8 p-0 bg-green-500 hover:bg-green-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCollection(result)
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm golden-glow truncate" title={result.name}>
                    {result.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate" title={result.series}>
                    {result.series}
                  </p>

                  {/* Detection Methods */}
                  {detectionMethods.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {detectionMethods.map((method) => (
                        <Badge
                          key={method}
                          variant="outline"
                          className="text-xs"
                        >
                          {method}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                    >
                      {result.rarity || 'Rare'}
                    </Badge>

                    {result.typesFormatted && result.typesFormatted.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {result.typesFormatted.join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-right">
                      <p className="font-semibold text-green-500">
                        {result.marketPrice || result.value || '0.00'}€
                      </p>
                    </div>
                    {result.hp && (
                      <div className="text-xs text-muted-foreground">
                        HP: {result.hp}
                      </div>
                    )}
                  </div>
                </div>

                {/* Confidence Description */}
                <div className="mt-3 pt-3 border-t border-muted">
                  <div className="flex items-center justify-between">
                    <div className={`text-xs ${confidenceInfo.color}`}>
                      {confidenceInfo.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {confidenceInfo.description}
                    </div>
                  </div>

                  {/* Extracted Information */}
                  {result.extractedInfo && (
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      {result.extractedInfo.detectedText && (
                        <div>Texte: {result.extractedInfo.detectedText}</div>
                      )}
                      {result.extractedInfo.detectedNumber && (
                        <div>Numéro: {result.extractedInfo.detectedNumber}</div>
                      )}
                      {result.extractedInfo.detectedSeries && (
                        <div>Série: {result.extractedInfo.detectedSeries}</div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold golden-glow">{results.length}</div>
              <div className="text-sm text-muted-foreground">Cartes trouvées</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {results.filter(r => (r.confidence || 0.5) >= 0.8).length}
              </div>
              <div className="text-sm text-muted-foreground">Très fiables</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {results.filter(r => (r.confidence || 0.5) >= 0.6 && (r.confidence || 0.5) < 0.8).length}
              </div>
              <div className="text-sm text-muted-foreground">Fiables</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">
                {results.filter(r => (r.confidence || 0.5) < 0.6).length}
              </div>
              <div className="text-sm text-muted-foreground">Incertaines</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add to Collection Modal */}
      {selectedCard && (
        <AddToCollectionModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setSelectedCard(null)
          }}
          onSubmit={handleQuickAdd}
          card={selectedCard}
        />
      )}
    </div>
  )
}