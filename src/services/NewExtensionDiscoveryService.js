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

// Mapping des codes PTCGO (utilisés par les utilisateurs) vers les IDs de l'API Pokemon TCG
// Ces codes sont parfois différents des vrais IDs de l'API
const PTCGO_TO_API_ID_MAPPING = {
  'crz': 'swsh12pt5',           // Crown Zenith
  'crzgg': 'swsh12pt5gg',       // Crown Zenith Galarian Gallery
  'gg': 'swsh12pt5gg',          // Galarian Gallery (alias)
  // Ajouter d'autres mappings ici si nécessaire
}

/**
 * Normaliser un ID d'extension (convertir code PTCGO → ID API si nécessaire)
 * @param {string} setId - ID potentiel (code PTCGO ou ID API)
 * @returns {string} ID normalisé pour l'API
 */
function normalizeSetId(setId) {
  if (!setId) return setId

  const lowercaseId = setId.toLowerCase()

  // Si c'est un code PTCGO connu, le convertir
  if (PTCGO_TO_API_ID_MAPPING[lowercaseId]) {
    const normalizedId = PTCGO_TO_API_ID_MAPPING[lowercaseId]
    console.log(`🔄 Normalisation: "${setId}" → "${normalizedId}"`)
    return normalizedId
  }

  // Sinon, retourner l'ID tel quel
  return setId
}

// Mapping des codes CardMarket vers episodeId RapidAPI
// Généré automatiquement le 20/11/2025 18:40:17
// Total: 165 extensions

