import { useState, useEffect, createContext, useContext } from 'react'
import { useAuth } from './useAuth'
import { UserAuthService } from '@/services/UserAuthService'

const FriendsContext = createContext()

export function FriendsProvider({ children }) {
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [allUsers, setAllUsers] = useState([])

  // Charger les utilisateurs depuis IndexedDB
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await UserAuthService.getAllUsers()
        setAllUsers(users)
      } catch (error) {
        console.error('Erreur chargement utilisateurs:', error)
      }
    }
    loadUsers()
  }, [])

  // Charger les amis depuis localStorage
  useEffect(() => {
    if (user?.id) {
      const savedFriends = localStorage.getItem(`vaultestim_friends_${user.id}`)
      const savedPending = localStorage.getItem(`vaultestim_pending_requests_${user.id}`)

      if (savedFriends) {
        setFriends(JSON.parse(savedFriends))
      }
      if (savedPending) {
        setPendingRequests(JSON.parse(savedPending))
      }
    }
  }, [user?.id])

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`vaultestim_friends_${user.id}`, JSON.stringify(friends))
    }
  }, [friends, user?.id])

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`vaultestim_pending_requests_${user.id}`, JSON.stringify(pendingRequests))
    }
  }, [pendingRequests, user?.id])

  // Rechercher des utilisateurs
  const searchUsers = (query) => {
    if (!query || query.trim().length < 2) {
      return []
    }

    const searchTerm = query.toLowerCase().trim()
    const friendIds = friends.map(f => f.id)

    return allUsers.filter(u => {
      // Ne pas afficher l'utilisateur courant ni ses amis existants
      if (u.id === user?.id || friendIds.includes(u.id)) {
        return false
      }

      return u.name?.toLowerCase().includes(searchTerm) ||
             u.email?.toLowerCase().includes(searchTerm)
    })
  }

  // Ajouter un ami
  const addFriend = (friendUser) => {
    if (!friends.find(f => f.id === friendUser.id)) {
      const newFriend = {
        ...friendUser,
        addedAt: new Date().toISOString(),
        displayDate: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      }
      setFriends(prev => [...prev, newFriend])
    }
  }

  // Retirer un ami
  const removeFriend = (friendId) => {
    setFriends(prev => prev.filter(f => f.id !== friendId))
  }

  // Obtenir les paramètres de partage d'un ami
  const getFriendSettings = (friendId) => {
    const savedSettings = localStorage.getItem(`vaultestim_settings_${friendId}`)
    if (savedSettings) {
      return JSON.parse(savedSettings)
    }
    return {
      shareCollection: false,
      shareStats: false,
      shareWishlist: false,
      shareFavorites: false
    }
  }

  // Obtenir la collection d'un ami (si partagée)
  const getFriendCollection = (friendId) => {
    const settings = getFriendSettings(friendId)
    if (!settings.shareCollection) {
      return null
    }

    const savedCollection = localStorage.getItem(`vaultestim_collection_${friendId}`)
    if (savedCollection) {
      return JSON.parse(savedCollection)
    }
    return []
  }

  // Obtenir les statistiques d'un ami (si partagées)
  const getFriendStats = (friendId) => {
    const settings = getFriendSettings(friendId)
    if (!settings.shareStats) {
      return null
    }

    const collection = getFriendCollection(friendId)
    if (!collection) {
      return null
    }

    // Calculer les statistiques basiques
    const totalCards = collection.length
    const totalValue = collection.reduce((sum, card) => {
      const marketPrice = parseFloat(card.marketPrice || card.value || '0')
      const quantity = parseInt(card.quantity || 1)
      return sum + (marketPrice * quantity)
    }, 0)

    const totalPurchaseValue = collection.reduce((sum, card) => {
      const purchasePrice = parseFloat(card.purchasePrice || '0')
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
      totalCards,
      totalValue: totalValue.toFixed(2),
      totalPurchaseValue: totalPurchaseValue.toFixed(2),
      rareCards
    }
  }

  // Obtenir les favoris d'un ami (si partagés)
  const getFriendFavorites = (friendId) => {
    const settings = getFriendSettings(friendId)
    if (!settings.shareFavorites) {
      return null
    }

    const savedFavorites = localStorage.getItem(`vaultestim_favorites_${friendId}`)
    if (savedFavorites) {
      return JSON.parse(savedFavorites)
    }
    return []
  }

  // Obtenir la wishlist d'un ami (si partagée)
  const getFriendWishlist = (friendId) => {
    const settings = getFriendSettings(friendId)
    if (!settings.shareWishlist) {
      return null
    }

    const savedWishlist = localStorage.getItem(`vaultestim_wishlist_${friendId}`)
    if (savedWishlist) {
      return JSON.parse(savedWishlist)
    }
    return []
  }

  const value = {
    friends,
    pendingRequests,
    searchUsers,
    addFriend,
    removeFriend,
    getFriendSettings,
    getFriendCollection,
    getFriendStats,
    getFriendFavorites,
    getFriendWishlist
  }

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  )
}

export function useFriends() {
  const context = useContext(FriendsContext)
  if (!context) {
    throw new Error('useFriends must be used within a FriendsProvider')
  }
  return context
}
