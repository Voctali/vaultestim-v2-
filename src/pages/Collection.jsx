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
import { CardVersionBadges } from '@/components/features/collection/CardVersionBadges'
import { CollectionTabs } from '@/components/features/navigation/CollectionTabs'
import { translateCondition } from '@/utils/cardConditions'
import { translatePokemonName } from '@/utils/pokemonTranslations'
import { translateTrainerName } from '@/utils/trainerTranslations'
import { translateCardName } from '@/utils/cardTranslations'
import { formatCardPrice } from '@/utils/priceFormatter'

export function Collection() {
  // Tri amélioré des cartes par numéro (v1.18.3)
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
    // Recherche bilingue : français et anglais
    const searchLower = searchTerm.toLowerCase().trim()

    // Si recherche vide, afficher toutes les cartes (ne pas filtrer)
    if (!searchLower) {
      const matchesRarity = filters.rarity === 'all' || card.rarity === filters.rarity
      const matchesCondition = filters.condition === 'all' || card.condition === filters.condition
      const matchesType = filters.type === 'all' || card.type === filters.type
      return matchesRarity && matchesCondition && matchesType
    }
    const cardNameLower = card.name.toLowerCase()

    // Recherche directe dans le nom anglais de la carte
    const matchesEnglish = (
      cardNameLower === searchLower ||
      cardNameLower.startsWith(searchLower + ' ') ||
      cardNameLower.includes(' ' + searchLower + ' ') ||
      cardNameLower.endsWith(' ' + searchLower)
    )

    // Si l'utilisateur recherche en français, traduire vers l'anglais
    let translatedSearch = translatePokemonName(searchLower)
    if (translatedSearch === searchLower) {
      translatedSearch = translateTrainerName(searchLower)
    }
    // Recherche par mot complet pour éviter faux positifs (ex: "eri" ne doit PAS matcher "Erika")
    const matchesTranslated = translatedSearch !== searchLower && (
      cardNameLower === translatedSearch || // Exact match
      cardNameLower.startsWith(translatedSearch + ' ') || // "eri " au début
      cardNameLower.includes(' ' + translatedSearch + ' ') || // " eri " au milieu
      cardNameLower.endsWith(' ' + translatedSearch) // " eri" à la fin
    )

    const matchesSearch = matchesEnglish || matchesTranslated
    const matchesRarity = filters.rarity === 'all' || card.rarity === filters.rarity
    const matchesCondition = filters.condition === 'all' || card.condition === filters.condition
    const matchesType = filters.type === 'all' || card.type === filters.type
    return matchesSearch && matchesRarity && matchesCondition && matchesType
  })

  // Trier les cartes par extension (set.releaseDate) et numéro de carte
  const sortedCards = [...filteredCards].sort((a, b) => {
    // 1. Trier par date de sortie de l'extension (plus récent en premier)
    const dateA = a.set?.releaseDate ? new Date(a.set.releaseDate) : new Date(0)
    const dateB = b.set?.releaseDate ? new Date(b.set.releaseDate) : new Date(0)

    if (dateB.getTime() !== dateA.getTime()) {
      return dateB.getTime() - dateA.getTime()
    }

    // 2. Si même extension, trier par numéro de carte (avec extraction intelligente)
    const numA = a.number || ''
    const numB = b.number || ''

    // Extraire la partie numérique du début
    const matchA = numA.match(/^(\d+)/)
    const matchB = numB.match(/^(\d+)/)

    // Si les deux ont un numéro, comparer numériquement
    if (matchA && matchB) {
      const intA = parseInt(matchA[1])
      const intB = parseInt(matchB[1])

      if (intA !== intB) {
        return intA - intB
      }
      // Si les nombres sont égaux, comparer alphabétiquement le reste
      return numA.localeCompare(numB)
    }

    // Si seul A a un numéro, A vient en premier
    if (matchA && !matchB) return -1

    // Si seul B a un numéro, B vient en premier
    if (!matchA && matchB) return 1

    // Si aucun n'a de numéro, comparer alphabétiquement
    return numA.localeCompare(numB)
  })

  // Grouper les cartes par BLOC puis EXTENSION (comme dans Explorer)
  const cardsByBlock = sortedCards.reduce((acc, card) => {
    const blockName = card.set?.series || card.series || 'Sans bloc'
    const extensionKey = card.set?.id || card.extension || 'Sans extension'
    const extensionName = card.set?.name || (card.set?.id && card.set.id !== 'unknown' ? card.set.id : 'Extension inconnue')
    const releaseDate = card.set?.releaseDate || null

    // Créer le bloc s'il n'existe pas
    if (!acc[blockName]) {
      acc[blockName] = {
        name: blockName,
        extensions: {}
      }
    }

    // Créer l'extension dans le bloc s'il n'existe pas
    if (!acc[blockName].extensions[extensionKey]) {
      acc[blockName].extensions[extensionKey] = {
        name: extensionName,
        releaseDate: releaseDate,
        cards: []
      }
    }

    acc[blockName].extensions[extensionKey].cards.push(card)
    return acc
  }, {})

  // Convertir en tableau et trier blocs et extensions par date
  const blockGroups = Object.entries(cardsByBlock).map(([blockName, blockData]) => {
    // Trier les extensions du bloc par date (plus récent en premier)
    const sortedExtensions = Object.values(blockData.extensions).sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0)
      const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0)
      return dateB - dateA
    })

    // Trouver la date la plus récente du bloc
    const blockMostRecentDate = sortedExtensions[0]?.releaseDate

    return {
      name: blockName,
      mostRecentDate: blockMostRecentDate,
      extensions: sortedExtensions
    }
  }).sort((a, b) => {
    // Trier les blocs par date (plus récent en premier)
    const dateA = a.mostRecentDate ? new Date(a.mostRecentDate) : new Date(0)
    const dateB = b.mostRecentDate ? new Date(b.mostRecentDate) : new Date(0)
    return dateB - dateA
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

      {/* Cards Grid with Block and Extension Hierarchy */}
      {blockGroups.length > 0 ? (
        <div className="space-y-12">
          {blockGroups.map((block, blockIndex) => (
            <div key={blockIndex} className="space-y-8">
              {/* Block Header */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <h1 className="text-2xl font-bold golden-glow uppercase tracking-wide">{block.name}</h1>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
              </div>

              {/* Extensions in this Block */}
              {block.extensions.map((extension, extIndex) => (
                <div key={extIndex} className="space-y-4">
                  {/* Extension Header */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold golden-glow">{extension.name}</h2>
                      {extension.releaseDate && (
                        <span className="text-sm text-muted-foreground">
                          ({new Date(extension.releaseDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })})
                        </span>
                      )}
                      <Badge variant="outline" className="ml-2">
                        {extension.cards.length} carte{extension.cards.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {extension.cards.map((card) => (
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
                            <Heart className={`w-4 h-4 ${favorites.find(fav => fav.card_id === card.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                        </div>
                      </div>

                      {/* Badges des versions possédées */}
                      <CardVersionBadges
                        cardId={card.card_id || card.id}
                        instances={card.instances}
                        card={card}
                        isUserCopy={true}
                        className="mb-2"
                      />

                      {/* Card Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm golden-glow">{translateCardName(card.name)}</h3>
                        <p className="text-xs text-muted-foreground">{card.set?.name || card.extension || card.series}</p>

                        <div className="space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {card.rarity}
                          </Badge>
                          <p className="text-xs text-blue-500">{translateCondition(card.condition)}</p>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-green-500">{formatCardPrice(card)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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