export const CARDMARKET_EPISODE_ID_MAPPING = {
  // OTHER Series
  'SV': 113, // Supreme Victors
  'SVE': 20, // Scarlet & Violet Energies
  'SVI': 19, // Scarlet & Violet
  'XY': 87, // XY
  'AOR': 79, // Ancient Origins
  'AQ': 155, // Aquapolis
  'AR': 112, // Arceus
  'ASR': 31, // Astral Radiance Trainer Gallery
  'B2': 167, // Base Set 2
  'BCR': 94, // Boundaries Crossed
  'BKP': 76, // BREAKpoint
  'BKT': 78, // BREAKthrough
  'BLK': 223, // Black Bolt
  'BLW': 103, // Black & White
  'BP': 156, // Best of Game
  'BRS': 33, // Brilliant Stars Trainer Gallery
  'BS': 171, // Base
  'BST': 39, // Battle Styles
  'BUS': 67, // Burning Shadows
  'CEC': 50, // Cosmic Eclipse
  'CEL': 36, // Celebrations: Classic Collection
  'CES': 61, // Celestial Storm
  'CG': 131, // Crystal Guardians
  'CIN': 65, // Crimson Invasion
  'CL': 105, // Call of Legends
  'CPA': 44, // Champion's Path
  'CRE': 38, // Chilling Reign
  'CRZ': 22, // Crown Zenith Galarian Gallery
  'DAA': 46, // Darkness Ablaze
  'DCR': 81, // Double Crisis
  'DET': 56, // Detective Pikachu
  'DEX': 98, // Dark Explorers
  'DF': 130, // Dragon Frontiers
  'DP': 126, // Diamond & Pearl
  'DR': 150, // Dragon
  'DRI': 221, // Destined Rivals
  'DRM': 60, // Dragon Majesty
  'DRV': 95, // Dragon Vault
  'DRX': 96, // Dragons Exalted
  'DS': 138, // Delta Species
  'DX': 142, // Deoxys
  'EM': 141, // Emerald
  'EPO': 101, // Emerging Powers
  'EVO': 71, // Evolutions
  'EVS': 37, // Evolving Skies
  'EX': 157, // Expedition Base Set
  'EX-TRAINER-KIT-2-MINUN': 136, // EX Trainer Kit 2 Minun
  'EX-TRAINER-KIT-2-PLUSLE': 135, // EX Trainer Kit 2 Plusle
  'EX-TRAINER-KIT-LATIAS': 147, // EX Trainer Kit Latias
  'EX-TRAINER-KIT-LATIOS': 148, // EX Trainer Kit Latios
  'FCO': 74, // Fates Collide
  'FFI': 84, // Furious Fists
  'FLF': 86, // Flashfire
  'FLI': 62, // Forbidden Light
  'FO': 168, // Fossil
  'FST': 34, // Fusion Strike
  'FUT20': 45, // Pokémon Futsal Collection
  'G1': 165, // Gym Heroes
  'G2': 164, // Gym Challenge
  'GE': 122, // Great Encounters
  'GEN': 75, // Generations
  'GRI': 68, // Guardians Rising
  'HIDDEN-FATES-SHINY-VAULT': 53, // Hidden Fates Shiny Vault
  'HIF': 52, // Hidden Fates
  'HL': 146, // Hidden Legends
  'HP': 133, // Holon Phantoms
  'HS': 109, // HeartGold & SoulSilver
  'JTG': 220, // Journey Together
  'JU': 170, // Jungle
  'KSS': 88, // Kalos Starter Set
  'LA': 119, // Legends Awakened
  'LC': 158, // Legendary Collection
  'LM': 137, // Legend Maker
  'LOR': 27, // Lost Origin Trainer Gallery
  'LOT': 58, // Lost Thunder
  'LTR': 89, // Legendary Treasures
  'MA': 149, // Team Magma vs Team Aqua
  'MCDONALDS-COLLECTION-2011': 102, // McDonald's Collection 2011
  'MCDONALDS-COLLECTION-2012': 97, // McDonald's Collection 2012
  'MCDONALDS-COLLECTION-2014': 85, // McDonald's Collection 2014
  'MCDONALDS-COLLECTION-2015': 77, // McDonald's Collection 2015
  'MCDONALDS-COLLECTION-2016': 72, // McDonald's Collection 2016
  'MCDONALDS-COLLECTION-2017': 64, // McDonald's Collection 2017
  'MCDONALDS-COLLECTION-2018': 59, // McDonald's Collection 2018
  'MCDONALDS-COLLECTION-2019': 51, // McDonald's Collection 2019
  'MCDONALDS-COLLECTION-2021': 42, // McDonald's Collection 2021
  'MCDONALDS-COLLECTION-2022': 28, // McDonald's Collection 2022
  'MD': 120, // Majestic Dawn
  'MEG': 230, // Mega Evolution
  'MEW': 16, // 151
  'MT': 125, // Mysterious Treasures
  'N1': 163, // Neo Genesis
  'N2': 162, // Neo Discovery
  'N3': 160, // Neo Revelation
  'N4': 159, // Neo Destiny
  'NVI': 100, // Noble Victories
  'NXD': 99, // Next Destinies
  'OBF': 17, // Obsidian Flames
  'PAF': 14, // Paldean Fates
  'PAL': 18, // Paldea Evolved
  'PAR': 15, // Paradox Rift
  'PFL': 231, // Phantasmal Flames
  'PGO': 29, // Pokémon GO
  'PHF': 83, // Phantom Forces
  'PK': 129, // Power Keepers
  'PL': 116, // Platinum
  'PLB': 91, // Plasma Blast
  'PLF': 92, // Plasma Freeze
  'PLS': 93, // Plasma Storm
  'POKEMON': 226, // Pokémon
  'POKEMON-PRODUCTS': 225, // Pokémon products
  'POKEMON-RUMBLE': 111, // Pokémon Rumble
  'POP-SERIES-1': 145, // POP Series 1
  'POP-SERIES-2': 140, // POP Series 2
  'POP-SERIES-3': 134, // POP Series 3
  'POP-SERIES-4': 132, // POP Series 4
  'POP-SERIES-5': 128, // POP Series 5
  'POP-SERIES-6': 124, // POP Series 6
  'POP-SERIES-7': 121, // POP Series 7
  'POP-SERIES-8': 118, // POP Series 8
  'POP-SERIES-9': 115, // POP Series 9
  'PR': 169, // Wizards Black Star Promos
  'PR-BLW': 104, // BW Black Star Promos
  'PR-DPP': 127, // DP Black Star Promos
  'PR-HS': 110, // HGSS Black Star Promos
  'PR-NP': 151, // Nintendo Black Star Promos
  'PR-SM': 70, // SM Black Star Promos
  'PR-SV': 23, // SV Black Star Promos
  'PR-SW': 49, // SWSH Black Star Promos
  'PR-XY': 90, // XY Black Star Promos
  'PRC': 82, // Primal Clash
  'PRE': 212, // Prismatic Evolutions
  'RCL': 47, // Rebel Clash
  'RG': 144, // FireRed & LeafGreen
  'ROS': 80, // Roaring Skies
  'RR': 114, // Rising Rivals
  'RS': 153, // Ruby & Sapphire
  'SCR': 10, // Stellar Crown
  'SF': 117, // Stormfront
  'SFA': 11, // Shrouded Fable
  'SHF': 41, // Shining Fates Shiny Vault
  'SIT': 25, // Silver Tempest Trainer Gallery
  'SK': 154, // Skyridge
  'SLG': 66, // Shining Legends
  'SOUTHERN-ISLANDS': 161, // Southern Islands
  'SS': 152, // Sandstorm
  'SSH': 48, // Sword & Shield
  'SSP': 172, // Surging Sparks
  'STS': 73, // Steam Siege
  'SUM': 69, // Sun & Moon
  'SW': 123, // Secret Wonders
  'TEF': 13, // Temporal Forces
  'TEU': 57, // Team Up
  'TM': 106, // HS—Triumphant
  'TR': 166, // Team Rocket
  'TRR': 143, // Team Rocket Returns
  'TWM': 12, // Twilight Masquerade
  'UD': 107, // HS—Undaunted
  'UF': 139, // Unseen Forces
  'UL': 108, // HS—Unleashed
  'UNB': 55, // Unbroken Bonds
  'UNM': 54, // Unified Minds
  'UPR': 63, // Ultra Prism
  'VIV': 43, // Vivid Voltage
  'WHT': 224, // White Flare
}

