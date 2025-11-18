import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, Search, Plus, Edit3, Trash2, ExternalLink, Euro, RefreshCw, TrendingUp, TrendingDown, AlertCircle, BarChart3, FolderOpen, ChevronRight, Eye, EyeOff, Image } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { UserSealedProductsService } from '@/services/UserSealedProductsService'
import { CardMarketSupabaseService } from '@/services/CardMarketSupabaseService'
import { AdminPreferencesService } from '@/services/AdminPreferencesService'
import { SealedProductModal } from './SealedProductModal'
import { PriceHistoryModal } from './PriceHistoryModal'
import { useAuth } from '@/hooks/useAuth'
import { detectSealedProductCategory, sortProductsByCategory } from '@/utils/detectSealedProductCategory'
import { supabase } from '@/lib/supabaseClient'

export function SealedProductsManager() {
  const { user } = useAuth()
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

  // Navigation par catégories (comme blocs/extensions)
  const [currentView, setCurrentView] = useState('categories') // 'categories' ou 'products'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [catalogProducts, setCatalogProducts] = useState([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [allCatalogData, setAllCatalogData] = useState([]) // Toutes les données du catalogue pour extraction des catégories

  // Édition de catégorie
  const [editingCategory, setEditingCategory] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    displayOrder: 0
  })

  // Gestion des catégories masquées (stockées dans Supabase)
  const [hiddenCategories, setHiddenCategories] = useState([])
  const [hiddenCategoriesLoading, setHiddenCategoriesLoading] = useState(true)
  // Filtre "images uniquement" (stocké dans Supabase)
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
        console.log(`👁️ Catégories masquées chargées depuis Supabase:`, hidden)
        console.log(`🖼️ Filtre images uniquement:`, imagesOnly)

        // Synchroniser avec localStorage pour les autres composants (temporaire)
        localStorage.setItem('vaultestim_hidden_sealed_categories', JSON.stringify(hidden))
      } catch (error) {
        console.error('❌ Erreur chargement préférences admin:', error)
      } finally {
        setHiddenCategoriesLoading(false)
      }
    }

    loadAdminPreferences()
  }, [])

  // Charger les produits
  useEffect(() => {
    if (user) {
      loadProducts()
    }
  }, [user])

  // Charger TOUTES les données du catalogue au démarrage pour extraire les catégories
  useEffect(() => {
    loadAllCatalogData()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await UserSealedProductsService.loadUserSealedProducts(user.id)

      // Détecter et mettre à jour automatiquement les catégories manquantes
      const productsToUpdate = []
      const productsWithCategories = data.map(product => {
        if (!product.category || product.category === 'Non spécifié') {
          const detectedCategory = detectSealedProductCategory(product.name)
          if (detectedCategory !== 'Autre') {
            // Marquer pour mise à jour en base
            productsToUpdate.push({ id: product.id, category: detectedCategory })
            return { ...product, category: detectedCategory }
          }
        }
        return product
      })

      setProducts(productsWithCategories)

      // Mettre à jour les catégories en base de données (async)
      if (productsToUpdate.length > 0) {
        console.log(`🔍 Détection automatique: ${productsToUpdate.length} catégories à mettre à jour`)
        productsToUpdate.forEach(async ({ id, category }) => {
          try {
            await UserSealedProductsService.updateSealedProduct(id, { category })
          } catch (error) {
            console.warn(`⚠️ Erreur mise à jour catégorie pour produit ${id}:`, error)
          }
        })
      }

      // Charger les alertes de prix
      const alerts = await UserSealedProductsService.detectPriceAlerts(user.id, 10)
      setPriceAlerts(alerts)
    } catch (error) {
      console.error('❌ Erreur chargement produits:', error)
    } finally {
      setLoading(false)
    }
  }

  // Charger TOUTES les données du catalogue pour extraire les catégories uniques
  const loadAllCatalogData = async () => {
    try {
      console.log('🌐 Chargement initial de toutes les données du catalogue...')

      let allProducts = []
      let hasMore = true
      let offset = 0
      const batchSize = 1000

      while (hasMore) {
        const data = await CardMarketSupabaseService.searchSealedProducts('', null, batchSize, offset)

        if (data.length === 0) {
          hasMore = false
        } else {
          allProducts = [...allProducts, ...data]
          offset += batchSize
          if (data.length < batchSize) {
            hasMore = false
          }
        }
      }

      // Nettoyer et détecter automatiquement les catégories (même logique que SealedProductsCatalog)
      const productsWithCategories = allProducts.map(product => {
        let categoryName = product.category_name || 'Non spécifié'

        // Auto-détecter la catégorie si "Non spécifié" AVANT d'enlever le préfixe
        if (categoryName === 'Non spécifié') {
          categoryName = detectSealedProductCategory(product.name)
        }

        // Enlever le préfixe "Pokémon " si présent (après détection pour préserver "Pokémon Booster")
        // SAUF si c'est spécifiquement "Pokémon Booster" qui doit rester tel quel
        if (categoryName !== 'Pokémon Booster') {
          categoryName = categoryName.replace(/^Pokémon\s+/i, '')
        }

        return {
          ...product,
          category_name: categoryName
        }
      })

      setAllCatalogData(productsWithCategories)
      console.log(`✅ ${productsWithCategories.length} produits du catalogue chargés avec détection automatique des catégories`)
    } catch (error) {
      console.error('❌ Erreur chargement données catalogue:', error)
    }
  }

  // Charger le catalogue complet des produits scellés (utilise allCatalogData déjà chargé)
  const loadCatalogProducts = async (category = null) => {
    try {
      setLoadingCatalog(true)
      console.log('📦 Filtrage du catalogue pour catégorie:', category)

      // Si allCatalogData n'est pas encore chargé, le charger d'abord
      if (allCatalogData.length === 0) {
        console.log('⏳ Catalogue non chargé, chargement initial...')
        await loadAllCatalogData()
        return // loadAllCatalogData déclenchera un re-render qui rappellera cette fonction
      }

      // Filtrer par catégorie depuis les données déjà en mémoire
      const filtered = category
        ? allCatalogData.filter(p => p.category_name === category)
        : allCatalogData

      console.log(`🔍 ${filtered.length} produits dans la catégorie "${category}"`)

      // Trier par catégorie
      const sorted = sortProductsByCategory(filtered)
      setCatalogProducts(sorted)

      console.log(`✅ ${sorted.length} produits affichés`)
    } catch (error) {
      console.error('❌ Erreur chargement catalogue:', error)
    } finally {
      setLoadingCatalog(false)
    }
  }

  // Gérer la sélection d'une catégorie
  const handleSelectCategory = (category) => {
    setSelectedCategory(category)
    setCurrentView('products')
    loadCatalogProducts(category)
  }

  // Retourner aux catégories
  const handleBackToCategories = () => {
    setCurrentView('categories')
    setSelectedCategory(null)
    setCatalogProducts([])
  }

  // Éditer une catégorie
  const handleEditCategory = (categoryName) => {
    setEditingCategory(categoryName)
    setCategoryFormData({
      name: categoryName,
      description: '',
      displayOrder: 0
    })
    setShowCategoryModal(true)
  }

  // Masquer/Afficher une catégorie
  const toggleCategoryVisibility = async (categoryName) => {
    // Calculer la nouvelle liste immédiatement pour mise à jour UI optimiste
    const newHidden = hiddenCategories.includes(categoryName)
      ? hiddenCategories.filter(c => c !== categoryName)
      : [...hiddenCategories, categoryName]

    // Mise à jour optimiste du state
    setHiddenCategories(newHidden)

    // Sauvegarder dans Supabase (async) - préférences admin globales
    try {
      await AdminPreferencesService.setHiddenSealedCategories(newHidden)
      console.log(`✅ Catégorie "${categoryName}" ${newHidden.includes(categoryName) ? 'masquée' : 'affichée'} (sauvegardé dans Supabase)`)
    } catch (error) {
      console.error('❌ Erreur sauvegarde catégories masquées:', error)
      // Rollback en cas d'erreur
      setHiddenCategories(hiddenCategories)
      return
    }

    // Synchroniser avec localStorage pour les autres composants (temporaire)
    localStorage.setItem('vaultestim_hidden_sealed_categories', JSON.stringify(newHidden))

    // Déclencher un événement custom pour synchroniser avec SealedProductsCatalog
    window.dispatchEvent(new CustomEvent('vaultestim_categories_changed', { detail: newHidden }))
    console.log(`📡 Événement de synchronisation envoyé:`, newHidden)
  }

  // Basculer le filtre "images uniquement"
  const toggleShowOnlyWithImages = async (enabled) => {
    // Mise à jour optimiste du state
    setShowOnlyWithImages(enabled)

    // Sauvegarder dans Supabase
    try {
      await AdminPreferencesService.setShowOnlyWithImages(enabled)
      console.log(`✅ Filtre images uniquement: ${enabled ? 'activé' : 'désactivé'} (sauvegardé dans Supabase)`)
    } catch (error) {
      console.error('❌ Erreur sauvegarde filtre images:', error)
      // Rollback en cas d'erreur
      setShowOnlyWithImages(!enabled)
      return
    }

    // Déclencher un événement custom pour synchroniser avec SealedProductsCatalog
    window.dispatchEvent(new CustomEvent('vaultestim_images_filter_changed', { detail: enabled }))
    console.log(`📡 Événement filtre images envoyé:`, enabled)
  }

  // Supprimer une catégorie (et tous ses produits)
  const handleDeleteCategory = async (categoryName) => {
    const productsInCategory = allCatalogData.filter(p => p.category_name === categoryName)
    const count = productsInCategory.length

    const confirmed = window.confirm(
      `⚠️ ATTENTION : Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?\n\n` +
      `Cela supprimera ${count} produit(s) du catalogue.\n\n` +
      `Cette action est IRRÉVERSIBLE.`
    )

    if (!confirmed) return

    try {
      setLoadingCatalog(true)
      console.log(`🗑️ Suppression de la catégorie "${categoryName}" (${count} produits)...`)

      // Récupérer les IDs des produits à supprimer
      const productIds = productsInCategory.map(p => p.id_product)

      // Supprimer par batches de 100 pour éviter les timeouts
      const batchSize = 100
      let deleted = 0

      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize)

        const { error } = await supabase
          .from('cardmarket_sealed_products')
          .delete()
          .in('id_product', batch)

        if (error) {
          throw new Error(`Erreur suppression batch ${i / batchSize + 1}: ${error.message}`)
        }

        deleted += batch.length
        console.log(`✅ ${deleted}/${productIds.length} produits supprimés`)
      }

      // Recharger les données
      await loadAllCatalogData()

      console.log(`✅ Catégorie "${categoryName}" supprimée avec succès (${deleted} produits)`)
      alert(`✅ Catégorie "${categoryName}" supprimée avec succès !\n\n${deleted} produit(s) supprimé(s).`)
    } catch (error) {
      console.error('❌ Erreur suppression catégorie:', error)
      alert(`❌ Erreur lors de la suppression de la catégorie :\n${error.message}`)
    } finally {
      setLoadingCatalog(false)
    }
  }

  // Sauvegarder les modifications de catégorie
  const handleSaveCategory = async () => {
    // TODO: Implémenter la sauvegarde en base de données
    // Pour l'instant, on peut juste mettre à jour localement
    console.log('💾 Sauvegarde catégorie:', categoryFormData)
    alert('Fonctionnalité en cours de développement')
    setShowCategoryModal(false)
    setEditingCategory(null)
  }

  // Mettre à jour la catégorie d'un produit du catalogue
  const handleUpdateProductCategory = async (productId, newCategory) => {
    try {
      // Mettre à jour dans Supabase (table cardmarket_sealed_products)
      await CardMarketSupabaseService.updateSealedProductCategory(productId, newCategory)

      // Recharger les produits
      if (selectedCategory) {
        await loadCatalogProducts(selectedCategory)
      }

      console.log('✅ Catégorie mise à jour')
    } catch (error) {
      console.error('❌ Erreur mise à jour catégorie:', error)
      alert('Erreur lors de la mise à jour de la catégorie')
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

  // Filtrer et trier les produits avec détection automatique de catégorie
  const filteredProducts = useMemo(() => {
    // 1. Détecter automatiquement les catégories manquantes
    const productsWithCategories = products.map(product => {
      // Si la catégorie est "Non spécifié" ou manquante, détecter automatiquement
      if (!product.category || product.category === 'Non spécifié') {
        const detectedCategory = detectSealedProductCategory(product.name)
        return {
          ...product,
          category: detectedCategory
        }
      }
      return product
    })

    // 2. Filtrer selon la recherche
    const filtered = productsWithCategories.filter(product => {
      if (!searchQuery) return true
      const lowerQuery = searchQuery.toLowerCase()
      return (
        product.name.toLowerCase().includes(lowerQuery) ||
        product.category?.toLowerCase().includes(lowerQuery) ||
        product.notes?.toLowerCase().includes(lowerQuery)
      )
    })

    // 3. Trier par catégorie
    return sortProductsByCategory(filtered)
  }, [products, searchQuery])

  // Grouper les produits par catégorie
  const productsByCategory = useMemo(() => {
    const grouped = {}
    filteredProducts.forEach(product => {
      const category = product.category || 'Autre'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(product)
    })
    return grouped
  }, [filteredProducts])

  // Extraire toutes les catégories disponibles du catalogue (dynamique depuis les données réelles)
  const availableCategories = useMemo(() => {
    console.log('🔄 Recalcul availableCategories, allCatalogData.length =', allCatalogData.length)

    if (allCatalogData.length === 0) {
      // Liste par défaut pendant le chargement
      console.warn('⚠️ allCatalogData est vide, retour tableau vide')
      return []
    }

    // Extraire toutes les catégories uniques
    const categoriesSet = new Set()
    const categoriesWithCount = {}

    allCatalogData.forEach(product => {
      const category = product.category_name || 'Autre'
      categoriesSet.add(category)
      categoriesWithCount[category] = (categoriesWithCount[category] || 0) + 1
    })

    // Convertir en tableau et trier par nombre de produits (décroissant)
    const sortedCategories = Array.from(categoriesSet).sort((a, b) => {
      return categoriesWithCount[b] - categoriesWithCount[a]
    })

    console.log(`📂 Catégories extraites du catalogue: ${sortedCategories.length} catégories trouvées`)
    console.log('📊 Répartition:', categoriesWithCount)

    // Log détaillé de toutes les catégories
    console.log('📋 Liste complète des catégories:')
    sortedCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat} (${categoriesWithCount[cat]} produits)`)
    })

    // Vérifier s'il manque des catégories
    if (sortedCategories.length < 15) {
      console.warn(`⚠️ ATTENTION: Seulement ${sortedCategories.length} catégories trouvées, attendu ~20`)
      console.log('🔍 Échantillon des 10 premiers produits:')
      allCatalogData.slice(0, 10).forEach(p => {
        console.log(`  - ${p.name} | Catégorie: "${p.category_name}"`)
      })
    }

    return sortedCategories
  }, [allCatalogData])

  // Filtrer les catégories visibles (exclure les masquées)
  const visibleCategories = useMemo(() => {
    return availableCategories.filter(cat => !hiddenCategories.includes(cat))
  }, [availableCategories, hiddenCategories])

  // Compter les produits dans chaque catégorie
  const categoryCounts = useMemo(() => {
    const counts = {}
    allCatalogData.forEach(product => {
      const category = product.category_name || 'Autre'
      counts[category] = (counts[category] || 0) + 1
    })
    return counts
  }, [allCatalogData])

  return (
    <div className="space-y-6">
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {currentView === 'products' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToCategories}
                >
                  ← Retour
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{selectedCategory}</span>
              </>
            )}
          </div>
          <h2 className="text-2xl font-bold">
            {currentView === 'categories' ? 'Gestion du Catalogue - Catégories' : `Produits - ${selectedCategory}`}
          </h2>
          <p className="text-muted-foreground">
            {currentView === 'categories'
              ? 'Gérez les catégories du catalogue des produits scellés'
              : `${catalogProducts.length} produits dans cette catégorie`}
          </p>
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

      {/* Vue Catégories */}
      {currentView === 'categories' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Catégories du Catalogue ({visibleCategories.length}/{availableCategories.length})
              </div>
              {hiddenCategories.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {hiddenCategories.length} masquée(s)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Catégories visibles */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleCategories.map((category) => (
                <Card
                  key={category}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleSelectCategory(category)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{category}</h3>
                        <p className="text-xs text-muted-foreground">
                          {categoryCounts[category] || 0} produit(s)
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCategoryVisibility(category)
                          }}
                          title="Masquer la catégorie"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCategory(category)
                          }}
                          title="Supprimer la catégorie"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cliquez pour voir les produits
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filtres globaux */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Image className="h-4 w-4" />
                Filtres du catalogue
              </h3>
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="images-only-filter" className="font-medium cursor-pointer">
                    Afficher uniquement les produits avec images
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Masque les produits sans image (imports CardMarket) dans le catalogue public
                  </p>
                </div>
                <Switch
                  id="images-only-filter"
                  checked={showOnlyWithImages}
                  onCheckedChange={toggleShowOnlyWithImages}
                />
              </div>
            </div>

            {/* Catégories masquées */}
            {hiddenCategories.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                  <EyeOff className="h-4 w-4" />
                  Catégories masquées ({hiddenCategories.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {hiddenCategories.map((category) => (
                    <Card
                      key={category}
                      className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-muted-foreground">{category}</h3>
                            <p className="text-xs text-muted-foreground">
                              {categoryCounts[category] || 0} produit(s)
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCategoryVisibility(category)
                              }}
                              title="Afficher la catégorie"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCategory(category)
                              }}
                              title="Supprimer la catégorie"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground italic">
                          Catégorie masquée
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Vue Produits d'une catégorie */
        <>
          {/* Barre de recherche */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit dans cette catégorie..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Liste des produits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produits du Catalogue ({catalogProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCatalog ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : catalogProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground">
                    Aucun produit dans cette catégorie
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {catalogProducts.map((product) => (
                    <Card key={product.id_product} className="overflow-hidden">
                      <CardContent className="p-4">
                    {/* Image */}
                    {(product.image_url || product.image_file) && (
                      <div className="mb-3">
                        <img
                          src={product.image_file || product.image_url}
                          alt={product.name}
                          className="w-full h-40 object-contain bg-slate-100 dark:bg-slate-800 rounded"
                        />
                      </div>
                    )}

                    {/* Nom */}
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                        {/* Catégorie actuelle */}
                        <Badge variant="outline" className="mb-2">
                          {product.category_name || 'Non spécifié'}
                        </Badge>

                        {/* Prix (si disponible) */}
                        {product.price && (
                          <div className="flex items-center gap-2 mb-2">
                            <Euro className="w-4 h-4 text-yellow-500" />
                            <span className="font-bold text-yellow-500">
                              {parseFloat(product.price).toFixed(2)} €
                            </span>
                          </div>
                        )}

                        {/* Changer de catégorie */}
                        <div className="mt-3">
                          <Label className="text-xs text-muted-foreground">Déplacer vers:</Label>
                          <select
                            className="w-full mt-1 p-2 border rounded text-sm"
                            value={product.category_name || ''}
                            onChange={(e) => handleUpdateProductCategory(product.id_product, e.target.value)}
                          >
                            {availableCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        {/* Lien CardMarket */}
                        <a
                          href={CardMarketSupabaseService.buildSealedProductUrl(product.id_product, product.name, product.id_category, 'fr')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-2"
                        >
                          <Button variant="ghost" size="sm" className="w-full">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Voir sur CardMarket
                          </Button>
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal d'édition de catégorie */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Éditer la catégorie</DialogTitle>
            <DialogDescription>
              Modifier le nom et les options de la catégorie
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Nom de la catégorie</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom de la catégorie"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Description (optionnel)</Label>
              <Input
                id="category-description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveCategory} className="flex-1">
                Sauvegarder
              </Button>
              <Button variant="outline" onClick={() => setShowCategoryModal(false)} className="flex-1">
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  )
}
