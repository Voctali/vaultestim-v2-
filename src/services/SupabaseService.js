/**
 * Service Supabase unifié
 * Remplace IndexedDBService + BackendApiService
 * Synchronisation multi-appareils automatique
 */
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUserId as getStoredUserId } from '@/lib/sessionStore'

export class SupabaseService {
  /**
   * Champs autorisés dans la table discovered_cards
   * (whitelist basée sur le schéma Supabase)
   */
  static ALLOWED_CARD_FIELDS = [
    'id',
    'name',
    'name_fr',
    'types',
    'hp',
    'number',
    'artist',
    'rarity',
    'rarity_fr',
    'images',
    'set',
    'set_id',
    '_source'
  ]

  /**
   * Filtrer une carte pour ne garder que les champs autorisés
   */
  static filterCardFields(card) {
    const filtered = {}
    this.ALLOWED_CARD_FIELDS.forEach(field => {
      if (card[field] !== undefined) {
        filtered[field] = card[field]
      }
    })
    return filtered
  }

  /**
   * Helper pour obtenir l'ID utilisateur courant (depuis le store)
   */
  static async getCurrentUserId() {
    console.log('🔍 [getCurrentUserId] Récupération depuis sessionStore...')

    try {
      const userId = getStoredUserId()
      console.log(`✅ User trouvé depuis store: ${userId}`)
      return userId
    } catch (error) {
      console.error('❌ [getCurrentUserId] Pas de session dans le store:', error.message)
      throw error
    }
  }

  // ============================================================================
  // CARTES DÉCOUVERTES (discovered_cards)
  // ============================================================================

