import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCollection } from '@/hooks/useCollection.jsx'
import { Search, Filter, BookOpen, Heart, List } from 'lucide-react'
import { CardImage } from '@/components/features/explore/CardImage'
import { CardDetailsModal } from '@/components/features/collection/CardDetailsModal'
import { CollectionTabs } from '@/components/features/navigation/CollectionTabs'

export function Collection() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    rarity: 'all',
    condition: 'all',
    type: 'all',
    extension: 'all'
  })
  const [selectedCard, setSelectedCard] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const { collection, favorites, wishlist, toggleFavorite, toggleWishlist } = useCollection()

  // Utiliser la vraie collection
  const collectionCards = collection

  // Regrouper les cartes identiques par card_id
  const groupedCards = collectionCards.reduce((acc, card) => {
    const cardId = card.card_id || card.id

    if (!acc[cardId]) {
      // Première occurrence de cette carte
      acc[cardId] = {
        ...card,
        totalQuantity: card.quantity || 1,
        instances: [card] // Garder toutes les instances pour les détails
      }
    } else {
      // Ajouter la quantité à la carte existante
      acc[cardId].totalQuantity += (card.quantity || 1)
      acc[cardId].instances.push(card)
    }

    return acc
  }, {})

  // Convertir l'objet en tableau
  const uniqueCards = Object.values(groupedCards)

  const filteredCards = uniqueCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRarity = filters.rarity === 'all' || card.rarity === filters.rarity
    const matchesCondition = filters.condition === 'all' || card.condition === filters.condition
    const matchesType = filters.type === 'all' || card.type === filters.type
    return matchesSearch && matchesRarity && matchesCondition && matchesType
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold golden-glow mb-2 flex items-center">
            <BookOpen className="w-8 h-8 mr-3" />
            Ma Collection
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une carte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 golden-border"
              style={{ textTransform: 'none' }}
            />
          </div>
          <Button variant="outline" className="border-primary/20 hidden lg:flex">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Collection Tabs - Mobile uniquement */}
      <CollectionTabs />

      {/* Search Mobile */}
      <div className="lg:hidden relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une carte..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 golden-border"
          style={{ textTransform: 'none' }}
        />
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-4 gap-4">
        <Select value={filters.rarity} onValueChange={(value) => setFilters(prev => ({ ...prev, rarity: value }))}>
          <SelectTrigger className="golden-border">
            <SelectValue placeholder="Toutes les raretés" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les raretés</SelectItem>
            <SelectItem value="Rare">Rare</SelectItem>
            <SelectItem value="Rare Holo GX">Rare Holo GX</SelectItem>
            <SelectItem value="Ultra Rare">Ultra Rare</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.condition} onValueChange={(value) => setFilters(prev => ({ ...prev, condition: value }))}>
          <SelectTrigger className="golden-border">
            <SelectValue placeholder="Tous les états" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les états</SelectItem>
            <SelectItem value="Neuf">Neuf</SelectItem>
            <SelectItem value="Proche du neuf">Proche du neuf</SelectItem>
            <SelectItem value="Excellent">Excellent</SelectItem>
            <SelectItem value="Bon">Bon</SelectItem>
            <SelectItem value="Moyen">Moyen</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
          <SelectTrigger className="golden-border">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="Fire">Feu</SelectItem>
            <SelectItem value="Water">Eau</SelectItem>
            <SelectItem value="Grass">Plante</SelectItem>
            <SelectItem value="Electric">Électrik</SelectItem>
            <SelectItem value="Psychic">Psy</SelectItem>
            <SelectItem value="Fighting">Combat</SelectItem>
            <SelectItem value="Dark">Ténèbres</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.extension} onValueChange={(value) => setFilters(prev => ({ ...prev, extension: value }))}>
          <SelectTrigger className="golden-border">
            <SelectValue placeholder="Toutes les extensions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les extensions</SelectItem>
            <SelectItem value="journey-together">Journey Together</SelectItem>
            <SelectItem value="cosmic-eclipse">Cosmic Eclipse</SelectItem>
            <SelectItem value="sword-shield">Sword & Shield</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Option */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border border-primary rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-sm"></div>
          </div>
          <span>Cartes triées par bloc et série (du plus récent au plus ancien)</span>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredCards.map((card) => (
            <Card
              key={card.id}
              className="golden-border card-hover cursor-pointer group overflow-hidden"
              onClick={() => {
                setSelectedCard(card)
                setShowDetailsModal(true)
              }}
            >
              <CardContent className="p-4">
                {/* Card Image */}
                <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-200">
                  <CardImage
                    card={card}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    x{card.totalQuantity || card.quantity || 1}
                  </div>
                  {/* Action buttons */}
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 bg-black/50 text-white hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(card)
                      }}
                    >
                      <Heart className={`w-4 h-4 ${favorites.find(fav => fav.id === card.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 bg-black/50 text-white hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWishlist(card)
                      }}
                    >
                      <List className={`w-4 h-4 ${wishlist.find(wish => wish.id === card.id) ? 'fill-blue-500 text-blue-500' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm golden-glow">{card.name}</h3>
                  <p className="text-xs text-muted-foreground">{card.series}</p>

                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-xs">
                      {card.rarity}
                    </Badge>
                    <p className="text-xs text-blue-500">{card.condition}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-green-500">{card.marketPrice || card.value}€</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="golden-border card-hover text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold golden-glow mb-2">
              Aucune carte trouvée
            </h3>
            <p className="text-muted-foreground mb-4">
              Essayez d'ajuster vos filtres de recherche
            </p>
          </CardContent>
        </Card>
      )}

      {/* Card Details Modal */}
      {selectedCard && (
        <CardDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedCard(null)
          }}
          card={selectedCard}
        />
      )}
    </div>
  )
}