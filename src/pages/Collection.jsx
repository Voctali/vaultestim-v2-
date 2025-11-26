import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCollection } from '@/hooks/useCollection.jsx'
import { Search, Filter, BookOpen, Heart, List, ChevronDown, ChevronRight } from 'lucide-react'
import { CardImage } from '@/components/features/explore/CardImage'
import { CardDetailsModal } from '@/components/features/collection/CardDetailsModal'
import { CardVersionBadges } from '@/components/features/collection/CardVersionBadges'
import { SetProgressBar } from '@/components/features/collection/SetProgressBar'
import { CollectionTabs } from '@/components/features/navigation/CollectionTabs'
import { useSettings } from '@/hooks/useSettings'
import { useCardDatabase } from '@/hooks/useCardDatabase'
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
  // État pour les extensions réduites (clé = extensionKey)
  const [collapsedExtensions, setCollapsedExtensions] = useState({})
  // État pour la recherche par extension (clé = extensionKey, valeur = terme de recherche)
  const [extensionSearchTerms, setExtensionSearchTerms] = useState({})

  const { collection, favorites, wishlist, toggleFavorite, toggleWishlist } = useCollection()
  const { settings } = useSettings()
  const { discoveredCards } = useCardDatabase()

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

  // Trier les cartes par extension (set.id) et numéro de carte
  const sortedCards = [...filteredCards].sort((a, b) => {
    // 1. Trier par set.id pour grouper les extensions ensemble
    const setIdA = a.set?.id || a.extension || ''
    const setIdB = b.set?.id || b.extension || ''

    if (setIdA !== setIdB) {
      return setIdA.localeCompare(setIdB)
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
    const cardIdLower = card.card_id?.toLowerCase() || ''

    // Déterminer le bloc en fonction du card_id ou set.series
    let blockName = card.set?.series
    if (!blockName) {
      // Détecter le bloc par le préfixe du card_id
      if (cardIdLower.startsWith('me1-') || cardIdLower.startsWith('me2-') || cardIdLower.startsWith('mep-')) {
        blockName = 'Mega Evolution'
      } else if (cardIdLower.startsWith('sv') || cardIdLower.startsWith('zsv')) {
        blockName = 'Scarlet & Violet'
      } else if (cardIdLower.startsWith('swsh')) {
        blockName = 'Sword & Shield'
      } else {
        blockName = card.series || 'Autre'
      }
    }

    const extensionKey = card.set?.id || card.card_id?.split('-')[0] || 'Sans extension'

    // Pour le nom de l'extension: card.set?.name (enrichi) ou détection par card_id ou card.series
    // IMPORTANT: Certaines cartes n'ont pas été corrigées, on détecte par card_id
    let extensionName = card.set?.name
    if (!extensionName || extensionName === 'Scarlet & Violet') {
      // Détection par préfixe card_id pour les extensions mal nommées
      if (cardIdLower.startsWith('sv3pt5-') || cardIdLower.startsWith('mew-')) {
        extensionName = '151'
      } else if (cardIdLower.startsWith('sv8pt5-')) {
        extensionName = 'Prismatic Evolutions'
      } else if (cardIdLower.startsWith('zsv10pt5-')) {
        // Distinguer White Flare et Black Bolt par le nom de la carte ou card.series
        if (card.series?.toLowerCase().includes('white') || card.series?.toLowerCase().includes('flamme blanche')) {
          extensionName = 'White Flare'
        } else if (card.series?.toLowerCase().includes('black') || card.series?.toLowerCase().includes('foudre noire')) {
          extensionName = 'Black Bolt'
        } else {
          extensionName = card.series || 'White Flare / Black Bolt'
        }
      } else if (cardIdLower.startsWith('me1-')) {
        extensionName = 'Mega Evolution'
      } else {
        extensionName = card.series || card.extension || 'Extension inconnue'
      }
    }

    // Date de sortie - définir des dates par défaut pour les extensions sans date dans discovered_cards
    let releaseDate = card.set?.releaseDate
    if (!releaseDate) {
      // Dates de sortie officielles pour les extensions connues
      if (cardIdLower.startsWith('me1-')) releaseDate = '2025-09-05' // Mega Evolution
      else if (cardIdLower.startsWith('zsv10pt5-')) releaseDate = '2025-07-11' // White Flare / Black Bolt
      else if (cardIdLower.startsWith('sv3pt5-') || cardIdLower.startsWith('mew-')) releaseDate = '2023-09-22' // 151
      else if (cardIdLower.startsWith('sv8pt5-')) releaseDate = '2025-01-17' // Prismatic Evolutions
      else if (cardIdLower.startsWith('sv1-')) releaseDate = '2023-03-31' // Scarlet & Violet base
      else if (cardIdLower.startsWith('sv2-')) releaseDate = '2023-06-16' // Paldea Evolved
      else if (cardIdLower.startsWith('sv3-')) releaseDate = '2023-08-11' // Obsidian Flames
      else if (cardIdLower.startsWith('sv4-')) releaseDate = '2023-11-03' // Paradox Rift
      else if (cardIdLower.startsWith('sv5-')) releaseDate = '2024-01-26' // Temporal Forces
      else if (cardIdLower.startsWith('sv6-')) releaseDate = '2024-05-24' // Twilight Masquerade
      else if (cardIdLower.startsWith('sv7-')) releaseDate = '2024-08-02' // Stellar Crown
      else if (cardIdLower.startsWith('sv8-') || cardIdLower.startsWith('sv08-')) releaseDate = '2024-11-08' // Surging Sparks
      else if (cardIdLower.startsWith('sv9-')) releaseDate = '2025-03-28' // Journey Together
      else if (cardIdLower.startsWith('sv10-')) releaseDate = '2025-06-13' // Destined Rivals
    }

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
        key: extensionKey, // Stocker la clé pour SetProgressBar
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
      const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date()
      const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date()
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
    // Mega Evolution doit toujours être en premier (bloc le plus récent)
    if (a.name === 'Mega Evolution') return -1
    if (b.name === 'Mega Evolution') return 1

    // Les blocs sans date sont considérés comme récents (new Date() au lieu de new Date(0))
    const dateA = a.mostRecentDate ? new Date(a.mostRecentDate) : new Date()
    const dateB = b.mostRecentDate ? new Date(b.mostRecentDate) : new Date()
    return dateB - dateA
  })

  // Fonction pour toggle l'état réduit/agrandi d'une extension
  const toggleExtensionCollapse = (extensionKey) => {
    setCollapsedExtensions(prev => ({
      ...prev,
      [extensionKey]: !prev[extensionKey]
    }))
  }

  // Fonction pour mettre à jour le terme de recherche d'une extension
  const updateExtensionSearch = (extensionKey, value) => {
    setExtensionSearchTerms(prev => ({
      ...prev,
      [extensionKey]: value
    }))
  }

  // Fonction pour filtrer les cartes d'une extension par numéro ou nom
  const filterExtensionCards = (cards, extensionKey) => {
    const searchTerm = extensionSearchTerms[extensionKey]?.toLowerCase().trim() || ''
    if (!searchTerm) return cards

    return cards.filter(card => {
      // Recherche par numéro
      const cardNumber = card.number?.toString().toLowerCase() || ''
      if (cardNumber.includes(searchTerm) || cardNumber === searchTerm) {
        return true
      }

      // Recherche par nom (anglais ou traduit)
      const cardName = card.name?.toLowerCase() || ''
      const translatedName = translateCardName(card.name)?.toLowerCase() || ''

      return cardName.includes(searchTerm) || translatedName.includes(searchTerm)
    })
  }

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
              {block.extensions.map((extension, extIndex) => {
                const isCollapsed = collapsedExtensions[extension.key]
                const filteredExtensionCards = filterExtensionCards(extension.cards, extension.key)
                const extensionSearch = extensionSearchTerms[extension.key] || ''

                return (
                <div key={extIndex} className="space-y-4">
                  {/* Extension Header - Cliquable pour réduire/agrandir */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
                        onClick={() => toggleExtensionCollapse(extension.key)}
                        title={isCollapsed ? "Cliquer pour agrandir" : "Cliquer pour réduire"}
                      >
                        {/* Icône chevron */}
                        {isCollapsed ? (
                          <ChevronRight className="w-5 h-5 text-primary transition-transform" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-primary transition-transform" />
                        )}
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

                    {/* Barre de progression + Recherche (visible uniquement si non réduit) */}
                    {!isCollapsed && (
                      <div className="flex flex-col md:flex-row items-center gap-4 max-w-2xl mx-auto">
                        {/* Barre de progression */}
                        <div className="flex-1 w-full md:w-auto">
                          <SetProgressBar
                            setId={extension.key}
                            collection={collection}
                            discoveredCards={discoveredCards}
                            mastersetMode={settings.mastersetMode}
                            size="small"
                          />
                        </div>
                        {/* Champ de recherche par extension */}
                        <div className="relative w-full md:w-48">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input
                            placeholder="N° ou nom..."
                            value={extensionSearch}
                            onChange={(e) => updateExtensionSearch(extension.key, e.target.value)}
                            className="pl-7 h-8 text-xs golden-border"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cards Grid - Visible uniquement si non réduit */}
                  {!isCollapsed && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {filteredExtensionCards.length > 0 ? (
                      filteredExtensionCards.map((card) => (
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
                        <h3 className="font-semibold text-sm golden-glow truncate" title={translateCardName(card.name)}>
                          {translateCardName(card.name)}
                        </h3>

                        {/* Numéro de carte */}
                        {card.number && (
                          <p className="text-xs text-muted-foreground">#{card.number}</p>
                        )}

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
                    ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Aucune carte trouvée pour "{extensionSearchTerms[extension.key]}"</p>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              )})}
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