// Fonction helper pour obtenir l'episodeId à partir du code CardMarket
export function getEpisodeIdFromCode(cardmarketCode) {
  return CARDMARKET_EPISODE_ID_MAPPING[cardmarketCode] || null
}

// Mapping des codes CardMarket vers les IDs Pokemon TCG API
// Source: https://pokemontcg.io/sets
// IMPORTANT: Utilisé par RapidAPIService pour garantir la compatibilité des IDs
export const CARDMARKET_TO_TCGAPI = {
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
  'SVI': 'sv1',  // Alias pour Scarlet & Violet base
  'SVE': 'sve',  // Scarlet & Violet Energies
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
  'CRZ': 'swsh12pt5',  // Crown Zenith (code CardMarket)
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

      // Vérifier quelles APIs sont disponibles
      const rapidApiAvailable = RapidAPIService.isAvailable()
      const pokemonTcgApiAvailable = PokemonTCGAPIService.isAvailable()

      console.log(`📊 APIs disponibles: RapidAPI=${rapidApiAvailable}, Pokemon TCG API=${pokemonTcgApiAvailable}`)

      // Essayer RapidAPI d'abord (plus rapide et fiable)
      if (rapidApiAvailable) {
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

            // Récupérer le bon episodeId depuis le mapping (fallback sur exp.id si non mappé)
            const episodeId = getEpisodeIdFromCode(cardmarketCode) || exp.id

            return {
              id: tcgApiId,
              episodeId: episodeId, // ID RapidAPI correct depuis le mapping
              slug: exp.slug || cardmarketCode.toLowerCase(),
              cardmarketCode: cardmarketCode, // Garder le code original pour référence
              name: exp.name,
              series: exp.series || 'Série inconnue',
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
      } else {
        console.log('⏭️ RapidAPI non disponible, utilisation directe de Pokemon TCG API')
      }

      // Fallback sur Pokemon TCG API si RapidAPI a échoué ou n'est pas disponible
      if (apiSets.length === 0) {
        if (!pokemonTcgApiAvailable) {
          throw new Error('Impossible de récupérer les extensions. Aucune API n\'est activée. Vérifiez VITE_USE_RAPIDAPI ou VITE_USE_POKEMON_TCG_API dans .env')
        }

        try {
          console.log('📡 Utilisation de Pokemon TCG API...')
          const result = await PokemonTCGAPIService.getAllSets()
          apiSets = result.data || []
          source = 'Pokemon TCG API'
          console.log(`✅ Pokemon TCG API: ${apiSets.length} extensions récupérées`)
        } catch (tcgError) {
          throw new Error(`Impossible de récupérer les extensions via Pokemon TCG API. Détail: ${tcgError.message}`)
        }
      }

      console.log(`📡 ${apiSets.length} extensions trouvées via ${source}`)

      // 2. Récupérer les extensions déjà importées (via les cartes découvertes)
      if (onProgress) onProgress({ status: 'loading_db', message: 'Chargement des extensions existantes...' })

      const existingSetIds = await this.getExistingSetIds()
      console.log(`💾 ${existingSetIds.size} extensions déjà dans la base`)

      // 3. Marquer les extensions avec leur statut d'import
      const allSetsWithStatus = apiSets.map(set => ({
        ...set,
        isImported: existingSetIds.has(set.id)
      }))

      // Séparer nouvelles et déjà importées pour les stats
      const newSets = allSetsWithStatus.filter(set => !set.isImported)
      const importedSets = allSetsWithStatus.filter(set => set.isImported)

      // Trier : nouvelles en premier (par date), puis déjà importées (par date)
      newSets.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
      importedSets.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))

      // Combiner : nouvelles extensions d'abord, puis déjà importées
      const allSets = [...newSets, ...importedSets]

      console.log(`🆕 ${newSets.length} nouvelles extensions détectées`)
      console.log(`✅ ${importedSets.length} extensions déjà importées`)

      // 4. Sauvegarder la date de dernière vérification
      localStorage.setItem(STORAGE_KEY, Date.now().toString())

      return {
        totalApiSets: apiSets.length,
        existingSets: existingSetIds.size,
        newSets: allSets, // CHANGEMENT: Maintenant contient TOUTES les extensions avec flag isImported
        newSetsCount: newSets.length,
        importedSetsCount: importedSets.length
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
    const rawSetId = extension.id || extension
    const setId = normalizeSetId(rawSetId) // Normaliser l'ID (PTCGO code → API ID)
    const setName = extension.name || setId
    const slug = extension.slug || setId.toLowerCase()
    const episodeId = extension.episodeId || null // ID RapidAPI si disponible
    const total = extension.total || 0

    console.log(`📦 Import de l'extension ${setName} (ID: ${setId}, slug: ${slug}, episodeId: ${episodeId})...`)

    try {
      let cards = []

      // Utiliser RapidAPI avec importAllCardsByExpansion (pagination complète)
      if (RapidAPIService.isAvailable()) {
        console.log(`📡 Import via RapidAPI (pagination complète)...`)

        try {
          // Utiliser la méthode dédiée qui gère correctement la pagination avec episode_id
          // Passer episodeId si disponible (évite recherche par slug)
          cards = await RapidAPIService.importAllCardsByExpansion({ slug, episodeId, name: setName }, (progressData) => {
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

      // 🎯 OPTIMISATION: Vérifier quelles cartes existent déjà en base
      console.log(`🔍 Vérification des cartes déjà présentes dans la base...`)
      const existingIds = await SupabaseService.getExistingCardIdsBySet(setId)
      const existingCount = uniqueCards.filter(card => existingIds.has(card.id)).length

      if (existingCount > 0) {
        console.log(`✅ ${existingCount} cartes déjà présentes (seront mises à jour)`)
        console.log(`➕ ${uniqueCards.length - existingCount} nouvelles cartes à insérer`)
      } else {
        console.log(`➕ Toutes les cartes sont nouvelles (${uniqueCards.length} cartes)`)
      }

      // 🔥 CHANGEMENT: Ne plus filtrer, envoyer TOUTES les cartes à upsert
      // L'upsert mettra à jour les existantes et insérera les nouvelles
      const newCards = uniqueCards

      console.log(`📤 Envoi de ${newCards.length} cartes à Supabase (upsert intelligent)`)

      // Ajouter les cartes via le context si fourni
      if (addDiscoveredCards) {
        await addDiscoveredCards(newCards)
        console.log(`✅ ${newCards.length} nouvelles cartes ajoutées à la base via context`)
      } else {
        // Sinon, sauvegarder directement dans Supabase
        await SupabaseService.addDiscoveredCards(newCards)
        console.log(`✅ ${newCards.length} nouvelles cartes sauvegardées dans Supabase`)
      }

      return {
        success: true,
        setId,
        setName,
        cardsImported: newCards.length,
        cardsAlreadyExisting: existingCount
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
