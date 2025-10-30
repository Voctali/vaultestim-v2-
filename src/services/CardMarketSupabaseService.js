/**
 * Service Supabase pour gérer les données CardMarket
 * Tables publiques + matchings utilisateur privés
 */

import { supabase } from '@/lib/supabaseClient'

/**
 * Mapping des codes de langue vers les IDs CardMarket
 */
export const CARDMARKET_LANGUAGE_IDS = {
  'en': 1,  // Anglais
  'fr': 2,  // Français
  'de': 3,  // Allemand
  'es': 4,  // Espagnol
  'it': 5   // Italien
}

/**
 * Mapping inversé : ID vers code de langue
 */
export const CARDMARKET_LANGUAGE_CODES = {
  1: 'en',
  2: 'fr',
  3: 'de',
  4: 'es',
  5: 'it'
}

/**
 * Labels des langues pour l'interface utilisateur
 */
export const LANGUAGE_LABELS = {
  'fr': 'Français',
  'en': 'Anglais',
  'de': 'Allemand',
  'es': 'Espagnol',
  'it': 'Italien'
}

export class CardMarketSupabaseService {
  /**
   * Convertir un code de langue (ex: 'fr') en ID CardMarket (ex: 2)
   * @param {string} languageCode - Code langue (fr, en, de, es, it)
   * @returns {number} ID CardMarket
   */
  static getLanguageId(languageCode) {
    return CARDMARKET_LANGUAGE_IDS[languageCode?.toLowerCase()] || 2 // Par défaut français
  }

