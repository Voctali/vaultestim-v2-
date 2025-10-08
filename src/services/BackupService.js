/**
 * Service de backup/restore pour la base de données VaultEstim
 * Architecture hybride : Backend SQLite + localStorage
 * Exporte et importe toutes les données : cartes, extensions, blocs, collection utilisateur
 */

import { BackendApiService } from './BackendApiService'
import { ImageUploadService } from './ImageUploadService'

export class BackupService {
  /**
   * Créer un backup complet de toutes les données
   */
  static async createBackup() {
    try {
      console.log('🔄 Création du backup en cours...')

      // 1. Données depuis le Backend API
      const [
        discoveredCards,
        seriesDatabase,
        customBlocks,
        customExtensions
      ] = await Promise.all([
        BackendApiService.getDiscoveredCards(),
        BackendApiService.getSeries(),
        BackendApiService.getCustomBlocks(),
        BackendApiService.getCustomExtensions()
      ])

      console.log('📊 Données Backend chargées:')
      console.log(`   - ${discoveredCards.length} cartes découvertes`)
      console.log(`   - ${seriesDatabase.length} extensions`)
      console.log(`   - ${customBlocks.length} blocs personnalisés`)
      console.log(`   - ${customExtensions.length} extensions personnalisées`)

      // 2. Données utilisateur depuis le Backend
      const [
        userCollection,
        favorites,
        wishlist,
        duplicateBatches,
        sales
      ] = await Promise.all([
        BackendApiService.getUserCollection(),
        BackendApiService.getUserFavorites(),
        BackendApiService.getUserWishlist(),
        BackendApiService.getDuplicateBatches(),
        BackendApiService.getUserSales()
      ])

      console.log('📊 Données utilisateur Backend chargées:')
      console.log(`   - ${userCollection.length} cartes en collection`)
      console.log(`   - ${favorites.length} favoris`)
      console.log(`   - ${wishlist.length} liste de souhaits`)
      console.log(`   - ${duplicateBatches.length} lots de doublons`)
      console.log(`   - ${sales.length} ventes`)

      // 3. Images uploadées (optionnel - peut être volumineux)
      let uploadedImages = []
      try {
        const allImages = await ImageUploadService.getAllImages()
        uploadedImages = allImages || []
        console.log(`📸 ${uploadedImages.length} images à sauvegarder`)
      } catch (error) {
        console.warn('⚠️ Impossible de charger les images:', error)
      }

      // 4. Créer l'objet de backup complet
      const backup = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        application: 'VaultEstim v2',
        data: {
          // Base de données de cartes
          database: {
            discoveredCards,
            seriesDatabase,
            customBlocks,
            customExtensions
          },
          // Données utilisateur
          user: {
            collection: userCollection,
            favorites,
            wishlist,
            duplicateBatches,
            sales
          },
          // Images (optionnel)
          images: uploadedImages
        },
        stats: {
          totalCards: discoveredCards.length,
          totalSeries: seriesDatabase.length,
          totalCustomBlocks: customBlocks.length,
          totalCustomExtensions: customExtensions.length,
          collectionSize: userCollection.length,
          favoritesCount: favorites.length,
          wishlistCount: wishlist.length,
          duplicateBatchesCount: duplicateBatches.length,
          salesCount: sales.length,
          imagesCount: uploadedImages.length
        }
      }

      console.log('✅ Backup créé avec succès')
      console.log('📊 Statistiques:', backup.stats)

      return backup
    } catch (error) {
      console.error('❌ Erreur création backup:', error)
      throw error
    }
  }

  /**
   * Exporter le backup dans un fichier JSON téléchargeable
   */
  static async exportBackup() {
    try {
      const backup = await this.createBackup()

      // Convertir en JSON avec indentation pour lisibilité
      const jsonString = JSON.stringify(backup, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })

      // Créer un nom de fichier avec timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `vaultestim-backup-${timestamp}.json`

      // Déclencher le téléchargement
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log(`✅ Backup exporté: ${filename}`)
      console.log(`📦 Taille: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)

      return {
        success: true,
        filename,
        size: blob.size,
        stats: backup.stats
      }
    } catch (error) {
      console.error('❌ Erreur export backup:', error)
      throw error
    }
  }

  /**
   * Restaurer les données depuis un backup
   */
  static async restoreBackup(backupData, options = {}) {
    try {
      console.log('🔄 Restauration du backup en cours...')

      // Valider le format du backup
      if (!backupData.version || !backupData.data) {
        throw new Error('Format de backup invalide')
      }

      const {
        restoreDatabase = true,
        restoreUserData = true,
        restoreImages = false, // Par défaut, ne pas restaurer les images (volumineuses)
        clearExisting = false // Par défaut, ne pas supprimer les données existantes
      } = options

      let restoredCount = {
        cards: 0,
        series: 0,
        customBlocks: 0,
        customExtensions: 0,
        collection: 0,
        favorites: 0,
        wishlist: 0,
        duplicateBatches: 0,
        sales: 0,
        images: 0
      }

      // Note: clearExisting n'est plus nécessaire car les données backend écrasent automatiquement

      // 1. Restaurer la base de données (Backend)
      if (restoreDatabase && backupData.data.database) {
        console.log('📦 Restauration de la base de données Backend...')

        const db = backupData.data.database

        if (db.discoveredCards && db.discoveredCards.length > 0) {
          await BackendApiService.addDiscoveredCards(db.discoveredCards)
          restoredCount.cards = db.discoveredCards.length
        }

        if (db.seriesDatabase && db.seriesDatabase.length > 0) {
          await BackendApiService.saveSeries(db.seriesDatabase)
          restoredCount.series = db.seriesDatabase.length
        }

        if (db.customBlocks && db.customBlocks.length > 0) {
          await BackendApiService.saveCustomBlocks(db.customBlocks)
          restoredCount.customBlocks = db.customBlocks.length
        }

        if (db.customExtensions && db.customExtensions.length > 0) {
          await BackendApiService.saveCustomExtensions(db.customExtensions)
          restoredCount.customExtensions = db.customExtensions.length
        }

        console.log('✅ Base de données Backend restaurée')
      }

      // 2. Restaurer les données utilisateur (Backend)
      if (restoreUserData && backupData.data.user) {
        console.log('👤 Restauration des données utilisateur Backend...')

        const userData = backupData.data.user

        // Restaurer la collection
        if (userData.collection && userData.collection.length > 0) {
          for (const card of userData.collection) {
            try {
              await BackendApiService.addToCollection(card)
              restoredCount.collection++
            } catch (error) {
              console.warn(`⚠️ Impossible de restaurer la carte:`, error)
            }
          }
        }

        // Restaurer les favoris
        if (userData.favorites && userData.favorites.length > 0) {
          for (const card of userData.favorites) {
            try {
              await BackendApiService.addToFavorites(card)
              restoredCount.favorites++
            } catch (error) {
              console.warn(`⚠️ Impossible de restaurer le favori:`, error)
            }
          }
        }

        // Restaurer la wishlist
        if (userData.wishlist && userData.wishlist.length > 0) {
          for (const card of userData.wishlist) {
            try {
              await BackendApiService.addToWishlist(card)
              restoredCount.wishlist++
            } catch (error) {
              console.warn(`⚠️ Impossible de restaurer l'élément wishlist:`, error)
            }
          }
        }

        // Restaurer les lots de doublons
        if (userData.duplicateBatches && userData.duplicateBatches.length > 0) {
          for (const batch of userData.duplicateBatches) {
            try {
              await BackendApiService.createDuplicateBatch(batch)
              restoredCount.duplicateBatches++
            } catch (error) {
              console.warn(`⚠️ Impossible de restaurer le lot de doublons:`, error)
            }
          }
        }

        // Restaurer les ventes
        if (userData.sales && userData.sales.length > 0) {
          for (const sale of userData.sales) {
            try {
              await BackendApiService.createSale(sale)
              restoredCount.sales++
            } catch (error) {
              console.warn(`⚠️ Impossible de restaurer la vente:`, error)
            }
          }
        }

        console.log('✅ Données utilisateur Backend restaurées')
      }

      // 3. Restaurer les images (optionnel)
      if (restoreImages && backupData.data.images && backupData.data.images.length > 0) {
        console.log('📸 Restauration des images...')

        for (const image of backupData.data.images) {
          try {
            await ImageUploadService.uploadImage(
              image.imageData,
              image.entityType,
              image.entityId
            )
            restoredCount.images++
          } catch (error) {
            console.warn(`⚠️ Impossible de restaurer l'image ${image.id}:`, error)
          }
        }

        console.log(`✅ ${restoredCount.images} images restaurées`)
      }

      console.log('✅ Restauration terminée avec succès')
      console.log('📊 Éléments restaurés:', restoredCount)

      return {
        success: true,
        restoredCount,
        backupVersion: backupData.version,
        backupDate: backupData.createdAt
      }
    } catch (error) {
      console.error('❌ Erreur restauration backup:', error)
      throw error
    }
  }

  /**
   * Importer un fichier de backup
   */
  static async importBackupFile(file) {
    try {
      console.log(`📂 Lecture du fichier: ${file.name}`)

      // Lire le fichier JSON
      const text = await file.text()
      const backupData = JSON.parse(text)

      // Valider le backup
      if (!backupData.version || !backupData.data) {
        throw new Error('Format de backup invalide')
      }

      console.log(`✅ Backup valide (version ${backupData.version})`)
      console.log(`📅 Date de création: ${new Date(backupData.createdAt).toLocaleString('fr-FR')}`)
      console.log('📊 Contenu:', backupData.stats)

      return backupData
    } catch (error) {
      console.error('❌ Erreur lecture fichier backup:', error)
      throw error
    }
  }

  /**
   * Obtenir un aperçu du backup sans l'appliquer
   */
  static getBackupPreview(backupData) {
    if (!backupData || !backupData.stats) {
      return null
    }

    return {
      version: backupData.version,
      createdAt: new Date(backupData.createdAt).toLocaleString('fr-FR'),
      stats: backupData.stats,
      hasDatabase: !!backupData.data.database,
      hasUserData: !!backupData.data.user,
      hasImages: !!backupData.data.images && backupData.data.images.length > 0
    }
  }

  /**
   * Comparer un backup avec les données actuelles
   */
  static async compareWithCurrent(backupData) {
    try {
      // Récupérer toutes les données depuis le backend
      const [
        currentCards,
        currentSeries,
        currentCollection,
        currentFavorites,
        currentWishlist
      ] = await Promise.all([
        BackendApiService.getDiscoveredCards(),
        BackendApiService.getSeries(),
        BackendApiService.getUserCollection(),
        BackendApiService.getUserFavorites(),
        BackendApiService.getUserWishlist()
      ])

      return {
        current: {
          cards: currentCards.length,
          series: currentSeries.length,
          collection: currentCollection.length,
          favorites: currentFavorites.length,
          wishlist: currentWishlist.length
        },
        backup: backupData.stats,
        differences: {
          cards: backupData.stats.totalCards - currentCards.length,
          series: backupData.stats.totalSeries - currentSeries.length,
          collection: backupData.stats.collectionSize - currentCollection.length,
          favorites: backupData.stats.favoritesCount - currentFavorites.length,
          wishlist: backupData.stats.wishlistCount - currentWishlist.length
        }
      }
    } catch (error) {
      console.error('❌ Erreur comparaison backup:', error)
      return null
    }
  }
}
