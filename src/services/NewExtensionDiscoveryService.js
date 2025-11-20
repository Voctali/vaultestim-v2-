/**
 * Service de découverte automatique des nouvelles extensions
 *
 * Ce service interroge l'API Pokemon TCG pour détecter les extensions
 * qui ne sont pas encore dans la base de données et les importer automatiquement.
 */

import SetImportService from './SetImportService'
import { SupabaseService } from './SupabaseService'
import { RapidAPIService } from './RapidAPIService'
import { PokemonTCGAPIService } from './PokemonTCGAPIService'

// Fonction helper pour obtenir le client Supabase de manière sûre
const getSupabaseClient = async () => {
  const { supabase } = await import('@/lib/supabaseClient')
  return supabase
}

// Mapping des codes CardMarket vers les IDs Pokemon TCG API
// Source: https://pokemontcg.io/sets
const CARDMARKET_TO_TCGAPI = {
  // Scarlet & Violet
  'SV9': 'sv9',
  'SV8': 'sv8',
  'SV8a': 'sv8pt5',
  'SV7': 'sv7',
  'SV6': 'sv6',
  'SV6a': 'sv6pt5',
  'SV5': 'sv5',
  'SV4': 'sv4',
  'SV4a': 'sv4pt5',
  'SV3': 'sv3',
  'SV3a': 'sv3pt5',
  'SV2': 'sv2',
  'SV2a': 'sv2pt5',
  'SV1': 'sv1',
  'MEW': 'sv3pt5',
  'PAL': 'sv2',
  'OBF': 'sv3',
  'PAF': 'sv4pt5',
  'TEF': 'sv5',
  'TWM': 'sv6',
  'SFA': 'sv6pt5',
  'SCR': 'sv7',
  'SSP': 'sv8',
  'PRE': 'sv8pt5',
  // Sword & Shield
  'SWSH1': 'swsh1',
  'SWSH2': 'swsh2',
  'SWSH3': 'swsh3',
  'SWSH4': 'swsh4',
  'SWSH5': 'swsh5',
  'SWSH6': 'swsh6',
  'SWSH7': 'swsh7',
  'SWSH8': 'swsh8',
  'SWSH9': 'swsh9',
  'SWSH10': 'swsh10',
  'SWSH11': 'swsh11',
  'SWSH12': 'swsh12',
  'SWSH12.5': 'swsh12pt5',
  // Sun & Moon
  'SM1': 'sm1',
  'SM2': 'sm2',
  'SM3': 'sm3',
  'SM4': 'sm4',
  'SM5': 'sm5',
  'SM6': 'sm6',
  'SM7': 'sm7',
  'SM8': 'sm8',
  'SM9': 'sm9',
  'SM10': 'sm10',
  'SM11': 'sm11',
  'SM12': 'sm12',
  // XY
  'XY1': 'xy1',
  'XY2': 'xy2',
  'XY3': 'xy3',
  'XY4': 'xy4',
  'XY5': 'xy5',
  'XY6': 'xy6',
  'XY7': 'xy7',
  'XY8': 'xy8',
  'XY9': 'xy9',
  'XY10': 'xy10',
  'XY11': 'xy11',
  'XY12': 'xy12',
  // Black & White
  'BW1': 'bw1',
  'BW2': 'bw2',
  'BW3': 'bw3',
  'BW4': 'bw4',
  'BW5': 'bw5',
  'BW6': 'bw6',
  'BW7': 'bw7',
  'BW8': 'bw8',
  'BW9': 'bw9',
  'BW10': 'bw10',
  'BW11': 'bw11',
}

const STORAGE_KEY = 'vaultestim_last_extension_check'
const CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24 heures

