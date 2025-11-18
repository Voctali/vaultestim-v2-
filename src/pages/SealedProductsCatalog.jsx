import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Package, Search, ExternalLink, Euro, Filter, Plus, Zap } from 'lucide-react'
import { CardMarketSupabaseService } from '@/services/CardMarketSupabaseService'
import { CardMarketDynamicLinkService } from '@/services/CardMarketDynamicLinkService'
import { UserSealedProductsService } from '@/services/UserSealedProductsService'
import { AdminPreferencesService } from '@/services/AdminPreferencesService'
import { HybridPriceService } from '@/services/HybridPriceService'
import { AddSealedProductModal } from '@/components/features/collection/AddSealedProductModal'
import { PriceSourceBadge } from '@/components/ui/PriceSourceBadge'
import { getCategorySearchTerm } from '@/utils/sealedProductCategories'
import { translateSealedProductSearch } from '@/utils/sealedProductTranslations'
import { detectSealedProductCategory, sortProductsByCategory, normalizeCategoryName } from '@/utils/detectSealedProductCategory'
import { useAuth } from '@/hooks/useAuth'
import { QuotaAlert } from '@/components/ui/QuotaAlert'

export function SealedProductsCatalog() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [apiSearchTerm, setApiSearchTerm] = useState('') // Recherche API séparée
  const [isApiSearch, setIsApiSearch] = useState(false) // Mode recherche API
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Charger les produits scellés depuis CardMarket
  useEffect(() => {
    loadSealedProducts()
  }, [])

  const loadSealedProducts = async () => {
    try {
      setLoading(true)
      setIsApiSearch(false)
      console.log('📦 Chargement du catalogue CardMarket...')

      // Charger tous les produits scellés par batches (Supabase limite à 1000 par requête)
      let allProducts = []
      let hasMore = true
      let offset = 0
      const batchSize = 1000

      while (hasMore) {
        console.log(`📥 Chargement batch ${offset / batchSize + 1}...`)
        const data = await CardMarketSupabaseService.searchSealedProducts('', null, batchSize, offset)

        if (data.length === 0) {
          hasMore = false
        } else {
          allProducts = [...allProducts, ...data]
          offset += batchSize

          // Si on reçoit moins que batchSize, c'est le dernier batch
          if (data.length < batchSize) {
            hasMore = false
          }
        }
      }

      console.log(`✅ ${allProducts.length} produits scellés chargés`)

      // Charger les prix pour TOUS les produits en une seule requête optimisée
      console.log(`💰 Chargement des prix pour ${allProducts.length} produits...`)
      const productIds = allProducts.map(p => p.id_product)
      const priceMap = await CardMarketSupabaseService.getPricesForProducts(productIds)
      console.log(`✅ ${priceMap.size} prix chargés`)

      // Associer les prix aux produits et détecter les catégories
      const productsWithPrices = allProducts.map(product => {
        const price = priceMap.get(product.id_product)
        // Générer URL image si non présente (utilise S3 CardMarket)
        const imageUrl = product.image_url || CardMarketSupabaseService.getCardMarketImageUrl(product.id_product, product.id_category)

        // Détecter automatiquement la catégorie si manquante ou "Non spécifié"
        let categoryName = (!product.category_name || product.category_name === 'Non spécifié')
          ? detectSealedProductCategory(product.name)
          : product.category_name

        // Enlever le préfixe "Pokémon " si présent (SAUF pour "Pokémon Booster")
        if (categoryName !== 'Pokémon Booster') {
          categoryName = categoryName.replace(/^Pokémon\s+/i, '')
        }

        // Normaliser pour éviter les doublons (Elite Trainer Boxes → Elite Trainer Box)
        const category = normalizeCategoryName(categoryName)

        return {
          ...product,
          image_url: imageUrl,
          price: price?.avg || price?.trend || null,
          priceLow: price?.low || null,
          priceDetails: price,
          _price_source: 'supabase-cardmarket',
          category_name: category
        }
      })

      // Trier par catégorie avant d'afficher
      const sortedProducts = sortProductsByCategory(productsWithPrices)
      setProducts(sortedProducts)
    } catch (error) {
      console.error('❌ Erreur chargement catalogue:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApiSearch = async (searchQuery = null) => {
    const query = searchQuery || apiSearchTerm.trim();
    if (!query) {
      // Si vide, revenir au catalogue complet
      loadSealedProducts()
      return
    }

    try {
      setLoading(true)
      setIsApiSearch(true)
      setSelectedCategory(null) // Réinitialiser le filtre de catégorie pour la recherche

      // Traduire la requête en anglais (ex: "coffret dresseur" → "elite trainer box")
      const translatedQuery = translateSealedProductSearch(query)
      console.log(`🔍 Recherche API produits: "${query}" → "${translatedQuery}"`)

      // Utiliser le système hybride avec la requête traduite
      const results = await HybridPriceService.searchProducts(translatedQuery, 1000)

      console.log(`✅ ${results.length} produits trouvés via API`)

      // Détecter et normaliser les catégories automatiquement
      const productsWithCategories = results.map(product => {
        // Utiliser la détection automatique si pas de catégorie ou si "Non spécifié"
        let categoryName = (!product.category_name || product.category_name === 'Non spécifié')
          ? detectSealedProductCategory(product.name)
          : product.category_name

        // Enlever le préfixe "Pokémon " si présent (SAUF pour "Pokémon Booster")
        if (categoryName !== 'Pokémon Booster') {
          categoryName = categoryName.replace(/^Pokémon\s+/i, '')
        }

        return {
          ...product,
          category_name: normalizeCategoryName(categoryName)
        }
      })

      // Sauvegarder les nouveaux produits dans Supabase avec les bonnes catégories (en arrière-plan)
      if (productsWithCategories.length > 0) {
        console.log(`💾 Sauvegarde de ${productsWithCategories.length} produits dans le catalogue...`)
        // Formater pour la sauvegarde avec category_name corrigée
        const productsToSave = productsWithCategories.map(p => ({
          ...p,
          category_name: p.category_name // Catégorie détectée automatiquement
        }))
        CardMarketSupabaseService.upsertSealedProductsFromRapidAPI(productsToSave)
          .then(count => {
            console.log(`✅ ${count} produits ajoutés/mis à jour dans le catalogue Supabase`)
          })
          .catch(err => {
            console.warn('⚠️ Erreur sauvegarde catalogue:', err)
          })
      }

      // Trier par catégorie
      const sortedProducts = sortProductsByCategory(productsWithCategories)

      setProducts(sortedProducts)
    } catch (error) {
      console.error('❌ Erreur recherche API:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = (product) => {
    if (!user) {
      alert('Vous devez être connecté pour ajouter des produits à votre collection')
      return
    }
    setSelectedProduct(product)
    setShowAddModal(true)
  }

  const handleAddToCollection = async (productData) => {
    try {
      console.log('📦 Ajout du produit à la collection...', productData)

      await UserSealedProductsService.addSealedProduct(user.id, productData)

      console.log('✅ Produit ajouté à la collection')
      alert(`✅ ${productData.name} a été ajouté à votre collection !`)

      setShowAddModal(false)
      setSelectedProduct(null)
    } catch (error) {
      console.error('❌ Erreur ajout produit:', error)
      alert('Erreur lors de l\'ajout du produit à votre collection')
    }
  }

  // State pour les catégories masquées (chargées depuis Supabase)
  const [hiddenCategories, setHiddenCategories] = useState([])
  // State pour le filtre "images uniquement" (chargé depuis Supabase)
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false)

  // Charger les préférences admin depuis Supabase
  useEffect(() => {
    const loadAdminPreferences = async () => {
      try {
        const [hidden, imagesOnly] = await Promise.all([
          AdminPreferencesService.getHiddenSealedCategories(),
          AdminPreferencesService.getShowOnlyWithImages()
        ])
        setHiddenCategories(hidden)
        setShowOnlyWithImages(imagesOnly)
        console.log('👁️ Catégories masquées chargées depuis Supabase:', hidden)
        console.log('🖼️ Filtre images uniquement:', imagesOnly)
      } catch (error) {
        console.error('❌ Erreur chargement préférences admin:', error)
      }
    }

    loadAdminPreferences()
  }, [])

  // Écouter les changements (synchronisation entre Admin et Catalogue)
  useEffect(() => {
    // Écouter les événements custom (changements dans le même onglet depuis Admin)
    const handleCategoriesEvent = (e) => {
      if (e.detail) {
        setHiddenCategories(e.detail)
        console.log('🔄 Catégories masquées mises à jour depuis Admin:', e.detail)
      }
    }
    const handleImagesFilterEvent = (e) => {
      if (e.detail !== undefined) {
        setShowOnlyWithImages(e.detail)
        console.log('🔄 Filtre images uniquement mis à jour depuis Admin:', e.detail)
      }
    }
    window.addEventListener('vaultestim_categories_changed', handleCategoriesEvent)
    window.addEventListener('vaultestim_images_filter_changed', handleImagesFilterEvent)

    return () => {
      window.removeEventListener('vaultestim_categories_changed', handleCategoriesEvent)
      window.removeEventListener('vaultestim_images_filter_changed', handleImagesFilterEvent)
    }
  }, [])

  // Extraire les catégories uniques (en excluant les masquées sauf en mode recherche API)
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category_name).filter(Boolean))]
    const sorted = cats.sort()

    // En mode recherche API, montrer TOUTES les catégories des résultats
    if (isApiSearch) {
      console.log(`📂 Catégories trouvées (recherche API): ${sorted.length}`)
      return sorted
    }

    // Filtrer les catégories masquées (avec normalisation)
    const visible = sorted.filter(cat => {
      const normalizedCat = normalizeCategoryName(cat)
      return !hiddenCategories.some(hiddenCat => normalizeCategoryName(hiddenCat) === normalizedCat)
    })

    console.log(`📂 Catégories visibles dans le catalogue: ${visible.length}/${sorted.length}`)
    if (hiddenCategories.length > 0) {
      console.log(`👁️ Catégories masquées: ${hiddenCategories.join(', ')}`)
    }

    return visible
  }, [products, hiddenCategories, isApiSearch])

  // Filtrer et trier les produits
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      // Filtre "images uniquement" (sauf en mode recherche API)
      if (showOnlyWithImages && !isApiSearch) {
        if (!product.image_url) {
          return false
        }
      }

      // En mode recherche API, NE PAS filtrer par catégories masquées
      // Car l'utilisateur cherche explicitement quelque chose
      if (!isApiSearch) {
        // Exclure les produits des catégories masquées (avec normalisation)
        const normalizedCategory = normalizeCategoryName(product.category_name)
        if (hiddenCategories.some(hiddenCat => normalizeCategoryName(hiddenCat) === normalizedCategory)) {
          return false
        }
      }

      // Filtre par recherche locale (seulement si pas en mode API)
      if (searchTerm && !isApiSearch) {
        const lowerSearch = searchTerm.toLowerCase()
        const matchesName = product.name?.toLowerCase().includes(lowerSearch)
        if (!matchesName) return false
      }

      // Filtre par catégorie
      if (selectedCategory && product.category_name !== selectedCategory) {
        return false
      }

      return true
    })

    console.log(`🔍 Produits filtrés: ${filtered.length}/${products.length} (isApiSearch: ${isApiSearch}, imagesOnly: ${showOnlyWithImages})`)

    // Trier par catégorie
    return sortProductsByCategory(filtered)
  }, [products, searchTerm, selectedCategory, hiddenCategories, isApiSearch, showOnlyWithImages])

  // Grouper les produits par catégorie pour affichage
  const productsByCategory = useMemo(() => {
    const grouped = {}
    filteredProducts.forEach(product => {
      const category = product.category_name || 'Autre'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(product)
    })
    return grouped
  }, [filteredProducts])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-white font-cinzel">
                Catalogue Produits Scellés
              </h1>
              <p className="text-gray-300">
                Parcourez le catalogue complet des produits scellés disponibles sur CardMarket
              </p>
            </div>
            {/* Badge quota compact */}
            <QuotaAlert compact />
          </div>
        </div>

        <div className="space-y-6">
          {/* Recherche API Hybride */}
          <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-amber-400">Recherche API (RapidAPI → Supabase)</h3>
                  <Badge variant="outline" className="text-xs">
                    Prix EUR actualisés
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher via API (booster, display, ETB...)..."
                      value={apiSearchTerm}
                      onChange={(e) => setApiSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApiSearch()}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    onClick={() => handleApiSearch()}
                    disabled={loading}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Rechercher
                  </Button>
                  {isApiSearch && (
                    <Button
                      onClick={loadSealedProducts}
                      variant="outline"
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
                {isApiSearch && (
                  <p className="text-xs text-amber-400">
                    🔍 Mode recherche API actif - Résultats en temps réel depuis RapidAPI ou Supabase
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Barre de recherche et filtres */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Recherche locale */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrer localement..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    disabled={isApiSearch}
                  />
                </div>

                {/* Filtre catégorie avec défilement horizontal */}
                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                  <Button
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={async () => { setSelectedCategory(null); setIsApiSearch(false); loadSealedProducts(); }}
                    className="flex-shrink-0"
                    disabled={isApiSearch}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Toutes
                  </Button>
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="flex-shrink-0"
                      disabled={isApiSearch}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm text-muted-foreground">Total produits</div>
                  <div className="text-2xl font-bold">{filteredProducts.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Catégories</div>
                  <div className="text-2xl font-bold">{categories.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Prix moyen</div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {(filteredProducts.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) /
                      filteredProducts.filter(p => p.price).length || 0).toFixed(2)} €
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des produits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produits ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Chargement du catalogue...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground">
                    Essayez de modifier vos critères de recherche
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                    <div key={category}>
                      {/* En-tête de catégorie */}
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-amber-400">{category}</h3>
                        <Badge variant="secondary" className="text-sm">
                          {categoryProducts.length} produit{categoryProducts.length > 1 ? 's' : ''}
                        </Badge>
                      </div>

                      {/* Grille de produits de cette catégorie */}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {categoryProducts.map((product) => (
                          <Card key={product.id_product} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        {/* Image (si disponible) */}
                        {product.image_url && (
                          <div className="mb-3">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-40 object-contain bg-slate-100 dark:bg-slate-800 rounded"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                // Fallback: essayer .jpg si .png échoue
                                if (e.target.src.endsWith('.png')) {
                                  e.target.src = e.target.src.replace('.png', '.jpg')
                                } else {
                                  // Si .jpg échoue aussi, masquer l'image
                                  e.target.style.display = 'none'
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* Nom */}
                        <h3 className="font-semibold mb-2 line-clamp-2" title={product.name}>
                          {product.name}
                        </h3>

                        {/* Catégorie */}
                        {product.category_name && (
                          <Badge variant="outline" className="mb-2">
                            {product.category_name}
                          </Badge>
                        )}

                        {/* Prix */}
                        {product.price && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <Euro className="w-4 h-4 text-yellow-500" />
                                <span className="font-bold text-yellow-500">
                                  {parseFloat(product.price).toFixed(2)} €
                                </span>
                              </div>
                              <PriceSourceBadge source={product._price_source} size="small" />
                            </div>
                            {product.priceLow && (
                              <div className="text-xs text-muted-foreground">
                                À partir de {parseFloat(product.priceLow).toFixed(2)} €
                              </div>
                            )}
                          </div>
                        )}

                        {/* Détails du produit */}
                        {product.number && (
                          <div className="text-xs text-muted-foreground mb-2">
                            #{product.number}
                          </div>
                        )}

                        {/* Boutons d'action */}
                        <div className="space-y-2">
                          {/* Ajouter à ma collection */}
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() => handleOpenAddModal(product)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Ajouter à ma collection
                          </Button>

                          {/* Lien CardMarket dynamique */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={async () => {
                              try {
                                // Récupérer le lien dynamique depuis RapidAPI ou cache
                                const dynamicUrl = await CardMarketDynamicLinkService.getSealedProductLink(
                                  product.id_product,
                                  'cardmarket_nonsingles',
                                  { name: product.name }
                                )
                                window.open(dynamicUrl, '_blank', 'noopener,noreferrer')
                              } catch (error) {
                                console.error('❌ Erreur récupération lien CardMarket:', error)
                                // Fallback: utiliser l'URL construite manuellement
                                const fallbackUrl = product.cardmarket_url ||
                                  CardMarketSupabaseService.buildSealedProductUrl(product.id_product, product.name, product.id_category, 'fr')
                                window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
                              }
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Voir sur CardMarket
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modale d'ajout à la collection */}
      <AddSealedProductModal
        product={selectedProduct}
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedProduct(null)
        }}
        onSave={handleAddToCollection}
      />
    </div>
  )
}
