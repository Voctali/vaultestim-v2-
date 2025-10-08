/**
 * Service pour gérer l'upload et le stockage d'images dans IndexedDB
 */

export class ImageUploadService {
  static DB_NAME = 'VaultEstim_Images'
  static DB_VERSION = 1
  static STORE_NAME = 'uploaded_images'

  /**
   * Initialiser la base de données IndexedDB pour les images
   */
  static async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('entityId', 'entityId', { unique: false })
          store.createIndex('uploadDate', 'uploadDate', { unique: false })
        }
      }
    })
  }

  /**
   * Convertir un fichier en base64
   */
  static fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Valider un fichier image
   */
  static validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.')
    }

    if (file.size > maxSize) {
      throw new Error('Fichier trop volumineux. Maximum 5MB.')
    }

    return true
  }

  /**
   * Uploader une image et la stocker dans IndexedDB
   */
  static async uploadImage(file, entityType, entityId, entityName = '') {
    try {
      console.log(`📤 Upload image pour ${entityType}: ${entityName}`)

      // Valider le fichier
      this.validateImageFile(file)

      // Convertir en base64
      const base64Data = await this.fileToBase64(file)

      // Créer l'objet image
      const imageData = {
        id: `${entityType}_${entityId}_${Date.now()}`,
        entityType: entityType, // 'card', 'extension', 'block'
        entityId: entityId,
        entityName: entityName,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        base64Data: base64Data,
        uploadDate: new Date().toISOString(),
        url: null // sera généré lors de la récupération
      }

      // Sauvegarder dans IndexedDB
      const db = await this.initDB()
      const transaction = db.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)

      return new Promise((resolve, reject) => {
        const request = store.add(imageData)

        request.onsuccess = () => {
          console.log(`✅ Image sauvegardée: ${imageData.id}`)

          // Générer l'URL blob pour utilisation immédiate
          const blob = this.base64ToBlob(base64Data, file.type)
          const url = URL.createObjectURL(blob)

          resolve({
            id: imageData.id,
            url: url,
            fileName: file.name,
            uploadDate: imageData.uploadDate
          })
        }

        request.onerror = () => reject(request.error)
      })

    } catch (error) {
      console.error('❌ Erreur upload image:', error)
      throw error
    }
  }

  /**
   * Récupérer une image par ID
   */
  static async getImageById(imageId) {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)

      return new Promise((resolve, reject) => {
        const request = store.get(imageId)

        request.onsuccess = () => {
          const imageData = request.result
          if (imageData) {
            // Convertir en blob URL
            const blob = this.base64ToBlob(imageData.base64Data, imageData.mimeType)
            const url = URL.createObjectURL(blob)

            resolve({
              ...imageData,
              url: url
            })
          } else {
            resolve(null)
          }
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('❌ Erreur récupération image:', error)
      return null
    }
  }

  /**
   * Récupérer toutes les images pour une entité
   */
  static async getImagesForEntity(entityType, entityId) {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)

      return new Promise((resolve, reject) => {
        const request = store.getAll()

        request.onsuccess = () => {
          const allImages = request.result
          const entityImages = allImages
            .filter(img => img.entityType === entityType && img.entityId === entityId)
            .map(imageData => {
              // Convertir en blob URL
              const blob = this.base64ToBlob(imageData.base64Data, imageData.mimeType)
              const url = URL.createObjectURL(blob)

              return {
                ...imageData,
                url: url
              }
            })
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))

          resolve(entityImages)
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('❌ Erreur récupération images entité:', error)
      return []
    }
  }

  /**
   * Supprimer une image
   */
  static async deleteImage(imageId) {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)

      return new Promise((resolve, reject) => {
        const request = store.delete(imageId)

        request.onsuccess = () => {
          console.log(`🗑️ Image supprimée: ${imageId}`)
          resolve(true)
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('❌ Erreur suppression image:', error)
      return false
    }
  }

  /**
   * Convertir base64 en blob
   */
  static base64ToBlob(base64Data, mimeType) {
    const byteCharacters = atob(base64Data.split(',')[1])
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  /**
   * Obtenir les statistiques de stockage
   */
  static async getStorageStats() {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)

      return new Promise((resolve, reject) => {
        const request = store.getAll()

        request.onsuccess = () => {
          const allImages = request.result
          const totalSize = allImages.reduce((sum, img) => sum + img.fileSize, 0)
          const typeStats = {}

          allImages.forEach(img => {
            if (!typeStats[img.entityType]) {
              typeStats[img.entityType] = { count: 0, size: 0 }
            }
            typeStats[img.entityType].count++
            typeStats[img.entityType].size += img.fileSize
          })

          resolve({
            totalImages: allImages.length,
            totalSize: totalSize,
            typeStats: typeStats,
            formattedSize: this.formatFileSize(totalSize)
          })
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('❌ Erreur statistiques stockage:', error)
      return { totalImages: 0, totalSize: 0, typeStats: {}, formattedSize: '0 B' }
    }
  }

  /**
   * Formater la taille de fichier
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Récupérer toutes les images de la base de données
   */
  static async getAllImages() {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)

      return new Promise((resolve, reject) => {
        const request = store.getAll()

        request.onsuccess = () => {
          const allImages = request.result || []
          console.log(`📸 ${allImages.length} images chargées`)
          resolve(allImages)
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('❌ Erreur récupération toutes images:', error)
      return []
    }
  }

  /**
   * Nettoyer les images orphelines (dont l'entité n'existe plus)
   */
  static async cleanOrphanedImages(existingEntities = { cards: [], extensions: [], blocks: [] }) {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)

      const allImages = await new Promise((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      let deletedCount = 0

      for (const image of allImages) {
        let entityExists = false

        switch (image.entityType) {
          case 'card':
            entityExists = existingEntities.cards.some(card => card.id === image.entityId)
            break
          case 'extension':
            entityExists = existingEntities.extensions.some(ext => ext.id === image.entityId)
            break
          case 'block':
            entityExists = existingEntities.blocks.some(block => block.id === image.entityId)
            break
        }

        if (!entityExists) {
          await new Promise((resolve, reject) => {
            const deleteRequest = store.delete(image.id)
            deleteRequest.onsuccess = () => resolve()
            deleteRequest.onerror = () => reject(deleteRequest.error)
          })
          deletedCount++
        }
      }

      console.log(`🧹 ${deletedCount} images orphelines supprimées`)
      return deletedCount

    } catch (error) {
      console.error('❌ Erreur nettoyage images orphelines:', error)
      return 0
    }
  }
}