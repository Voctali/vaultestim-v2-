/**
 * Service de récupération dynamique des liens CardMarket
 *
 * Au clic sur un bouton CardMarket :
 * 1. Vérifie si le lien est déjà en cache (Supabase)
 * 2. Sinon, appelle RapidAPI pour récupérer le lien officiel
 * 3. Sauvegarde en arrière-plan dans Supabase
 * 4. Retourne le lien pour redirection immédiate
 */

import { RapidAPIService } from './RapidAPIService'
import { supabase } from '@/lib/supabaseClient'

export class CardMarketDynamicLinkService {
  /**
   * Récupérer le lien CardMarket pour une carte
   *
   * @param {Object} card - Carte Pokemon TCG API
   * @returns {Promise<string>} URL CardMarket
   */
  static async getCardLink(card) {
    // Supporter à la fois card.id (API) et card.card_id (collection)
    const cardId = card?.card_id || card?.id
    if (!cardId) {
      throw new Error('Carte invalide')
    }

    try {
      // 1. Vérifier si le lien existe déjà dans discovered_cards
      const { data: existingCard, error: fetchError } = await supabase
        .from('discovered_cards')
        .select('cardmarket_url')
        .eq('id', cardId)
        .single()

      if (!fetchError && existingCard?.cardmarket_url) {
        // S'assurer que le paramètre language=2 est présent
        let cachedUrl = existingCard.cardmarket_url
        if (!cachedUrl.includes('language=2')) {
          cachedUrl += cachedUrl.includes('?') ? '&language=2' : '?language=2'
        }
        console.log(`✅ Lien CardMarket trouvé en cache: ${cachedUrl}`)
        return cachedUrl
      }

      // 2. Récupérer depuis RapidAPI
      console.log(`🔍 Récupération lien CardMarket depuis RapidAPI pour carte ${cardId}...`)

      // Rechercher la carte par nom + numéro + extension
      const searchQuery = `${card.name} ${card.number || ''} ${card.set?.name || ''}`.trim()
      const results = await RapidAPIService.searchCards(searchQuery, { limit: 5 })

      if (!results || results.length === 0) {
        console.warn(`⚠️ Aucun résultat RapidAPI pour: ${searchQuery}`)
        return this._buildFallbackSearchUrl(card)
      }

      // Trouver la meilleure correspondance (par nom + numéro)
      const bestMatch = results.find(r => {
        const nameMatch = r.name?.toLowerCase().includes(card.name.toLowerCase())
        const numberMatch = card.number && r.number?.toString() === card.number.toString()
        return nameMatch && numberMatch
      }) || results[0]

      const cardMarketUrl = bestMatch.links?.cardmarket
      if (!cardMarketUrl) {
        console.warn(`⚠️ Pas de lien CardMarket dans la réponse RapidAPI`)
        return this._buildFallbackSearchUrl(card)
      }

      // Ajouter ?language=2 si pas déjà présent
      let finalUrl = cardMarketUrl
      if (!finalUrl.includes('language=2')) {
        finalUrl += finalUrl.includes('?') ? '&language=2' : '?language=2'
      }

      console.log(`✅ Lien CardMarket récupéré: ${finalUrl}`)

      // 3. Sauvegarder en arrière-plan (fire-and-forget)
      this._saveCardLinkInBackground(cardId, finalUrl)

      return finalUrl

    } catch (error) {
      console.error(`❌ Erreur récupération lien CardMarket:`, error)
      return this._buildFallbackSearchUrl(card)
    }
  }

  /**
   * Récupérer le lien CardMarket pour un produit scellé
   *
   * @param {number} productId - ID CardMarket du produit
   * @param {string} tableName - Nom de la table ('user_sealed_products' ou 'cardmarket_nonsingles')
   * @param {Object} productInfo - Infos du produit (nom, etc.) pour fallback
   * @returns {Promise<string>} URL CardMarket
   */
  static async getSealedProductLink(productId, tableName = 'cardmarket_nonsingles', productInfo = {}) {
    if (!productId) {
      throw new Error('Product ID invalide')
    }

    try {
      // 1. Vérifier si le lien existe déjà dans la table
      const { data: existingProduct, error: fetchError } = await supabase
        .from(tableName)
        .select('cardmarket_url')
        .eq('id_product', productId)
        .single()

      if (!fetchError && existingProduct?.cardmarket_url) {
        console.log(`✅ Lien CardMarket trouvé en cache: ${existingProduct.cardmarket_url}`)
        return existingProduct.cardmarket_url
      }

      // 2. Récupérer depuis RapidAPI
      console.log(`🔍 Récupération lien CardMarket depuis RapidAPI pour produit ${productId}...`)

      const product = await RapidAPIService.getProduct(productId)

      if (!product?.links?.cardmarket) {
        console.warn(`⚠️ Pas de lien CardMarket dans la réponse RapidAPI`)
        return this._buildFallbackProductSearchUrl(productInfo)
      }

      const cardMarketUrl = product.links.cardmarket
      console.log(`✅ Lien CardMarket récupéré: ${cardMarketUrl}`)

      // 3. Sauvegarder en arrière-plan (fire-and-forget)
      this._saveProductLinkInBackground(productId, cardMarketUrl, tableName)

      return cardMarketUrl

    } catch (error) {
      console.error(`❌ Erreur récupération lien CardMarket:`, error)
      return this._buildFallbackProductSearchUrl(productInfo)
    }
  }

  /**
   * Sauvegarder le lien d'une carte en arrière-plan
   * @private
   */
  static _saveCardLinkInBackground(cardId, url) {
    // Fire-and-forget: pas d'await
    supabase
      .from('discovered_cards')
      .update({ cardmarket_url: url })
      .eq('id', cardId)
      .then(({ error }) => {
        if (error) {
          console.warn(`⚠️ Erreur sauvegarde lien carte ${cardId}:`, error)
        } else {
          console.log(`💾 Lien CardMarket sauvegardé pour carte ${cardId}`)
        }
      })
  }

  /**
   * Sauvegarder le lien d'un produit scellé en arrière-plan
   * @private
   */
  static _saveProductLinkInBackground(productId, url, tableName) {
    // Fire-and-forget: pas d'await
    supabase
      .from(tableName)
      .update({ cardmarket_url: url })
      .eq('id_product', productId)
      .then(({ error }) => {
        if (error) {
          console.warn(`⚠️ Erreur sauvegarde lien produit ${productId}:`, error)
        } else {
          console.log(`💾 Lien CardMarket sauvegardé pour produit ${productId}`)
        }
      })
  }

  /**
   * Construire une URL de recherche CardMarket (fallback)
   * @private
   */
  static _buildFallbackSearchUrl(card) {
    const searchTerms = [card.name]
    if (card.number) searchTerms.push(card.number)
    if (card.set?.name) searchTerms.push(card.set.name)

    const searchString = searchTerms.join(' ')
    return `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(searchString)}&language=2`
  }

  /**
   * Construire une URL de recherche CardMarket pour un produit (fallback)
   * @private
   */
  static _buildFallbackProductSearchUrl(productInfo) {
    if (productInfo.name) {
      return `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(productInfo.name)}`
    }
    return 'https://www.cardmarket.com/en/Pokemon'
  }
}