  /**
   * Sauvegarder toutes les cartes découvertes
   */
  static async saveDiscoveredCards(cards) {
    try {
      const userId = await this.getCurrentUserId()
      console.log(`📝 Tentative de sauvegarde de ${cards.length} cartes pour user ${userId}`)

      // Supprimer les anciennes cartes de l'utilisateur
      const { data: deletedCards, error: deleteError } = await supabase
        .from('discovered_cards')
        .delete()
        .eq('user_id', userId)
        .select()

      if (deleteError) {
        console.error('⚠️ Erreur lors de la suppression:', deleteError)
      } else {
        console.log(`🗑️ ${deletedCards?.length || 0} anciennes cartes supprimées`)
      }

      // Insérer par batch de 500 pour éviter les timeouts
      const BATCH_SIZE = 500
      let savedCount = 0

      for (let i = 0; i < cards.length; i += BATCH_SIZE) {
        const batch = cards.slice(i, i + BATCH_SIZE)

        const cardsWithUserId = batch.map(card => {
          // Filtrer pour ne garder que les champs autorisés dans Supabase
          const cleanCard = this.filterCardFields(card)

          return {
            ...cleanCard,
            user_id: userId,
            _saved_at: new Date().toISOString()
          }
        })

        // Log de debug : afficher la première carte pour vérifier les champs
        if (i === 0 && cardsWithUserId.length > 0) {
          console.log('🔍 Exemple de carte à sauvegarder:', {
            id: cardsWithUserId[0].id,
            name: cardsWithUserId[0].name,
            name_fr: cardsWithUserId[0].name_fr,
            user_id: cardsWithUserId[0].user_id,
            fields: Object.keys(cardsWithUserId[0])
          })
        }

        // Utiliser upsert au lieu de insert pour gérer les conflits de clés
        const { data: upsertedData, error } = await supabase
          .from('discovered_cards')
          .upsert(cardsWithUserId, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()

        if (error) {
          console.error(`❌ Erreur batch ${i / BATCH_SIZE + 1}:`, error)
          throw error
        }

        savedCount += batch.length
        console.log(`💾 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} cartes sauvegardées (${savedCount}/${cards.length})`)
        console.log(`   └─ Données insérées: ${upsertedData?.length || 0} lignes retournées`)
      }

      // Vérifier combien de cartes sont maintenant en base
      const { count } = await supabase
        .from('discovered_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      console.log(`✅ ${savedCount} cartes sauvegardées dans Supabase`)
      console.log(`📊 Total en base pour cet utilisateur: ${count} cartes`)
      return true
    } catch (error) {
      console.error('❌ Erreur saveDiscoveredCards:', error)
      throw error
    }
  }

  /**
   * Charger seulement les cartes modifiées depuis un certain timestamp (sync incrémentale)
   */
  static async loadCardsModifiedSince(sinceTimestamp) {
    try {
      console.log(`🔄 Chargement cartes modifiées depuis: ${sinceTimestamp}`)
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('discovered_cards')
        .select('id, name, name_fr, types, hp, number, artist, rarity, rarity_fr, images, set, set_id, _source, _saved_at')
        .eq('user_id', userId)
        .gte('_saved_at', sinceTimestamp)
        .order('_saved_at', { ascending: true })

      if (error) throw error

      console.log(`📦 ${data.length} cartes modifiées depuis ${sinceTimestamp}`)
      return data
    } catch (error) {
      console.error('❌ Erreur loadCardsModifiedSince:', error)
      return []
    }
  }

  /**
   * Charger toutes les cartes découvertes (avec pagination pour > 1000 cartes)
   */
  static async loadDiscoveredCards() {
    try {
      console.log('🔍 Récupération userId...')
      const userId = await this.getCurrentUserId()
      console.log(`✅ UserId: ${userId}`)

      console.log('📡 Chargement des cartes par batch (optimisé)...')

      // Charger par batch de 100 (sécurisé)
      let allCards = []
      let hasMore = true
      let offset = 0
      const BATCH_SIZE = 100

      while (hasMore) {
        console.log(`🔄 Batch ${Math.floor(offset / BATCH_SIZE) + 1}: Requête offset=${offset}...`)

        const startTime = Date.now()

        let data, error

        try {
          console.log('⏳ Lancement requête Supabase...')

          // Timeout 15s
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout après 15s')), 15000)
          )

          const queryPromise = supabase
            .from('discovered_cards')
            .select('id, name, name_fr, types, hp, number, artist, rarity, rarity_fr, images, set, set_id, _source')
            .eq('user_id', userId)
            .range(offset, offset + BATCH_SIZE - 1)

          console.log('⏳ Attente réponse...')
          const result = await Promise.race([queryPromise, timeoutPromise])
          console.log('✅ Réponse reçue')

          data = result.data
          error = result.error
        } catch (timeoutError) {
          console.error('⏱️ TIMEOUT:', timeoutError.message)
          throw timeoutError
        }

        const elapsed = Date.now() - startTime
        console.log(`⏱️ Requête terminée en ${elapsed}ms`)

        if (error) {
          console.error('❌ Erreur Supabase:', error)
          throw error
        }

        allCards = allCards.concat(data)
        console.log(`📦 Batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${data.length} cartes reçues (${allCards.length} total)`)

        // Si on a reçu moins que BATCH_SIZE, on a tout chargé
        hasMore = data.length === BATCH_SIZE
        offset += BATCH_SIZE

        // Petit délai entre batches pour ne pas surcharger Supabase
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      console.log(`📦 ${allCards.length} cartes chargées depuis Supabase`)
      return allCards
    } catch (error) {
      console.error('❌ Erreur loadDiscoveredCards:', error)
      console.error('Détails:', error.message)
      return []
    }
  }

  /**
   * Ajouter de nouvelles cartes (sans doublons)
   */
  static async addDiscoveredCards(newCards) {
    try {
      const userId = await this.getCurrentUserId()

      // Récupérer les IDs existants
      const { data: existing } = await supabase
        .from('discovered_cards')
        .select('id')
        .eq('user_id', userId)

      const existingIds = new Set(existing?.map(c => c.id) || [])

      // Filtrer les nouvelles cartes
      const cardsToAdd = newCards.filter(card => !existingIds.has(card.id))

      if (cardsToAdd.length === 0) {
        console.log('ℹ️ Aucune nouvelle carte à ajouter')
        return 0
      }

      // Insérer par batch
      const BATCH_SIZE = 100
      let addedCount = 0

      for (let i = 0; i < cardsToAdd.length; i += BATCH_SIZE) {
        const batch = cardsToAdd.slice(i, i + BATCH_SIZE)

        const cardsWithUserId = batch.map(card => {
          // Filtrer pour ne garder que les champs autorisés dans Supabase
          const cleanCard = this.filterCardFields(card)

          return {
            ...cleanCard,
            user_id: userId,
            _saved_at: new Date().toISOString()
          }
        })

        // Utiliser upsert pour gérer automatiquement les conflits de clés
        const { error } = await supabase
          .from('discovered_cards')
          .upsert(cardsWithUserId, {
            onConflict: 'id',
            ignoreDuplicates: false
          })

        if (error) throw error

        addedCount += batch.length
        console.log(`📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} nouvelles cartes ajoutées (${addedCount} total)`)
      }

      console.log(`✅ ${addedCount} nouvelles cartes ajoutées`)
      return addedCount
    } catch (error) {
      console.error('❌ Erreur addDiscoveredCards:', error)
      return 0
    }
  }

  /**
   * Mettre à jour une carte
   */
  static async updateDiscoveredCard(cardId, updates) {
    try {
      const userId = await this.getCurrentUserId()

      // Filtrer les mises à jour pour ne garder que les champs autorisés
      const cleanUpdates = this.filterCardFields(updates)

      const { data, error } = await supabase
        .from('discovered_cards')
        .update(cleanUpdates)
        .eq('id', cardId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Carte ${cardId} mise à jour`)
      return data
    } catch (error) {
      console.error('❌ Erreur updateDiscoveredCard:', error)
      throw error
    }
  }

  /**
   * Rechercher des cartes par nom
   */
  static async searchCardsByName(query) {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('discovered_cards')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${query}%,name_fr.ilike.%${query}%`)
        .limit(100)

      if (error) throw error

      console.log(`🔍 ${data.length} résultats pour "${query}"`)
      return data
    } catch (error) {
      console.error('❌ Erreur searchCardsByName:', error)
      return []
    }
  }

  // ============================================================================
  // SÉRIES/EXTENSIONS (series_database)
  // ============================================================================

  /**
   * Sauvegarder la base de données des séries
   */
  static async saveSeriesDatabase(series) {
    try {
      const userId = await this.getCurrentUserId()

      // Supprimer les anciennes séries
      await supabase
        .from('series_database')
        .delete()
        .eq('user_id', userId)

      // Dédupliquer
      const uniqueSeries = []
      const seenIds = new Set()

      series.forEach((serie, index) => {
        let serieId = serie.id
        if (!serieId || seenIds.has(serieId)) {
          serieId = `${serie.id || 'unknown'}-${index}`
        }
        seenIds.add(serieId)
        uniqueSeries.push({ ...serie, id: serieId })
      })

      // Insérer par batch
      const BATCH_SIZE = 50
      let savedCount = 0

      for (let i = 0; i < uniqueSeries.length; i += BATCH_SIZE) {
        const batch = uniqueSeries.slice(i, i + BATCH_SIZE)

        const seriesWithUserId = batch.map(serie => {
          // Garder UNIQUEMENT les colonnes qui existent dans Supabase
          // (pas de 'cards', 'extensions', 'releaseDate', 'logo', '_saved_at')
          return {
            id: serie.id,
            user_id: userId,
            name: serie.name,
            series: serie.series,
            created_at: new Date().toISOString()
          }
        })

        const { error } = await supabase
          .from('series_database')
          .insert(seriesWithUserId)

        if (error) throw error

        savedCount += batch.length
        console.log(`📚 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} séries sauvegardées (${savedCount}/${uniqueSeries.length})`)
      }

      console.log(`✅ ${savedCount} séries sauvegardées`)
      return true
    } catch (error) {
      console.error('❌ Erreur saveSeriesDatabase:', error)
      throw error
    }
  }

  /**
   * Charger la base de données des séries
   */
  static async loadSeriesDatabase() {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('series_database')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      console.log(`📚 ${data.length} séries chargées`)
      return data
    } catch (error) {
      console.error('❌ Erreur loadSeriesDatabase:', error)
      return []
    }
  }

  // ============================================================================
  // BLOCS PERSONNALISÉS (custom_blocks)
  // ============================================================================

  /**
   * Sauvegarder un bloc personnalisé
   */
  static async saveCustomBlock(block) {
    try {
      const userId = await this.getCurrentUserId()

      const blockWithUserId = {
        ...block,
        user_id: userId
      }

      const { data, error } = await supabase
        .from('custom_blocks')
        .upsert(blockWithUserId, { onConflict: 'id,user_id' })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Bloc personnalisé sauvegardé: ${block.name}`)
      return data
    } catch (error) {
      console.error('❌ Erreur saveCustomBlock:', error)
      throw error
    }
  }

  /**
   * Charger tous les blocs personnalisés
   */
  static async loadCustomBlocks() {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('custom_blocks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log(`📦 ${data.length} blocs personnalisés chargés`)
      return data
    } catch (error) {
      console.error('❌ Erreur loadCustomBlocks:', error)
      return []
    }
  }

  /**
   * Supprimer un bloc personnalisé
   */
  static async deleteCustomBlock(blockId) {
    try {
      const userId = await this.getCurrentUserId()

      const { error } = await supabase
        .from('custom_blocks')
        .delete()
        .eq('id', blockId)
        .eq('user_id', userId)

      if (error) throw error

      console.log(`🗑️ Bloc personnalisé supprimé: ${blockId}`)
      return true
    } catch (error) {
      console.error('❌ Erreur deleteCustomBlock:', error)
      throw error
    }
  }

  /**
   * Mettre à jour un bloc personnalisé
   */
  static async updateCustomBlock(blockId, updates) {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('custom_blocks')
        .update(updates)
        .eq('id', blockId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Bloc personnalisé mis à jour: ${blockId}`)
      return data
    } catch (error) {
      console.error('❌ Erreur updateCustomBlock:', error)
      throw error
    }
  }

