/**
 * Service API pour communiquer avec le backend SQLite
 */

import { config } from '@/lib/config'

export class BackendApiService {
  static API_BASE_URL = config.API_BASE_URL

  /**
   * Obtenir le token JWT depuis localStorage
   */
  static getAuthToken() {
    return localStorage.getItem('vaultestim_token')
  }

  /**
   * Headers par défaut avec authentification
   */
  static getHeaders() {
    const token = this.getAuthToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  // ==================== CARTES DÉCOUVERTES ====================

  /**
   * Récupérer toutes les cartes découvertes
   */
  static async getDiscoveredCards() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/collection/discovered`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur récupération cartes')
      }

      const data = await response.json()
      return data.cards || []
    } catch (error) {
      console.error('❌ Erreur getDiscoveredCards:', error)
      throw error
    }
  }

  /**
   * Ajouter de nouvelles cartes découvertes
   */
  static async addDiscoveredCards(cards) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/collection/add-cards`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ cards })
      })

      if (!response.ok) {
        throw new Error('Erreur ajout cartes')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur addDiscoveredCards:', error)
      throw error
    }
  }

  /**
   * Mettre à jour une carte
   */
  static async updateCard(cardId, updates) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/collection/update-card/${cardId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ updates })
      })

      if (!response.ok) {
        throw new Error('Erreur mise à jour carte')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur updateCard:', error)
      throw error
    }
  }

  /**
   * Supprimer une carte
   */
  static async deleteCard(cardId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/collection/delete-card/${cardId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur suppression carte')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur deleteCard:', error)
      throw error
    }
  }

  /**
   * Rechercher des cartes
   */
  static async searchCards(query) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/collection/search?query=${encodeURIComponent(query)}`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur recherche cartes')
      }

      const data = await response.json()
      return data.cards || []
    } catch (error) {
      console.error('❌ Erreur searchCards:', error)
      throw error
    }
  }

  // ==================== SÉRIES ====================

  /**
   * Récupérer la base de données des séries
   */
  static async getSeries() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/collection/series`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur récupération séries')
      }

      const data = await response.json()
      return data.series || []
    } catch (error) {
      console.error('❌ Erreur getSeries:', error)
      throw error
    }
  }

  /**
   * Sauvegarder la base de données des séries
   */
  static async saveSeries(series) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/collection/migrate-series`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ series })
      })

      if (!response.ok) {
        throw new Error('Erreur sauvegarde séries')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur saveSeries:', error)
      throw error
    }
  }

  // ==================== BLOCS PERSONNALISÉS ====================

  /**
   * Récupérer les blocs personnalisés
   */
  static async getCustomBlocks() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/collection/blocks`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur récupération blocs')
      }

      const data = await response.json()
      return data.blocks || []
    } catch (error) {
      console.error('❌ Erreur getCustomBlocks:', error)
      throw error
    }
  }

  /**
   * Sauvegarder les blocs personnalisés
   */
  static async saveCustomBlocks(blocks) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/collection/migrate-blocks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ blocks })
      })

      if (!response.ok) {
        throw new Error('Erreur sauvegarde blocs')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur saveCustomBlocks:', error)
      throw error
    }
  }

  // ==================== EXTENSIONS PERSONNALISÉES ====================

  /**
   * Récupérer les extensions personnalisées
   */
  static async getCustomExtensions() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/collection/custom-extensions`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur récupération extensions')
      }

      const data = await response.json()
      return data.extensions || []
    } catch (error) {
      console.error('❌ Erreur getCustomExtensions:', error)
      throw error
    }
  }

  /**
   * Sauvegarder les extensions personnalisées
   */
  static async saveCustomExtensions(extensions) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/collection/migrate-custom-extensions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ extensions })
      })

      if (!response.ok) {
        throw new Error('Erreur sauvegarde extensions')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur saveCustomExtensions:', error)
      throw error
    }
  }

  // ==================== COLLECTION UTILISATEUR ====================

  /**
   * Récupérer la collection de l'utilisateur
   */
  static async getUserCollection() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/collection`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur récupération collection')
      }

      const data = await response.json()
      return data.collection || []
    } catch (error) {
      console.error('❌ Erreur getUserCollection:', error)
      throw error
    }
  }

  /**
   * Ajouter une carte à la collection
   */
  static async addToCollection(card) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/collection`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ card })
      })

      if (!response.ok) {
        throw new Error('Erreur ajout collection')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur addToCollection:', error)
      throw error
    }
  }

  /**
   * Mettre à jour une carte de la collection
   */
  static async updateCollectionCard(cardId, updates) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/collection/${cardId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ updates })
      })

      if (!response.ok) {
        throw new Error('Erreur mise à jour collection')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur updateCollectionCard:', error)
      throw error
    }
  }

  /**
   * Supprimer une carte de la collection
   */
  static async removeFromCollection(cardId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/collection/${cardId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur suppression collection')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur removeFromCollection:', error)
      throw error
    }
  }

  // ==================== FAVORIS ====================

  /**
   * Récupérer les favoris de l'utilisateur
   */
  static async getUserFavorites() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/favorites`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur récupération favoris')
      }

      const data = await response.json()
      return data.favorites || []
    } catch (error) {
      console.error('❌ Erreur getUserFavorites:', error)
      throw error
    }
  }

  /**
   * Ajouter une carte aux favoris
   */
  static async addToFavorites(card) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/favorites`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ card })
      })

      if (!response.ok) {
        throw new Error('Erreur ajout favoris')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur addToFavorites:', error)
      throw error
    }
  }

  /**
   * Supprimer une carte des favoris
   */
  static async removeFromFavorites(cardId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/favorites/${cardId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur suppression favoris')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur removeFromFavorites:', error)
      throw error
    }
  }

  // ==================== WISHLIST ====================

  /**
   * Récupérer la wishlist de l'utilisateur
   */
  static async getUserWishlist() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/wishlist`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur récupération wishlist')
      }

      const data = await response.json()
      return data.wishlist || []
    } catch (error) {
      console.error('❌ Erreur getUserWishlist:', error)
      throw error
    }
  }

  /**
   * Ajouter une carte à la wishlist
   */
  static async addToWishlist(card) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/wishlist`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ card })
      })

      if (!response.ok) {
        throw new Error('Erreur ajout wishlist')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur addToWishlist:', error)
      throw error
    }
  }

  /**
   * Supprimer une carte de la wishlist
   */
  static async removeFromWishlist(cardId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/wishlist/${cardId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur suppression wishlist')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur removeFromWishlist:', error)
      throw error
    }
  }

  // ==================== LOTS DE DOUBLONS ====================

  /**
   * Récupérer les lots de doublons de l'utilisateur
   */
  static async getDuplicateBatches() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/duplicate-batches`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur récupération lots doublons')
      }

      const data = await response.json()
      return data.batches || []
    } catch (error) {
      console.error('❌ Erreur getDuplicateBatches:', error)
      throw error
    }
  }

  /**
   * Créer un lot de doublons
   */
  static async createDuplicateBatch(batch) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/duplicate-batches`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ batch })
      })

      if (!response.ok) {
        throw new Error('Erreur création lot doublons')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur createDuplicateBatch:', error)
      throw error
    }
  }

  /**
   * Mettre à jour un lot de doublons
   */
  static async updateDuplicateBatch(batchId, batch) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/duplicate-batches/${batchId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ batch })
      })

      if (!response.ok) {
        throw new Error('Erreur mise à jour lot doublons')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur updateDuplicateBatch:', error)
      throw error
    }
  }

  /**
   * Supprimer un lot de doublons
   */
  static async deleteDuplicateBatch(batchId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/duplicate-batches/${batchId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur suppression lot doublons')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur deleteDuplicateBatch:', error)
      throw error
    }
  }

  // ==================== VENTES ====================

  /**
   * Récupérer les ventes de l'utilisateur
   */
  static async getUserSales() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/sales`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur récupération ventes')
      }

      const data = await response.json()
      return data.sales || []
    } catch (error) {
      console.error('❌ Erreur getUserSales:', error)
      throw error
    }
  }

  /**
   * Créer une vente
   */
  static async createSale(sale) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/sales`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ sale })
      })

      if (!response.ok) {
        throw new Error('Erreur création vente')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur createSale:', error)
      throw error
    }
  }

  /**
   * Supprimer une vente
   */
  static async deleteSale(saleId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/user/sales/${saleId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Erreur suppression vente')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur deleteSale:', error)
      throw error
    }
  }

  // ==================== SANTÉ ====================

  /**
   * Vérifier la santé du backend
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`)

      if (!response.ok) {
        return { status: 'ERROR', message: 'Backend inaccessible' }
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur checkHealth:', error)
      return { status: 'ERROR', message: error.message }
    }
  }
}
