/**
 * SealedProductPriceRefreshService - Actualisation automatique des prix des produits scellés
 *
 * Stratégie :
 * - Actualisation quotidienne automatique (si > 24h)
 * - Par batch de 500 produits/jour
 * - Rotation équitable sur tout le catalogue
 * - Priorise les produits consultés récemment ou avec valeur élevée
 */

import { CardMarketSupabaseService } from './CardMarketSupabaseService'
import { RapidAPIService } from './RapidAPIService'
import { QuotaTracker } from './QuotaTracker'

export class SealedProductPriceRefreshService {
  // Configuration
  static BATCH_SIZE = 500 // Nombre de produits à actualiser par batch
  static REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 heures
  static REQUEST_DELAY_MS = 1000 // Pause de 1s entre chaque requête
  static STORAGE_KEY_PROGRESS = 'vaultestim_sealed_price_refresh_progress'
  static STORAGE_KEY_LAST_REFRESH = 'vaultestim_sealed_price_last_refresh'

  /**
   * Obtenir la progression sauvegardée
   */
  static getProgress() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_PROGRESS)
      if (!stored) return null

      const progress = JSON.parse(stored)

      // Vérifier si la progression date d'hier ou avant
      const lastUpdate = progress.lastUpdated || 0
      const now = Date.now()
      const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60)

      // Si plus de 24h écoulées depuis la dernière mise à jour, réinitialiser
      if (hoursSinceUpdate >= 24) {
        console.log(`🔄 Progression obsolète (${Math.round(hoursSinceUpdate)}h écoulées), réinitialisation...`)
        this.clearProgress()
        return null
      }

      return progress
    } catch (error) {
      console.warn('⚠️ Erreur lecture progression:', error)
      return null
    }
  }

  /**
   * Sauvegarder la progression actuelle
   */
  static saveProgress(current, total) {
    try {
      const progress = {
        current,
        total,
        percentage: Math.round((current / total) * 100),
        lastUpdated: Date.now()
      }
      localStorage.setItem(this.STORAGE_KEY_PROGRESS, JSON.stringify(progress))
    } catch (error) {
      console.warn('⚠️ Erreur sauvegarde progression:', error)
    }
  }

  /**
   * Réinitialiser la progression
   */
  static clearProgress() {
    try {
      localStorage.removeItem(this.STORAGE_KEY_PROGRESS)
    } catch (error) {
      console.warn('⚠️ Erreur réinitialisation progression:', error)
    }
  }

  /**
   * Obtenir la dernière date d'actualisation
   */
  static getLastRefreshTime() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_LAST_REFRESH)
      return stored ? parseInt(stored, 10) : 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Enregistrer la date d'actualisation
   */
  static setLastRefreshTime() {
    try {
      localStorage.setItem(this.STORAGE_KEY_LAST_REFRESH, Date.now().toString())
    } catch (error) {
      console.warn('⚠️ Erreur sauvegarde date actualisation:', error)
    }
  }

  /**
   * Vérifier si une actualisation est nécessaire
   */
  static shouldRefresh() {
    const lastRefresh = this.getLastRefreshTime()
    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefresh

    return timeSinceLastRefresh >= this.REFRESH_INTERVAL_MS
  }

  /**
   * Actualiser les prix d'un batch de produits scellés
   *
   * @param {Function} onProgress - Callback de progression (current, total, updated, errors)
   * @returns {Promise<{updated: number, errors: number, total: number}>}
   */
  static async refreshBatch(onProgress = null, userId = null) {
    console.log('🔄 Actualisation des prix des produits scellés...')

    try {
      // 1. Récupérer les produits à actualiser avec priorité :
      //    - D'abord : produits de la collection personnelle de l'utilisateur
      //    - Ensuite : produits du catalogue visible (catégories non masquées)

      let allProducts = []
      let userProductIds = new Set()

      // 1a. Produits de la collection personnelle (prioritaires)
      if (userId) {
        const userProducts = await CardMarketSupabaseService.getAllSealedProducts(userId)
        console.log(`👤 ${userProducts.length} produits dans la collection personnelle`)

        // Extraire les cardmarket_id_product uniques de la collection utilisateur
        for (const product of userProducts) {
          // user_sealed_products utilise cardmarket_id_product (pas id_product)
          const productId = product.cardmarket_id_product
          if (productId && !userProductIds.has(productId)) {
            userProductIds.add(productId)
            allProducts.push({
              id_product: productId,
              name: product.name || `Produit ${productId}`,
              isUserProduct: true
            })
          }
        }
        console.log(`⭐ ${userProductIds.size} produits uniques de la collection à actualiser en priorité`)
      }

      // 1b. Produits du catalogue visible (sans doublons avec la collection)
      const catalogProducts = await CardMarketSupabaseService.getAllCatalogProducts()
      console.log(`📦 ${catalogProducts.length} produits catalogue visibles`)

      for (const product of catalogProducts) {
        // Ne pas ajouter si déjà dans la collection utilisateur
        if (!userProductIds.has(product.id_product)) {
          allProducts.push(product)
        }
      }

      console.log(`📊 Total: ${allProducts.length} produits à actualiser (${userProductIds.size} prioritaires + ${allProducts.length - userProductIds.size} catalogue)`)

      if (allProducts.length === 0) {
        console.log('ℹ️ Aucun produit scellé à actualiser')
        return { updated: 0, errors: 0, total: 0 }
      }

      // 2. Récupérer la progression sauvegardée
      const savedProgress = this.getProgress()
      const startIndex = savedProgress && savedProgress.total === allProducts.length
        ? savedProgress.current
        : 0

      console.log(`📍 Reprise depuis l'index ${startIndex}/${allProducts.length}`)

      // 3. Déterminer le batch à actualiser
      const endIndex = Math.min(startIndex + this.BATCH_SIZE, allProducts.length)
      const productsToRefresh = allProducts.slice(startIndex, endIndex)

      console.log(`🎯 Actualisation de ${productsToRefresh.length} produits (${startIndex} → ${endIndex})`)

      // 4. Calculer la durée estimée
      const estimatedDurationMs = productsToRefresh.length * this.REQUEST_DELAY_MS
      const estimatedMinutes = Math.ceil(estimatedDurationMs / 60000)
      console.log(`⏱️ Durée estimée: ~${estimatedMinutes} minutes`)

      // 5. Actualiser chaque produit
      let updated = 0
      let errors = 0

      for (let i = 0; i < productsToRefresh.length; i++) {
        const product = productsToRefresh[i]
        const currentIndex = startIndex + i

        // 🔒 Vérifier et réserver le quota AVANT la requête
        if (!QuotaTracker.reserveRequest()) {
          console.warn(`🚫 [${currentIndex + 1}/${allProducts.length}] Quota épuisé, arrêt de l'actualisation`)
          break
        }

        try {
          // Récupérer le produit par son ID CardMarket depuis RapidAPI
          const rapidProduct = await RapidAPIService.getProduct(product.id_product)

          // ✅ Confirmer la requête réussie
          QuotaTracker.confirmRequest()

          if (rapidProduct) {
            const cm = rapidProduct.prices?.cardmarket || {}

            // Utiliser 'lowest' comme prix principal (le plus représentatif du marché)
            const price = cm.lowest || cm.avg || cm.trend

            if (price) {
              // Mettre à jour dans la table cardmarket_prices (catalogue)
              await CardMarketSupabaseService.updateCatalogProductPrice(
                product.id_product,
                {
                  avg: cm.lowest || null,      // Prix le plus bas (le plus fiable)
                  low: cm.lowest_DE || null,   // Prix Allemagne
                  trend: cm.lowest_FR || null  // Prix France
                }
              )

              updated++
              console.log(`✅ [${currentIndex + 1}/${allProducts.length}] Prix catalogue mis à jour: ${product.name} (${price}€)`)
            } else {
              console.log(`⏭️ [${currentIndex + 1}/${allProducts.length}] Produit trouvé mais pas de prix: ${product.name}`)
            }
          } else {
            console.log(`⏭️ [${currentIndex + 1}/${allProducts.length}] Produit ${product.id_product} non trouvé dans RapidAPI`)
          }
        } catch (error) {
          // 🔓 Libérer la requête en cas d'erreur
          QuotaTracker.releaseRequest()

          errors++
          // Si 404, le produit n'existe pas dans RapidAPI
          if (error.message?.includes('404')) {
            console.log(`⏭️ [${currentIndex + 1}/${allProducts.length}] Produit ${product.id_product} non disponible dans RapidAPI`)
          } else {
            console.error(`❌ [${currentIndex + 1}/${allProducts.length}] Erreur: ${product.name}`, error.message)
          }
        }

        // Callback de progression
        if (onProgress) {
          onProgress({
            current: currentIndex + 1,
            total: allProducts.length,
            updated,
            errors
          })
        }

        // Sauvegarder la progression
        this.saveProgress(currentIndex + 1, allProducts.length)

        // Pause entre les requêtes (sauf pour la dernière)
        if (i < productsToRefresh.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY_MS))
        }
      }

      // 6. Si on a terminé le cycle complet, réinitialiser la progression
      if (endIndex >= allProducts.length) {
        console.log('✅ Cycle complet terminé, réinitialisation de la progression')
        this.clearProgress()
        this.setLastRefreshTime()
      }

      const result = {
        updated,
        errors,
        total: productsToRefresh.length
      }

      console.log('📊 Résultat actualisation:', result)
      return result

    } catch (error) {
      console.error('❌ Erreur actualisation batch:', error)
      throw error
    }
  }

  /**
   * Vérifier si l'actualisation automatique est activée
   */
  static isEnabled() {
    try {
      const stored = localStorage.getItem('vaultestim_sealed_price_refresh_enabled')
      return stored === null ? true : stored === 'true'
    } catch {
      return true
    }
  }

  /**
   * Actualiser automatiquement si nécessaire (appelé au démarrage)
   * @param {Function} onProgress - Callback optionnel pour suivre la progression
   * @param {string} userId - ID de l'utilisateur pour prioriser sa collection
   */
  static async autoRefreshIfNeeded(onProgress = null, userId = null) {
    // Vérifier si l'actualisation automatique est activée
    if (!this.isEnabled()) {
      console.log('ℹ️ Actualisation automatique des prix produits scellés DÉSACTIVÉE par l\'utilisateur')
      return false
    }

    if (!this.shouldRefresh()) {
      const lastRefresh = this.getLastRefreshTime()
      const hours = Math.floor((Date.now() - lastRefresh) / (60 * 60 * 1000))
      console.log(`ℹ️ Actualisation des prix produits scellés non nécessaire (dernière: il y a ${hours}h)`)
      return false
    }

    console.log('🚀 Lancement de l\'actualisation automatique des prix produits scellés...')

    try {
      await this.refreshBatch(onProgress, userId)
      return true
    } catch (error) {
      console.error('❌ Erreur actualisation automatique:', error)
      return false
    }
  }
}
