/**
 * Service d'administration pour la gestion manuelle de la base de données
 * Fonctions pour modifier/ajouter/supprimer des blocs, extensions et cartes
 */

import { config } from '@/lib/config'

export class AdminService {
  static BASE_URL = config.API_BASE_URL

  /**
   * Fonctions de gestion des blocs/séries
   */
  static async createBlock(blockData) {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/blocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blockData)
      })

      if (!response.ok) {
        throw new Error(`Erreur création bloc: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur création bloc:', error)
      throw error
    }
  }

  static async updateBlock(blockId, blockData) {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/blocks/${blockId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blockData)
      })

      if (!response.ok) {
        throw new Error(`Erreur mise à jour bloc: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur mise à jour bloc:', error)
      throw error
    }
  }

  static async deleteBlock(blockId) {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/blocks/${blockId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Erreur suppression bloc: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur suppression bloc:', error)
      throw error
    }
  }

  /**
   * Fonctions de gestion des extensions/sets
   */
  static async createSet(setData) {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setData)
      })

      if (!response.ok) {
        throw new Error(`Erreur création extension: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur création extension:', error)
      throw error
    }
  }

  static async updateSet(setId, setData) {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/sets/${setId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setData)
      })

      if (!response.ok) {
        throw new Error(`Erreur mise à jour extension: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur mise à jour extension:', error)
      throw error
    }
  }

  static async deleteSet(setId) {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/sets/${setId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Erreur suppression extension: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur suppression extension:', error)
      throw error
    }
  }

  /**
   * Fonctions de gestion des cartes
   */
  static async createCard(cardData) {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData)
      })

      if (!response.ok) {
        throw new Error(`Erreur création carte: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur création carte:', error)
      throw error
    }
  }

  static async updateCard(cardId, cardData) {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData)
      })

      if (!response.ok) {
        throw new Error(`Erreur mise à jour carte: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur mise à jour carte:', error)
      throw error
    }
  }

  static async deleteCard(cardId) {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/cards/${cardId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Erreur suppression carte: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur suppression carte:', error)
      throw error
    }
  }

  /**
   * Fonctions utilitaires d'administration
   */
  static async syncWithExternalAPI(apiSource = 'pokemon-tcg') {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/sync/${apiSource}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur synchronisation: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error)
      throw error
    }
  }

  static async getDatabaseStats() {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/stats`)

      if (!response.ok) {
        throw new Error(`Erreur récupération stats: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur récupération stats:', error)
      throw error
    }
  }

  static async cleanupDatabase() {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/cleanup`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`Erreur nettoyage BDD: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur nettoyage BDD:', error)
      throw error
    }
  }

  /**
   * Validation des données avant envoi
   */
  static validateBlockData(blockData) {
    const required = ['name', 'series', 'releaseDate']
    const missing = required.filter(field => !blockData[field])

    if (missing.length > 0) {
      throw new Error(`Champs requis manquants: ${missing.join(', ')}`)
    }

    return true
  }

  static validateSetData(setData) {
    const required = ['name', 'series', 'code', 'blockId']
    const missing = required.filter(field => !setData[field])

    if (missing.length > 0) {
      throw new Error(`Champs requis manquants: ${missing.join(', ')}`)
    }

    return true
  }

  static validateCardData(cardData) {
    const required = ['name', 'setId', 'number']
    const missing = required.filter(field => !cardData[field])

    if (missing.length > 0) {
      throw new Error(`Champs requis manquants: ${missing.join(', ')}`)
    }

    return true
  }
}