/**
 * Service pour la gestion des uploads de fichiers
 */
import { config } from '@/lib/config'

const API_BASE_URL = config.API_BASE_URL

export class UploadService {
  /**
   * Uploader un fichier
   */
  static async uploadFile(file, type = 'auto') {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur upload:', error)
      throw error
    }
  }

  /**
   * Valider un fichier avant upload
   */
  static async validateFile(fileContent, type) {
    try {
      const response = await fetch(`${API_BASE_URL}/upload/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data: fileContent
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur validation:', error)
      throw error
    }
  }

  /**
   * Obtenir l'historique des uploads
   */
  static async getUploadHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/upload/history`)

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur historique uploads:', error)
      throw error
    }
  }

  /**
   * Parser un fichier CSV
   */
  static parseCSV(content) {
    try {
      const lines = content.split('\n').filter(line => line.trim())
      if (lines.length === 0) {
        throw new Error('Fichier CSV vide')
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || ''
          return obj
        }, {})
      })

      return {
        headers,
        rows,
        totalRows: rows.length,
        preview: rows.slice(0, 5)
      }
    } catch (error) {
      throw new Error(`Erreur parsing CSV: ${error.message}`)
    }
  }

  /**
   * Parser un fichier JSON
   */
  static parseJSON(content) {
    try {
      const data = JSON.parse(content)
      return {
        data,
        isArray: Array.isArray(data),
        count: Array.isArray(data) ? data.length : 1,
        preview: Array.isArray(data) ? data.slice(0, 3) : [data]
      }
    } catch (error) {
      throw new Error(`Erreur parsing JSON: ${error.message}`)
    }
  }

  /**
   * Valider la structure d'une carte
   */
  static validateCardStructure(card) {
    const errors = []
    const warnings = []

    // Champs requis
    if (!card.name) errors.push('Nom manquant')
    if (!card.id) warnings.push('ID manquant (sera généré automatiquement)')

    // Validation des types
    if (card.types && !Array.isArray(card.types)) {
      errors.push('Les types doivent être un tableau')
    }

    // Validation HP
    if (card.hp && (isNaN(card.hp) || card.hp < 0)) {
      errors.push('HP doit être un nombre positif')
    }

    // Validation images
    if (card.images) {
      if (typeof card.images !== 'object') {
        errors.push('Images doit être un objet')
      } else {
        if (card.images.large && !this.isValidUrl(card.images.large)) {
          warnings.push('URL image large invalide')
        }
        if (card.images.small && !this.isValidUrl(card.images.small)) {
          warnings.push('URL image small invalide')
        }
      }
    }

    return { errors, warnings }
  }

  /**
   * Valider une URL
   */
  static isValidUrl(string) {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  /**
   * Estimer le temps de traitement
   */
  static estimateProcessingTime(fileSize, recordCount) {
    // Estimation basée sur la taille et le nombre d'enregistrements
    const baseTime = 2000 // 2 secondes de base
    const sizeMultiplier = fileSize / (1024 * 1024) // MB
    const recordMultiplier = recordCount / 100

    return Math.max(baseTime, baseTime + (sizeMultiplier * 1000) + (recordMultiplier * 500))
  }

  /**
   * Formater la taille de fichier
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Détecter le type de fichier depuis le contenu
   */
  static detectFileType(content, filename) {
    // Détection basée sur l'extension
    if (filename.toLowerCase().endsWith('.json')) {
      return 'json'
    }
    if (filename.toLowerCase().endsWith('.csv')) {
      return 'csv'
    }

    // Détection basée sur le contenu
    const trimmed = content.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return 'json'
    }

    // Par défaut, assume CSV
    return 'csv'
  }
}