  // ============================================================================
  // EXTENSIONS PERSONNALISÉES (custom_extensions)
  // ============================================================================

  /**
   * Sauvegarder une extension personnalisée
   */
  static async saveCustomExtension(extensionId, newSeries, originalSeries = null) {
    try {
      const userId = await this.getCurrentUserId()

      const customExtension = {
        id: extensionId,
        user_id: userId,
        series: newSeries,
        original_series: originalSeries || 'Non défini'
      }

      const { data, error } = await supabase
        .from('custom_extensions')
        .upsert(customExtension, { onConflict: 'id,user_id' })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Extension personnalisée sauvegardée: ${extensionId} → ${newSeries}`)
      return data
    } catch (error) {
      console.error('❌ Erreur saveCustomExtension:', error)
      throw error
    }
  }

  /**
   * Charger toutes les extensions personnalisées
   */
  static async loadCustomExtensions() {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('custom_extensions')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      console.log(`📝 ${data.length} extensions personnalisées chargées`)
      return data
    } catch (error) {
      console.error('❌ Erreur loadCustomExtensions:', error)
      return []
    }
  }

  /**
   * Supprimer une extension personnalisée
   */
  static async deleteCustomExtension(extensionId) {
    try {
      const userId = await this.getCurrentUserId()

      const { error } = await supabase
        .from('custom_extensions')
        .delete()
        .eq('id', extensionId)
        .eq('user_id', userId)

      if (error) throw error

      console.log(`🗑️ Extension personnalisée supprimée: ${extensionId}`)
      return true
    } catch (error) {
      console.error('❌ Erreur deleteCustomExtension:', error)
      throw error
    }
  }

  /**
   * Obtenir le bloc personnalisé d'une extension
   */
  static async getCustomExtensionSeries(extensionId) {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('custom_extensions')
        .select('series')
        .eq('id', extensionId)
        .eq('user_id', userId)
        .single()

      if (error) return null

      return data?.series || null
    } catch (error) {
      console.error('❌ Erreur getCustomExtensionSeries:', error)
      return null
    }
  }

  // ============================================================================
  // SUPPRESSION COMPLÈTE (comme IndexedDBService)
  // ============================================================================

  /**
   * Supprimer toutes les cartes d'une extension
   */
  static async deleteCardsFromExtension(extensionId) {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await supabase
        .from('discovered_cards')
        .delete()
        .eq('user_id', userId)
        .eq('set_id', extensionId)
        .select()

      if (error) throw error

      const deletedCount = data?.length || 0
      console.log(`🗑️ ${deletedCount} cartes supprimées de l'extension ${extensionId}`)
      return deletedCount
    } catch (error) {
      console.error('❌ Erreur deleteCardsFromExtension:', error)
      return 0
    }
  }

