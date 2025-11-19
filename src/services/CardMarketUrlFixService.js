/**
 * CardMarketUrlFixService - Correction des liens CardMarket
 *
 * Utilise RapidAPI pour récupérer les vrais liens CardMarket
 * et met à jour la base de données Supabase
 */

import { supabase } from '@/lib/supabaseClient'
import { RapidAPIService } from './RapidAPIService'
import { QuotaTracker } from './QuotaTracker'

export class CardMarketUrlFixService {
  static BATCH_SIZE = 50 // Nombre d'éléments à traiter par batch
  static REQUEST_DELAY_MS = 1000 // Pause entre requêtes
  static STORAGE_KEY_CARDS = 'vaultestim_cardmarket_url_fix_cards'
  static STORAGE_KEY_PRODUCTS = 'vaultestim_cardmarket_url_fix_products'

  /**
   * Ajouter le paramètre language=2 (français) à une URL CardMarket
   */
  static addLanguageParam(url) {
    if (!url) return url

    try {
      const urlObj = new URL(url)
      // Ajouter ou remplacer le paramètre language
      urlObj.searchParams.set('language', '2')
      return urlObj.toString()
    } catch (error) {
      // Si l'URL est invalide, la retourner telle quelle
      console.warn('URL CardMarket invalide:', url)
      return url
    }
  }

