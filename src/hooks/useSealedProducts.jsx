import { useState, useEffect, createContext, useContext } from 'react'
import { UserSealedProductsService } from '@/services/UserSealedProductsService'
import { supabase } from '@/lib/supabaseClient'

const SealedProductsContext = createContext()

export function SealedProductsProvider({ children }) {
  const [sealedProducts, setSealedProducts] = useState([])
  const [sealedProductSales, setSealedProductSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)

  // Vérifier l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        console.log('✅ [SealedProducts] Auth prête')
        setAuthInitialized(true)
      }
    }

    checkAuth()

    // Écouter les événements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ [SealedProducts] SIGNED_IN détecté')
        setTimeout(() => {
          console.log('✅ [SealedProducts] Délai écoulé, activation du chargement')
          setAuthInitialized(true)
        }, 500)
      } else if (event === 'SIGNED_OUT') {
        console.log('⚠️ [SealedProducts] SIGNED_OUT détecté')
        setAuthInitialized(false)
        setSealedProducts([])
        setSealedProductSales([])
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Charger les données SEULEMENT quand authentifié
  useEffect(() => {
    if (!authInitialized) {
      setIsLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setIsLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setIsLoading(false)
          return
        }

        const [productsData, salesData] = await Promise.all([
          UserSealedProductsService.loadUserSealedProducts(user.id),
          loadSealedProductSales(user.id)
        ])

        setSealedProducts(productsData)
        setSealedProductSales(salesData)

        console.log('✅ Produits scellés et ventes chargés depuis Supabase')
      } catch (error) {
        console.error('❌ Erreur chargement produits scellés:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [authInitialized])

  // Charger les ventes de produits scellés
  const loadSealedProductSales = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('sealed_product_sales')
        .select('*')
        .eq('user_id', userId)
        .order('sale_date', { ascending: false })

      if (error) throw error

      // Formater les dates pour affichage
      const formattedSales = (data || []).map(sale => ({
        ...sale,
        displayDate: new Date(sale.sale_date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        profit: (parseFloat(sale.sale_price) - parseFloat(sale.purchase_price || 0)).toFixed(2),
        profitPercentage: sale.purchase_price > 0
          ? (((parseFloat(sale.sale_price) - parseFloat(sale.purchase_price)) / parseFloat(sale.purchase_price)) * 100).toFixed(1)
          : '0.0'
      }))

      return formattedSales
    } catch (error) {
      console.error('❌ Erreur chargement ventes produits scellés:', error)
      return []
    }
  }

  // Créer une vente de produit scellé
  const createSealedProductSale = async (saleData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Créer la vente dans Supabase
      const { data: sale, error } = await supabase
        .from('sealed_product_sales')
        .insert({
          user_id: user.id,
          product_id: saleData.productId,
          product_name: saleData.productName,
          product_image: saleData.productImage,
          quantity: saleData.quantity || 1,
          sale_price: parseFloat(saleData.salePrice),
          purchase_price: parseFloat(saleData.purchasePrice || 0),
          buyer: saleData.buyer || null,
          notes: saleData.notes || null,
          sale_date: saleData.saleDate || new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Formater pour affichage
      const formattedSale = {
        ...sale,
        displayDate: new Date(sale.sale_date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        profit: (parseFloat(sale.sale_price) - parseFloat(sale.purchase_price || 0)).toFixed(2),
        profitPercentage: sale.purchase_price > 0
          ? (((parseFloat(sale.sale_price) - parseFloat(sale.purchase_price)) / parseFloat(sale.purchase_price)) * 100).toFixed(1)
          : '0.0'
      }

      // Mettre à jour l'état local
      setSealedProductSales(prev => [formattedSale, ...prev])

      // Retirer le produit de la collection ou réduire la quantité
      const product = sealedProducts.find(p => p.id === saleData.productId)
      if (product) {
        const currentQuantity = product.quantity || 1
        const soldQuantity = saleData.quantity || 1

        if (soldQuantity >= currentQuantity) {
          // Supprimer complètement le produit
          await UserSealedProductsService.deleteSealedProduct(saleData.productId)
          setSealedProducts(prev => prev.filter(p => p.id !== saleData.productId))
        } else {
          // Réduire la quantité
          await UserSealedProductsService.updateSealedProduct(saleData.productId, {
            quantity: currentQuantity - soldQuantity
          })
          setSealedProducts(prev =>
            prev.map(p =>
              p.id === saleData.productId
                ? { ...p, quantity: currentQuantity - soldQuantity }
                : p
            )
          )
        }
      }

      console.log('✅ Vente de produit scellé créée:', sale)
      return formattedSale
    } catch (error) {
      console.error('❌ Erreur création vente produit scellé:', error)
      throw error
    }
  }

  // Annuler une vente et restaurer le produit
  const cancelSealedProductSale = async (sale) => {
    try {
      // Vérifier si le produit existe encore dans la collection
      const existingProduct = sealedProducts.find(p => p.id === sale.product_id)

      if (existingProduct) {
        // Augmenter la quantité
        await UserSealedProductsService.updateSealedProduct(sale.product_id, {
          quantity: (existingProduct.quantity || 1) + (sale.quantity || 1)
        })
        setSealedProducts(prev =>
          prev.map(p =>
            p.id === sale.product_id
              ? { ...p, quantity: (p.quantity || 1) + (sale.quantity || 1) }
              : p
          )
        )
      } else {
        // Recréer le produit dans la collection
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Non authentifié')

        const restoredProduct = {
          name: sale.product_name,
          market_price: parseFloat(sale.purchase_price || 0) / (sale.quantity || 1),
          purchase_price: parseFloat(sale.purchase_price || 0) / (sale.quantity || 1),
          image_url: sale.product_image,
          quantity: sale.quantity || 1,
          condition: 'Impeccable'
        }

        const newProduct = await UserSealedProductsService.addSealedProduct(user.id, restoredProduct)
        setSealedProducts(prev => [newProduct, ...prev])
      }

      // Supprimer la vente
      const { error } = await supabase
        .from('sealed_product_sales')
        .delete()
        .eq('id', sale.id)

      if (error) throw error

      setSealedProductSales(prev => prev.filter(s => s.id !== sale.id))

      console.log('✅ Vente annulée et produit restauré')
    } catch (error) {
      console.error('❌ Erreur annulation vente:', error)
      throw error
    }
  }

  // Calculer les statistiques
  const getStats = () => {
    const totalProducts = sealedProducts.reduce((sum, product) => sum + (product.quantity || 1), 0)

    const totalMarketValue = sealedProducts.reduce((sum, product) => {
      const marketPrice = parseFloat(product.market_price || 0)
      const quantity = parseInt(product.quantity || 1)
      return sum + (marketPrice * quantity)
    }, 0)

    const totalPurchaseValue = sealedProducts.reduce((sum, product) => {
      const purchasePrice = parseFloat(product.purchase_price || 0)
      const quantity = parseInt(product.quantity || 1)
      return sum + (purchasePrice * quantity)
    }, 0)

    const plusValue = totalMarketValue - totalPurchaseValue

    return {
      totalProducts,
      totalMarketValue: totalMarketValue.toFixed(2),
      totalPurchaseValue: totalPurchaseValue.toFixed(2),
      plusValue: plusValue.toFixed(2),
      plusValuePercentage: totalPurchaseValue > 0
        ? ((plusValue / totalPurchaseValue) * 100).toFixed(1)
        : '0.0'
    }
  }

  // Obtenir les produits les plus valorisés
  const getMostValuedProducts = (limit = 5) => {
    return [...sealedProducts]
      .sort((a, b) => {
        const valueA = parseFloat(a.market_price || 0)
        const valueB = parseFloat(b.market_price || 0)
        return valueB - valueA
      })
      .slice(0, limit)
  }

  // Obtenir les statistiques de ventes
  const getSalesStats = () => {
    const totalSales = sealedProductSales.length

    const totalRevenue = sealedProductSales.reduce((sum, sale) => {
      return sum + parseFloat(sale.sale_price || 0)
    }, 0)

    const totalProfit = sealedProductSales.reduce((sum, sale) => {
      const salePrice = parseFloat(sale.sale_price || 0)
      const purchasePrice = parseFloat(sale.purchase_price || 0)
      return sum + (salePrice - purchasePrice)
    }, 0)

    const averageSalePrice = totalSales > 0
      ? (totalRevenue / totalSales).toFixed(2)
      : '0.00'

    return {
      totalSales,
      totalRevenue: totalRevenue.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      averageSalePrice
    }
  }

  // Obtenir les dernières ventes
  const getRecentSales = (limit = 8) => {
    return sealedProductSales.slice(0, limit)
  }

  // Recharger les données
  const refreshData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [productsData, salesData] = await Promise.all([
      UserSealedProductsService.loadUserSealedProducts(user.id),
      loadSealedProductSales(user.id)
    ])

    setSealedProducts(productsData)
    setSealedProductSales(salesData)
  }

  const value = {
    sealedProducts,
    sealedProductSales,
    isLoading,
    createSealedProductSale,
    cancelSealedProductSale,
    getStats,
    getMostValuedProducts,
    getSalesStats,
    getRecentSales,
    refreshData
  }

  return (
    <SealedProductsContext.Provider value={value}>
      {children}
    </SealedProductsContext.Provider>
  )
}

export function useSealedProducts() {
  const context = useContext(SealedProductsContext)
  if (!context) {
    throw new Error('useSealedProducts must be used within a SealedProductsProvider')
  }
  return context
}