  /**
   * Supprimer une extension de la base de données
   */
  static async deleteExtensionFromDatabase(extensionId) {
    try {
      const userId = await this.getCurrentUserId()

      const { error } = await supabase
        .from('series_database')
        .delete()
        .eq('id', extensionId)
        .eq('user_id', userId)

      if (error) throw error

      console.log(`🗑️ Extension supprimée: ${extensionId}`)
      return true
    } catch (error) {
      console.error('❌ Erreur deleteExtensionFromDatabase:', error)
      return false
    }
  }

  /**
   * Supprimer complètement une extension (extension + cartes)
   */
  static async deleteCompleteExtension(extensionId) {
    try {
      const deletedCardsCount = await this.deleteCardsFromExtension(extensionId)
      const extensionDeleted = await this.deleteExtensionFromDatabase(extensionId)
      await this.deleteCustomExtension(extensionId)

      console.log(`🗑️ Extension complète supprimée: ${extensionId} (${deletedCardsCount} cartes)`)
      return { extensionDeleted, deletedCardsCount }
    } catch (error) {
      console.error('❌ Erreur deleteCompleteExtension:', error)
      return { extensionDeleted: false, deletedCardsCount: 0 }
    }
  }

  /**
   * Supprimer un bloc complet (toutes ses extensions et cartes)
   */
  static async deleteCompleteBlock(blockName, extensions = []) {
    try {
      let totalDeletedCards = 0
      let deletedExtensions = 0

      for (const extension of extensions) {
        const result = await this.deleteCompleteExtension(extension.id)
        if (result.extensionDeleted) {
          deletedExtensions++
          totalDeletedCards += result.deletedCardsCount
        }
      }

      const customBlockId = blockName.replace(/\s+/g, '-').toLowerCase()
      await this.deleteCustomBlock(customBlockId)

      console.log(`🗑️ Bloc complet supprimé: ${blockName} (${deletedExtensions} extensions, ${totalDeletedCards} cartes)`)
      return { deletedExtensions, totalDeletedCards }
    } catch (error) {
      console.error('❌ Erreur deleteCompleteBlock:', error)
      return { deletedExtensions: 0, totalDeletedCards: 0 }
    }
  }

