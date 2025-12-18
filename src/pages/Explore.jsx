import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AddCardModal } from '@/components/features/collection/AddCardModal'
import { AddToCollectionModal } from '@/components/features/collection/AddToCollectionModal'
import { CardPreviewModal } from '@/components/features/explore/CardPreviewModal'
import { CardSearchResults } from '@/components/features/explore/CardSearchResults'
import { SeriesDetailView } from '@/components/features/explore/SeriesDetailView'
import { useCollection } from '@/hooks/useCollection.jsx'
import { useCardDatabase } from '@/hooks/useCardDatabase.jsx'
import { useToast } from '@/hooks/useToast'
import { IndexedDBService } from '@/services/IndexedDBService'
import { ImageUploadService } from '@/services/ImageUploadService'
import { buildBlocksHierarchy } from '@/services/BlockHierarchyService'
import { translatePokemonName } from '@/utils/pokemonTranslations'
import { translateTrainerName } from '@/utils/trainerTranslations'
import { translateCardName } from '@/utils/cardTranslations'
import { translateCardType } from '@/utils/typeTranslations'
import { formatCardPrice } from '@/utils/priceFormatter'
import { CardVersionBadges } from '@/components/features/collection/CardVersionBadges'
import { ExploreCard } from '@/components/features/explore/ExploreCard'
import { SetProgressBar } from '@/components/features/collection/SetProgressBar'
import { RarityProgressIcons } from '@/components/features/collection/RarityProgressIcons'
import { PriceSourceBadge } from '@/components/ui/PriceSourceBadge'
import { useSettings } from '@/hooks/useSettings'
import { Search, ChevronRight, Plus, Database, Layers, Package, ArrowLeft, X, Heart, List } from 'lucide-react'

// Tableau vide constant pour éviter les re-renders inutiles sur mobile
const EMPTY_INSTANCES = []