class NewExtensionDiscoveryService {
  /**
   * Découvrir les nouvelles extensions disponibles sur l'API
   * Compare avec les extensions déjà importées dans Supabase
   *
   * @param {Function} onProgress - Callback pour suivre la progression
   * @returns {Promise<Object>} Résultat avec nouvelles extensions trouvées
   */
  static async discoverNewExtensions(onProgress = null) {
    console.log('🔍 Recherche de nouvelles extensions...')

    try {
      // 1. Récupérer toutes les extensions depuis l'API (RapidAPI en priorité)
      if (onProgress) onProgress({ status: 'loading_api', message: 'Chargement des extensions depuis l\'API...' })

      let apiSets = []
      let source = 'unknown'

      // Essayer RapidAPI d'abord (plus rapide et fiable)
      if (RapidAPIService.isAvailable()) {
        try {
          console.log('📡 Tentative via RapidAPI...')
          const allExpansions = []
          let page = 1
          let hasMore = true

          // Pagination pour récupérer toutes les extensions
          while (hasMore) {
            const result = await RapidAPIService.getExpansions({ page, limit: 100 })
            if (result.data && result.data.length > 0) {
              allExpansions.push(...result.data)
              hasMore = result.paging && page < result.paging.total
              page++
            } else {
              hasMore = false
            }
          }

          // Transformer le format RapidAPI et mapper les codes vers Pokemon TCG API IDs
          apiSets = allExpansions.map(exp => {
            const cardmarketCode = exp.code || exp.slug
            // Convertir le code CardMarket en ID Pokemon TCG API
            const tcgApiId = CARDMARKET_TO_TCGAPI[cardmarketCode] || cardmarketCode.toLowerCase()

            return {
              id: tcgApiId,
              slug: exp.slug || cardmarketCode.toLowerCase(), // AJOUT: garder le slug pour l'import
              cardmarketCode: cardmarketCode, // Garder le code original pour référence
              name: exp.name,
              series: exp.series || 'Unknown',
              releaseDate: exp.release_date || null,
              total: exp.card_count || 0,
              images: {
                logo: exp.logo || null,
                symbol: exp.symbol || null
              }
            }
          })

          source = 'RapidAPI'
          console.log(`✅ RapidAPI: ${apiSets.length} extensions récupérées`)
        } catch (rapidError) {
          console.warn('⚠️ RapidAPI échoué, fallback sur Pokemon TCG API:', rapidError.message)
        }
      }

      // Fallback sur Pokemon TCG API si RapidAPI a échoué
      if (apiSets.length === 0) {
        try {
          console.log('📡 Fallback via Pokemon TCG API...')
          const result = await PokemonTCGAPIService.getAllSets()
          apiSets = result.data || []
          source = 'Pokemon TCG API'
          console.log(`✅ Pokemon TCG API: ${apiSets.length} extensions récupérées`)
        } catch (tcgError) {
          throw new Error(`Impossible de récupérer les extensions. RapidAPI et Pokemon TCG API sont indisponibles. Détail: ${tcgError.message}`)
        }
      }

      console.log(`📡 ${apiSets.length} extensions trouvées via ${source}`)

      // 2. Récupérer les extensions déjà importées (via les cartes découvertes)
      if (onProgress) onProgress({ status: 'loading_db', message: 'Chargement des extensions existantes...' })

      const existingSetIds = await this.getExistingSetIds()
      console.log(`💾 ${existingSetIds.size} extensions déjà dans la base`)

      // 3. Identifier les extensions manquantes
      const newSets = apiSets.filter(set => !existingSetIds.has(set.id))

      // Trier par date de sortie (plus récentes en premier)
      newSets.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))

      console.log(`🆕 ${newSets.length} nouvelles extensions détectées`)

      // 4. Sauvegarder la date de dernière vérification
      localStorage.setItem(STORAGE_KEY, Date.now().toString())

