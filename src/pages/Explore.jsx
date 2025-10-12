import { useState, useEffect, useRef } from 'react'
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
import { IndexedDBService } from '@/services/IndexedDBService'
import { ImageUploadService } from '@/services/ImageUploadService'
import { buildBlocksHierarchy } from '@/services/BlockHierarchyService'
import { Search, ChevronRight, Plus, Database, Layers, Package, ArrowLeft, X } from 'lucide-react'

export function Explore() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddCardModal, setShowAddCardModal] = useState(false) // Modale d'ajout manuel
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false) // Modale d'ajout à la collection
  const [showPreviewModal, setShowPreviewModal] = useState(false) // Modale d'aperçu en grand
  const [selectedCard, setSelectedCard] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searchError, setSearchError] = useState(null)
  const [currentView, setCurrentView] = useState('blocks') // 'blocks', 'extensions', 'cards', 'search'
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [selectedExtension, setSelectedExtension] = useState(null)
  const [navigationPath, setNavigationPath] = useState([])
  const [blocksData, setBlocksData] = useState([])
  const [customBlocks, setCustomBlocks] = useState([])
  const [customExtensions, setCustomExtensions] = useState([])
  const [isSearching, setIsSearching] = useState(false) // État local pour afficher le bouton d'annulation
  const { addToCollection } = useCollection()
  const { searchCards, seriesDatabase, discoveredCards, isLoading, totalDiscoveredCards, getCardsBySet } = useCardDatabase()

  // AbortController pour annuler la recherche
  const abortControllerRef = useRef(null)

  // Nettoyer l'AbortController quand le composant est démonté
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        console.log('🛑 Recherche annulée - composant démonté')
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
        console.log(`📦 Chargé ${customBlocksList.length} blocs personnalisés et ${customExtensionsList.length} extensions personnalisées`)
      } catch (error) {
        console.error('❌ Erreur chargement données personnalisées:', error)
      }
    }

    loadCustomData()
  }, [])

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
                  } catch (error) {
                    console.warn(`⚠️ Erreur chargement image pour extension ${extension.id}:`, error)
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
            } catch (error) {
              console.warn(`⚠️ Erreur enrichissement bloc ${block.id}:`, error)
              return block
            }
          })
        )

        setBlocksData(enrichedBlocks)
        console.log(`✅ Explore.jsx - ${enrichedBlocks.length} blocs enrichis avec images`)
      } catch (error) {
        console.error('❌ Erreur construction hiérarchie:', error)
      }
    }

    buildAndEnrichBlocks()
  }, [discoveredCards, seriesDatabase, customExtensions, customBlocks])

  // Filtrer selon la vue actuelle
  const getFilteredData = () => {
    const searchLower = searchTerm.toLowerCase()

    switch (currentView) {
      case 'blocks':
        return blocksData.filter(block =>
          block.name.toLowerCase().includes(searchLower)
        )
      case 'extensions':
        return selectedBlock?.extensions?.filter(ext =>
          ext.name.toLowerCase().includes(searchLower)
        ) || []
      case 'cards':
        const filteredCards = discoveredCards.filter(card =>
          card.set?.id === selectedExtension?.id &&
          card.name.toLowerCase().includes(searchLower)
        )

        // Debug: Afficher les propriétés de la première carte pour vérifier les données
        if (filteredCards.length > 0 && !window.cardDebugLogged) {
          console.log('🔍 Debug - Exemple de carte:', {
            name: filteredCards[0].name,
            number: filteredCards[0].number,
            rarity: filteredCards[0].rarity,
            types: filteredCards[0].types,
            supertype: filteredCards[0].supertype,
            subtypes: filteredCards[0].subtypes,
            allProperties: Object.keys(filteredCards[0])
          })
          window.cardDebugLogged = true
        }

        // Trier les cartes par numéro (ordre croissant)
        return filteredCards.sort((a, b) => {
          const numA = extractCardNumber(a.number)
          const numB = extractCardNumber(b.number)
          return numA - numB
        })
      default:
        return []
    }
  }

  // Fonction pour extraire le numéro d'une carte (ex: "001/197" -> 1, "SWSH123" -> 123)
  const extractCardNumber = (cardNumber) => {
    if (!cardNumber) return 999999 // Mettre les cartes sans numéro à la fin

    // Extraire le premier nombre du numéro de carte
    const match = cardNumber.match(/(\d+)/)
    return match ? parseInt(match[1]) : 999999
  }

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
  }

  const handleExtensionClick = (extension) => {
    setSelectedExtension(extension)
    setCurrentView('cards')
    setNavigationPath(prev => [...prev, { name: extension.name, view: 'extensions' }])
  }

  const handleBackToBlocks = () => {
    setCurrentView('blocks')
    setSelectedBlock(null)
    setSelectedExtension(null)
    setNavigationPath([])
  }

  const handleBackToExtensions = () => {
    setCurrentView('extensions')
    setSelectedExtension(null)
    setNavigationPath(prev => prev.slice(0, 1))
  }

  const handleAddCard = (cardData) => {
    // Ajouter la carte à la collection
    addToCollection({
      ...cardData,
      // Ajouter des valeurs par défaut si elles ne sont pas fournies
      marketPrice: cardData.marketPrice || '0.00',
      value: cardData.marketPrice || '0.00'
    })

    console.log('Carte ajoutée avec succès:', cardData.name)
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
      console.log('🛑 Recherche précédente annulée')
    }

    // Créer un nouveau AbortController pour cette recherche
    abortControllerRef.current = new AbortController()
    setIsSearching(true) // Activer l'état de recherche pour afficher le bouton d'annulation

    try {
      console.log(`🔍 Recherche de cartes: "${searchTerm}"`)
      setCurrentView('search')

      // Rechercher via l'API Pokémon TCG avec le signal d'annulation
      const results = await searchCards(searchTerm, abortControllerRef.current.signal)
      setSearchResults(results)

      console.log(`✅ ${results.length} cartes trouvées`)
    } catch (error) {
      // Ne pas afficher d'erreur si c'est une annulation volontaire
      if (error.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        console.log('🛑 Recherche annulée par l\'utilisateur')
      } else {
        console.error('❌ Erreur lors de la recherche:', error)
      }
      setSearchResults([])
    } finally {
      setIsSearching(false) // Désactiver l'état de recherche
    }
  }

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      console.log('🛑 Recherche annulée manuellement par l\'utilisateur')
      abortControllerRef.current = null
    }

    // Réinitialiser complètement la vue
    setIsSearching(false)
    setCurrentView('blocks')
    setSearchTerm('')
    setSearchResults([])
    setSelectedBlock(null)
    setSelectedExtension(null)
    setNavigationPath([])
    console.log('🔙 Retour à la vue des blocs')
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

      {/* Navigation Breadcrumb */}
      {(navigationPath.length > 0 || currentView === 'search') && (
        <div className="flex items-center gap-2">
          {/* Breadcrumb Navigation */}
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
      )}

      {/* Bouton Ajouter une carte manuellement */}
      <div className="flex justify-center">
        <Button
          className="bg-black hover:bg-gray-900 text-white border border-gray-700"
          onClick={() => setShowAddCardModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une carte manuellement
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une carte dans l'API Pokemon TCG..."
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
          {getFilteredData().map((block, blockIndex) => (
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
          {getFilteredData().map((extension, extensionIndex) => (
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
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <span>{extension.cardsCount || 0} carte{(extension.cardsCount || 0) > 1 ? 's' : ''}</span>
                        {extension.releaseDate && (
                          <span>{new Date(extension.releaseDate).getFullYear()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : currentView === 'cards' ? (
        /* Cards List */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {getFilteredData().map((card, cardIndex) => (
            <Card
              key={`card-${card.id || cardIndex}`}
              className="golden-border card-hover cursor-pointer group overflow-hidden"
              onClick={() => {
                setSelectedCard(card)
                setShowPreviewModal(true)
              }}
            >
              <CardContent className="p-4">
                <div className="relative aspect-[3/4] mb-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-200">
                  {card.images?.small || card.image ? (
                    <img
                      src={card.images?.small || card.image}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground" style={{ display: card.images?.small || card.image ? 'none' : 'flex' }}>
                    <Database className="w-8 h-8" />
                  </div>

                  {/* Bouton d'ajout à la collection */}
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      className="w-8 h-8 p-0 bg-green-500 hover:bg-green-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAddToCollectionModal(true)
                        setSelectedCard(card)
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm golden-glow truncate" title={card.name}>
                    {card.name}
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
                            {type}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Empty State */}
      {getFilteredData().length === 0 && !isLoading && currentView !== 'search' && (
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
          onSubmit={(cardData) => {
            addToCollection(cardData)
            setShowAddToCollectionModal(false)
            setSelectedCard(null)
          }}
          card={selectedCard}
        />
      )}
    </div>
  )
}