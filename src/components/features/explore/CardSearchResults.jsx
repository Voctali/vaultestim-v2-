import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddToCollectionModal } from '@/components/features/collection/AddToCollectionModal'
import { CardImage } from '@/components/features/explore/CardImage'
import { useCollection } from '@/hooks/useCollection.jsx'
import { useToast } from '@/hooks/useToast'
import { TCGdxService } from '@/services/TCGdxService'
import { formatCardPrice } from '@/utils/priceFormatter'
import { Heart, List, Plus, Eye, Settings } from 'lucide-react'

export function CardSearchResults({ cards, isLoading, searchQuery, showHeader = true }) {
  const [selectedCard, setSelectedCard] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const { addToCollection, toggleFavorite, toggleWishlist, favorites, wishlist } = useCollection()
  const { toast } = useToast()

  const handleAddToCollection = (card) => {
    setSelectedCard(card)
    setShowAddModal(true)
  }

  // Ajout rapide avec valeurs par défaut (état quasi-neuf)
  const handleQuickAdd = async (card) => {
    console.log('🚀 [Quick Add] Ajout rapide de:', card.name)

    // Mapper correctement les données de la carte pour Supabase
    const cardData = {
      id: card.id,
      name: card.name,
      series: card.set?.series || card.series || 'Non spécifié',
      extension: card.set?.name || card.extension || 'Non spécifié',
      rarity: card.rarity || 'Non spécifié',
      image: card.images?.large || card.images?.small || card.image || null,
      images: card.images || null,
      quantity: 1,
      condition: 'near_mint', // État quasi-neuf par défaut
      version: 'Normale',
      purchasePrice: null,
      marketPrice: card.cardmarket?.prices?.averageSellPrice || card.tcgplayer?.prices?.holofoil?.market || null,
      value: card.cardmarket?.prices?.averageSellPrice || card.tcgplayer?.prices?.holofoil?.market || null,
      isGraded: false
    }

    console.log('📦 [Quick Add] Données mappées:', cardData)

    try {
      await addToCollection(cardData)
      console.log('✅ [Quick Add] Carte ajoutée avec succès!')
      toast({
        title: 'Carte ajoutée !',
        description: `${card.name} a été ajoutée à votre collection`,
        variant: 'success'
      })
    } catch (error) {
      console.error('❌ [Quick Add] Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la carte',
        variant: 'error'
      })
    }
  }

  // Ajout avec options personnalisées (via modal)
  const handleCustomAdd = async (formData) => {
    console.log('🎯 [Custom Add] Ajout personnalisé avec formulaire:', formData)
    console.log('📋 [Custom Add] Carte sélectionnée:', selectedCard?.name)

    // Mapper correctement les données de la carte + formulaire pour Supabase
    const cardData = {
      id: selectedCard.id,
      name: selectedCard.name,
      series: selectedCard.set?.series || selectedCard.series || 'Non spécifié',
      extension: selectedCard.set?.name || selectedCard.extension || 'Non spécifié',
      rarity: selectedCard.rarity || 'Non spécifié',
      image: selectedCard.images?.large || selectedCard.images?.small || selectedCard.image || null,
      images: selectedCard.images || null,
      quantity: formData.quantity || 1,
      condition: formData.condition || 'near_mint',
      version: formData.version || 'Normale',
      purchasePrice: formData.purchasePrice || null,
      marketPrice: selectedCard.cardmarket?.prices?.averageSellPrice || selectedCard.tcgplayer?.prices?.holofoil?.market || null,
      value: selectedCard.cardmarket?.prices?.averageSellPrice || selectedCard.tcgplayer?.prices?.holofoil?.market || null,
      isGraded: formData.isGraded || false
    }

    console.log('📦 [Custom Add] Données mappées:', cardData)

    try {
      await addToCollection(cardData)
      console.log('✅ [Custom Add] Carte ajoutée avec succès!')
      toast({
        title: 'Carte ajoutée !',
        description: `${selectedCard.name} a été ajoutée à votre collection`,
        variant: 'success'
      })
      setShowAddModal(false)
      setSelectedCard(null)
    } catch (error) {
      console.error('❌ [Custom Add] Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la carte',
        variant: 'error'
      })
    }
  }

  const handleToggleFavorite = (card) => {
    toggleFavorite(card)
  }

  const handleToggleWishlist = async (card) => {
    try {
      const result = await toggleWishlist(card)
      if (result.action === 'added') {
        toast({
          title: 'Ajoutée à la liste de souhaits',
          description: `${card.name} a été ajoutée à votre liste de souhaits`,
          variant: 'success'
        })
      } else if (result.action === 'removed') {
        toast({
          title: 'Retirée de la liste de souhaits',
          description: `${card.name} a été retirée de votre liste de souhaits`,
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('Erreur toggle wishlist:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Recherche dans l'API Pokémon TCG...</p>
        </div>
      </div>
    )
  }

  if (!searchQuery) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold golden-glow mb-2">
          Rechercher des cartes Pokémon
        </h3>
        <p className="text-muted-foreground">
          Tapez le nom d'un Pokémon ou d'une carte pour commencer
        </p>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😕</div>
        <h3 className="text-xl font-semibold golden-glow mb-2">
          Aucune carte trouvée
        </h3>
        <p className="text-muted-foreground">
          Aucun résultat pour "{searchQuery}". Essayez avec un autre terme.
        </p>
      </div>
    )
  }

  // Trier les cartes par numéro (ordre croissant)
  const sortedCards = [...cards].sort((a, b) => {
    const numA = a.number || ''
    const numB = b.number || ''

    // Extraire la partie numérique du début
    const matchA = numA.match(/^(\d+)/)
    const matchB = numB.match(/^(\d+)/)

    if (matchA && matchB) {
      const intA = parseInt(matchA[1])
      const intB = parseInt(matchB[1])

      if (intA !== intB) {
        return intA - intB
      }
    }

    // Si les nombres sont égaux ou absents, comparer alphabétiquement
    return numA.localeCompare(numB)
  })

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold golden-glow">
            Résultats de recherche pour "{searchQuery}"
          </h2>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {cards.length} carte{cards.length > 1 ? 's' : ''} trouvée{cards.length > 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {sortedCards.map((card, index) => {
          const isFavorite = favorites.find(fav => fav.id === card.id)
          const isInWishlist = wishlist.find(wish => wish.id === card.id)
          const uniqueKey = `${card.id || 'unknown'}-${card.setId || 'noset'}-${index}`

          return (
            <Card key={uniqueKey} className="golden-border card-hover cursor-pointer group overflow-hidden">
              <CardContent className="p-4">
                {/* Card Image */}
                <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 group-hover:scale-105 transition-transform duration-200">
                  <CardImage
                    card={card}
                    className="w-full h-full object-cover"
                  />

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <Button
                      size="sm"
                      className="w-8 h-8 p-0 bg-green-500 hover:bg-green-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickAdd(card)
                      }}
                      title="Ajout rapide (état quasi-neuf)"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="w-8 h-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCollection(card)
                      }}
                      title="Options d'ajout personnalisées"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 bg-black/50 text-white hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFavorite(card)
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
                        handleToggleWishlist(card)
                      }}
                    >
                      <List className={`w-4 h-4 ${isInWishlist ? 'fill-blue-500 text-blue-500' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm golden-glow truncate" title={card.name}>
                    {card.name}
                    {card.number && (
                      <span className="text-xs text-muted-foreground ml-1">#{card.number}</span>
                    )}
                  </h3>

                  {/* Extension/Set */}
                  <p className="text-xs text-muted-foreground truncate" title={card.set?.name || card.series}>
                    {card.set?.name || card.series}
                  </p>

                  {/* Types et Rareté */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {card.rarity && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: card.typesFormatted && card.typesFormatted[0]
                              ? TCGdxService.getTypeColor(card.typesFormatted[0]) + '20'
                              : undefined,
                            color: card.typesFormatted && card.typesFormatted[0]
                              ? TCGdxService.getTypeColor(card.typesFormatted[0])
                              : undefined
                          }}
                        >
                          {card.rarity}
                        </Badge>
                      )}
                    </div>

                    {/* Types */}
                    {card.typesFormatted && card.typesFormatted.length > 0 && (
                      <div className="text-xs" style={{ color: TCGdxService.getTypeColor(card.typesFormatted[0]) }}>
                        {card.typesFormatted.join(', ')}
                      </div>
                    )}

                    {/* Sous-types */}
                    {card.subtypes && card.subtypes.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {card.subtypes.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Prix et HP */}
                  <div className="flex justify-between items-center">
                    <div className="text-right">
                      <p className="font-semibold text-green-500">
                        {formatCardPrice(card)}
                      </p>
                    </div>
                    {card.hp && (
                      <div className="text-xs text-muted-foreground">
                        HP: {card.hp}
                      </div>
                    )}
                  </div>

                  {/* Artiste */}
                  {card.artist && (
                    <div className="text-xs text-muted-foreground italic truncate" title={`Artiste: ${card.artist}`}>
                      Art: {card.artist}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal d'ajout à la collection */}
      {selectedCard && (
        <AddToCollectionModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setSelectedCard(null)
          }}
          onSubmit={handleCustomAdd}
          card={selectedCard}
        />
      )}
    </div>
  )
}