export function Explore() {
  const [filterTerm, setFilterTerm] = useState('') // Filtrage local des blocs/extensions/cartes
  const [searchTerm, setSearchTerm] = useState('') // Recherche API globale
  const [showAddCardModal, setShowAddCardModal] = useState(false) // Modale d'ajout manuel
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false) // Modale d'ajout à la collection
  const [showPreviewModal, setShowPreviewModal] = useState(false) // Modale d'aperçu en grand
  const [selectedCard, setSelectedCard] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searchError, setSearchError] = useState(null)
  const [currentView, setCurrentView] = useState('blocks') // 'blocks', 'extensions', 'cards', 'search'
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [selectedExtension, setSelectedExtension] = useState(null)
  const [extensionCards, setExtensionCards] = useState([]) // Cartes de l'extension sélectionnée (APRÈS fusion Gallery)
  const [navigationPath, setNavigationPath] = useState([])
  const [blocksData, setBlocksData] = useState([])
  const [customBlocks, setCustomBlocks] = useState([])
  const [customExtensions, setCustomExtensions] = useState([])
  const [isSearching, setIsSearching] = useState(false) // État local pour afficher le bouton d'annulation
  const { addToCollection, toggleFavorite, toggleWishlist, favorites, wishlist, collection } = useCollection()
  const { searchCards, seriesDatabase, discoveredCards, isLoading, totalDiscoveredCards, getCardsBySet } = useCardDatabase()
  const { settings } = useSettings()
  const { toast } = useToast()

  // Optimisation : pré-calculer un Set de card_ids pour vérification O(1)
  const collectionCardIds = useMemo(() => {
    const ids = new Set()
    collection.forEach(c => {
      if (c.card_id) ids.add(c.card_id)
      if (c.id) ids.add(c.id)
    })
    return ids
  }, [collection])

  // Optimisation : pré-calculer les instances par card_id pour les badges
  const cardInstancesMap = useMemo(() => {
    const map = new Map()
    collection.forEach(c => {
      const cardId = c.card_id || c.id
      if (!cardId) return
      if (!map.has(cardId)) {
        map.set(cardId, [])
      }
      map.get(cardId).push(c)
    })
    return map
  }, [collection])

  // Optimisation : pré-calculer les Sets de favoris et wishlist
  const favoritesCardIds = useMemo(() => {
    return new Set(favorites.map(f => f.card_id))
  }, [favorites])

  const wishlistCardIds = useMemo(() => {
    return new Set(wishlist.map(w => w.card_id))
  }, [wishlist])

  // AbortController pour annuler la recherche
  const abortControllerRef = useRef(null)

  // Nettoyer l'AbortController quand le composant est démonté
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Charger les données personnalisées au démarrage
  useEffect(() => {
    const loadCustomData = async () => {
      try {
        const [customBlocksList, customExtensionsList] = await Promise.all([
          IndexedDBService.loadCustomBlocks(),
          IndexedDBService.loadCustomExtensions()
        ])
        setCustomBlocks(customBlocksList)
        setCustomExtensions(customExtensionsList)
      } catch (error) {
        // Erreur silencieuse - données personnalisées non critiques
      }
    }

    loadCustomData()
  }, [])

  // Charger les cartes de l'extension sélectionnée (avec cartes fusionnées Gallery)
  useEffect(() => {
    const loadExtensionCards = async () => {
      if (!selectedExtension?.id) {
        setExtensionCards([])
        return
      }

      const cards = await getCardsBySet(selectedExtension.id)
      setExtensionCards(cards)
    }

    loadExtensionCards()
  }, [selectedExtension, getCardsBySet])

    // Construire la hiérarchie quand les données changent
  useEffect(() => {
    const buildAndEnrichBlocks = async () => {
      if (!discoveredCards || !seriesDatabase) return

      try {
        // Utiliser le service centralisé pour construire la hiérarchie
        const blocks = buildBlocksHierarchy(
          discoveredCards,
          seriesDatabase,
          customBlocks,
          customExtensions
        )

        // Enrichir les blocs avec leurs images uploadées
        const enrichedBlocks = await Promise.all(
          blocks.map(async (block) => {
            try {
              // Récupérer les images uploadées pour ce bloc
              const uploadedImages = await ImageUploadService.getImagesForEntity('block', block.id)
              const latestImage = uploadedImages.length > 0 ? uploadedImages[0] : null

              // Enrichir les extensions avec leurs images
              const enrichedExtensions = await Promise.all(
                (block.extensions || []).map(async (extension) => {
                  try {
                    const extImages = await ImageUploadService.getImagesForEntity('extension', extension.id)
                    const latestExtImage = extImages.length > 0 ? extImages[0] : null

                    return {
                      ...extension,
                      image: latestExtImage?.url || extension.image || extension.imageUrl,
                      imageUrl: latestExtImage?.url || extension.image || extension.imageUrl
                    }
                  } catch {
                    return extension
                  }
                })
              )

              return {
                ...block,
                extensions: enrichedExtensions,
                image: latestImage?.url || block.image || block.imageUrl,
                imageUrl: latestImage?.url || block.image || block.imageUrl
              }
            } catch {
              return block
            }
          })
        )

        setBlocksData(enrichedBlocks)
      } catch {
        // Erreur silencieuse - hiérarchie non critique
      }
    }

    buildAndEnrichBlocks()
  }, [discoveredCards, seriesDatabase, customExtensions, customBlocks])

  // Fonction pour extraire le numéro d'une carte (ex: "001/197" -> 1, "SWSH123" -> 123)
  const extractCardNumber = useCallback((cardNumber) => {
    if (!cardNumber) return 999999
    const match = cardNumber.match(/(\d+)/)
    return match ? parseInt(match[1]) : 999999
  }, [])

  // Filtrer selon la vue actuelle - MÉMORISÉ pour éviter recalculs à chaque render
  const filteredData = useMemo(() => {
    const searchLower = filterTerm.toLowerCase()

    switch (currentView) {
      case 'blocks':
        return blocksData.filter(block =>
          block.name.toLowerCase().includes(searchLower)
        )
      case 'extensions':
        return selectedBlock?.extensions?.filter(ext =>
          ext.name.toLowerCase().includes(searchLower)
        ) || []
      case 'cards': {
        if (!extensionCards || extensionCards.length === 0) return []

        // Pré-calculer la traduction une seule fois
        let translatedSearch = null
        if (searchLower && searchLower.trim()) {
          translatedSearch = translatePokemonName(searchLower)
          if (translatedSearch === searchLower) {
            translatedSearch = translateTrainerName(searchLower)
          }
          if (translatedSearch === searchLower) {
            translatedSearch = null // Pas de traduction trouvée
          }
        }

        const filteredCards = extensionCards.filter(card => {
          if (!searchLower || searchLower.trim() === '') return true

          // Recherche par numéro de carte
          const cardNumber = card.number || ''
          if (cardNumber.toLowerCase().includes(searchLower)) {
            return true
          }

          // Recherche bilingue
          const cardNameLower = card.name.toLowerCase()

          // Recherche directe dans le nom anglais
          const matchesEnglish = (
            cardNameLower === searchLower ||
            cardNameLower.startsWith(searchLower + ' ') ||
            cardNameLower.includes(' ' + searchLower + ' ') ||
            cardNameLower.endsWith(' ' + searchLower)
          )

          if (matchesEnglish) return true

          // Recherche par traduction
          if (translatedSearch) {
            return (
              cardNameLower === translatedSearch ||
              cardNameLower.startsWith(translatedSearch + ' ') ||
              cardNameLower.includes(' ' + translatedSearch + ' ') ||
              cardNameLower.endsWith(' ' + translatedSearch)
            )
          }

          return false
        })

        // Trier les cartes par numéro
        return filteredCards.sort((a, b) => {
          const numA = a.number ? parseInt(a.number.match(/(\d+)/)?.[1]) || 999999 : 999999
          const numB = b.number ? parseInt(b.number.match(/(\d+)/)?.[1]) || 999999 : 999999
          return numA - numB
        })
      }
      default:
        return []
    }
  }, [currentView, filterTerm, blocksData, selectedBlock?.extensions, extensionCards])

  // Utility function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit'
      })
    } catch (error) {
      return null
    }
  }

  const formatDatePeriod = (startDate, endDate) => {
    const formattedStart = formatDate(startDate)
    const formattedEnd = formatDate(endDate)

    if (formattedStart && formattedEnd) {
      return `${formattedStart} - ${formattedEnd}`
    } else if (formattedStart) {
      return `Depuis ${formattedStart}`
    } else if (formattedEnd) {
      return `Jusqu'à ${formattedEnd}`
    }
    return null
  }

  // Navigation functions
  const handleBlockClick = (block) => {
    setSelectedBlock(block)
    setCurrentView('extensions')
    setNavigationPath([{ name: block.name, view: 'blocks' }])
    setFilterTerm('') // Réinitialiser la recherche locale
  }

  const handleExtensionClick = (extension) => {
    setSelectedExtension(extension)
    setCurrentView('cards')
    setNavigationPath(prev => [...prev, { name: extension.name, view: 'extensions' }])
    setFilterTerm('') // Réinitialiser la recherche locale
  }

  const handleBackToBlocks = () => {
    setCurrentView('blocks')
    setSelectedBlock(null)
    setSelectedExtension(null)
    setNavigationPath([])
    setFilterTerm('') // Réinitialiser la recherche locale
  }

  const handleBackToExtensions = () => {
    setCurrentView('extensions')
    setSelectedExtension(null)
    setNavigationPath(prev => prev.slice(0, 1))
    setFilterTerm('') // Réinitialiser la recherche locale
  }

  const handleAddCard = (cardData) => {
    // Ajouter la carte à la collection
    addToCollection({
      ...cardData,
      // Ajouter des valeurs par défaut si elles ne sont pas fournies
      marketPrice: cardData.marketPrice || '0.00',
      value: cardData.marketPrice || '0.00'
    })
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setCurrentView('blocks')
      setSearchResults([])
      return
    }

    // Annuler toute recherche en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Créer un nouveau AbortController pour cette recherche
    abortControllerRef.current = new AbortController()
    setIsSearching(true)

    try {
      setCurrentView('search')
      const results = await searchCards(searchTerm, abortControllerRef.current.signal)
      setSearchResults(results)
    } catch (error) {
      if (error.name !== 'AbortError' && !abortControllerRef.current?.signal.aborted) {
        // Erreur réelle, pas une annulation
      }
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setIsSearching(false)
    setCurrentView('blocks')
    setSearchTerm('')
    setSearchResults([])
    setSelectedBlock(null)
    setSelectedExtension(null)
    setNavigationPath([])
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleBackFromSearch = () => {
    setCurrentView('blocks')
    setSearchTerm('')
    setSearchResults([])
    setSelectedBlock(null)
    setSelectedExtension(null)
    setNavigationPath([])
  }

  const handleToggleFavorite = (card) => {
    toggleFavorite(card)
  }

  const handleToggleWishlist = useCallback(async (card) => {
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
    } catch {
      // Erreur toggle wishlist silencieuse
    }
  }, [toggleWishlist, toast])

  // Handler mémorisé pour l'ajout rapide de carte
  const handleQuickAdd = useCallback(async (card) => {
    const cardData = {
      id: card.id,
      name: card.name,
      series: card.set?.series || card.series || 'Non spécifié',
      extension: card.set?.name || card.extension || 'Non spécifié',
      number: card.number || null,
      set: card.set || null,
      rarity: card.rarity || 'Non spécifié',
      image: card.images?.large || card.images?.small || card.image || null,
      images: card.images || null,
      quantity: 1,
      condition: 'near_mint',
      version: 'Normale',
      language: 'Français',
      purchasePrice: null,
      marketPrice: card.cardmarket?.prices?.averageSellPrice || card.tcgplayer?.prices?.holofoil?.market || null,
      value: card.cardmarket?.prices?.averageSellPrice || card.tcgplayer?.prices?.holofoil?.market || null,
      cardmarket: card.cardmarket || null,
      tcgplayer: card.tcgplayer || null,
      isGraded: false
    }

    try {
      await addToCollection(cardData)
      toast({
        title: 'Carte ajoutée !',
        description: `${card.name} a été ajoutée à votre collection`,
        variant: 'success'
      })
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la carte',
        variant: 'error'
      })
    }
  }, [addToCollection, toast])

  // Handler mémorisé pour le clic sur une carte
  const handleCardClick = useCallback((card) => {
    setSelectedCard(card)
    setShowAddToCollectionModal(true)
  }, [])

  // Handler mémorisé pour toggle favorite
  const handleToggleFavoriteCallback = useCallback((card) => {
    toggleFavorite(card)
  }, [toggleFavorite])

  return (
    <div className="space-y-6 p-6">
      {/* Header - Titre seulement */}
      <div>
        <h1 className="text-3xl font-bold golden-glow flex items-center mb-2">
          {currentView === 'search' ? (
            <>
              <Database className="w-8 h-8 mr-3" />
              Résultats de recherche
            </>
          ) : currentView === 'blocks' ? (
            <>
              <Package className="w-8 h-8 mr-3" />
              Explorer les Blocs
            </>
          ) : currentView === 'extensions' ? (
            <>
              <Layers className="w-8 h-8 mr-3" />
              Extensions de {selectedBlock?.name}
            </>
          ) : currentView === 'cards' ? (
            <>
              <Database className="w-8 h-8 mr-3" />
              Cartes de {selectedExtension?.name}
            </>
          ) : (
            <>
              <Search className="w-8 h-8 mr-3" />
              Explorer
            </>
          )}
        </h1>
        <div className="text-muted-foreground flex items-center gap-4">
          <span>
            {currentView === 'search' ? (
              `Cartes trouvées via l'API Pokémon TCG`
            ) : currentView === 'blocks' ? (
              'Découvrez les blocs et leurs extensions'
            ) : currentView === 'extensions' ? (
              `Extensions du bloc ${selectedBlock?.name}`
            ) : currentView === 'cards' ? (
              `Cartes de l'extension ${selectedExtension?.name}`
            ) : (
              'Naviguez dans la hiérarchie Blocs → Extensions → Cartes'
            )}
          </span>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {totalDiscoveredCards} cartes en base
          </Badge>
        </div>
      </div>

      {/* Navigation et Bouton Ajouter - Responsive : vertical sur mobile, horizontal sur desktop */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 flex-wrap">
          {navigationPath.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToBlocks}
                className="border-primary/20"
              >
                <Package className="w-4 h-4 mr-2" />
                Blocs
              </Button>
              {navigationPath.map((item, index) => (
                <div key={`nav-${index}-${item.name || 'unnamed'}`} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  {index === navigationPath.length - 1 ? (
                    <span className="font-medium text-sm">{item.name}</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={index === 0 ? handleBackToExtensions : undefined}
                      className="border-primary/20"
                    >
                      {item.name}
                    </Button>
                  )}
                </div>
              ))}
            </>
          )}

          {currentView === 'search' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackFromSearch}
              className="border-primary/20"
            >
              <Package className="w-4 h-4 mr-2" />
              Retour aux blocs
            </Button>
          )}
        </div>

        {/* Bouton Ajouter une carte manuellement */}
        <Button
          className="bg-black hover:bg-gray-900 text-white border border-gray-700 w-full md:w-auto"
          onClick={() => setShowAddCardModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une carte manuellement
        </Button>
      </div>

      {/* Barres de recherche séparées */}
      <div className="space-y-3">
        {/* Champ 1 : Filtrage local des blocs/extensions OU recherche dans extension */}
        {currentView !== 'search' && (
          <div className="relative">
            <Database className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={
                currentView === 'cards'
                  ? "Rechercher par nom ou numéro de carte dans cette extension..."
                  : "Filtrer les blocs, extensions ou cartes..."
              }
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="pl-10 golden-border"
              style={{ textTransform: 'none' }}
            />
          </div>
        )}

        {/* Champ 2 : Recherche API globale */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une carte dans l'API Pokemon TCG (traduction automatique français → anglais)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 golden-border"
              style={{ textTransform: 'none' }}
            />
          </div>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? 'Recherche...' : 'Rechercher'}
          </Button>
          {isSearching && (
            <Button
              variant="destructive"
              onClick={handleCancelSearch}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {currentView === 'search' ? (
        <CardSearchResults
          cards={searchResults}
          isLoading={isSearching}
          searchQuery={searchTerm}
        />
      ) : currentView === 'blocks' ? (
        /* Blocks List */
        <div className="space-y-4">
          {filteredData.map((block, blockIndex) => (
            <Card
              key={`block-${block.id || blockIndex}`}
              className="golden-border card-hover cursor-pointer group"
              onClick={() => handleBlockClick(block)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0 w-12 h-12">
                      {block.image || block.imageUrl ? (
                        <img
                          src={block.image || block.imageUrl}
                          alt={`Logo ${block.name}`}
                          className="w-12 h-12 object-contain rounded border"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'block'
                          }}
                        />
                      ) : null}
                      <Package
                        className={`w-12 h-12 text-primary ${block.image || block.imageUrl ? 'hidden' : 'block'}`}
                        style={{ display: block.image || block.imageUrl ? 'none' : 'block' }}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-semibold golden-glow">
                          {block.name}
                        </h3>
                        {formatDatePeriod(block.startDate || block.releaseDate, block.endDate) && (
                          <span className="text-sm text-muted-foreground font-medium">
                            {formatDatePeriod(block.startDate || block.releaseDate, block.endDate)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <span>{block.totalExtensions} extension{block.totalExtensions > 1 ? 's' : ''}</span>
                        <span>{block.totalCards} carte{block.totalCards > 1 ? 's' : ''}</span>
                        {block.type === 'custom' && (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                            Personnalisé
                          </Badge>
                        )}
                      </div>
                      {block.description && (
                        <p className="text-xs text-muted-foreground mt-1">{block.description}</p>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : currentView === 'extensions' ? (
        /* Extensions List */
        <div className="space-y-4">
          {filteredData.map((extension, extensionIndex) => (
            <Card
              key={`extension-${extension.id || extensionIndex}`}
              className="golden-border card-hover cursor-pointer group"
              onClick={() => handleExtensionClick(extension)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0 w-12 h-12">
                      {extension.image || extension.imageUrl ? (
                        <img
                          src={extension.image || extension.imageUrl}
                          alt={`Logo ${extension.name}`}
                          className="w-12 h-12 object-contain rounded border"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'block'
                          }}
                        />
                      ) : null}
                      <Layers
                        className={`w-12 h-12 text-primary ${extension.image || extension.imageUrl ? 'hidden' : 'block'}`}
                        style={{ display: extension.image || extension.imageUrl ? 'none' : 'block' }}
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold golden-glow mb-1">
                        {extension.name}
                      </h3>
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-2">
                        <span>{extension.cards?.length || extension.cardsCount || 0} carte{(extension.cards?.length || extension.cardsCount || 0) > 1 ? 's' : ''}</span>
                        {extension.releaseDate && (
                          <span>{new Date(extension.releaseDate).getFullYear()}</span>
                        )}
                      </div>
                      {/* Barre de progression */}
                      <SetProgressBar
                        setId={extension.id}
                        collection={collection}
                        discoveredCards={discoveredCards}
                        mastersetMode={settings.mastersetMode}
                        size="small"
                      />
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : currentView === 'cards' ? (
        /* Cards List with Extension Header */
        <div className="space-y-6">
          {/* Extension Header with Progress */}
          {selectedExtension && (
            <Card className="golden-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Extension Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold golden-glow mb-2">
                        {selectedExtension.name}
                      </h2>
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        {selectedExtension.releaseDate && (
                          <span>{new Date(selectedExtension.releaseDate).getFullYear()}</span>
                        )}
                        <span>{extensionCards.length} carte{extensionCards.length > 1 ? 's' : ''}</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedExtension.id}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <SetProgressBar
                    setId={selectedExtension.id}
                    collection={collection}
                    discoveredCards={discoveredCards}
                    mastersetMode={settings.mastersetMode}
                    size="medium"
                  />

                  {/* Rarity Icons */}
                  <RarityProgressIcons
                    setId={selectedExtension.id}
                    collection={collection}
                    discoveredCards={discoveredCards}
                    mastersetMode={settings.mastersetMode}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cards Grid - Composants mémorisés pour éviter les re-renders */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {filteredData.map((card, cardIndex) => (
              <ExploreCard
                key={`card-${card.id || cardIndex}`}
                card={card}
                cardIndex={cardIndex}
                isInCollection={collectionCardIds.has(card.id)}
                isFavorite={favoritesCardIds.has(card.id)}
                isInWishlist={wishlistCardIds.has(card.id)}
                onCardClick={handleCardClick}
                onQuickAdd={handleQuickAdd}
                onToggleFavorite={handleToggleFavoriteCallback}
                onToggleWishlist={handleToggleWishlist}
                cardInstances={cardInstancesMap.get(card.id) || EMPTY_INSTANCES}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Empty State */}
      {filteredData.length === 0 && !isLoading && currentView !== 'search' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            {currentView === 'blocks' ? (
              <Package className="w-8 h-8 text-muted-foreground" />
            ) : currentView === 'extensions' ? (
              <Layers className="w-8 h-8 text-muted-foreground" />
            ) : (
              <Database className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {currentView === 'blocks' ? 'Aucun bloc trouvé' :
             currentView === 'extensions' ? 'Aucune extension trouvée' :
             'Aucune carte trouvée'}
          </h3>
          <p className="text-muted-foreground">
            {currentView === 'blocks' ? 'Recherchez des cartes pour découvrir de nouveaux blocs !' :
             currentView === 'extensions' ? 'Ce bloc ne contient aucune extension.' :
             'Cette extension ne contient aucune carte.'}
          </p>
        </div>
      )}

      {/* Add Card Modal - Ajout manuel de carte */}
      <AddCardModal
        isOpen={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onSubmit={handleAddCard}
      />

      {/* Card Preview Modal - Aperçu en grand d'une carte */}
      {selectedCard && (
        <CardPreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false)
            setSelectedCard(null)
          }}
          card={selectedCard}
          onAddToCollection={(card) => {
            setShowPreviewModal(false)
            setShowAddToCollectionModal(true)
          }}
        />
      )}

      {/* Add To Collection Modal - Ajout d'une carte existante à la collection */}
      {selectedCard && (
        <AddToCollectionModal
          isOpen={showAddToCollectionModal}
          onClose={() => {
            setShowAddToCollectionModal(false)
            setSelectedCard(null)
          }}
          onSubmit={async (formData) => {
            const cardData = {
              id: selectedCard.id,
              name: selectedCard.name,
              series: selectedCard.set?.series || selectedCard.series || 'Non spécifié',
              extension: selectedCard.set?.name || selectedCard.extension || 'Non spécifié',
              number: selectedCard.number || null,
              set: selectedCard.set || null,
              rarity: selectedCard.rarity || 'Non spécifié',
              image: selectedCard.images?.large || selectedCard.images?.small || selectedCard.image || null,
              images: selectedCard.images || null,
              quantity: formData.quantity || 1,
              condition: formData.condition || 'near_mint',
              version: formData.version || 'Normale',
              language: formData.language || 'Français',
              purchasePrice: formData.purchasePrice || null,
              marketPrice: selectedCard.cardmarket?.prices?.averageSellPrice || selectedCard.tcgplayer?.prices?.holofoil?.market || null,
              value: selectedCard.cardmarket?.prices?.averageSellPrice || selectedCard.tcgplayer?.prices?.holofoil?.market || null,
              cardmarket: selectedCard.cardmarket || null,
              tcgplayer: selectedCard.tcgplayer || null,
              isGraded: formData.isGraded || false
            }

            try {
              await addToCollection(cardData)
              toast({
                title: 'Carte ajoutée !',
                description: `${selectedCard.name} a été ajoutée à votre collection`,
                variant: 'success'
              })
              setShowAddToCollectionModal(false)
              setSelectedCard(null)
            } catch {
              toast({
                title: 'Erreur',
                description: 'Impossible d\'ajouter la carte',
                variant: 'error'
              })
            }
          }}
          card={selectedCard}
        />
      )}
    </div>
  )
}