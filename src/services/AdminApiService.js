/**
 * Service pour la gestion des utilisateurs par les administrateurs
 * Utilise le backend API pour les opérations CRUD
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://192.168.50.137:3000/api'

export class AdminApiService {
  /**
   * Récupérer le token d'authentification
   */
  static getToken() {
    return localStorage.getItem('vaultestim_token')
  }

  /**
   * Headers pour les requêtes authentifiées
   */
  static getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    }
  }

  /**
   * Récupérer tous les utilisateurs (admin uniquement)
   */
  static async getAllUsers() {
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la récupération des utilisateurs')
      }

      const data = await response.json()
      return data.users
    } catch (error) {
      console.error('❌ Erreur getAllUsers:', error)
      throw error
    }
  }

  /**
   * Mettre à jour un utilisateur (admin uniquement)
   */
  static async updateUser(userId, updates) {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour de l\'utilisateur')
      }

      const data = await response.json()
      return data.user
    } catch (error) {
      console.error('❌ Erreur updateUser:', error)
      throw error
    }
  }

  /**
   * Supprimer un utilisateur (admin uniquement)
   */
  static async deleteUser(userId) {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression de l\'utilisateur')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Erreur deleteUser:', error)
      throw error
    }
  }
}
