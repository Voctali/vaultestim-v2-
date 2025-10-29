/**
 * Service pour gérer les produits scellés de la collection utilisateur
 * (Différent de CardMarketSupabaseService qui gère le catalogue CardMarket)
 */

import { supabase } from '@/lib/supabaseClient'

export class UserSealedProductsService {
  /**
   * Charger tous les produits scellés d'un utilisateur
   */
  static async loadUserSealedProducts(userId) {
    try {
      const { data, error } = await supabase
        .from('user_sealed_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log(`📦 ${data?.length || 0} produits scellés chargés pour l'utilisateur`)
      return data || []
    } catch (error) {
      console.error('❌ Erreur chargement produits scellés:', error)
      return []
    }
  }

  /**
   * Ajouter un produit scellé à la collection
   */
  static async addSealedProduct(userId, productData) {
    try {
      const { data, error } = await supabase
        .from('user_sealed_products')
        .insert({
          user_id: userId,
          name: productData.name,
          market_price: productData.market_price || null,
          image_url: productData.image_url || null,
          image_file: productData.image_file || null, // Base64 si uploadé
          cardmarket_id_product: productData.cardmarket_id_product || null,
          category: productData.category || null,
          notes: productData.notes || null,
          quantity: productData.quantity || 1,
          condition: productData.condition || 'Impeccable',
          purchase_price: productData.purchase_price || null
        })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Produit scellé ajouté: ${productData.name}`)
      return data
    } catch (error) {
      console.error('❌ Erreur ajout produit scellé:', error)
      throw error
    }
  }

  /**
   * Mettre à jour un produit scellé
   */
  static async updateSealedProduct(productId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_sealed_products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Produit scellé mis à jour: ID ${productId}`)
      return data
    } catch (error) {
      console.error('❌ Erreur mise à jour produit scellé:', error)
      throw error
    }
  }

  /**
   * Supprimer un produit scellé
   */
  static async deleteSealedProduct(productId) {
    try {
      const { error } = await supabase
        .from('user_sealed_products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      console.log(`🗑️ Produit scellé supprimé: ID ${productId}`)
      return true
    } catch (error) {
      console.error('❌ Erreur suppression produit scellé:', error)
      throw error
    }
  }

  /**
   * Rechercher des produits scellés
   */
  static async searchSealedProducts(userId, query) {
    try {
      let queryBuilder = supabase
        .from('user_sealed_products')
        .select('*')
        .eq('user_id', userId)

      if (query) {
        queryBuilder = queryBuilder.ilike('name', `%${query}%`)
      }

      const { data, error } = await queryBuilder.order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erreur recherche produits scellés:', error)
      return []
    }
  }

  /**
   * Récupérer l'historique des prix d'un produit
   */
  static async getPriceHistory(productId) {
    try {
      const { data, error } = await supabase
        .from('sealed_product_price_history')
        .select('*')
        .eq('user_sealed_product_id', productId)
        .order('recorded_at', { ascending: true })

      if (error) throw error

      console.log(`📊 ${data?.length || 0} entrées d'historique chargées pour produit ${productId}`)
      return data || []
    } catch (error) {
      console.error('❌ Erreur récupération historique prix:', error)
      return []
    }
  }

  /**
   * Ajouter une entrée d'historique de prix
   */
  static async addPriceHistory(productId, price, source = 'manual') {
    try {
      const { data, error } = await supabase
        .from('sealed_product_price_history')
        .insert({
          user_sealed_product_id: productId,
          price: price,
          price_source: source
        })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Historique prix ajouté: ${price}€ (${source})`)
      return data
    } catch (error) {
      console.error('❌ Erreur ajout historique prix:', error)
      throw error
    }
  }

  /**
   * Actualiser les prix depuis CardMarket pour tous les produits avec un ID CardMarket
   */
  static async refreshAllPrices(userId, onProgress = null) {
    try {
      // Récupérer tous les produits avec un ID CardMarket
      const { data: products, error } = await supabase
        .from('user_sealed_products')
        .select('*')
        .eq('user_id', userId)
        .not('cardmarket_id_product', 'is', null)

      if (error) throw error

      if (!products || products.length === 0) {
        console.log('ℹ️ Aucun produit avec ID CardMarket à actualiser')
        return { updated: 0, errors: 0, total: 0 }
      }

      console.log(`🔄 Actualisation des prix pour ${products.length} produits...`)

      let updated = 0
      let errors = 0

      // Importer CardMarketSupabaseService dynamiquement pour éviter les dépendances circulaires
      const { CardMarketSupabaseService } = await import('./CardMarketSupabaseService')

      for (let i = 0; i < products.length; i++) {
        const product = products[i]

        try {
          // Récupérer le prix depuis CardMarket
          const priceData = await CardMarketSupabaseService.getPriceForProduct(product.cardmarket_id_product)

          if (priceData?.avg) {
            const newPrice = parseFloat(priceData.avg)
            const oldPrice = parseFloat(product.market_price) || 0

            // Mettre à jour uniquement si le prix a changé
            if (Math.abs(newPrice - oldPrice) > 0.01) {
              await this.updateSealedProduct(product.id, {
                market_price: newPrice
              })

              updated++
              console.log(`✅ Prix mis à jour: ${product.name} (${oldPrice}€ → ${newPrice}€)`)
            } else {
              console.log(`⏭️ Prix inchangé: ${product.name} (${newPrice}€)`)
            }
          }
        } catch (error) {
          errors++
          console.error(`❌ Erreur actualisation ${product.name}:`, error)
        }

        // Callback de progression
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: products.length,
            updated,
            errors
          })
        }
      }

      console.log(`✅ Actualisation terminée: ${updated} mis à jour, ${errors} erreurs`)
      return { updated, errors, total: products.length }
    } catch (error) {
      console.error('❌ Erreur actualisation globale des prix:', error)
      throw error
    }
  }

  /**
   * Détecter les changements de prix significatifs (> 10%)
   */
  static async detectPriceAlerts(userId, threshold = 10) {
    try {
      const products = await this.loadUserSealedProducts(userId)
      const alerts = []

      for (const product of products) {
        if (!product.cardmarket_id_product) continue

        const history = await this.getPriceHistory(product.id)
        if (history.length < 2) continue

        // Comparer le dernier prix avec l'avant-dernier
        const latestPrice = parseFloat(history[history.length - 1].price)
        const previousPrice = parseFloat(history[history.length - 2].price)

        const changePercent = ((latestPrice - previousPrice) / previousPrice) * 100

        if (Math.abs(changePercent) >= threshold) {
          alerts.push({
            product,
            previousPrice,
            latestPrice,
            changePercent,
            type: changePercent > 0 ? 'increase' : 'decrease',
            recordedAt: history[history.length - 1].recorded_at
          })
        }
      }

      if (alerts.length > 0) {
        console.log(`🚨 ${alerts.length} alertes de prix détectées (seuil: ${threshold}%)`)
      }

      return alerts
    } catch (error) {
      console.error('❌ Erreur détection alertes prix:', error)
      return []
    }
  }
}
