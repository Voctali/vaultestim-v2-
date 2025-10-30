import { useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useCollection } from '@/hooks/useCollection.jsx'
import { CardImage } from '@/components/features/explore/CardImage'
import { CardDetailsModal } from '@/components/features/collection/CardDetailsModal'
import { CollectionTabs } from '@/components/features/navigation/CollectionTabs'
import { Heart, List, Copy, Search, Filter, BookOpen } from 'lucide-react'
import { translateCondition } from '@/utils/cardConditions'
import { translatePokemonName } from '@/utils/pokemonTranslations'
import { translateTrainerName } from '@/utils/trainerTranslations'
import { translateCardName } from '@/utils/cardTranslations'

export function Favorites() {
  const location = useLocation()
  const { collection, favorites, wishlist, getDuplicates, toggleFavorite, toggleWishlist } = useCollection()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Déterminer le type de page basé sur l'URL
  const pageType = useMemo(() => {
    if (location.pathname.includes('/favorites')) return 'favorites'
    if (location.pathname.includes('/wishlist')) return 'wishlist'
    if (location.pathname.includes('/duplicates')) return 'duplicates'
    return 'favorites'
  }, [location.pathname])

  // Obtenir les données appropriées
  const getData = () => {
    switch (pageType) {
      case 'favorites':
        return favorites
      case 'wishlist':
        return wishlist
      case 'duplicates':
        return getDuplicates()
      default:
        return favorites
    }
  }

  // Configuration de la page
  const getPageConfig = () => {
    switch (pageType) {
      case 'favorites':
        return {
          title: 'Cartes Favorites',
          icon: Heart,
          emptyIcon: '❤️',
          emptyTitle: 'Aucune carte favorite',
          emptyMessage: 'Ajoutez vos cartes préférées à cette collection'
        }
      case 'wishlist':
        return {
          title: 'Liste de Souhaits',
          icon: List,
          emptyIcon: '📝',
          emptyTitle: 'Aucune carte dans la liste de souhaits',
          emptyMessage: 'Ajoutez des cartes que vous souhaitez obtenir'
        }
      case 'duplicates':
        return {
          title: 'Doublons',
          icon: Copy,
          emptyIcon: '📚',
          emptyTitle: 'Aucun doublon',
          emptyMessage: 'Vous n\'avez pas de cartes en double'
        }
      default:
        return {
          title: 'Cartes Favorites',
          icon: Heart,
          emptyIcon: '❤️',
          emptyTitle: 'Aucune carte favorite',
          emptyMessage: 'Ajoutez vos cartes préférées à cette collection'
        }
    }
  }

  const pageConfig = getPageConfig()
  const data = getData()

  const filteredCards = data.filter(card => {
    // Recherche bilingue : français et anglais
    const searchLower = searchTerm.toLowerCase().trim()
    const cardNameLower = card.name.toLowerCase()

    // Recherche directe dans le nom anglais de la carte
    const matchesEnglish = cardNameLower.includes(searchLower)

    // Si l'utilisateur recherche en français, traduire vers l'anglais
    let translatedSearch = translatePokemonName(searchLower)
    if (translatedSearch === searchLower) {
      translatedSearch = translateTrainerName(searchLower)
    }
    const matchesTranslated = translatedSearch !== searchLower && cardNameLower.includes(translatedSearch)

    return matchesEnglish || matchesTranslated
  })

  const PageIcon = pageConfig.icon

  return (
    <div className="space-y-6 p-6">
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold golden-glow mb-2 flex items-center">
            <PageIcon className="w-8 h-8 mr-3" />
            {pageConfig.title}
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

      {/* Cards Grid or Empty State */}
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
                <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 group-hover:scale-105 transition-transform duration-200">
                  <CardImage
                    card={card}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {pageType === 'duplicates' ? 'x2+' : 'x1'}
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
                  <h3 className="font-semibold text-sm golden-glow">{translateCardName(card.name)}</h3>
                  <p className="text-xs text-muted-foreground">{card.series}</p>

                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-xs">
                      {card.rarity}
                    </Badge>
                    <p className="text-xs text-blue-500">{translateCondition(card.condition)}</p>
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
            <div className="text-6xl mb-4">{pageConfig.emptyIcon}</div>
            <h3 className="text-xl font-semibold golden-glow mb-2">
              {pageConfig.emptyTitle}
            </h3>
            <p className="text-muted-foreground mb-4">
              {pageConfig.emptyMessage}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="mb-4"
              >
                Effacer la recherche
              </Button>
            )}
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