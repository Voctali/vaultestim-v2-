/**
 * Composant pour afficher une carte de la base de données
 */
import React, { useState } from 'react'
import { Eye, Plus, Star, TrendingUp, Calendar, Hash } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

export function DatabaseCard({ card, viewMode = 'grid' }) {
  const [showDetails, setShowDetails] = useState(false)
  const [imageError, setImageError] = useState(false)

  // URL de l'image avec fallback
  const getImageUrl = (card) => {
    if (imageError) {
      return '/placeholder-card.jpg' // Image placeholder
    }

    // Priorité: image locale cachée > image large > image small
    if (card.images?.large) {
      return card.images.large
    }
    if (card.images?.small) {
      return card.images.small
    }

    return '/placeholder-card.jpg'
  }

  // Formater le prix
  const formatPrice = (price) => {
    if (!price?.market || price.market <= 0) {
      return 'N/A'
    }

    const currency = price.currency === 'EUR' ? '€' : '$'
    return `${price.market.toFixed(2)}${currency}`
  }

  // Couleur de rareté
  const getRarityColor = (rarity) => {
    if (!rarity) return 'secondary'

    const rarityLower = rarity.toLowerCase()
    if (rarityLower.includes('secret') || rarityLower.includes('rainbow')) return 'destructive'
    if (rarityLower.includes('ultra') || rarityLower.includes('holo')) return 'default'
    if (rarityLower.includes('rare')) return 'outline'
    return 'secondary'
  }

  // Types avec couleurs
  const getTypeColor = (type) => {
    const colors = {
      'Fire': 'bg-red-500',
      'Water': 'bg-blue-500',
      'Grass': 'bg-green-500',
      'Electric': 'bg-yellow-500',
      'Psychic': 'bg-purple-500',
      'Fighting': 'bg-orange-500',
      'Darkness': 'bg-gray-800',
      'Metal': 'bg-gray-500',
      'Fairy': 'bg-pink-500',
      'Dragon': 'bg-indigo-500',
      'Colorless': 'bg-gray-400'
    }
    return colors[type] || 'bg-gray-400'
  }

  if (viewMode === 'list') {
    return (
      <>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowDetails(true)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Image miniature */}
              <div className="flex-shrink-0">
                <img
                  src={getImageUrl(card)}
                  alt={card.name}
                  className="w-16 h-22 object-cover rounded border"
                  onError={() => setImageError(true)}
                />
              </div>

              {/* Informations principales */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg truncate">{card.name}</h3>
                    {card.name_fr && card.name_fr !== card.name && (
                      <p className="text-sm text-muted-foreground">{card.name_fr}</p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-lg font-bold text-primary">
                      {formatPrice(card.price)}
                    </div>
                    {card.price?.updatedAt && (
                      <div className="text-xs text-muted-foreground">
                        MAJ: {new Date(card.price.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getRarityColor(card.rarity)} className="text-xs">
                    {card.rarity}
                  </Badge>

                  {card.types?.map(type => (
                    <span
                      key={type}
                      className={`inline-block w-4 h-4 rounded-full ${getTypeColor(type)}`}
                      title={type}
                    />
                  ))}

                  {card.hp && (
                    <Badge variant="outline" className="text-xs">
                      {card.hp} HP
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{card.set?.name}</span>
                  <span>#{card.number}</span>
                  {card.set?.releaseDate && (
                    <span>{new Date(card.set.releaseDate).getFullYear()}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex gap-2">
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation()
                  setShowDetails(true)
                }}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={(e) => {
                  e.stopPropagation()
                  // Ajouter à la collection
                }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <DatabaseCardDetails
          card={card}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
        />
      </>
    )
  }

  // Mode grille (par défaut)
  return (
    <>
      <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => setShowDetails(true)}>
        <div className="relative">
          {/* Image principale */}
          <div className="aspect-[3/4] overflow-hidden bg-muted">
            <img
              src={getImageUrl(card)}
              alt={card.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          </div>

          {/* Badge de prix en overlay */}
          {card.price?.market > 0 && (
            <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 border">
              <div className="text-sm font-bold text-primary">
                {formatPrice(card.price)}
              </div>
            </div>
          )}

          {/* Types en overlay */}
          {card.types?.length > 0 && (
            <div className="absolute top-2 left-2 flex gap-1">
              {card.types.slice(0, 2).map(type => (
                <span
                  key={type}
                  className={`w-6 h-6 rounded-full ${getTypeColor(type)} border-2 border-white shadow-sm`}
                  title={type}
                />
              ))}
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Nom de la carte */}
          <div className="mb-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2" title={card.name}>
              {card.name}
            </h3>
            {card.name_fr && card.name_fr !== card.name && (
              <p className="text-xs text-muted-foreground line-clamp-1" title={card.name_fr}>
                {card.name_fr}
              </p>
            )}
          </div>

          {/* Rareté et HP */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={getRarityColor(card.rarity)} className="text-xs px-1.5 py-0.5">
              {card.rarity}
            </Badge>
            {card.hp && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {card.hp} HP
              </Badge>
            )}
          </div>

          {/* Extension et numéro */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="line-clamp-1" title={card.set?.name}>
              {card.set?.name}
            </div>
            <div className="flex items-center justify-between">
              <span>#{card.number}</span>
              {card.set?.releaseDate && (
                <span>{new Date(card.set.releaseDate).getFullYear()}</span>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={(e) => {
              e.stopPropagation()
              setShowDetails(true)
            }}>
              <Eye className="h-3 w-3 mr-1" />
              Voir
            </Button>
            <Button size="sm" className="flex-1 h-8 text-xs" onClick={(e) => {
              e.stopPropagation()
              // Ajouter à la collection
            }}>
              <Plus className="h-3 w-3 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      <DatabaseCardDetails
        card={card}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  )
}

/**
 * Dialogue avec détails complets de la carte
 */
function DatabaseCardDetails({ card, isOpen, onClose }) {
  const [imageError, setImageError] = useState(false)

  const getImageUrl = (card) => {
    if (imageError) return '/placeholder-card.jpg'
    return card.images?.large || card.images?.small || '/placeholder-card.jpg'
  }

  const formatPrice = (price) => {
    if (!price?.market || price.market <= 0) return 'N/A'
    const currency = price.currency === 'EUR' ? '€' : '$'
    return `${price.market.toFixed(2)}${currency}`
  }

  const getTypeColor = (type) => {
    const colors = {
      'Fire': 'bg-red-500',
      'Water': 'bg-blue-500',
      'Grass': 'bg-green-500',
      'Electric': 'bg-yellow-500',
      'Psychic': 'bg-purple-500',
      'Fighting': 'bg-orange-500',
      'Darkness': 'bg-gray-800',
      'Metal': 'bg-gray-500',
      'Fairy': 'bg-pink-500',
      'Dragon': 'bg-indigo-500',
      'Colorless': 'bg-gray-400'
    }
    return colors[type] || 'bg-gray-400'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {card.name}
            {card.name_fr && card.name_fr !== card.name && (
              <span className="text-muted-foreground">({card.name_fr})</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image de la carte */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
              <img
                src={getImageUrl(card)}
                alt={card.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter à ma collection
              </Button>
              <Button variant="outline">
                <Star className="h-4 w-4 mr-2" />
                Favoris
              </Button>
            </div>
          </div>

          {/* Détails de la carte */}
          <div className="space-y-6">
            {/* Informations principales */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Informations</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Numéro:</span>
                  <span className="font-medium">#{card.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{card.supertype}</span>
                </div>
                {card.hp && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HP:</span>
                    <span className="font-medium">{card.hp}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rareté:</span>
                  <Badge variant="outline">{card.rarity}</Badge>
                </div>
                {card.artist && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Artiste:</span>
                    <span className="font-medium">{card.artist}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Types Pokémon */}
            {card.types?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Types</h3>
                <div className="flex gap-2">
                  {card.types.map(type => (
                    <div key={type} className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full ${getTypeColor(type)}`} />
                      <span className="text-sm font-medium">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extension */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Extension</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nom:</span>
                  <span className="font-medium">{card.set?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Série:</span>
                  <span className="font-medium">{card.set?.series}</span>
                </div>
                {card.set?.releaseDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date de sortie:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(card.set.releaseDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Prix */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Prix du marché
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Prix actuel:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(card.price)}
                  </span>
                </div>
                {card.price?.updatedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dernière MAJ:</span>
                    <span>{new Date(card.price.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Texte de saveur */}
            {card.flavorText && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-sm text-muted-foreground italic">
                  "{card.flavorText}"
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}