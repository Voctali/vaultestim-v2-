/**
 * Service Supabase pour la gestion de la collection utilisateur
 * Remplace la partie collection de BackendApiService
 * Version: 2.0 - Gestion complète des versions de cartes
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
   * Enrichit les cartes avec les données de prix depuis discovered_cards
   */
  static async getUserCollection() {
    try {
      const userId = await this.getCurrentUserId()

      // Récupérer TOUTES les cartes avec pagination (Supabase limite à 1000 par défaut)
      let allCollectionData = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('user_collection')
          .select('*')
          .eq('user_id', userId)
          .order('date_added', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) throw error

        if (data.length === 0) {
          hasMore = false
        } else {
          allCollectionData = allCollectionData.concat(data)
          page++
          if (data.length < pageSize) hasMore = false
        }
      }

      const collectionData = allCollectionData

      if (!collectionData || collectionData.length === 0) {
        return []
      }

      // Récupérer les IDs des cartes
      const cardIds = [...new Set(collectionData.map(card => card.card_id))]

      // Récupérer les données complètes depuis discovered_cards (avec prix ET infos extension)
      let discoveredData = []
      let discoveredError = null

      if (cardIds.length <= 1000) {
        const { data, error } = await supabase
          .from('discovered_cards')
          .select('id, cardmarket, tcgplayer, set, number')
          .in('id', cardIds)
        discoveredData = data || []
        discoveredError = error
      } else {
        // Pagination par batches de 500 IDs
        for (let i = 0; i < cardIds.length; i += 500) {
          const batch = cardIds.slice(i, i + 500)
          const { data, error } = await supabase
            .from('discovered_cards')
            .select('id, cardmarket, tcgplayer, set, number')
            .in('id', batch)
          if (error) {
            discoveredError = error
            break
          }
          if (data) discoveredData = discoveredData.concat(data)
        }
      }

      if (discoveredError) {
        console.warn('Impossible de récupérer les prix:', discoveredError.message)
      }

      // Créer un map pour les données complètes
      const dataMap = {}
      if (discoveredData) {
        for (const card of discoveredData) {
          dataMap[card.id] = {
            cardmarket: card.cardmarket,
            tcgplayer: card.tcgplayer,
            set: card.set,
            number: card.number
          }
        }
      }

      // Enrichir les cartes de la collection
      const enrichedData = collectionData.map(card => {
        const extraData = dataMap[card.card_id]
        if (extraData) {
          return {
            ...card,
            cardmarket: extraData.cardmarket,
            tcgplayer: extraData.tcgplayer,
            set: extraData.set || card.set,
            number: extraData.number || card.number
          }
        }
        return card
      })

      return enrichedData
    } catch (error) {
      console.error('Erreur getUserCollection:', error.message)
      return []
    }
  }

  /**
   * Ajouter une carte à la collection
   */
  static async addToCollection(card) {
    try {
      const userId = await this.getCurrentUserId()

      // series doit contenir le nom de l'EXTENSION (ex: "Journey Together")
      const extensionName = card.set?.name || card.extension || card.series

      const insertData = {
        user_id: userId,
        card_id: card.id,
        name: card.name,
        number: card.number || null,
        series: extensionName,
        extension: extensionName,
        set: card.set || null,
        rarity: card.rarity,
        image: card.image,
        images: card.images,
        quantity: card.quantity || 1,
        condition: card.condition || 'Non spécifié',
        version: card.version || 'Normale',
        is_graded: card.isGraded || false,
        grade_company: card.gradeCompany || null,
        grade: card.grade || null,
        purchase_price: card.purchasePrice ? parseFloat(card.purchasePrice) : null,
        market_price: card.marketPrice ? parseFloat(card.marketPrice) : null,
        value: card.value ? parseFloat(card.value) : null,
        date_added: card.dateAdded || new Date().toISOString(),
        display_date: card.displayDate || new Date().toLocaleDateString('fr-FR'),
        notes: card.notes || null
      }

      const { data, error } = await supabase
        .from('user_collection')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      throw error
    }
  }

  /**
   * Mettre à jour une carte de la collection
   */
  static async updateCollectionCard(cardId, updates) {
    try {
      const userId = await this.getCurrentUserId()

      // Mapper les propriétés camelCase vers snake_case
      const mappedUpdates = {}
      if (updates.quantity !== undefined) mappedUpdates.quantity = updates.quantity
      if (updates.condition !== undefined) mappedUpdates.condition = updates.condition
      if (updates.version !== undefined) mappedUpdates.version = updates.version
      if (updates.purchasePrice !== undefined) mappedUpdates.purchase_price = updates.purchasePrice ? parseFloat(updates.purchasePrice) : null
      if (updates.isGraded !== undefined) mappedUpdates.is_graded = updates.isGraded
      if (updates.gradeCompany !== undefined) mappedUpdates.grade_company = updates.gradeCompany
      if (updates.grade !== undefined) mappedUpdates.grade = updates.grade
      if (updates.notes !== undefined) mappedUpdates.notes = updates.notes
      if (updates.marketPrice !== undefined) mappedUpdates.market_price = updates.marketPrice ? parseFloat(updates.marketPrice) : null
      if (updates.value !== undefined) mappedUpdates.value = updates.value ? parseFloat(updates.value) : null

      const { data, error } = await supabase
        .from('user_collection')
        .update(mappedUpdates)
        .eq('id', cardId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
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
      return true
    } catch (error) {
      throw error
    }
  }

  // ============================================================================
  // FAVORIS
  // ============================================================================

  /**
   * Récupérer les favoris de l'utilisateur
   * Enrichit les cartes avec les données de prix depuis discovered_cards
   */
  static async getUserFavorites() {
    try {
      const userId = await this.getCurrentUserId()

      const { data: favoritesData, error: favoritesError } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (favoritesError) throw favoritesError

      if (!favoritesData || favoritesData.length === 0) {
        return []
      }

      // Récupérer les IDs des cartes
      const cardIds = [...new Set(favoritesData.map(card => card.card_id))]

      // Récupérer les prix depuis discovered_cards
      const { data: discoveredData } = await supabase
        .from('discovered_cards')
        .select('id, cardmarket, tcgplayer')
        .in('id', cardIds)

      // Créer un map pour les données de prix
      const priceMap = {}
      if (discoveredData) {
        discoveredData.forEach(card => {
          priceMap[card.id] = {
            cardmarket: card.cardmarket,
            tcgplayer: card.tcgplayer
          }
        })
      }

      // Enrichir les favoris avec les prix
      const enrichedData = favoritesData.map(card => {
        const priceData = priceMap[card.card_id]
        if (priceData) {
          return {
            ...card,
            cardmarket: priceData.cardmarket,
            tcgplayer: priceData.tcgplayer
          }
        }
        return card
      })

      return enrichedData
    } catch (error) {
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
      return data
    } catch (error) {
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
        .eq('card_id', cardId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      throw error
    }
  }

  // ============================================================================
  // WISHLIST
  // ============================================================================

  /**
   * Récupérer la wishlist de l'utilisateur
   * Enrichit les cartes avec les données de prix depuis discovered_cards
   */
  static async getUserWishlist() {
    try {
      const userId = await this.getCurrentUserId()

      const { data: wishlistData, error: wishlistError } = await supabase
        .from('user_wishlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (wishlistError) throw wishlistError

      if (!wishlistData || wishlistData.length === 0) {
        return []
      }

      // Récupérer les IDs des cartes
      const cardIds = [...new Set(wishlistData.map(card => card.card_id))]

      // Récupérer les prix depuis discovered_cards
      const { data: discoveredData } = await supabase
        .from('discovered_cards')
        .select('id, cardmarket, tcgplayer')
        .in('id', cardIds)

      // Créer un map pour les données de prix
      const priceMap = {}
      if (discoveredData) {
        discoveredData.forEach(card => {
          priceMap[card.id] = {
            cardmarket: card.cardmarket,
            tcgplayer: card.tcgplayer
          }
        })
      }

      // Enrichir la wishlist avec les prix
      const enrichedData = wishlistData.map(card => {
        const priceData = priceMap[card.card_id]
        if (priceData) {
          return {
            ...card,
            cardmarket: priceData.cardmarket,
            tcgplayer: priceData.tcgplayer
          }
        }
        return card
      })

      return enrichedData
    } catch (error) {
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
      return data
    } catch (error) {
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
        .eq('card_id', cardId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
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
      return data
    } catch (error) {
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
      return data
    } catch (error) {
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
      return data
    } catch (error) {
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
      return true
    } catch (error) {
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
      return data
    } catch (error) {
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
      return data
    } catch (error) {
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
      return true
    } catch (error) {
      throw error
    }
  }
}
