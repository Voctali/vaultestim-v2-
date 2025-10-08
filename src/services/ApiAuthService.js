/**
 * Service d'authentification via API backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.50.137:3000/api'

export class ApiAuthService {
  /**
   * Récupérer le token stocké
   */
  static getToken() {
    return localStorage.getItem('vaultestim_token')
  }

  /**
   * Sauvegarder le token
   */
  static setToken(token) {
    localStorage.setItem('vaultestim_token', token)
  }

  /**
   * Supprimer le token
   */
  static removeToken() {
    localStorage.removeItem('vaultestim_token')
  }

  /**
   * Headers avec authentification
   */
  static getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }
    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  /**
   * Inscription
   */
  static async register(email, password, name) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      // Sauvegarder le token
      this.setToken(data.token)

      return data.user
    } catch (error) {
      console.error('❌ Erreur registration:', error)
      throw error
    }
  }

  /**
   * Connexion
   */
  static async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion')
      }

      // Sauvegarder le token
      this.setToken(data.token)

      return data.user
    } catch (error) {
      console.error('❌ Erreur login:', error)
      throw error
    }
  }

  /**
   * Récupérer l'utilisateur connecté
   */
  static async getCurrentUser() {
    try {
      const token = this.getToken()
      if (!token) return null

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        // Token invalide ou expiré
        this.removeToken()
        return null
      }

      const data = await response.json()
      return data.user
    } catch (error) {
      console.error('❌ Erreur getCurrentUser:', error)
      this.removeToken()
      return null
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  static async updateUser(updates) {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      return data.user
    } catch (error) {
      console.error('❌ Erreur updateUser:', error)
      throw error
    }
  }

  /**
   * Changer le mot de passe
   */
  static async changePassword(oldPassword, newPassword) {
    try {
      const response = await fetch(`${API_URL}/users/password`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ oldPassword, newPassword })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement de mot de passe')
      }

      return data
    } catch (error) {
      console.error('❌ Erreur changePassword:', error)
      throw error
    }
  }

  /**
   * Déconnexion
   */
  static logout() {
    this.removeToken()
  }
}