  // ============================================================================
  // STATISTIQUES
  // ============================================================================

  /**
   * Obtenir les statistiques de stockage
   */
  static async getStorageStats() {
    try {
      const userId = await this.getCurrentUserId()

      const [cardsResult, seriesResult] = await Promise.all([
        supabase.from('discovered_cards').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('series_database').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      ])

      return {
        cards: cardsResult.count || 0,
        series: seriesResult.count || 0,
        unlimited: true,
        storage: 'Supabase Cloud'
      }
    } catch (error) {
      console.error('❌ Erreur getStorageStats:', error)
      return { cards: 0, series: 0, unlimited: true, storage: 'Supabase Cloud' }
    }
  }

  /**
   * Nettoyer toutes les données de l'utilisateur
   */
  static async clearAllData() {
    try {
      const userId = await this.getCurrentUserId()

      await Promise.all([
        supabase.from('discovered_cards').delete().eq('user_id', userId),
        supabase.from('series_database').delete().eq('user_id', userId),
        supabase.from('custom_blocks').delete().eq('user_id', userId),
        supabase.from('custom_extensions').delete().eq('user_id', userId)
      ])

      console.log('🗑️ Toutes les données Supabase supprimées')
      return true
    } catch (error) {
      console.error('❌ Erreur clearAllData:', error)
      return false
    }
  }
}
