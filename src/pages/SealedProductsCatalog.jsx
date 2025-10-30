import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Package, Search, ExternalLink, Euro, Filter, Plus } from 'lucide-react'
import { CardMarketSupabaseService } from '@/services/CardMarketSupabaseService'
import { UserSealedProductsService } from '@/services/UserSealedProductsService'
import { AddSealedProductModal } from '@/components/features/collection/AddSealedProductModal'
import { useAuth } from '@/hooks/useAuth'

export function SealedProductsCatalog() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
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

      // Associer les prix aux produits
      const productsWithPrices = allProducts.map(product => {
        const price = priceMap.get(product.id_product)
        return {
          ...product,
          price: price?.avg || price?.trend || null,
          priceLow: price?.low || null,
          priceDetails: price
        }
      })

      setProducts(productsWithPrices)
    } catch (error) {
      console.error('❌ Erreur chargement catalogue:', error)
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

  // Extraire les catégories uniques
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category_name).filter(Boolean))]
    return cats.sort()
  }, [products])

  // Filtrer les produits
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filtre par recherche
      if (searchTerm) {
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
  }, [products, searchTerm, selectedCategory])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white font-cinzel">
            Catalogue Produits Scellés
          </h1>
          <p className="text-gray-300">
            Parcourez le catalogue complet des produits scellés disponibles sur CardMarket
          </p>
        </div>

        <div className="space-y-6">
          {/* Barre de recherche et filtres */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Recherche */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filtre catégorie avec défilement horizontal */}
                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                  <Button
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="flex-shrink-0"
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id_product} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        {/* Image (si disponible) */}
                        {product.image_url && (
                          <div className="mb-3">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-40 object-contain bg-slate-100 dark:bg-slate-800 rounded"
                              onError={(e) => { e.target.style.display = 'none' }}
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
                            <div className="flex items-center gap-2 mb-1">
                              <Euro className="w-4 h-4 text-yellow-500" />
                              <span className="font-bold text-yellow-500">
                                {parseFloat(product.price).toFixed(2)} €
                              </span>
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

                          {/* Lien CardMarket */}
                          <a
                            href={CardMarketSupabaseService.buildSealedProductUrl(product.id_product, product.name, product.id_category, 'fr')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Voir sur CardMarket
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
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