      return {
        totalApiSets: apiSets.length,
        existingSets: existingSetIds.size,
        newSets: newSets,
        newSetsCount: newSets.length
      }
    } catch (error) {
      console.error('❌ Erreur lors de la découverte des extensions:', error)
      throw error
    }
  }

  /**
   * Récupérer les IDs des extensions déjà présentes dans discovered_cards
   * @returns {Promise<Set<string>>} Set des IDs d'extensions existantes
   */
  static async getExistingSetIds() {
    try {
      // Obtenir le client Supabase de manière sûre (évite les problèmes d'import circulaire)
      const supabase = await getSupabaseClient()

      // Requête optimisée pour récupérer uniquement les set_id distincts
      const { data, error } = await supabase
        .from('discovered_cards')
        .select('set_id')

      if (error) {
        console.error('❌ Erreur Supabase:', error)
        throw error
      }

      // Créer un Set des IDs uniques
      const setIds = new Set(data.map(card => card.set_id).filter(Boolean))
      return setIds
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des extensions existantes:', error)
      throw error
    }
  }

  /**
   * Importer une extension spécifique avec toutes ses cartes
   *
   * @param {Object} extension - Objet extension avec id, slug, name, total
   * @param {Function} onProgress - Callback de progression
   * @param {Function} addDiscoveredCards - Fonction du context pour ajouter les cartes
   * @returns {Promise<Object>} Résultat de l'import
   */
  static async importExtension(extension, onProgress = null, addDiscoveredCards = null) {
    const setId = extension.id || extension
    const setName = extension.name || setId
    const slug = extension.slug || setId.toLowerCase()
    const total = extension.total || 0

    console.log(`📦 Import de l'extension ${setName} (slug: ${slug})...`)

    try {
      let cards = []

      // Utiliser RapidAPI avec importAllCardsByExpansion (pagination complète)
      if (RapidAPIService.isAvailable()) {
        console.log(`📡 Import via RapidAPI (pagination complète)...`)

        try {
          // Utiliser la méthode dédiée qui gère correctement la pagination avec episode_id
          cards = await RapidAPIService.importAllCardsByExpansion(slug, (progressData) => {
            if (onProgress) {
              onProgress({
                status: 'importing',
                setId,
                setName: progressData.setName || setName,
                current: progressData.count,
                total: progressData.total || total,
                page: progressData.page
              })
            }
          })

          console.log(`✅ RapidAPI: ${cards.length} cartes récupérées pour ${setName}`)
        } catch (rapidError) {
          console.warn(`⚠️ RapidAPI échoué pour ${setName}:`, rapidError.message)
          cards = [] // Réinitialiser pour fallback
        }
      }

      // Fallback sur Pokemon TCG API si RapidAPI n'a pas trouvé assez de cartes
      if (cards.length === 0 || (total > 0 && cards.length < total * 0.5)) {
        console.log(`📡 Fallback import via Pokemon TCG API (setId: ${setId})...`)
        try {
          const tcgCards = await PokemonTCGAPIService.getCardsBySet(setId, (progress) => {
            if (onProgress) {
              onProgress({
                status: 'importing',
                setId,
                setName: progress.setName || setName,
                current: progress.current,
                total: progress.total,
                page: progress.page
              })
            }
          })
          if (tcgCards.length > cards.length) {
            cards = tcgCards
            console.log(`✅ Pokemon TCG API: ${cards.length} cartes récupérées pour ${setName}`)
          }
        } catch (tcgError) {
          console.warn(`⚠️ Pokemon TCG API fallback échoué: ${tcgError.message}`)
        }
      }

      if (cards.length === 0) {
        return { success: false, setId, error: 'Aucune carte trouvée pour cette extension' }
      }

      // Dédupliquer les cartes par ID (évite l'erreur Supabase "cannot affect row a second time")
      const seenIds = new Set()
      const uniqueCards = cards.filter(card => {
        if (seenIds.has(card.id)) {
          return false
        }
        seenIds.add(card.id)
        return true
      })

      if (uniqueCards.length < cards.length) {
        console.log(`⚠️ ${cards.length - uniqueCards.length} doublons supprimés, ${uniqueCards.length} cartes uniques`)
      }

      // Ajouter les cartes via le context si fourni
      if (addDiscoveredCards) {
        await addDiscoveredCards(uniqueCards)
        console.log(`✅ ${uniqueCards.length} cartes ajoutées à la base via context`)
      } else {
        // Sinon, sauvegarder directement dans Supabase
        await SupabaseService.addDiscoveredCards(uniqueCards)
        console.log(`✅ ${uniqueCards.length} cartes sauvegardées dans Supabase`)
      }

      return {
        success: true,
        setId,
        setName,
        cardsImported: uniqueCards.length
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'import de ${setId}:`, error)
      return {
        success: false,
        setId,
        error: error.message
      }
    }
  }


  /**
   * Importer plusieurs extensions en séquence
   *
   * @param {Array<Object>} extensions - Liste des objets extensions à importer
   * @param {Function} onProgress - Callback de progression
   * @param {Function} addDiscoveredCards - Fonction du context
   * @returns {Promise<Object>} Résultat global
   */
  static async importMultipleExtensions(extensions, onProgress = null, addDiscoveredCards = null) {
    const results = {
      total: extensions.length,
      success: 0,
      failed: 0,
      totalCards: 0,
      details: []
    }

    for (let i = 0; i < extensions.length; i++) {
      const extension = extensions[i]
      const setId = extension.id || extension

      if (onProgress) {
        onProgress({
          status: 'batch_progress',
          current: i + 1,
          total: extensions.length,
          setId,
          setName: extension.name || setId
        })
      }

      const result = await this.importExtension(extension, onProgress, addDiscoveredCards)
      results.details.push(result)

      if (result.success) {
        results.success++
        results.totalCards += result.cardsImported
      } else {
        results.failed++
      }

      // Pause entre les imports pour éviter le rate limiting
      if (i < extensions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log(`🎉 Import terminé: ${results.success}/${results.total} extensions, ${results.totalCards} cartes`)
    return results
  }

  /**
   * Vérifier si une vérification automatique est nécessaire
   * @returns {boolean}
   */
  static shouldCheckForNewExtensions() {
    const lastCheck = localStorage.getItem(STORAGE_KEY)
    if (!lastCheck) return true

    const lastCheckTime = parseInt(lastCheck, 10)
    return Date.now() - lastCheckTime > CHECK_INTERVAL
  }

  /**
   * Rechercher une extension spécifique par nom ou ID
   *
   * @param {string} query - Terme de recherche
   * @returns {Promise<Array>} Extensions correspondantes
   */
  static async searchExtension(query) {
    try {
      const allSets = await SetImportService.getAllSets()
      const queryLower = query.toLowerCase()

      return allSets.filter(set =>
        set.id.toLowerCase().includes(queryLower) ||
        set.name.toLowerCase().includes(queryLower) ||
        (set.series && set.series.toLowerCase().includes(queryLower))
      )
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error)
      throw error
    }
  }

  /**
   * Obtenir les statistiques de couverture
   * @returns {Promise<Object>}
   */
  static async getCoverageStats() {
    const apiSets = await SetImportService.getAllSets()
    const existingSetIds = await this.getExistingSetIds()

    // Grouper par série
    const seriesStats = {}

    for (const set of apiSets) {
      const series = set.series || 'Autres'
      if (!seriesStats[series]) {
        seriesStats[series] = { total: 0, imported: 0, sets: [] }
      }
      seriesStats[series].total++
      seriesStats[series].sets.push({
        id: set.id,
        name: set.name,
        imported: existingSetIds.has(set.id),
        releaseDate: set.releaseDate,
        totalCards: set.total
      })
      if (existingSetIds.has(set.id)) {
        seriesStats[series].imported++
      }
    }

    return {
      totalApiSets: apiSets.length,
      totalImported: existingSetIds.size,
      coverage: Math.round((existingSetIds.size / apiSets.length) * 100),
      bySeries: seriesStats
    }
  }
}

export default NewExtensionDiscoveryService
