/**
 * Service de sauvegarde et restauration de la base de données
 * Permet de créer des backups complets de toutes les données Supabase
 */

import { SupabaseService } from './SupabaseService'
import { supabase } from '@/lib/supabaseClient'

export class DatabaseBackupService {
  /**
   * Créer un backup complet de toutes les tables utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Objet contenant toutes les données
   */
  static async createBackup(userId) {
    try {
      console.log('📦 Création du backup pour utilisateur:', userId)

      const backup = {
        metadata: {
          version: '1.0',
          created_at: new Date().toISOString(),
          user_id: userId,
          app_version: '2.0'
        },
        data: {}
      }

      // 1. Cartes découvertes (base commune - TOUTES les cartes)
      console.log('📥 Backup discovered_cards...')
      const { data: discoveredCards, error: cardsError } = await supabase
        .from('discovered_cards')
        .select('*')

      if (cardsError) throw cardsError
      backup.data.discovered_cards = discoveredCards
      console.log(`✅ ${discoveredCards?.length || 0} cartes découvertes`)

      // 2. Collection personnelle
      console.log('📥 Backup user_collection...')
      const { data: collection, error: collectionError } = await supabase
        .from('user_collection')
        .select('*')
        .eq('user_id', userId)

      if (collectionError) throw collectionError
      backup.data.user_collection = collection
      console.log(`✅ ${collection?.length || 0} cartes en collection`)

      // 3. Favoris
      console.log('📥 Backup user_favorites...')
      const { data: favorites, error: favError } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId)

      if (favError) throw favError
      backup.data.user_favorites = favorites
      console.log(`✅ ${favorites?.length || 0} favoris`)

      // 4. Wishlist
      console.log('📥 Backup user_wishlist...')
      const { data: wishlist, error: wishError } = await supabase
        .from('user_wishlist')
        .select('*')
        .eq('user_id', userId)

      if (wishError) throw wishError
      backup.data.user_wishlist = wishlist
      console.log(`✅ ${wishlist?.length || 0} items wishlist`)

      // 5. Produits scellés
      console.log('📥 Backup user_sealed_products...')
      const { data: sealed, error: sealedError } = await supabase
        .from('user_sealed_products')
        .select('*')
        .eq('user_id', userId)

      if (sealedError) throw sealedError
      backup.data.user_sealed_products = sealed
      console.log(`✅ ${sealed?.length || 0} produits scellés`)

      // 6. Ventes
      console.log('📥 Backup sales...')
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', userId)

      if (salesError) throw salesError
      backup.data.sales = sales
      console.log(`✅ ${sales?.length || 0} ventes`)

      // 7. Lots de doublons
      console.log('📥 Backup duplicate_lots...')
      const { data: duplicates, error: dupError } = await supabase
        .from('duplicate_lots')
        .select('*')
        .eq('user_id', userId)

      if (dupError) throw dupError
      backup.data.duplicate_lots = duplicates
      console.log(`✅ ${duplicates?.length || 0} lots de doublons`)

      // 8. Matchings CardMarket
      console.log('📥 Backup user_cardmarket_matches...')
      const { data: matches, error: matchError } = await supabase
        .from('user_cardmarket_matches')
        .select('*')
        .eq('user_id', userId)

      if (matchError) throw matchError
      backup.data.user_cardmarket_matches = matches
      console.log(`✅ ${matches?.length || 0} matchings CardMarket`)

      // 9. Extensions découvertes
      console.log('📥 Backup discovered_sets...')
      const { data: sets, error: setsError } = await supabase
        .from('discovered_sets')
        .select('*')

      if (setsError) throw setsError
      backup.data.discovered_sets = sets
      console.log(`✅ ${sets?.length || 0} extensions découvertes`)

      console.log('✅ Backup créé avec succès')
      return backup

    } catch (error) {
      console.error('❌ Erreur création backup:', error)
      throw error
    }
  }

  /**
   * Télécharger le backup sous forme de fichier JSON
   * @param {Object} backup - Données du backup
   * @param {string} filename - Nom du fichier (optionnel)
   */
  static downloadBackup(backup, filename = null) {
    const defaultFilename = `vaultestim-backup-${new Date().toISOString().split('T')[0]}.json`
    const finalFilename = filename || defaultFilename

    const dataStr = JSON.stringify(backup, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = finalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log(`💾 Backup téléchargé: ${finalFilename}`)
  }

  /**
   * Restaurer un backup depuis un fichier JSON
   * @param {File} file - Fichier JSON du backup
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} onProgress - Callback pour le progrès (optionnel)
   * @returns {Promise<Object>} Résultat de la restauration
   */
  static async restoreBackup(file, userId, onProgress = null) {
    try {
      console.log('📥 Lecture du fichier backup...')

      // Lire le fichier JSON
      const text = await file.text()
      const backup = JSON.parse(text)

      // Vérifier la version
      if (!backup.metadata || !backup.data) {
        throw new Error('Format de backup invalide')
      }

      console.log('✅ Backup valide, version:', backup.metadata.version)
      console.log('📅 Créé le:', backup.metadata.created_at)

      const results = {
        discovered_cards: 0,
        user_collection: 0,
        user_favorites: 0,
        user_wishlist: 0,
        user_sealed_products: 0,
        sales: 0,
        duplicate_lots: 0,
        user_cardmarket_matches: 0,
        discovered_sets: 0,
        errors: []
      }

      let progress = 0
      const totalSteps = 9

      // 1. Restaurer discovered_cards (base commune)
      if (backup.data.discovered_cards?.length > 0) {
        console.log(`📥 Restauration de ${backup.data.discovered_cards.length} cartes découvertes...`)
        try {
          const { error } = await supabase
            .from('discovered_cards')
            .upsert(backup.data.discovered_cards, { onConflict: 'id' })

          if (error) throw error
          results.discovered_cards = backup.data.discovered_cards.length
          console.log(`✅ ${results.discovered_cards} cartes découvertes restaurées`)
        } catch (error) {
          console.error('❌ Erreur discovered_cards:', error)
          results.errors.push({ table: 'discovered_cards', error: error.message })
        }
      }
      progress++
      onProgress?.(Math.round((progress / totalSteps) * 100))

      // 2. Restaurer user_collection
      if (backup.data.user_collection?.length > 0) {
        console.log(`📥 Restauration de ${backup.data.user_collection.length} cartes collection...`)
        try {
          // Remplacer l'user_id par celui de l'utilisateur actuel
          const collectionData = backup.data.user_collection.map(item => ({
            ...item,
            user_id: userId
          }))

          const { error } = await supabase
            .from('user_collection')
            .upsert(collectionData, { onConflict: 'id' })

          if (error) throw error
          results.user_collection = collectionData.length
          console.log(`✅ ${results.user_collection} cartes collection restaurées`)
        } catch (error) {
          console.error('❌ Erreur user_collection:', error)
          results.errors.push({ table: 'user_collection', error: error.message })
        }
      }
      progress++
      onProgress?.(Math.round((progress / totalSteps) * 100))

      // 3. Restaurer user_favorites
      if (backup.data.user_favorites?.length > 0) {
        console.log(`📥 Restauration de ${backup.data.user_favorites.length} favoris...`)
        try {
          const favData = backup.data.user_favorites.map(item => ({
            ...item,
            user_id: userId
          }))

          const { error } = await supabase
            .from('user_favorites')
            .upsert(favData, { onConflict: 'id' })

          if (error) throw error
          results.user_favorites = favData.length
          console.log(`✅ ${results.user_favorites} favoris restaurés`)
        } catch (error) {
          console.error('❌ Erreur user_favorites:', error)
          results.errors.push({ table: 'user_favorites', error: error.message })
        }
      }
      progress++
      onProgress?.(Math.round((progress / totalSteps) * 100))

      // 4. Restaurer user_wishlist
      if (backup.data.user_wishlist?.length > 0) {
        console.log(`📥 Restauration de ${backup.data.user_wishlist.length} items wishlist...`)
        try {
          const wishData = backup.data.user_wishlist.map(item => ({
            ...item,
            user_id: userId
          }))

          const { error } = await supabase
            .from('user_wishlist')
            .upsert(wishData, { onConflict: 'id' })

          if (error) throw error
          results.user_wishlist = wishData.length
          console.log(`✅ ${results.user_wishlist} items wishlist restaurés`)
        } catch (error) {
          console.error('❌ Erreur user_wishlist:', error)
          results.errors.push({ table: 'user_wishlist', error: error.message })
        }
      }
      progress++
      onProgress?.(Math.round((progress / totalSteps) * 100))

      // 5. Restaurer sealed_products
      if (backup.data.user_sealed_products?.length > 0) {
        console.log(`📥 Restauration de ${backup.data.user_sealed_products.length} produits scellés...`)
        try {
          const sealedData = backup.data.user_sealed_products.map(item => ({
            ...item,
            user_id: userId
          }))

          const { error } = await supabase
            .from('user_sealed_products')
            .upsert(sealedData, { onConflict: 'id' })

          if (error) throw error
          results.user_sealed_products = sealedData.length
          console.log(`✅ ${results.user_sealed_products} produits scellés restaurés`)
        } catch (error) {
          console.error('❌ Erreur user_sealed_products:', error)
          results.errors.push({ table: 'user_sealed_products', error: error.message })
        }
      }
      progress++
      onProgress?.(Math.round((progress / totalSteps) * 100))

      // 6. Restaurer sales
      if (backup.data.sales?.length > 0) {
        console.log(`📥 Restauration de ${backup.data.sales.length} ventes...`)
        try {
          const salesData = backup.data.sales.map(item => ({
            ...item,
            user_id: userId
          }))

          const { error } = await supabase
            .from('sales')
            .upsert(salesData, { onConflict: 'id' })

          if (error) throw error
          results.sales = salesData.length
          console.log(`✅ ${results.sales} ventes restaurées`)
        } catch (error) {
          console.error('❌ Erreur sales:', error)
          results.errors.push({ table: 'sales', error: error.message })
        }
      }
      progress++
      onProgress?.(Math.round((progress / totalSteps) * 100))

      // 7. Restaurer duplicate_lots
      if (backup.data.duplicate_lots?.length > 0) {
        console.log(`📥 Restauration de ${backup.data.duplicate_lots.length} lots doublons...`)
        try {
          const dupData = backup.data.duplicate_lots.map(item => ({
            ...item,
            user_id: userId
          }))

          const { error } = await supabase
            .from('duplicate_lots')
            .upsert(dupData, { onConflict: 'id' })

          if (error) throw error
          results.duplicate_lots = dupData.length
          console.log(`✅ ${results.duplicate_lots} lots doublons restaurés`)
        } catch (error) {
          console.error('❌ Erreur duplicate_lots:', error)
          results.errors.push({ table: 'duplicate_lots', error: error.message })
        }
      }
      progress++
      onProgress?.(Math.round((progress / totalSteps) * 100))

      // 8. Restaurer user_cardmarket_matches
      if (backup.data.user_cardmarket_matches?.length > 0) {
        console.log(`📥 Restauration de ${backup.data.user_cardmarket_matches.length} matchings CardMarket...`)
        try {
          const matchData = backup.data.user_cardmarket_matches.map(item => ({
            ...item,
            user_id: userId
          }))

          const { error } = await supabase
            .from('user_cardmarket_matches')
            .upsert(matchData, { onConflict: 'id' })

          if (error) throw error
          results.user_cardmarket_matches = matchData.length
          console.log(`✅ ${results.user_cardmarket_matches} matchings CardMarket restaurés`)
        } catch (error) {
          console.error('❌ Erreur user_cardmarket_matches:', error)
          results.errors.push({ table: 'user_cardmarket_matches', error: error.message })
        }
      }
      progress++
      onProgress?.(Math.round((progress / totalSteps) * 100))

      // 9. Restaurer discovered_sets
      if (backup.data.discovered_sets?.length > 0) {
        console.log(`📥 Restauration de ${backup.data.discovered_sets.length} extensions...`)
        try {
          const { error } = await supabase
            .from('discovered_sets')
            .upsert(backup.data.discovered_sets, { onConflict: 'id' })

          if (error) throw error
          results.discovered_sets = backup.data.discovered_sets.length
          console.log(`✅ ${results.discovered_sets} extensions restaurées`)
        } catch (error) {
          console.error('❌ Erreur discovered_sets:', error)
          results.errors.push({ table: 'discovered_sets', error: error.message })
        }
      }
      progress++
      onProgress?.(Math.round((progress / totalSteps) * 100))

      console.log('✅ Restauration terminée')
      console.log('📊 Résultats:', results)

      return results

    } catch (error) {
      console.error('❌ Erreur restauration backup:', error)
      throw error
    }
  }

  /**
   * Obtenir des statistiques sur un backup sans le restaurer
   * @param {File} file - Fichier JSON du backup
   * @returns {Promise<Object>} Statistiques du backup
   */
  static async getBackupStats(file) {
    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      if (!backup.metadata || !backup.data) {
        throw new Error('Format de backup invalide')
      }

      return {
        version: backup.metadata.version,
        created_at: backup.metadata.created_at,
        user_id: backup.metadata.user_id,
        tables: {
          discovered_cards: backup.data.discovered_cards?.length || 0,
          user_collection: backup.data.user_collection?.length || 0,
          user_favorites: backup.data.user_favorites?.length || 0,
          user_wishlist: backup.data.user_wishlist?.length || 0,
          user_sealed_products: backup.data.user_sealed_products?.length || 0,
          sales: backup.data.sales?.length || 0,
          duplicate_lots: backup.data.duplicate_lots?.length || 0,
          user_cardmarket_matches: backup.data.user_cardmarket_matches?.length || 0,
          discovered_sets: backup.data.discovered_sets?.length || 0
        }
      }
    } catch (error) {
      console.error('❌ Erreur lecture stats backup:', error)
      throw error
    }
  }
}