  /**
   * Obtenir la progression pour les cartes
   */
  static getCardsProgress() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_CARDS)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  /**
   * Obtenir la progression pour les produits
   */
  static getProductsProgress() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_PRODUCTS)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  /**
   * Sauvegarder la progression
   */
  static saveProgress(type, current, total) {
    try {
      const key = type === 'cards' ? this.STORAGE_KEY_CARDS : this.STORAGE_KEY_PRODUCTS
      const progress = {
        current,
        total,
        percentage: Math.round((current / total) * 100),
        lastUpdated: Date.now()
      }
      localStorage.setItem(key, JSON.stringify(progress))
    } catch (error) {
      console.warn('⚠️ Erreur sauvegarde progression:', error)
    }
  }

  /**
   * Réinitialiser la progression
   */
  static clearProgress(type) {
    try {
      const key = type === 'cards' ? this.STORAGE_KEY_CARDS : this.STORAGE_KEY_PRODUCTS
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('⚠️ Erreur réinitialisation progression:', error)
    }
  }

  /**
   * Corriger les URLs CardMarket des cartes
   *
   * @param {Function} onProgress - Callback de progression
   * @returns {Promise<{updated: number, errors: number, skipped: number, total: number}>}
   */
  static async fixCardUrls(onProgress = null) {
    console.log('🔧 Correction des URLs CardMarket des cartes...')

    if (!RapidAPIService.isAvailable()) {
      throw new Error('RapidAPI non disponible. Activez-le dans .env avec VITE_USE_RAPIDAPI=true')
    }

    try {
      // 1. Compter le nombre total de cartes à corriger
      const { count, error: countError } = await supabase
        .from('discovered_cards')
        .select('id', { count: 'exact', head: true })
        .is('cardmarket_url', null)

      if (countError) throw countError

      console.log(`📦 ${count} cartes à corriger au total`)

      if (count === 0) {
        console.log('✅ Toutes les cartes ont déjà un lien CardMarket')
        return { updated: 0, errors: 0, skipped: 0, total: 0 }
      }

      // 2. Traiter en boucle continue jusqu'à ce qu'il n'y ait plus de cartes sans URL
      let updated = 0
      let errors = 0
      let skipped = 0
      let processedTotal = 0

      while (true) {
        // Récupérer un batch de cartes sans URL
        const { data: cards, error } = await supabase
          .from('discovered_cards')
          .select('id, name, number')
          .is('cardmarket_url', null)
          .order('id', { ascending: true })
          .limit(100) // Batch de 100 cartes à la fois

        if (error) throw error

        if (!cards || cards.length === 0) {
          console.log('✅ Toutes les cartes ont été traitées')
          break
        }

        console.log(`🔄 Traitement du batch: ${cards.length} cartes`)

        for (let i = 0; i < cards.length; i++) {
          const card = cards[i]
          processedTotal++

          // Vérifier le quota
          const quotaCheck = QuotaTracker.canMakeRequest()
          if (!quotaCheck.allowed) {
            console.warn(`⚠️ Quota atteint: ${quotaCheck.message}`)
            console.log(`⏸️ Traitement interrompu. Progression: ${processedTotal}/${count}`)
            const result = { updated, errors, skipped, total: processedTotal }
            console.log('📊 Résultat correction cartes:', result)
            return result
          }

          try {
            // Rechercher la carte via RapidAPI (nom + numéro)
            const searchTerm = `${card.name} ${card.number || ''}`.trim()
            const result = await RapidAPIService.searchCards(searchTerm, { limit: 1 })

            if (result.data && result.data.length > 0) {
              const apiCard = result.data[0]
              let cardmarketUrl = apiCard.links?.cardmarket

              if (cardmarketUrl) {
                // Ajouter le paramètre language=2 (français)
                cardmarketUrl = this.addLanguageParam(cardmarketUrl)

                // Mettre à jour dans Supabase
                const { error: updateError } = await supabase
                  .from('discovered_cards')
                  .update({ cardmarket_url: cardmarketUrl })
                  .eq('id', card.id)

                if (updateError) throw updateError

                updated++
                console.log(`✅ [${processedTotal}/${count}] ${card.name}: ${cardmarketUrl}`)
              } else {
                skipped++
                console.log(`⏭️ [${processedTotal}/${count}] ${card.name}: Pas de lien CardMarket`)
              }
            } else {
              skipped++
              console.log(`⏭️ [${processedTotal}/${count}] ${card.name}: Aucun résultat trouvé`)
            }

            // Incrémenter le quota
            QuotaTracker.incrementUsage()

          } catch (error) {
            errors++
            console.error(`❌ [${processedTotal}/${count}] ${card.name}:`, error.message)
          }

          // Callback de progression
          if (onProgress) {
            onProgress({
              type: 'cards',
              current: processedTotal,
              total: count,
              updated,
              errors,
              skipped
            })
          }

          // Pause entre requêtes
          await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY_MS))
        }
      }

      // Terminé
      this.clearProgress('cards')

      const result = {
        updated,
        errors,
        skipped,
        total: processedTotal
      }

      console.log('📊 Résultat correction cartes:', result)
      return result

    } catch (error) {
      console.error('❌ Erreur correction URLs cartes:', error)
      throw error
    }
  }

  /**
   * Corriger les URLs CardMarket des produits scellés
   *
   * @param {Function} onProgress - Callback de progression
   * @returns {Promise<{updated: number, errors: number, skipped: number, total: number}>}
   */
  static async fixProductUrls(onProgress = null) {
    console.log('🔧 Correction des URLs CardMarket des produits scellés...')

    if (!RapidAPIService.isAvailable()) {
      throw new Error('RapidAPI non disponible. Activez-le dans .env avec VITE_USE_RAPIDAPI=true')
    }

    try {
      // 1. Récupérer tous les produits sans URL CardMarket
      const { data: products, error } = await supabase
        .from('user_sealed_products')
        .select('id, name')
        .is('cardmarket_url', null)
        .order('id', { ascending: true })
        .limit(2000)

      if (error) throw error

      console.log(`📦 ${products.length} produits à corriger`)

      if (products.length === 0) {
        console.log('✅ Tous les produits ont déjà un lien CardMarket')
        return { updated: 0, errors: 0, skipped: 0, total: 0 }
      }

      // 2. Récupérer la progression sauvegardée
      const savedProgress = this.getProductsProgress()
      const startIndex = savedProgress && savedProgress.total === products.length
        ? savedProgress.current
        : 0

      console.log(`📍 Reprise depuis l'index ${startIndex}/${products.length}`)

      // 3. Traiter les produits
      let updated = 0
      let errors = 0
      let skipped = 0

      for (let i = startIndex; i < products.length; i++) {
        const product = products[i]

        // Vérifier le quota
        const quotaCheck = QuotaTracker.canMakeRequest()
        if (!quotaCheck.allowed) {
          console.warn(`⚠️ Quota atteint: ${quotaCheck.message}`)
          console.log(`⏸️ Progression sauvegardée à ${i}/${products.length}`)
          break
        }

        try {
          // Rechercher le produit via RapidAPI
          const result = await RapidAPIService.searchProducts(product.name, { limit: 1 })

          if (result.data && result.data.length > 0) {
            const apiProduct = result.data[0]
            let cardmarketUrl = apiProduct.links?.cardmarket

            if (cardmarketUrl) {
              // Ajouter le paramètre language=2 (français)
              cardmarketUrl = this.addLanguageParam(cardmarketUrl)

              // Mettre à jour dans Supabase
              const { error: updateError } = await supabase
                .from('user_sealed_products')
                .update({ cardmarket_url: cardmarketUrl })
                .eq('id', product.id)

              if (updateError) throw updateError

              updated++
              console.log(`✅ [${i + 1}/${products.length}] ${product.name}: ${cardmarketUrl}`)
            } else {
              skipped++
              console.log(`⏭️ [${i + 1}/${products.length}] ${product.name}: Pas de lien CardMarket`)
            }
          } else {
            skipped++
            console.log(`⏭️ [${i + 1}/${products.length}] ${product.name}: Aucun résultat trouvé`)
          }

          // Incrémenter le quota
          QuotaTracker.incrementUsage()

        } catch (error) {
          errors++
          console.error(`❌ [${i + 1}/${products.length}] ${product.name}:`, error.message)
        }

        // Callback de progression
        if (onProgress) {
          onProgress({
            type: 'products',
            current: i + 1,
            total: products.length,
            updated,
            errors,
            skipped
          })
        }

        // Sauvegarder la progression
        this.saveProgress('products', i + 1, products.length)

        // Pause entre requêtes
        if (i < products.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY_MS))
        }
      }

      // Si terminé, réinitialiser la progression
      if (updated + errors + skipped >= products.length) {
        this.clearProgress('products')
      }

      const result = {
        updated,
        errors,
        skipped,
        total: products.length
      }

      console.log('📊 Résultat correction produits:', result)
      return result

    } catch (error) {
      console.error('❌ Erreur correction URLs produits:', error)
      throw error
    }
  }

  /**
   * Corriger les URLs CardMarket du catalogue des produits scellés
   *
   * @param {Function} onProgress - Callback de progression
   * @returns {Promise<{updated: number, errors: number, skipped: number, total: number}>}
   */
  static async fixCatalogProductUrls(onProgress = null) {
    console.log('🔧 Correction des URLs CardMarket du catalogue produits scellés...')

    if (!RapidAPIService.isAvailable()) {
      throw new Error('RapidAPI non disponible. Activez-le dans .env avec VITE_USE_RAPIDAPI=true')
    }

    try {
      // 1. Compter le nombre total de produits à corriger
      const { count, error: countError } = await supabase
        .from('cardmarket_nonsingles')
        .select('id_product', { count: 'exact', head: true })
        .is('cardmarket_url', null)

      if (countError) throw countError

      console.log(`📦 ${count} produits catalogue à corriger`)

      if (count === 0) {
        console.log('✅ Tous les produits catalogue ont déjà un lien CardMarket')
        return { updated: 0, errors: 0, skipped: 0, total: 0 }
      }

      // 2. Traiter en boucle continue
      let updated = 0
      let errors = 0
      let skipped = 0
      let processedTotal = 0

      while (true) {
        // Récupérer un batch de produits sans URL
        const { data: products, error } = await supabase
          .from('cardmarket_nonsingles')
          .select('id_product, name')
          .is('cardmarket_url', null)
          .order('id_product', { ascending: true })
          .limit(100)

        if (error) throw error

        if (!products || products.length === 0) {
          console.log('✅ Tous les produits catalogue ont été traités')
          break
        }

        console.log(`🔄 Traitement du batch: ${products.length} produits`)

        for (let i = 0; i < products.length; i++) {
          const product = products[i]
          processedTotal++

          // Vérifier le quota
          const quotaCheck = QuotaTracker.canMakeRequest()
          if (!quotaCheck.allowed) {
            console.warn(`⚠️ Quota atteint: ${quotaCheck.message}`)
            console.log(`⏸️ Traitement interrompu. Progression: ${processedTotal}/${count}`)
            const result = { updated, errors, skipped, total: processedTotal }
            console.log('📊 Résultat correction produits catalogue:', result)
            return result
          }

          try {
            // Rechercher le produit via RapidAPI
            const result = await RapidAPIService.searchProducts(product.name, { limit: 1 })

            if (result.data && result.data.length > 0) {
              const apiProduct = result.data[0]
              let cardmarketUrl = apiProduct.links?.cardmarket

              if (cardmarketUrl) {
                // Ajouter le paramètre language=2 (français)
                cardmarketUrl = this.addLanguageParam(cardmarketUrl)

                // Mettre à jour dans Supabase
                const { error: updateError } = await supabase
                  .from('cardmarket_nonsingles')
                  .update({ cardmarket_url: cardmarketUrl })
                  .eq('id_product', product.id_product)

                if (updateError) throw updateError

                updated++
                console.log(`✅ [${processedTotal}/${count}] ${product.name}: ${cardmarketUrl}`)
              } else {
                skipped++
                console.log(`⏭️ [${processedTotal}/${count}] ${product.name}: Pas de lien CardMarket`)
              }
            } else {
              skipped++
              console.log(`⏭️ [${processedTotal}/${count}] ${product.name}: Aucun résultat trouvé`)
            }

            // Incrémenter le quota
            QuotaTracker.incrementUsage()

          } catch (error) {
            errors++
            console.error(`❌ [${processedTotal}/${count}] ${product.name}:`, error.message)
          }

          // Callback de progression
          if (onProgress) {
            onProgress({
              type: 'catalog_products',
              current: processedTotal,
              total: count,
              updated,
              errors,
              skipped
            })
          }

          // Pause entre requêtes
          await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY_MS))
        }
      }

      const result = {
        updated,
        errors,
        skipped,
        total: processedTotal
      }

      console.log('📊 Résultat correction produits catalogue:', result)
      return result

    } catch (error) {
      console.error('❌ Erreur correction URLs produits catalogue:', error)
      throw error
    }
  }

  /**
   * Corriger tous les liens (cartes + produits utilisateurs + catalogue produits)
   */
  static async fixAllUrls(onProgress = null) {
    console.log('🔧 Correction de tous les liens CardMarket...')

    const cardResults = await this.fixCardUrls((progress) => {
      if (onProgress) onProgress({ ...progress, phase: 'cards' })
    })

    const userProductResults = await this.fixProductUrls((progress) => {
      if (onProgress) onProgress({ ...progress, phase: 'user_products' })
    })

    const catalogProductResults = await this.fixCatalogProductUrls((progress) => {
      if (onProgress) onProgress({ ...progress, phase: 'catalog_products' })
    })

    return {
      cards: cardResults,
      userProducts: userProductResults,
      catalogProducts: catalogProductResults
    }
  }
}