  /**
   * Convertir un ID CardMarket en code de langue
   * @param {number} languageId - ID CardMarket
   * @returns {string} Code langue
   */
  static getLanguageCode(languageId) {
    return CARDMARKET_LANGUAGE_CODES[languageId] || 'fr' // Par défaut français
  }
  /**
   * Importer les données depuis les fichiers JSON vers Supabase
   * ATTENTION: Cette fonction doit être exécutée UNE SEULE FOIS par un admin
   *
   * @param {object} jsonFiles - { singles, nonsingles, prices }
   */
  static async importFromJSON(jsonFiles, onProgress = null) {
    console.log('📥 Début import CardMarket vers Supabase...')
    const startTime = Date.now()

    try {
      // 1. Import des singles (59,683 cartes)
      if (jsonFiles.singles?.products) {
        console.log(`📦 Import ${jsonFiles.singles.products.length} cartes singles...`)

        await this._importInBatches(
          'cardmarket_singles',
          jsonFiles.singles.products.map(p => ({
            id_product: p.idProduct,
            name: p.name,
            id_category: p.idCategory,
            category_name: p.categoryName,
            id_expansion: p.idExpansion,
            id_metacard: p.idMetacard,
            date_added: p.dateAdded !== '0000-00-00 00:00:00' ? p.dateAdded : null
          })),
          1000,
          (progress) => {
            console.log(`  ⏳ Singles: ${progress.current} / ${progress.total}`)
            if (onProgress) onProgress({ step: 'singles', ...progress })
          }
        )

        console.log('✅ Singles importés')
      }

      // 2. Import des produits scellés (4,527 produits)
      if (jsonFiles.nonsingles?.products) {
        console.log(`📦 Import ${jsonFiles.nonsingles.products.length} produits scellés...`)

        await this._importInBatches(
          'cardmarket_nonsingles',
          jsonFiles.nonsingles.products.map(p => ({
            id_product: p.idProduct,
            name: p.name,
            id_category: p.idCategory,
            category_name: p.categoryName,
            id_expansion: p.idExpansion,
            id_metacard: p.idMetacard,
            date_added: p.dateAdded !== '0000-00-00 00:00:00' ? p.dateAdded : null
          })),
          500,
          (progress) => {
            console.log(`  ⏳ NonSingles: ${progress.current} / ${progress.total}`)
            if (onProgress) onProgress({ step: 'nonsingles', ...progress })
          }
        )

        console.log('✅ Produits scellés importés')
      }

      // 3. Import des prix (64,210 prix)
      if (jsonFiles.prices?.priceGuides) {
        console.log(`💰 Import ${jsonFiles.prices.priceGuides.length} guides de prix...`)

        await this._importInBatches(
          'cardmarket_prices',
          jsonFiles.prices.priceGuides.map(p => ({
            id_product: p.idProduct,
            id_category: p.idCategory,
            id_language: p.idLanguage || 2, // Par défaut français (2) si non spécifié
            avg: p.avg,
            low: p.low,
            trend: p.trend,
            avg1: p.avg1,
            avg7: p.avg7,
            avg30: p.avg30,
            avg_holo: p['avg-holo'],
            low_holo: p['low-holo'],
            trend_holo: p['trend-holo'],
            avg1_holo: p['avg1-holo'],
            avg7_holo: p['avg7-holo'],
            avg30_holo: p['avg30-holo']
          })),
          1000,
          (progress) => {
            console.log(`  ⏳ Prix: ${progress.current} / ${progress.total}`)
            if (onProgress) onProgress({ step: 'prices', ...progress })
          }
        )

        console.log('✅ Prix importés')
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ Import CardMarket terminé en ${duration}s`)

      return {
        success: true,
        duration,
        stats: {
          singles: jsonFiles.singles?.products?.length || 0,
          nonsingles: jsonFiles.nonsingles?.products?.length || 0,
          prices: jsonFiles.prices?.priceGuides?.length || 0
        }
      }

    } catch (error) {
      console.error('❌ Erreur import CardMarket:', error)
      throw error
    }
  }

  /**
   * Import par batches pour éviter les timeouts
   */
  static async _importInBatches(tableName, data, batchSize, onProgress = null) {
    const total = data.length

    for (let i = 0; i < total; i += batchSize) {
      const batch = data.slice(i, i + batchSize)

      const { error } = await supabase
        .from(tableName)
        .upsert(batch, { onConflict: 'id_product' })

      if (error) {
        console.error(`❌ Erreur batch ${i}-${i + batch.length}:`, error)
        throw error
      }

      if (onProgress) {
        onProgress({
          current: Math.min(i + batchSize, total),
          total,
          percent: Math.round((Math.min(i + batchSize, total) / total) * 100)
        })
      }

      // Petite pause pour éviter rate limiting
      if (i + batchSize < total) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  /**
   * Rechercher des cartes CardMarket par nom (approximatif)
   */
  static async searchCardsByName(pokemonName, limit = 50) {
    const { data, error } = await supabase
      .from('cardmarket_singles')
      .select('*')
      .ilike('name', `${pokemonName}%`)
      .limit(limit)

    if (error) {
      console.error('❌ Erreur recherche CardMarket:', error)
      return []
    }

    return data || []
  }

  /**
   * Obtenir une carte CardMarket par ID
   */
  static async getCardById(idProduct) {
    const { data, error } = await supabase
      .from('cardmarket_singles')
      .select('*')
      .eq('id_product', idProduct)
      .single()

    if (error) {
      console.error('❌ Erreur récupération carte:', error)
      return null
    }

    return data
  }

  /**
   * Obtenir le prix pour un produit
   * @param {number} idProduct - ID du produit CardMarket
   * @param {number} languageId - ID de la langue (1=Anglais, 2=Français, 3=Allemand, etc.)
   */
  static async getPriceForProduct(idProduct, languageId = 2) {
    const { data, error } = await supabase
      .from('cardmarket_prices')
      .select('*')
      .eq('id_product', idProduct)
      .eq('id_language', languageId) // Filtrer par langue française (2) par défaut
      .maybeSingle() // maybeSingle au lieu de single pour gérer le cas où il n'y a pas de prix

    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('❌ Erreur récupération prix:', error)
      }
      return null
    }

    return data
  }

  /**
   * Obtenir les prix pour plusieurs produits en une seule requête
   * Optimisation : évite de faire des milliers de requêtes individuelles
   * @param {Array<number>} productIds - Liste des IDs de produits
   * @param {number} languageId - ID de la langue (1=Anglais, 2=Français, 3=Allemand, etc.)
   * @returns {Map<number, object>} Map avec id_product -> prix
   */
  static async getPricesForProducts(productIds, languageId = 2) {
    if (!productIds || productIds.length === 0) {
      return new Map()
    }

    // Supabase limite la clause IN à ~1000 éléments, donc on traite par batches
    const BATCH_SIZE = 1000
    const priceMap = new Map()

    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
      const batch = productIds.slice(i, i + BATCH_SIZE)

      const { data, error } = await supabase
        .from('cardmarket_prices')
        .select('*')
        .in('id_product', batch)
        .eq('id_language', languageId) // Filtrer par langue française (2) par défaut

      if (error) {
        console.error('❌ Erreur récupération prix batch:', error)
        continue
      }

      // Ajouter les prix à la Map
      if (data) {
        data.forEach(price => {
          priceMap.set(price.id_product, price)
        })
      }
    }

    return priceMap
  }

  /**
   * Rechercher des produits scellés
   * @param {string} query - Recherche par nom
   * @param {number|null} category - Filtrer par catégorie
   * @param {number} limit - Nombre max de résultats par requête
   * @param {number} offset - Décalage pour pagination
   */
  static async searchSealedProducts(query = '', category = null, limit = 100, offset = 0) {
    let queryBuilder = supabase
      .from('cardmarket_nonsingles')
      .select('*')

    if (query) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`)
    }

    if (category !== null) {
      queryBuilder = queryBuilder.eq('id_category', category)
    }

    // Utiliser .range() pour pagination (permet de dépasser la limite de 1000)
    const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Erreur recherche produits scellés:', error)
      return []
    }

