import { useState, useEffect, useMemo, createContext, useContext } from 'react'
import { SupabaseCollectionService } from '@/services/SupabaseCollectionService'
import { supabase } from '@/lib/supabaseClient'
import { getNumericPrice } from '@/utils/priceFormatter'
import { DEFAULT_CARD_PURCHASE_PRICE } from '@/constants/cardPricing'

const CollectionContext = createContext()

export function CollectionProvider({ children }) {
  const [collection, setCollection] = useState([])
  const [favorites, setFavorites] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [recentAdditions, setRecentAdditions] = useState([])
  const [duplicateBatches, setDuplicateBatches] = useState([])
  const [sales, setSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)

  // Vérifier l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setAuthInitialized(true)
      }
    }

    checkAuth()

    // Écouter les événements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // IMPORTANT : Attendre 500ms pour que getSession() soit prêt
        setTimeout(() => {
          setAuthInitialized(true)
        }, 500)
      } else if (event === 'SIGNED_OUT') {
        setAuthInitialized(false)
        setCollection([])
        setFavorites([])
        setWishlist([])
        setDuplicateBatches([])
        setSales([])
        setRecentAdditions([])
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

        const [
          collectionData,
          favoritesData,
          wishlistData,
          batchesData,
          salesData
        ] = await Promise.all([
          SupabaseCollectionService.getUserCollection(),
          SupabaseCollectionService.getUserFavorites(),
          SupabaseCollectionService.getUserWishlist(),
          SupabaseCollectionService.getDuplicateBatches(),
          SupabaseCollectionService.getUserSales()
        ])

        setCollection(collectionData)
        setFavorites(favoritesData)
        setWishlist(wishlistData)
        setDuplicateBatches(batchesData)
        setSales(salesData)

        // Les 10 dernières cartes ajoutées
        const recent = collectionData
          .sort((a, b) => new Date(b.date_added) - new Date(a.date_added))
          .slice(0, 10)
        setRecentAdditions(recent)
      } catch (error) {
        console.error('Erreur chargement données utilisateur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [authInitialized])

  const addToCollection = async (card) => {
    try {
      const newCard = {
        ...card,
        dateAdded: new Date().toISOString(),
        displayDate: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      }

      // Appel API Supabase
      const result = await SupabaseCollectionService.addToCollection(newCard)

      // Mettre à jour l'état local
      setCollection(prev => [...prev, result])

      // Ajouter aux ajouts récents (garder seulement les 10 derniers)
      setRecentAdditions(prev => {
        const updated = [result, ...prev].slice(0, 10)
        return updated
      })

      return result
    } catch (error) {
      throw error
    }
  }

  const removeFromCollection = async (cardId) => {
    try {
      await SupabaseCollectionService.removeFromCollection(cardId)
      setCollection(prev => prev.filter(card => card.id !== cardId))
      setRecentAdditions(prev => prev.filter(card => card.id !== cardId))
    } catch (error) {
      throw error
    }
  }

  const updateCardInCollection = async (cardId, updatedData) => {
    try {
      await SupabaseCollectionService.updateCollectionCard(cardId, updatedData)
      setCollection(prev => prev.map(card =>
        card.id === cardId ? { ...card, ...updatedData } : card
      ))
      setRecentAdditions(prev => prev.map(card =>
        card.id === cardId ? { ...card, ...updatedData } : card
      ))
    } catch (error) {
      throw error
    }
  }

  const addToFavorites = async (card) => {
    try {
      if (favorites.find(fav => fav.card_id === card.id)) {
        return
      }
      const result = await SupabaseCollectionService.addToFavorites(card)
      setFavorites(prev => [...prev, result])
    } catch (error) {
      throw error
    }
  }

  const removeFromFavorites = async (cardId) => {
    try {
      await SupabaseCollectionService.removeFromFavorites(cardId)
      setFavorites(prev => prev.filter(card => card.card_id !== cardId))
    } catch (error) {
      throw error
    }
  }

  const addToWishlist = async (card) => {
    try {
      if (wishlist.find(wish => wish.card_id === card.id)) {
        return
      }
      const result = await SupabaseCollectionService.addToWishlist(card)
      setWishlist(prev => [...prev, result])
    } catch (error) {
      throw error
    }
  }

  const removeFromWishlist = async (cardId) => {
    try {
      await SupabaseCollectionService.removeFromWishlist(cardId)
      setWishlist(prev => prev.filter(card => card.card_id !== cardId))
    } catch (error) {
      throw error
    }
  }

  const toggleFavorite = async (card) => {
    const isFavorite = favorites.find(fav => fav.card_id === card.id)
    if (isFavorite) {
      await removeFromFavorites(card.id)
    } else {
      await addToFavorites(card)
    }
  }

  const toggleWishlist = async (card) => {
    const isInWishlist = wishlist.find(wish => wish.card_id === card.id)
    if (isInWishlist) {
      await removeFromWishlist(card.id)
      return { action: 'removed', card }
    } else {
      await addToWishlist(card)
      return { action: 'added', card }
    }
  }

  // Calculer les statistiques
  const getStats = () => {
    // Total d'exemplaires (somme des quantités)
    const totalCards = collection.reduce((sum, card) => {
      return sum + parseInt(card.quantity || 1)
    }, 0)

    // Nombre de cartes uniques (nombre de lignes distinctes)
    const uniqueCards = collection.length

    const totalValue = collection.reduce((sum, card) => {
      const marketPrice = getNumericPrice(card) // Utilise la même logique que l'affichage
      const quantity = parseInt(card.quantity || 1)
      return sum + (marketPrice * quantity)
    }, 0)

    const totalPurchaseValue = collection.reduce((sum, card) => {
      // Si pas de prix d'achat renseigné, utiliser le prix par défaut (0.60€)
      const purchasePrice = parseFloat(card.purchasePrice || DEFAULT_CARD_PURCHASE_PRICE)
      const quantity = parseInt(card.quantity || 1)
      return sum + (purchasePrice * quantity)
    }, 0)

    const rareCards = collection.filter(card =>
      card.rarity && (
        card.rarity.includes('Rare') ||
        card.rarity.includes('Ultra') ||
        card.rarity.includes('Secret')
      )
    ).length

    return {
      totalCards, // Total d'exemplaires (avec quantités)
      uniqueCards, // Nombre de cartes uniques
      totalValue: totalValue.toFixed(2),
      totalPurchaseValue: totalPurchaseValue.toFixed(2),
      rareCards,
      favoriteCards: favorites.length,
      wishlistCards: wishlist.length,
      duplicates: duplicates.length
    }
  }

  // Obtenir les cartes les plus valorisées
  const getMostValuedCards = (limit = 5) => {
    return [...collection]
      .sort((a, b) => {
        const valueA = getNumericPrice(a) // Utilise la même logique que l'affichage
        const valueB = getNumericPrice(b) // Utilise la même logique que l'affichage
        return valueB - valueA
      })
      .slice(0, limit)
  }

  // Calculer les doublons avec useMemo pour performance (cartes avec quantité > 1 ou cartes identiques multiples)
  // Algorithme optimisé O(n) au lieu de O(n²)
  const duplicates = useMemo(() => {
    if (collection.length === 0) return []

    const seen = new Set()
    const duplicatesList = []
    const cardCounts = {}

    // Ordre de priorité des conditions (pour garder le meilleur exemplaire)
    const conditionOrder = {
      'Neuf': 5,
      'Proche du neuf': 4,
      'Excellent': 3,
      'Bon': 2,
      'Acceptable': 1,
      'Endommagé': 0
    }

    // PASSE UNIQUE: grouper les cartes et détecter les doublons en même temps
    for (const card of collection) {
      const version = card.version || 'Normale'

      // Construire une clé robuste
      let cardKey
      if (card.card_id) {
        cardKey = card.card_id
      } else {
        const setId = card.set?.id || card.extension || 'unknown'
        const number = card.number || ''
        const name = card.name || 'unknown'
        cardKey = `${name.toLowerCase()}-${setId.toLowerCase()}-${number}`
      }

      const key = `${cardKey}-${version}`

      // Cartes avec quantité > 1 sont des doublons
      if (card.quantity > 1 && !seen.has(card.id)) {
        seen.add(card.id)
        duplicatesList.push(card)
      }

      // Grouper pour détecter les cartes identiques multiples
      if (!cardCounts[key]) {
        cardCounts[key] = []
      }
      cardCounts[key].push(card)
    }

    // Traiter les groupes de cartes identiques
    for (const cards of Object.values(cardCounts)) {
      if (cards.length > 1) {
        // Trier par condition (meilleur en dernier)
        cards.sort((a, b) => (conditionOrder[a.condition] || 0) - (conditionOrder[b.condition] || 0))

        // Ajouter tous sauf le meilleur (dernier après tri)
        for (let i = 0; i < cards.length - 1; i++) {
          const card = cards[i]
          if (!seen.has(card.id)) {
            seen.add(card.id)
            duplicatesList.push(card)
          }
        }
      }
    }

    // Trier par date d'extension (plus récent en premier) puis par numéro
    duplicatesList.sort((a, b) => {
      const dateA = a.set?.releaseDate ? new Date(a.set.releaseDate).getTime() : Date.now()
      const dateB = b.set?.releaseDate ? new Date(b.set.releaseDate).getTime() : Date.now()

      if (dateB !== dateA) return dateB - dateA

      const numA = parseInt(a.number) || 0
      const numB = parseInt(b.number) || 0
      return numA - numB
    })

    return duplicatesList
  }, [collection])

  // Gestion des lots de doublons
  const createDuplicateBatch = async (batchData) => {
    try {
      // Appel API Supabase
      const result = await SupabaseCollectionService.createDuplicateBatch(batchData)

      // Mettre à jour l'état local
      setDuplicateBatches(prev => [...prev, result])

      return result
    } catch (error) {
      console.error('❌ Erreur création lot doublons:', error)
      throw error
    }
  }

  const updateDuplicateBatch = async (updatedBatch) => {
    try {
      // Appel API Supabase
      await SupabaseCollectionService.updateDuplicateBatch(updatedBatch.id, updatedBatch)

      // Mettre à jour l'état local
      setDuplicateBatches(prev =>
        prev.map(batch =>
          batch.id === updatedBatch.id ? updatedBatch : batch
        )
      )
    } catch (error) {
      console.error('❌ Erreur mise à jour lot doublons:', error)
      throw error
    }
  }

  const deleteDuplicateBatch = async (batchId) => {
    try {
      // Appel API Supabase
      await SupabaseCollectionService.deleteDuplicateBatch(batchId)

      // Mettre à jour l'état local
      setDuplicateBatches(prev => prev.filter(batch => batch.id !== batchId))
    } catch (error) {
      console.error('❌ Erreur suppression lot doublons:', error)
      throw error
    }
  }

  // Gestion des ventes
  const createSale = async (saleData) => {
    try {
      // Appel API Supabase
      const result = await SupabaseCollectionService.createSale(saleData)

      // Mettre à jour l'état local
      setSales(prev => [result, ...prev])

      // Retirer la carte de la collection si c'est une vente unitaire
      if (saleData.type === 'card' && saleData.cardId) {
        const card = collection.find(c => c.id === saleData.cardId)
        if (card) {
          const currentQuantity = card.quantity || 1
          const soldQuantity = saleData.quantity || 1

          if (soldQuantity >= currentQuantity) {
            // Retirer complètement la carte si on vend tout
            await removeFromCollection(saleData.cardId)
          } else {
            // Réduire la quantité si on vend partiellement
            await updateCardInCollection(saleData.cardId, {
              quantity: currentQuantity - soldQuantity
            })
          }
        }
      }
      // Retirer le lot de doublons si c'est une vente de lot
      else if (saleData.type === 'batch' && saleData.batchId) {
        await deleteDuplicateBatch(saleData.batchId)
        // Retirer toutes les cartes du lot de la collection
        if (saleData.cards && Array.isArray(saleData.cards)) {
          for (const card of saleData.cards) {
            if (card.id) {
              await removeFromCollection(card.id)
            }
          }
        }
      }

      return result
    } catch (error) {
      console.error('❌ Erreur création vente:', error)
      throw error
    }
  }

  const deleteSale = async (saleId) => {
    try {
      // Appel API Supabase
      await SupabaseCollectionService.deleteSale(saleId)

      // Mettre à jour l'état local
      setSales(prev => prev.filter(sale => sale.id !== saleId))
    } catch (error) {
      console.error('❌ Erreur suppression vente:', error)
      throw error
    }
  }

  // Annuler une vente et restaurer les cartes dans la collection
  const cancelSale = async (saleData) => {
    try {
      // Restaurer la carte ou le lot dans la collection
      if (saleData.type === 'card') {
        // Vérifier si la carte existe déjà dans la collection
        const existingCard = collection.find(c => c.id === saleData.cardId)

        if (existingCard) {
          // Augmenter la quantité si la carte existe déjà
          await updateCardInCollection(saleData.cardId, {
            quantity: (existingCard.quantity || 1) + (saleData.quantity || 1)
          })
        } else {
          // Recréer la carte dans la collection
          const restoredCard = {
            id: saleData.cardId,
            name: saleData.cardName,
            series: saleData.cardSeries,
            extension: saleData.cardSeries,
            rarity: saleData.cardRarity,
            image: saleData.cardImage,
            images: saleData.cardImage ? { small: saleData.cardImage } : null,
            purchasePrice: (parseFloat(saleData.purchasePrice) / (saleData.quantity || 1)).toFixed(2),
            marketPrice: (parseFloat(saleData.purchasePrice) / (saleData.quantity || 1)).toFixed(2),
            value: (parseFloat(saleData.purchasePrice) / (saleData.quantity || 1)).toFixed(2),
            quantity: saleData.quantity || 1,
            dateAdded: new Date().toISOString(),
            displayDate: new Date().toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }),
            condition: 'Non spécifié'
          }
          await addToCollection(restoredCard)
        }
      } else if (saleData.type === 'batch' && saleData.cards) {
        // Restaurer toutes les cartes du lot
        for (const card of saleData.cards) {
          await addToCollection(card)
        }

        // Recréer le lot de doublons si nécessaire
        if (saleData.batchId && saleData.batchName) {
          const restoredBatch = {
            id: saleData.batchId,
            name: saleData.batchName,
            description: saleData.batchDescription || '',
            cards: saleData.cards,
            createdAt: new Date().toISOString(),
            totalValue: saleData.cards.reduce((sum, card) =>
              sum + parseFloat(card.marketPrice || card.value || 0), 0
            ).toFixed(2)
          }
          await createDuplicateBatch(restoredBatch)
        }
      }

      // Supprimer la vente de l'historique
      await deleteSale(saleData.id)
    } catch (error) {
      console.error('❌ Erreur annulation vente:', error)
      throw error
    }
  }

  // Obtenir les statistiques de ventes
  const getSalesStats = () => {
    const totalSales = sales.length
    const cardSales = sales.filter(sale => sale.type === 'card').length
    const batchSales = sales.filter(sale => sale.type === 'batch').length

    const totalRevenue = sales.reduce((sum, sale) => {
      return sum + parseFloat(sale.salePrice || 0)
    }, 0)

    const totalProfit = sales.reduce((sum, sale) => {
      const salePrice = parseFloat(sale.salePrice || 0)
      const purchasePrice = parseFloat(sale.purchasePrice || 0)
      return sum + (salePrice - purchasePrice)
    }, 0)

    const averageSalePrice = totalSales > 0
      ? (totalRevenue / totalSales).toFixed(2)
      : '0.00'

    return {
      totalSales,
      cardSales,
      batchSales,
      totalRevenue: totalRevenue.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      averageSalePrice
    }
  }

  // Obtenir les dernières ventes
  const getRecentSales = (limit = 8) => {
    return sales.slice(0, limit)
  }

  const value = {
    collection,
    favorites,
    wishlist,
    recentAdditions,
    duplicates, // Valeur mémorisée au lieu de fonction
    duplicateBatches,
    sales,
    isLoading,
    addToCollection,
    removeFromCollection,
    updateCardInCollection,
    addToFavorites,
    removeFromFavorites,
    addToWishlist,
    removeFromWishlist,
    toggleFavorite,
    toggleWishlist,
    getStats,
    getMostValuedCards,
    createDuplicateBatch,
    updateDuplicateBatch,
    deleteDuplicateBatch,
    createSale,
    deleteSale,
    cancelSale,
    getSalesStats,
    getRecentSales
  }

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  )
}

export function useCollection() {
  const context = useContext(CollectionContext)
  if (!context) {
    throw new Error('useCollection must be used within a CollectionProvider')
  }
  return context
}
