import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CollectionTabs } from '@/components/features/navigation/CollectionTabs'
import { Package, Search, Plus, Edit3, Trash2, Euro, RefreshCw, TrendingUp, TrendingDown, AlertCircle, BarChart3, ExternalLink, ShoppingCart } from 'lucide-react'
import { UserSealedProductsService } from '@/services/UserSealedProductsService'
import { CardMarketSupabaseService } from '@/services/CardMarketSupabaseService'
import { CardMarketDynamicLinkService } from '@/services/CardMarketDynamicLinkService'
import { AdminPreferencesService } from '@/services/AdminPreferencesService'
import { SealedProductModal } from '@/components/features/admin/SealedProductModal'
import { PriceHistoryModal } from '@/components/features/admin/PriceHistoryModal'
import { SealedProductSaleModal } from '@/components/features/collection/SealedProductSaleModal'
import { useAuth } from '@/hooks/useAuth'
import { useSealedProducts } from '@/hooks/useSealedProducts'
import { detectSealedProductCategory, sortProductsByCategory, normalizeCategoryName } from '@/utils/detectSealedProductCategory'

export function SealedProducts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { createSealedProductSale, refreshData } = useSealedProducts()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [refreshingPrices, setRefreshingPrices] = useState(false)
  const [refreshProgress, setRefreshProgress] = useState(null)
  const [priceAlerts, setPriceAlerts] = useState([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyProduct, setHistoryProduct] = useState(null)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [sellingProduct, setSellingProduct] = useState(null)

  // State pour les catégories masquées (chargées depuis Supabase)
  const [hiddenCategories, setHiddenCategories] = useState([])

  // Charger les catégories masquées depuis Supabase (préférences admin globales)
  useEffect(() => {
    const loadHiddenCategories = async () => {
      try {
        const hidden = await AdminPreferencesService.getHiddenSealedCategories()
        setHiddenCategories(hidden)
        console.log('👁️ Catégories masquées chargées depuis Supabase:', hidden)
      } catch (error) {
        console.error('❌ Erreur chargement catégories masquées:', error)
      }
    }

    loadHiddenCategories()
  }, [])

  // Écouter les changements (synchronisation avec Admin)
  useEffect(() => {
    // Écouter les événements custom (changements dans le même onglet depuis Admin)
    const handleCustomEvent = (e) => {
      if (e.detail) {
        setHiddenCategories(e.detail)
        console.log('🔄 Catégories masquées mises à jour depuis Admin:', e.detail)
      }
    }
    window.addEventListener('vaultestim_categories_changed', handleCustomEvent)

    return () => {
      window.removeEventListener('vaultestim_categories_changed', handleCustomEvent)
    }
  }, [])

  // Charger les produits
  useEffect(() => {
    if (user) {
      loadProducts()
    }
  }, [user])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await UserSealedProductsService.loadUserSealedProducts(user.id)
      setProducts(data)

      // Charger les alertes de prix
      const alerts = await UserSealedProductsService.detectPriceAlerts(user.id, 10)
      setPriceAlerts(alerts)
    } catch (error) {
      console.error('❌ Erreur chargement produits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshAllPrices = async () => {
    if (!confirm('Actualiser tous les prix depuis CardMarket?\n\nCela peut prendre quelques secondes.')) {
      return
    }

    try {
      setRefreshingPrices(true)
      setRefreshProgress({ current: 0, total: 0, updated: 0, errors: 0 })

      const result = await UserSealedProductsService.refreshAllPrices(
        user.id,
        (progress) => {
          setRefreshProgress(progress)
        }
      )

      // Recharger les produits et alertes
      await loadProducts()

      alert(`Actualisation terminée!\n\n✅ ${result.updated} prix mis à jour\n⏭️ ${result.total - result.updated - result.errors} inchangés\n❌ ${result.errors} erreurs`)
    } catch (error) {
      console.error('❌ Erreur actualisation prix:', error)
      alert('Erreur lors de l\'actualisation des prix')
    } finally {
      setRefreshingPrices(false)
      setRefreshProgress(null)
    }
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleShowHistory = (product) => {
    setHistoryProduct(product)
    setShowHistoryModal(true)
  }

  const handleDelete = async (productId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return

    try {
      await UserSealedProductsService.deleteSealedProduct(productId)
      setProducts(prev => prev.filter(p => p.id !== productId))
      console.log('✅ Produit supprimé')
    } catch (error) {
      console.error('❌ Erreur suppression:', error)
      alert('Erreur lors de la suppression du produit')
    }
  }

  const handleSave = async (productData) => {
    try {
      if (editingProduct) {
        // Mise à jour
        const updated = await UserSealedProductsService.updateSealedProduct(
          editingProduct.id,
          productData
        )
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p))
        console.log('✅ Produit mis à jour')
      } else {
        // Ajout
        const newProduct = await UserSealedProductsService.addSealedProduct(
          user.id,
          productData
        )
        setProducts(prev => [newProduct, ...prev])
        console.log('✅ Produit ajouté')
      }

      setShowModal(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error)
      alert('Erreur lors de la sauvegarde du produit')
    }
  }

  const handleSell = (product) => {
    setSellingProduct(product)
    setShowSaleModal(true)
  }

  // DEBUG: Analyser les catégories
  const debugCategories = () => {
    console.log('🔍 === DEBUG CATÉGORIES ===')
    console.log('📋 Catégories masquées:', hiddenCategories)
    console.log('📦 Total produits:', products.length)
    console.log('✅ Produits visibles:', filteredProducts.length)
    console.log('❌ Produits masqués:', products.length - filteredProducts.length)

    const categoryCounts = {}
    products.forEach(p => {
      const rawCategory = p.category || detectSealedProductCategory(p.name)
      const cat = normalizeCategoryName(rawCategory) || 'NULL'
      if (!categoryCounts[cat]) {
        categoryCounts[cat] = { total: 0, hidden: false }
      }
      categoryCounts[cat].total++
      categoryCounts[cat].hidden = hiddenCategories.some(hiddenCat => normalizeCategoryName(hiddenCat) === cat)
    })

    console.log('📊 Répartition par catégorie:')
    console.table(categoryCounts)

    console.log('⚠️ Catégories masquées mais absentes de vos produits:')
    hiddenCategories.forEach(cat => {
      const normalizedCat = normalizeCategoryName(cat)
      if (!categoryCounts[normalizedCat]) {
        console.log(`  - "${cat}" (0 produits)`)
      }
    })

    alert(`Debug affiché dans la console (F12)\n\n` +
      `Total produits: ${products.length}\n` +
      `Produits visibles: ${filteredProducts.length}\n` +
      `Produits masqués: ${products.length - filteredProducts.length}\n` +
      `Catégories masquées: ${hiddenCategories.length}`)
  }

  const handleSaleSubmit = async (saleData) => {
    try {
      await createSealedProductSale(saleData)
      setShowSaleModal(false)
      setSellingProduct(null)

      // Recharger les produits depuis le service pour obtenir les quantités à jour
      await loadProducts()
      // Recharger les données du contexte
      await refreshData()

      alert('Vente enregistrée avec succès ! 🎉')
    } catch (error) {
      console.error('❌ Erreur vente produit:', error)
      alert('Erreur lors de l\'enregistrement de la vente')
    }
  }

  // Filtrer et trier les produits selon la recherche et les catégories masquées
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      // Détecter et normaliser la catégorie d'abord
      const rawCategory = product.category || detectSealedProductCategory(product.name)
      const normalizedCategory = normalizeCategoryName(rawCategory)

      // Exclure les produits des catégories masquées
      if (hiddenCategories.some(hiddenCat => normalizeCategoryName(hiddenCat) === normalizedCategory)) {
        return false
      }

      // Filtre par recherche
      if (!searchQuery) return true
      const lowerQuery = searchQuery.toLowerCase()
      return (
        product.name.toLowerCase().includes(lowerQuery) ||
        product.category?.toLowerCase().includes(lowerQuery) ||
        product.notes?.toLowerCase().includes(lowerQuery)
      )
    })

    // Détecter et normaliser les catégories
    const productsWithCategories = filtered.map(product => {
      // Récupérer la catégorie (de la BDD ou détection auto)
      const rawCategory = product.category || detectSealedProductCategory(product.name)
      // Normaliser pour éviter les doublons (Elite Trainer Boxes → Elite Trainer Box)
      const normalizedCategory = normalizeCategoryName(rawCategory)

      return {
        ...product,
        category_name: normalizedCategory
      }
    })

    return sortProductsByCategory(productsWithCategories)
  }, [products, searchQuery, hiddenCategories])

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
        <CollectionTabs />

        <div className="space-y-6 mt-8">
          {/* En-tête avec boutons d'action */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Mes Produits Scellés</h2>
              <p className="text-gray-300">
                Gérez votre collection de produits scellés (boosters, decks, ETB, etc.)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefreshAllPrices}
                disabled={refreshingPrices}
              >
                {refreshingPrices ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Actualisation...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser prix
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/explorer/catalogue-produits-scelles')}
              >
                <Search className="h-4 w-4 mr-2" />
                Rechercher un produit scellé
              </Button>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            </div>
          </div>

          {/* Progression de l'actualisation */}
          {refreshProgress && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Actualisation en cours...</span>
                    <span className="font-mono">
                      {refreshProgress.current}/{refreshProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(refreshProgress.current / refreshProgress.total) * 100}%`
                      }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>✅ {refreshProgress.updated} mis à jour</span>
                    <span>❌ {refreshProgress.errors} erreurs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alertes de changement de prix */}
          {priceAlerts.length > 0 && (
            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertCircle className="h-5 w-5" />
                  Alertes de Prix ({priceAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {priceAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {alert.type === 'increase' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-semibold">{alert.product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.previousPrice.toFixed(2)}€ → {alert.latestPrice.toFixed(2)}€
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={alert.type === 'increase' ? 'default' : 'destructive'}
                        className="text-sm"
                      >
                        {alert.changePercent > 0 ? '+' : ''}
                        {alert.changePercent.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Barre de recherche */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm text-muted-foreground">Total produits</div>
                  <div className="text-2xl font-bold">{filteredProducts.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Valeur totale</div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {filteredProducts.reduce((sum, p) => sum + (parseFloat(p.market_price) || 0), 0).toFixed(2)} €
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Catégories</div>
                  <div className="text-2xl font-bold">
                    {new Set(filteredProducts.map(p => p.category_name).filter(Boolean)).size}
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
                Mes Produits ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? 'Aucun produit ne correspond à votre recherche'
                      : 'Commencez par ajouter votre premier produit scellé'}
                  </p>
                  {!searchQuery && (
                    <div className="flex flex-col gap-2 items-center">
                      <Button onClick={handleAddNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un produit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/explorer/catalogue-produits-scelles')}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Rechercher un produit scellé
                      </Button>
                    </div>
                  )}
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
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {categoryProducts.map((product) => (
                          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <CardContent className="p-4">
                              {/* Image */}
                              {(product.image_file || product.cardmarket_id_product || product.image_url) && (
                                <div className="mb-3">
                                  <img
                                    src={
                                      product.image_file ||
                                      product.image_url ||
                                      (product.cardmarket_id_product && product.cardmarket_id_category
                                        ? CardMarketSupabaseService.getCardMarketImageUrl(product.cardmarket_id_product, product.cardmarket_id_category)
                                        : null)
                                    }
                                    alt={product.name}
                                    className="w-full h-40 object-contain bg-slate-100 dark:bg-slate-800 rounded"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      if (e.target.src.endsWith('.png')) {
                                        e.target.src = e.target.src.replace('.png', '.jpg')
                                      } else {
                                        e.target.style.display = 'none'
                                      }
                                    }}
                                  />
                                </div>
                              )}

                              {/* Nom */}
                              <h3 className="font-semibold mb-2 line-clamp-2">
                                {product.name}
                              </h3>

                              {/* Catégorie */}
                              {(product.category_name || product.category) && (
                                <Badge variant="outline" className="mb-2">
                                  {product.category_name || product.category}
                                </Badge>
                              )}

                              {/* Informations clés */}
                              <div className="space-y-2 mb-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                {/* Nombre d'exemplaires */}
                                {product.quantity && (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Package className="w-4 h-4" />
                                      <span>Quantité</span>
                                    </div>
                                    <span className="font-semibold">
                                      {product.quantity} {product.quantity > 1 ? 'exemplaires' : 'exemplaire'}
                                    </span>
                                  </div>
                                )}

                                {/* Prix du marché */}
                                {product.market_price && (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Euro className="w-4 h-4 text-yellow-500" />
                                      <span>Valeur marché</span>
                                    </div>
                                    <span className="font-bold text-yellow-500">
                                      {parseFloat(product.market_price).toFixed(2)} €
                                    </span>
                                  </div>
                                )}

                                {/* Valeur totale si plusieurs exemplaires */}
                                {product.quantity && product.market_price && product.quantity > 1 && (
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <span className="text-sm font-medium">Valeur totale</span>
                                    <span className="font-bold text-green-500">
                                      {(parseFloat(product.market_price) * product.quantity).toFixed(2)} €
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Notes */}
                              {product.notes && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {product.notes}
                                </p>
                              )}

                              {/* Actions */}
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSell(product)}
                                    className="flex-1 text-green-500 hover:text-green-600 border-green-500/20"
                                  >
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Vendre
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(product)}
                                    className="flex-1"
                                  >
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Modifier
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(product.id)}
                                    className="flex-1 text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Supprimer
                                  </Button>
                                </div>

                                {/* Bouton historique des prix */}
                                {product.cardmarket_id_product && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleShowHistory(product)}
                                    className="w-full"
                                  >
                                    <BarChart3 className="h-3 w-3 mr-1" />
                                    Voir historique des prix
                                  </Button>
                                )}
                              </div>

                              {/* Lien CardMarket dynamique si disponible */}
                              {product.cardmarket_id_product && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full mt-2"
                                  onClick={async () => {
                                    try {
                                      // Récupérer le lien dynamique depuis RapidAPI ou cache
                                      const dynamicUrl = await CardMarketDynamicLinkService.getSealedProductLink(
                                        product.cardmarket_id_product,
                                        'user_sealed_products',
                                        { name: product.name }
                                      )
                                      window.open(dynamicUrl, '_blank', 'noopener,noreferrer')
                                    } catch (error) {
                                      console.error('❌ Erreur récupération lien CardMarket:', error)
                                      // Fallback: utiliser l'URL construite manuellement
                                      const fallbackUrl = product.cardmarket_url ||
                                        CardMarketSupabaseService.buildSealedProductUrl(
                                          product.cardmarket_id_product,
                                          product.name,
                                          product.cardmarket_id_category,
                                          product.language || 'fr'
                                        )
                                      window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
                                    }
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Voir sur CardMarket
                                </Button>
                              )}
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

      {/* Modal d'ajout/modification */}
      <SealedProductModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingProduct(null)
        }}
        onSave={handleSave}
        product={editingProduct}
      />

      {/* Modal d'historique des prix */}
      <PriceHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false)
          setHistoryProduct(null)
        }}
        product={historyProduct}
      />

      {/* Modal de vente */}
      <SealedProductSaleModal
        isOpen={showSaleModal}
        onClose={() => {
          setShowSaleModal(false)
          setSellingProduct(null)
        }}
        onSubmit={handleSaleSubmit}
        product={sellingProduct}
      />
    </div>
  )
}