    return data || []
  }

  /**
   * Sauvegarder un matching utilisateur
   */
  static async saveUserMatch(userId, cardId, cardmarketIdProduct, matchScore, matchMethod = 'auto_attacks', isSealedProduct = false) {
    const { data, error } = await supabase
      .from('user_cardmarket_matches')
      .upsert({
        user_id: userId,
        card_id: cardId,
        cardmarket_id_product: cardmarketIdProduct,
        match_score: matchScore,
        match_method: matchMethod,
        is_sealed_product: isSealedProduct
      }, {
        onConflict: 'user_id,card_id'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur sauvegarde matching:', error)
      throw error
    }

    console.log(`✅ Matching sauvegardé: ${cardId} → CardMarket ${cardmarketIdProduct}`)
    return data
  }

  /**
   * Charger tous les matchings d'un utilisateur
   */
  static async loadUserMatches(userId) {
    const { data, error } = await supabase
      .from('user_matches_with_details')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Erreur chargement matchings:', error)
      return []
    }

    console.log(`📥 ${data?.length || 0} matchings chargés pour l'utilisateur`)
    return data || []
  }

  /**
   * Obtenir un matching spécifique
   */
  static async getUserMatch(userId, cardId) {
    const { data, error } = await supabase
      .from('user_cardmarket_matches')
      .select('*')
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .maybeSingle()

    if (error) {
      console.error('❌ Erreur récupération matching:', error)
      return null
    }

    return data
  }

  /**
   * Supprimer un matching
   */
  static async deleteUserMatch(userId, cardId) {
    const { error } = await supabase
      .from('user_cardmarket_matches')
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId)

    if (error) {
      console.error('❌ Erreur suppression matching:', error)
      throw error
    }

    console.log(`🗑️ Matching supprimé: ${cardId}`)
  }

  /**
   * Obtenir les statistiques globales
   */
  static async getStats() {
    const { data, error } = await supabase
      .from('cardmarket_stats')
      .select('*')
      .single()

    if (error) {
      console.error('❌ Erreur récupération stats:', error)
      return null
    }

    return data
  }

  /**
   * Extraire les noms d'attaques depuis le nom CardMarket
   * Ex: "Amoonguss [Sporprise | Rising Lunge]" → ["Sporprise", "Rising Lunge"]
   */
  static extractAttacksFromName(name) {
    const match = name.match(/\[([^\]]+)\]/)
    if (!match) return []

    return match[1]
      .split('|')
      .map(attack => attack.trim().toLowerCase())
  }

  /**
   * Calculer un score de matching entre attaques
   * @returns {number} Score entre 0 et 1
   */
  static calculateAttackMatchScore(cardAttacks, cardmarketAttacks) {
    if (!cardAttacks.length || !cardmarketAttacks.length) return 0

    const normalizedCard = cardAttacks.map(a => a.toLowerCase().trim())
    const normalizedCM = cardmarketAttacks.map(a => a.toLowerCase().trim())

    let matchCount = 0

    normalizedCard.forEach(attack => {
      if (normalizedCM.includes(attack)) {
        matchCount++
      }
    })

    // Score = ratio d'attaques qui matchent
    return matchCount / Math.max(normalizedCard.length, normalizedCM.length)
  }

  /**
   * Construire l'URL CardMarket directe depuis un idProduct
   * @param {number} idProduct - ID du produit CardMarket
   * @param {boolean} isSealedProduct - true pour produits scellés, false pour singles
   */
  /**
   * Mapping des catégories CardMarket vers leurs chemins URL
   * Basé sur les URLs réelles de CardMarket
   */
  static CATEGORY_URL_MAPPING = {
    52: 'Boosters',                    // Pokémon Booster
    53: 'Booster-Boxes',               // Pokémon Display
    54: 'Theme-Decks',                 // Pokémon Theme Deck
    1013: 'Trainer-Kits',              // Pokémon Trainer Kits
    1014: 'Tins',                      // Pokémon Tins
    1015: 'Box-Sets',                  // Pokémon Box Set
    1016: 'Elite-Trainer-Boxes',       // Pokémon Elite Trainer Boxes
    1017: 'Coins'                      // Pokémon Coins
  }

  /**
   * Slugifier un nom de produit pour CardMarket
   * Format CardMarket : mots avec majuscules séparés par des tirets
   * Exemple : "Black Bolt Elite Trainer Box" → "Black-Bolt-Elite-Trainer-Box"
   * Exemple : "Pokémon GO: Premium Collection—Radiant Eevee" → "Pokemon-GO-Premium-Collection-Radiant-Eevee"
   */
  static slugifyForCardMarket(text) {
    if (!text) return ''

    return text
      .toString()
      .trim()
      // Normaliser les caractères accentués (é → e, à → a, etc.)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Supprimer les parenthèses et leur contenu
      .replace(/\s*\([^)]*\)/g, '')
      // Remplacer les tirets cadratins (—, –) et deux-points par des espaces
      .replace(/[—–:]/g, ' ')
      // Remplacer les autres caractères spéciaux (sauf espaces et tirets normaux) par des espaces
      .replace(/[^\w\s-]/g, ' ')
      // Remplacer les espaces multiples par un seul
      .replace(/\s+/g, ' ')
      .trim()
      // Remplacer les espaces par des tirets
      .replace(/\s/g, '-')
      // Supprimer les tirets multiples
      .replace(/-+/g, '-')
      // Supprimer les tirets en début/fin
      .replace(/^-+|-+$/g, '')
  }

  static buildDirectUrl(idProduct, isSealedProduct = false, productName = null, categoryId = null, languageCode = 'fr') {
    // Format CardMarket : /en/Pokemon/Products/[Catégorie]/[Nom-Slugifié]?language=X
    // Exemples :
    //   - /Products/Boosters/Destined-Rivals-Booster?language=2
    //   - /Products/Elite-Trainer-Boxes/Black-Bolt-Elite-Trainer-Box?language=2

    // Convertir le code langue en ID CardMarket
    const languageId = this.getLanguageId(languageCode)
    const languageParam = `?language=${languageId}`

    if (isSealedProduct && productName && categoryId) {
      const categoryPath = this.CATEGORY_URL_MAPPING[categoryId]

      if (categoryPath) {
        const slug = this.slugifyForCardMarket(productName)

        // Si le slug est vide (trop de caractères spéciaux supprimés), utiliser le fallback
        if (slug && slug.length > 0) {
          return `https://www.cardmarket.com/en/Pokemon/Products/${categoryPath}/${slug}${languageParam}`
        }
      }
    }

    // Fallback : URL de recherche si on n'a pas toutes les infos
    if (isSealedProduct) {
      return `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${idProduct}&searchInSealedProducts=true&language=${languageId}`
    }

    return `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${idProduct}&language=${languageId}`
  }

  /**
   * Construire l'URL CardMarket pour un produit scellé
   * @param {number} idProduct - ID du produit CardMarket
   * @param {string} productName - Nom du produit
   * @param {number} categoryId - ID de la catégorie (optionnel)
   * @param {string} languageCode - Code langue (fr, en, de, es, it) - défaut: 'fr'
   */
  static buildSealedProductUrl(idProduct, productName = null, categoryId = null, languageCode = 'fr') {
    return this.buildDirectUrl(idProduct, true, productName, categoryId, languageCode)
  }

  /**
   * Construire l'URL de l'image CardMarket pour un produit scellé
   * @param {number} idProduct - ID du produit CardMarket
   * @param {number} idCategory - ID de la catégorie CardMarket (requis pour produits scellés)
   * @returns {string|null} URL de l'image
   */
  static getCardMarketImageUrl(idProduct, idCategory) {
    if (!idProduct) return null
    if (!idCategory) return null // Requis pour construire l'URL S3

    // Format officiel des images de produits scellés CardMarket (S3)
    // Note: Les images S3 sont protégées par referer (403 sans referer cardmarket.com)
    // Solution: Utiliser notre proxy côté serveur (Vercel Function)
    // La fonction récupère l'image avec le referer CardMarket et la renvoie
    return `/api/cardmarket-image?category=${idCategory}&product=${idProduct}`
  }

  /**
   * Récupérer l'URL de l'image d'un produit scellé
   * @param {number} idProduct - ID du produit CardMarket
   * @param {number} idCategory - ID de la catégorie CardMarket (optionnel, sera cherché en base si non fourni)
   * @returns {Promise<string|null>} URL de l'image si disponible
   */
  static async getSealedProductImageUrl(idProduct, idCategory = null) {
    try {
      // Si idCategory n'est pas fourni, le chercher en base
      if (!idCategory) {
        console.log(`🔍 Recherche de la catégorie pour le produit ${idProduct}...`)
        const { data, error } = await supabase
          .from('cardmarket_nonsingles')
          .select('id_category')
          .eq('id_product', idProduct)
          .single()

        if (error || !data) {
          console.log(`⚠️ Impossible de trouver la catégorie pour: ${idProduct}`)
          return null
        }

        idCategory = data.id_category
        console.log(`✅ Catégorie trouvée: ${idCategory}`)
      }

      const imageUrl = this.getCardMarketImageUrl(idProduct, idCategory)

      if (!imageUrl) {
        console.log(`⚠️ Impossible de construire l'URL image pour: ${idProduct}`)
        return null
      }

      // Vérifier que l'image existe en faisant une requête HEAD
      const response = await fetch(imageUrl, { method: 'HEAD' })

      if (response.ok) {
        console.log(`✅ Image CardMarket trouvée: ${idProduct}`)
        return imageUrl
      } else {
        console.log(`⚠️ Pas d'image CardMarket pour: ${idProduct}`)
        return null
      }
    } catch (error) {
      console.error(`❌ Erreur vérification image CardMarket ${idProduct}:`, error)
      return null
    }
  }

  /**
   * Nettoyer toutes les données CardMarket (DANGER!)
   */
  static async clearAllData() {
    console.warn('⚠️ Suppression de TOUTES les données CardMarket...')

    const tables = ['cardmarket_singles', 'cardmarket_nonsingles', 'cardmarket_prices']

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id_product', 0) // Delete all (workaround car .delete() sans where ne marche pas)

      if (error) {
        console.error(`❌ Erreur suppression ${table}:`, error)
      } else {
        console.log(`🗑️ ${table} vidée`)
      }
    }

    console.log('✅ Toutes les données CardMarket supprimées')
  }
}
