/**
 * Service Supabase pour la gestion de la collection utilisateur
 * Remplace la partie collection de BackendApiService
 */
import { supabase } from '@/lib/supabaseClient'

export class SupabaseCollectionService {
  /**
   * Helper pour obtenir l'ID utilisateur courant
   */
  static async getCurrentUserId() {
    // Utiliser getSession() au lieu de getUser() pour éviter le localStorage
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session?.user) throw new Error('Utilisateur non connecté')
    return session.user.id
  }

  // ============================================================================
  // COLLECTION UTILISATEUR
  // ============================================================================

  /**
   * Récupérer la collection de l'utilisateur
   */
  static async getUserCollection() {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('user_collection')
        .select('*')
        .eq('user_id', userId)
        .order('date_added', { ascending: false })

      if (error) throw error

      console.log(`✅ ${data.length} cartes dans la collection`)
      return data
    } catch (error) {
      console.error('❌ Erreur getUserCollection:', error)
      return []
    }
  }

  /**
   * Ajouter une carte à la collection
   */
  static async addToCollection(card) {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('user_collection')
        .insert({
          user_id: userId,
          card_id: card.id,
          name: card.name,
          series: card.series,
          extension: card.extension,
          rarity: card.rarity,
          image: card.image,
          images: card.images,
          quantity: card.quantity || 1,
          condition: card.condition || 'Non spécifié',
          purchase_price: card.purchasePrice,
          market_price: card.marketPrice,
          value: card.value,
          date_added: card.dateAdded || new Date().toISOString(),
          display_date: card.displayDate,
          notes: card.notes
        })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Carte ajoutée à la collection: ${card.name}`)
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
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('user_collection')
        .update(updates)
        .eq('id', cardId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Carte mise à jour: ${cardId}`)
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
      const userId = await this.getCurrentUserId()

      const { error } = await supabase
        .from('user_collection')
        .delete()
        .eq('id', cardId)
        .eq('user_id', userId)

      if (error) throw error

      console.log(`🗑️ Carte supprimée de la collection: ${cardId}`)
      return true
    } catch (error) {
      console.error('❌ Erreur removeFromCollection:', error)
      throw error
    }
  }

  // ============================================================================
  // FAVORIS
  // ============================================================================

  /**
   * Récupérer les favoris de l'utilisateur
   */
  static async getUserFavorites() {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log(`✅ ${data.length} favoris`)
      return data
    } catch (error) {
      console.error('❌ Erreur getUserFavorites:', error)
      return []
    }
  }

  /**
   * Ajouter une carte aux favoris
   */
  static async addToFavorites(card) {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          card_id: card.id,
          name: card.name,
          series: card.series,
          rarity: card.rarity,
          image: card.image,
          images: card.images
        })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Carte ajoutée aux favoris: ${card.name}`)
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
      const userId = await this.getCurrentUserId()

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', cardId)
        .eq('user_id', userId)

      if (error) throw error

      console.log(`🗑️ Carte supprimée des favoris: ${cardId}`)
      return true
    } catch (error) {
      console.error('❌ Erreur removeFromFavorites:', error)
      throw error
    }
  }

  // ============================================================================
  // WISHLIST
  // ============================================================================

  /**
   * Récupérer la wishlist de l'utilisateur
   */
  static async getUserWishlist() {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('user_wishlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log(`✅ ${data.length} items dans la wishlist`)
      return data
    } catch (error) {
      console.error('❌ Erreur getUserWishlist:', error)
      return []
    }
  }

  /**
   * Ajouter une carte à la wishlist
   */
  static async addToWishlist(card) {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('user_wishlist')
        .insert({
          user_id: userId,
          card_id: card.id,
          name: card.name,
          series: card.series,
          rarity: card.rarity,
          image: card.image,
          images: card.images,
          priority: card.priority || 'normal',
          notes: card.notes
        })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Carte ajoutée à la wishlist: ${card.name}`)
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
      const userId = await this.getCurrentUserId()

      const { error } = await supabase
        .from('user_wishlist')
        .delete()
        .eq('id', cardId)
        .eq('user_id', userId)

      if (error) throw error

      console.log(`🗑️ Carte supprimée de la wishlist: ${cardId}`)
      return true
    } catch (error) {
      console.error('❌ Erreur removeFromWishlist:', error)
      throw error
    }
  }

  // ============================================================================
  // LOTS DE DOUBLONS
  // ============================================================================

  /**
   * Récupérer les lots de doublons de l'utilisateur
   */
  static async getDuplicateBatches() {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('duplicate_batches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log(`✅ ${data.length} lots de doublons`)
      return data
    } catch (error) {
      console.error('❌ Erreur getDuplicateBatches:', error)
      return []
    }
  }

  /**
   * Créer un lot de doublons
   */
  static async createDuplicateBatch(batch) {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('duplicate_batches')
        .insert({
          user_id: userId,
          name: batch.name,
          description: batch.description,
          cards: batch.cards,
          total_value: batch.totalValue
        })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Lot de doublons créé: ${batch.name}`)
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
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('duplicate_batches')
        .update({
          name: batch.name,
          description: batch.description,
          cards: batch.cards,
          total_value: batch.totalValue
        })
        .eq('id', batchId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Lot de doublons mis à jour: ${batchId}`)
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
      const userId = await this.getCurrentUserId()

      const { error } = await supabase
        .from('duplicate_batches')
        .delete()
        .eq('id', batchId)
        .eq('user_id', userId)

      if (error) throw error

      console.log(`🗑️ Lot de doublons supprimé: ${batchId}`)
      return true
    } catch (error) {
      console.error('❌ Erreur deleteDuplicateBatch:', error)
      throw error
    }
  }

  // ============================================================================
  // VENTES
  // ============================================================================

  /**
   * Récupérer les ventes de l'utilisateur
   */
  static async getUserSales() {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('user_sales')
        .select('*')
        .eq('user_id', userId)
        .order('sale_date', { ascending: false })

      if (error) throw error

      console.log(`✅ ${data.length} ventes`)
      return data
    } catch (error) {
      console.error('❌ Erreur getUserSales:', error)
      return []
    }
  }

  /**
   * Créer une vente
   */
  static async createSale(sale) {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('user_sales')
        .insert({
          user_id: userId,
          type: sale.type,
          card_id: sale.cardId,
          card_name: sale.cardName,
          card_series: sale.cardSeries,
          card_rarity: sale.cardRarity,
          card_image: sale.cardImage,
          batch_id: sale.batchId,
          batch_name: sale.batchName,
          batch_description: sale.batchDescription,
          cards: sale.cards,
          quantity: sale.quantity || 1,
          purchase_price: sale.purchasePrice,
          sale_price: sale.salePrice,
          buyer_name: sale.buyerName,
          buyer_email: sale.buyerEmail,
          platform: sale.platform,
          notes: sale.notes,
          sale_date: sale.saleDate || new Date().toISOString(),
          display_date: sale.displayDate
        })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Vente créée: ${sale.type}`)
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
      const userId = await this.getCurrentUserId()

      const { error } = await supabase
        .from('user_sales')
        .delete()
        .eq('id', saleId)
        .eq('user_id', userId)

      if (error) throw error

      console.log(`🗑️ Vente supprimée: ${saleId}`)
      return true
    } catch (error) {
      console.error('❌ Erreur deleteSale:', error)
      throw error
    }
  }
}
