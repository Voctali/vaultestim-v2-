/**
 * Service pour les cartes Pokémon TCG
 * Utilise l'API Pokemon TCG pour une meilleure fiabilité des images
 */

import { CacheService } from './CacheService'
import { translatePokemonName, POKEMON_TRANSLATIONS_VERSION } from '@/utils/pokemonTranslations'
import { translateTrainerName, TRAINER_TRANSLATIONS_VERSION } from '@/utils/trainerTranslations'
import { translateRarity } from '@/utils/cardConditions'

export class TCGdxService {
  static BASE_URL = '/api/pokemontcg/v2'
  static TIMEOUT = 30000 // 30 secondes

  // Version du cache : incrémenter quand le format de recherche change
  // Cela invalide automatiquement l'ancien cache sans nécessiter de vider manuellement
  static CACHE_VERSION = 'v2' // v2: Fix encodage guillemets pour apostrophes (2025-01)

  static CACHE_KEYS = {
    SEARCH: 'tcg_search_v2', // Version incluse pour invalider automatiquement
    CARD: 'tcg_card',
    SETS: 'tcg_sets'
  }

  // Mapping des séries Pokemon TCG vers les blocs corrects
  static SERIES_TO_BLOCK_MAPPING = {
    // Scarlet & Violet
    'Scarlet & Violet': 'Scarlet & Violet',

    // Sword & Shield
    'Sword & Shield': 'Sword & Shield',

    // Sun & Moon
    'Sun & Moon': 'Sun & Moon',

    // XY
    'XY': 'XY',
    'Kalos': 'XY',

    // Black & White
    'Black & White': 'Black & White',
    'BW': 'Black & White',

    // HeartGold SoulSilver
    'HeartGold & SoulSilver': 'HeartGold & SoulSilver',
    'HGSS': 'HeartGold & SoulSilver',

    // Platinum
    'Platinum': 'Platinum',
    'PL': 'Platinum',

    // Diamond & Pearl
    'Diamond & Pearl': 'Diamond & Pearl',
    'DP': 'Diamond & Pearl',

    // EX Series
    'EX': 'EX',
    'e-Card': 'e-Card',

    // Original/Classic
    'Base': 'Classic',
    'Base Set': 'Classic',
    'Jungle': 'Classic',
    'Fossil': 'Classic',
    'Gym': 'Classic',
    'Neo': 'Classic',
    'Legendary Collection': 'Classic',
    'Team Rocket': 'Classic',

    // POP Series
    'POP': 'POP Series',

    // Promos et spéciaux
    'Wizards Promos': 'Promos',
    'Nintendo Promos': 'Promos',
    'Black Star Promos': 'Promos',
    'McDonald\'s Collection': 'Promos',

    // Par défaut
    'Other': 'Autres'
  }

  /**
   * Obtenir le bloc correct pour une série donnée
   * @param {string} series - La série principale
   * @param {string} setName - Le nom de l'extension (optionnel, pour affiner le mapping)
   */
  static getBlockFromSeries(series, setName = '') {
    if (!series) return 'Non défini'

    // Si la série est "Other" ou vide, essayer de déterminer depuis le nom de l'extension
    if (series === 'Other' || series === 'Autres' || !series) {
      if (setName) {
        // Chercher un mot-clé dans le nom de l'extension
        for (const [seriesKey, block] of Object.entries(this.SERIES_TO_BLOCK_MAPPING)) {
          if (setName.includes(seriesKey) || seriesKey.includes(setName)) {
            // Log supprimé pour éviter la pollution de console (appelé pour chaque carte)
            return block
          }
        }
      }
    }

    // Chercher dans le mapping
    const exactMatch = this.SERIES_TO_BLOCK_MAPPING[series]
    if (exactMatch) return exactMatch

    // Chercher par correspondance partielle
    for (const [seriesKey, block] of Object.entries(this.SERIES_TO_BLOCK_MAPPING)) {
      if (series.includes(seriesKey) || seriesKey.includes(series)) {
        return block
      }
    }

    // Par défaut, utiliser la série comme bloc
    return series
  }

  /**
   * Nettoie les anciennes entrées de cache avec une version obsolète
   */
  static cleanObsoleteCache() {
    const currentVersion = `${POKEMON_TRANSLATIONS_VERSION}_${TRAINER_TRANSLATIONS_VERSION}`
    const prefix = this.CACHE_KEYS.SEARCH

    try {
      // Parcourir toutes les clés localStorage
      const keysToDelete = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(prefix) && !key.includes(currentVersion)) {
          keysToDelete.push(key)
        }
      }

      // Supprimer les anciennes entrées
      keysToDelete.forEach(key => localStorage.removeItem(key))

      if (keysToDelete.length > 0) {
        console.log(`🧹 Nettoyage cache obsolète: ${keysToDelete.length} entrées supprimées`)
      }
    } catch (error) {
      console.warn('⚠️ Erreur nettoyage cache:', error)
    }
  }

  /**
   * Recherche de cartes avec l'API Pokemon TCG
   */
  static async searchCards(query, limit = 50) {
    console.log(`🔍 Recherche Pokemon TCG: "${query}"`)

    // Traduire le nom français vers anglais si nécessaire AVANT de vérifier le cache
    const translatedQuery = this.translateToEnglish(query)
    console.log(`🇬🇧 Recherche: "${translatedQuery}"`)

    // Vérifier le cache avec le nom traduit + versions des traductions
    // Cela invalide automatiquement le cache quand les dictionnaires changent
    const translationsVersion = `${POKEMON_TRANSLATIONS_VERSION}_${TRAINER_TRANSLATIONS_VERSION}`
    const cacheKey = `${this.CACHE_KEYS.SEARCH}_${translationsVersion}_${translatedQuery}_${limit}`
    const cached = CacheService.getCache(cacheKey)

    if (cached) {
      console.log(`⚡ Résultats depuis cache: ${cached.length} cartes`)
      return cached
    }

    try {
      let cards = []

      // Encoder SEULEMENT la valeur entre guillemets pour gérer les caractères spéciaux (&, ', etc.)
      // IMPORTANT: Les guillemets ne doivent PAS être encodés pour l'API Pokemon TCG
      const encodedValue = encodeURIComponent(translatedQuery)
      const encodedQuery = `"${encodedValue}"`

      // 1. Essayer d'abord une recherche exacte (pour éviter pidgeot* qui match pidgeotto)
      // Ajouter des guillemets pour les noms contenant des espaces (ex: "mr. mime")
      const exactUrl = `${this.BASE_URL}/cards?q=name:${encodedQuery}&pageSize=${limit}`
      console.log(`🎯 Tentative recherche exacte: "${translatedQuery}"`)
      console.log(`📝 URL encodée: ${exactUrl}`)

      try {
        const exactResult = await this.makeRequestWithRetry(exactUrl, 2)
        cards = exactResult.data || []
        console.log(`✅ Recherche exacte: ${cards.length} cartes trouvées`)
      } catch (exactError) {
        console.log(`⚠️ Recherche exacte échouée, essai avec wildcard...`)
      }

      // 2. Si aucun résultat, essayer avec wildcard (SEULEMENT si pas d'espace)
      // IMPORTANT: Les wildcards ne fonctionnent PAS avec les espaces (ex: "quaquaval ex*" = 400 Bad Request)
      if (cards.length === 0 && !translatedQuery.includes(' ')) {
        // Wildcard : PAS de guillemets (syntaxe API: name:pheromosa* et NON name:"pheromosa"*)
        const wildcardQuery = encodeURIComponent(translatedQuery) + '*'
        const wildcardUrl = `${this.BASE_URL}/cards?q=name:${wildcardQuery}&pageSize=${limit}`
        console.log(`🔍 Recherche avec wildcard: "${translatedQuery}*"`)
        const wildcardResult = await this.makeRequestWithRetry(wildcardUrl, 3)
        cards = wildcardResult.data || []
        console.log(`✅ Recherche wildcard: ${cards.length} cartes trouvées`)

        // Filtrer pour privilégier les correspondances exactes
        // Ex: "mew" doit matcher "Mew" mais PAS "Mewtwo"
        const exactMatches = cards.filter(card =>
          card.name.toLowerCase() === translatedQuery.toLowerCase()
        )

        // Pour les correspondances partielles, vérifier que c'est un mot complet
        // "mew" ne doit PAS matcher "mewtwo" (mew n'est pas un mot séparé)
        // "mew" PEUT matcher "Mew ex", "Mew V", etc. (mew est suivi d'un espace)
        // "mustard" PEUT matcher "Rapid Strike Style Mustard" (mustard est un mot complet au milieu)
        const validPartialMatches = cards.filter(card => {
          const cardNameLower = card.name.toLowerCase()
          const queryLower = translatedQuery.toLowerCase()

          // Éviter les correspondances exactes (déjà traitées)
          if (cardNameLower === queryLower) return false

          // Vérifier que le terme recherché est un mot complet N'IMPORTE OÙ dans le nom
          // Cas 1: Au début - "mew ex" ✅, "mewtwo" ❌
          const startsWithQuery = cardNameLower.startsWith(queryLower + ' ') ||
                                   cardNameLower.startsWith(queryLower + '-') ||
                                   cardNameLower.startsWith(queryLower + '(') ||
                                   cardNameLower.startsWith(queryLower + '.')

          // Cas 2: Au milieu - "rapid strike style mustard" ✅
          const containsQueryAsWord = cardNameLower.includes(' ' + queryLower + ' ') ||
                                       cardNameLower.includes(' ' + queryLower + '-') ||
                                       cardNameLower.includes(' ' + queryLower + '(') ||
                                       cardNameLower.includes('-' + queryLower + ' ') ||
                                       cardNameLower.includes('-' + queryLower + '-')

          // Cas 3: À la fin - "style mustard" ✅
          const endsWithQuery = cardNameLower.endsWith(' ' + queryLower) ||
                                 cardNameLower.endsWith('-' + queryLower)

          return startsWithQuery || containsQueryAsWord || endsWithQuery
        })

        // Prioriser les correspondances exactes, sinon accepter les correspondances de mots complets
        if (exactMatches.length > 0) {
          cards = exactMatches
          console.log(`🎯 Filtré: ${exactMatches.length} correspondances exactes (ignoré ${cards.length - exactMatches.length} partielles)`)
        } else if (validPartialMatches.length > 0) {
          cards = validPartialMatches
          console.log(`📝 Filtré: ${validPartialMatches.length} correspondances de mots complets`)
        } else {
          // Aucune correspondance valide trouvée
          cards = []
          console.log(`⚠️ Aucune correspondance valide pour "${translatedQuery}" - ${cards.length} résultats ignorés car non pertinents`)
        }
      }
      console.log(`🔍 Total: ${cards.length} cartes pour "${query}"`)

      const normalizedCards = this.normalizePokemonTCGData(cards)

      // Mettre en cache pour 15 minutes
      CacheService.setCache(cacheKey, normalizedCards, 15 * 60 * 1000)

      console.log(`✅ Pokemon TCG trouvé ${normalizedCards.length} cartes pour "${query}"`)
      return normalizedCards

    } catch (error) {
      console.error('❌ Erreur Pokemon TCG après retry:', error.message)
      // Plus de fallback - retourner une erreur claire
      throw new Error(`API Pokemon TCG indisponible: ${error.message}`)
    }
  }

  /**
   * Faire une requête avec retry et backoff exponentiel
   */
  static async makeRequestWithRetry(url, maxRetries = 3) {
    let lastError = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Créer un AbortController avec timeout de 60 secondes
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      try {
        console.log(`📡 Tentative ${attempt}/${maxRetries}: ${url}`)

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            // Ajouter la clé API si disponible
            ...(import.meta.env.VITE_POKEMON_TCG_API_KEY && {
              'X-Api-Key': import.meta.env.VITE_POKEMON_TCG_API_KEY
            })
          }
        })

        clearTimeout(timeoutId)

        console.log(`📊 Réponse API: Status ${response.status} ${response.statusText}`)

        // Gestion spécifique des codes d'erreur
        if (response.status === 429) {
          // Rate limit dépassé
          const retryAfter = response.headers.get('Retry-After') || 60
          console.warn(`⏳ Rate limit atteint, retry dans ${retryAfter}s`)

          if (attempt < maxRetries) {
            await this.sleep(retryAfter * 1000)
            continue
          }
          throw new Error(`Rate limit dépassé (429)`)
        }

        if (response.status >= 500 && response.status <= 504) {
          // Erreur serveur - retry avec backoff
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000 // Backoff exponentiel
            console.warn(`🔄 Erreur serveur ${response.status}, retry dans ${delay}ms`)
            await this.sleep(delay)
            continue
          }
        }

        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`✅ Succès tentative ${attempt}: ${data?.data?.length || 0} cartes trouvées`)
        return data

      } catch (error) {
        clearTimeout(timeoutId) // Nettoyer le timeout en cas d'erreur
        lastError = error
        console.warn(`❌ Tentative ${attempt} échouée:`, error.message)

        // Si ce n'est pas la dernière tentative et que c'est une erreur réseau
        if (attempt < maxRetries && (error.name === 'TypeError' || error.message.includes('fetch') || error.name === 'AbortError')) {
          const delay = Math.pow(2, attempt) * 1000
          console.log(`⏳ Retry dans ${delay}ms...`)
          await this.sleep(delay)
          continue
        }
      }
    }

    throw lastError || new Error('Toutes les tentatives ont échoué')
  }

  /**
   * Utilitaire pour attendre
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Récupérer une carte spécifique par ID
   */
  static async getCardById(cardId) {
    const cacheKey = `${this.CACHE_KEYS.CARD}_${cardId}`
    const cached = CacheService.getCache(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const url = `${this.BASE_URL}/cards/${cardId}`
      const data = await this.makeRequestWithRetry(url, 3)
      const card = data.data

      if (card) {
        const normalizedCard = this.normalizePokemonTCGCard(card)

        // Cache pour 1 heure
        CacheService.setCache(cacheKey, normalizedCard, 60 * 60 * 1000)
        return normalizedCard
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération carte Pokemon TCG après retry:', error.message)
    }

    return null
  }

  /**
   * Normaliser les données Pokemon TCG vers le format VaultEstim
   */
  static normalizePokemonTCGData(cards) {
    return cards
      .map(card => this.normalizePokemonTCGCard(card))
      .filter(card => {
        // Ne garder que les cartes avec des images valides
        const hasValidImage = card.image &&
          card.image.startsWith('https://images.pokemontcg.io/') &&
          card.images?.large &&
          card.images.large.startsWith('https://images.pokemontcg.io/')

        if (!hasValidImage) {
          console.warn(`⚠️ Carte "${card.name}" exclue - pas d'image valide`)
        }

        return hasValidImage
      })
  }

  /**
   * Normaliser une carte Pokemon TCG vers le format VaultEstim
   */
  static normalizePokemonTCGCard(item) {
    // Récupérer l'URL de l'image de haute qualité
    const imageUrl = item.images?.large || item.images?.small || ''

    // Log détaillé pour debug
    if (!imageUrl) {
      console.warn(`⚠️ PAS D'IMAGE pour ${item.name}:`, {
        hasImages: !!item.images,
        large: item.images?.large,
        small: item.images?.small,
        rawItem: item
      })
    } else {
      console.log(`🖼️ Image trouvée pour ${item.name}: ${imageUrl}`)
    }

    // Debug: afficher les données de prix disponibles (Charizard/Dracaufeu)
    if (item.name?.toLowerCase().includes('charizard') || item.name?.toLowerCase().includes('dracaufeu')) {
      console.log(`💰 PRIX COMPLETS pour ${item.name} (${item.set?.name} ${item.number}):`)
      console.log('CardMarket:', item.cardmarket)
      if (item.cardmarket?.prices) {
        console.log('  - trendPrice:', item.cardmarket.prices.trendPrice, '€')
        console.log('  - averageSellPrice:', item.cardmarket.prices.averageSellPrice, '€')
        console.log('  - lowPrice:', item.cardmarket.prices.lowPrice, '€')
        console.log('  - lowPriceExPlus:', item.cardmarket.prices.lowPriceExPlus, '€')
        console.log('  - avg1:', item.cardmarket.prices.avg1, '€')
        console.log('  - avg7:', item.cardmarket.prices.avg7, '€')
        console.log('  - avg30:', item.cardmarket.prices.avg30, '€')
      }
      console.log('TCGPlayer:', item.tcgplayer)
    }

    // Extraire le meilleur prix disponible - PRIORITÉ À CARDMARKET (marché européen/français)
    let bestPrice = null
    let priceSource = null

    // Déterminer si la carte est une reverse holo basé sur sa rareté
    const isReverseHolo = item.rarity?.toLowerCase().includes('reverse') || false

    // 1. PRIORITÉ: CardMarket (EUR - marché européen/français)
    if (item.cardmarket?.prices) {
      const cm = item.cardmarket.prices

      // Choisir la variante de prix en fonction de la VRAIE rareté de la carte
      if (isReverseHolo && (cm.reverseHoloTrend || cm.reverseHoloSell || cm.reverseHoloLow)) {
        // La carte EST une reverse holo → utiliser les prix reverse holo
        bestPrice = {
          amount: cm.reverseHoloTrend || cm.reverseHoloSell || cm.reverseHoloLow,
          currency: 'EUR',
          source: 'CardMarket',
          variant: 'reverseHolo',
          low: cm.reverseHoloLow || null,
          trend: cm.reverseHoloTrend || null,
          avg: cm.reverseHoloSell || null
        }
        priceSource = 'CardMarket (Reverse Holo)'
      } else if (cm.avg7 || cm.avg1 || cm.averageSellPrice || cm.trendPrice || cm.lowPrice) {
        // Carte normale (non-reverse) → utiliser les prix normaux
        // PRIORITÉ: avg7 (moyenne 7 jours = stable et représentatif du Near Mint)
        const nearMintPrice = cm.avg7 || cm.avg1 || cm.averageSellPrice || cm.trendPrice || cm.lowPrice
        const priceField = cm.avg7 ? 'avg7' : (cm.avg1 ? 'avg1' : (cm.averageSellPrice ? 'averageSellPrice' : (cm.trendPrice ? 'trendPrice' : 'lowPrice')))

        bestPrice = {
          amount: nearMintPrice,
          currency: 'EUR',
          source: 'CardMarket',
          variant: 'normal',
          priceField: priceField, // Quel champ est utilisé pour Near Mint
          low: cm.lowPrice || null,
          lowExPlus: cm.lowPriceExPlus || null, // Pour Excellent
          trend: cm.trendPrice || null,
          avg: cm.averageSellPrice || null,
          avg1: cm.avg1 || null,
          avg7: cm.avg7 || null,
          avg30: cm.avg30 || null
        }
        priceSource = `CardMarket (Normal - ${priceField})`
      } else if (!isReverseHolo && (cm.reverseHoloTrend || cm.reverseHoloSell || cm.reverseHoloLow)) {
        // Fallback: Si pas de prix normal mais reverse dispo ET carte pas reverse → utiliser quand même
        bestPrice = {
          amount: cm.reverseHoloTrend || cm.reverseHoloSell || cm.reverseHoloLow,
          currency: 'EUR',
          source: 'CardMarket',
          variant: 'reverseHolo (fallback)',
          low: cm.reverseHoloLow || null,
          trend: cm.reverseHoloTrend || null,
          avg: cm.reverseHoloSell || null
        }
        priceSource = 'CardMarket (Reverse Holo - Fallback)'
      }
    }

    // 2. FALLBACK: TCGPlayer (USD - marché américain) si CardMarket indisponible
    if (!bestPrice && item.tcgplayer?.prices) {
      const rarity = item.rarity?.toLowerCase() || ''
      const tcgPrices = item.tcgplayer.prices

      // Mapper la rareté vers la variante de prix appropriée
      let priceVariantsOrdered = []

      if (rarity.includes('reverse')) {
        // Reverse Holo
        priceVariantsOrdered = ['reverseHolofoil', 'holofoil', 'normal']
      } else if (rarity.includes('holo') || rarity.includes('rare holo')) {
        // Holo (non-reverse)
        priceVariantsOrdered = ['holofoil', 'unlimitedHolofoil', '1stEditionHolofoil', 'normal']
      } else if (rarity.includes('1st edition')) {
        // 1ère édition
        priceVariantsOrdered = ['1stEditionHolofoil', '1stEditionNormal', 'holofoil', 'normal']
      } else {
        // Commune, peu commune, rare normale
        priceVariantsOrdered = ['normal', 'unlimitedNormal', 'holofoil', 'reverseHolofoil']
      }

      // Chercher le prix dans l'ordre de priorité
      for (const variant of priceVariantsOrdered) {
        const variantPrice = tcgPrices[variant]
        if (variantPrice?.market) {
          bestPrice = {
            amount: variantPrice.market,
            currency: 'USD',
            source: 'TCGPlayer',
            variant: variant,
            low: variantPrice.low,
            mid: variantPrice.mid,
            high: variantPrice.high
          }
          priceSource = `TCGPlayer (${variant})`
          break
        }
      }

      // Si toujours rien, essayer toutes les variantes disponibles (fallback)
      if (!bestPrice) {
        const allVariants = ['holofoil', 'reverseHolofoil', 'normal', '1stEditionHolofoil', '1stEditionNormal', 'unlimitedHolofoil', 'unlimitedNormal']
        for (const variant of allVariants) {
          const variantPrice = tcgPrices[variant]
          if (variantPrice?.market) {
            bestPrice = {
              amount: variantPrice.market,
              currency: 'USD',
              source: 'TCGPlayer',
              variant: `${variant} (fallback)`,
              low: variantPrice.low,
              mid: variantPrice.mid,
              high: variantPrice.high
            }
            priceSource = `TCGPlayer (${variant} - Fallback)`
            break
          }
        }
      }
    }

    // Log du prix trouvé avec rareté
    if (bestPrice) {
      console.log(`💰 Prix pour ${item.name} [${item.rarity || 'Rareté inconnue'}]: ${bestPrice.amount} ${bestPrice.currency} (${priceSource})`)
    } else {
      console.warn(`⚠️ Aucun prix trouvé pour ${item.name} [${item.rarity || 'Rareté inconnue'}]`)
    }

    // Déterminer le bloc correct en utilisant le mapping (avec nom d'extension pour affiner)
    const originalSeries = item.set?.series || 'Pokemon TCG'
    const setName = item.set?.name || ''
    const correctBlock = this.getBlockFromSeries(originalSeries, setName)

    const normalizedCard = {
      id: item.id || `ptcg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || '',
      name_fr: item.name || '',
      name_en: item.name || '',
      image: imageUrl, // Pour compatibilité avec CardImage component
      images: {
        large: item.images?.large || imageUrl,
        small: item.images?.small || imageUrl
      },
      number: item.number || '',
      set: {
        id: item.set?.id || 'unknown',
        name: item.set?.name || 'Unknown Set',
        series: correctBlock, // Utiliser le bloc mappé
        originalSeries: originalSeries, // Garder la série originale pour référence
        code: item.set?.ptcgoCode || item.set?.id || '',
        releaseDate: item.set?.releaseDate || null,
        logo: item.set?.images?.logo || ''
      },
      supertype: item.supertype || 'Pokémon',
      subtypes: item.subtypes || [],
      types: item.types || [],
      typesFormatted: item.types || [],
      hp: item.hp || null,
      rarity: translateRarity(item.rarity) || '', // Rareté en français
      rarityOriginal: item.rarity || '', // Rareté originale (anglais) pour calculs
      condition: 'near_mint', // État par défaut (Quasi-neuf)
      artist: item.artist || '',
      marketPrice: bestPrice?.amount || null,
      marketPriceCurrency: bestPrice?.currency || 'EUR', // EUR par défaut (CardMarket)
      marketPriceSource: bestPrice?.source || null, // 'CardMarket' ou 'TCGPlayer'
      marketPriceDetails: bestPrice || null,
      tcgPlayerPrice: item.tcgplayer || null,
      cardMarketPrice: item.cardmarket || null,
      // IMPORTANT: Structures complètes pour persistence Supabase (multi-device)
      cardmarket: item.cardmarket || null, // Structure complète CardMarket (EUR)
      tcgplayer: item.tcgplayer || null,   // Structure complète TCGPlayer (USD)
      series: correctBlock, // Utiliser le bloc mappé
      // Données de combat (ajoutées automatiquement depuis l'API)
      attacks: item.attacks || [],
      abilities: item.abilities || [],
      weaknesses: item.weaknesses || [],
      resistances: item.resistances || [],
      retreat_cost: item.retreatCost || [], // Note: retreat_cost avec underscore pour Supabase
      _source: 'pokemon-tcg',
      _timestamp: Date.now()
    }

    // Debug détaillé pour Charizard/Dracaufeu
    if (item.name?.toLowerCase().includes('charizard') || item.name?.toLowerCase().includes('dracaufeu')) {
      console.log(`\n💰 ===== PRIX COMPLETS pour ${item.name} (${item.set?.name} #${item.number}) =====`)
      if (item.cardmarket?.prices) {
        const cm = item.cardmarket.prices
        console.log('📊 CardMarket - Tous les prix disponibles:')
        console.log('  • trendPrice:', cm.trendPrice, '€ (tendance marché)')
        console.log('  • averageSellPrice:', cm.averageSellPrice, '€ (moyenne ventes réelles)')
        console.log('  • lowPrice:', cm.lowPrice, '€ (prix le plus bas)')
        console.log('  • lowPriceExPlus:', cm.lowPriceExPlus, '€ (prix le plus bas Excellent+)')
        console.log('  • avg1:', cm.avg1, '€ (moyenne 1 jour)')
        console.log('  • avg7:', cm.avg7, '€ (moyenne 7 jours)')
        console.log('  • avg30:', cm.avg30, '€ (moyenne 30 jours)')
        console.log(`\n✅ Prix Near Mint utilisé: ${bestPrice?.amount}€ (champ: ${bestPrice?.priceField})`)
      }
      console.log('===========================================\n')
    }

    // Debug: Afficher les URLs des marketplaces
    if (item.cardmarket?.url) {
      console.log(`🔗 CardMarket URL pour ${normalizedCard.name}: ${item.cardmarket.url}`)
    } else {
      console.log(`⚠️ Pas d'URL CardMarket pour ${normalizedCard.name}`)
    }
    if (item.tcgplayer?.url) {
      console.log(`🔗 TCGPlayer URL pour ${normalizedCard.name}: ${item.tcgplayer.url}`)
    }

    console.log(`📋 Carte normalisée: ${normalizedCard.name} - Image: ${normalizedCard.image} - Prix: ${normalizedCard.marketPrice ? `${normalizedCard.marketPrice} ${normalizedCard.marketPriceCurrency}` : 'N/A'}`)
    return normalizedCard
  }

  /**
   * Traduction français -> anglais pour les noms de Pokémon
   * Utilise le dictionnaire centralisé dans pokemonTranslations.js
   */
  static translateToEnglish(frenchName) {
    // Essayer d'abord dans les Pokémon
    const pokemonTranslation = translatePokemonName(frenchName)

    // Si une traduction Pokémon est trouvée (différent du nom original)
    if (pokemonTranslation !== frenchName) {
      return pokemonTranslation
    }

    // Sinon, essayer dans les Dresseurs
    const trainerTranslation = translateTrainerName(frenchName)
    return trainerTranslation
  }

  /**
   * LEGACY - Ancienne fonction de traduction (conservée pour référence)
   * Désormais remplacée par le dictionnaire centralisé
   */
  static translateToEnglish_LEGACY(frenchName) {
    const translations = {
      // Starters Kanto
      'bulbizarre': 'bulbasaur',
      'herbizarre': 'ivysaur',
      'florizarre': 'venusaur',
      'salameche': 'charmander',
      'salamèche': 'charmander', // Avec accent
      'reptincel': 'charmeleon',
      'dracaufeu': 'charizard',
      'carapuce': 'squirtle',
      'carabaffe': 'wartortle',
      'tortank': 'blastoise',

      // Légendaires populaires
      'mewtwo': 'mewtwo',
      'mew': 'mew',
      'pikachu': 'pikachu',
      'raichu': 'raichu',
      'évoli': 'eevee',
      'eevee': 'eevee',
      'aquali': 'vaporeon',
      'voltali': 'jolteon',
      'pyroli': 'flareon',
      'mentali': 'espeon',
      'noctali': 'umbreon',
      'phyllali': 'leafeon',
      'givrali': 'glaceon',
      'sylverol': 'sylveon',

      // Autres Pokémon populaires Kanto
      'chenipan': 'caterpie',
      'chrysacier': 'metapod',
      'papilusion': 'butterfree',
      'aspicot': 'weedle',
      'coconfort': 'kakuna',
      'dardargnan': 'beedrill',
      'roucool': 'pidgey',
      'roucoups': 'pidgeotto',
      'roucarnage': 'pidgeot',
      'rattata': 'rattata',
      'rattatac': 'raticate',
      'piafabec': 'spearow',
      'rapasdepic': 'fearow',
      'abo': 'ekans',
      'arbok': 'arbok',
      'miaouss': 'meowth',
      'persian': 'persian',
      'psykokwak': 'psyduck',
      'akwakwak': 'golduck',
      'léviator': 'gyarados',
      'leviator': 'gyarados',
      'magicarpe': 'magikarp',
      'metamorph': 'ditto',
      'ronflex': 'snorlax',
      'artikodin': 'articuno',
      'electhor': 'zapdos',
      'sulfura': 'moltres',

      // Ligne évolutive Sabelette
      'sabelette': 'sandshrew',
      'sablaireau': 'sandslash',

      // Ligne évolutive Nidoran
      'nidoran♀': 'nidoran-f',
      'nidoran♂': 'nidoran-m',
      'nidorina': 'nidorina',
      'nidoqueen': 'nidoqueen',
      'nidorino': 'nidorino',
      'nidoking': 'nidoking',

      // Ligne évolutive Goupix
      'goupix': 'vulpix',
      'feunard': 'ninetales',

      // Ligne évolutive Taupiqueur
      'taupiqueur': 'diglett',
      'triopikeur': 'dugtrio',

      // Ligne évolutive Miaouss déjà ajoutée

      // Ligne évolutive Caninos
      'caninos': 'growlithe',
      'arcanin': 'arcanine',

      // Ligne évolutive Abra
      'abra': 'abra',
      'kadabra': 'kadabra',
      'alakazam': 'alakazam',

      // Ligne évolutive Machoc
      'machoc': 'machop',
      'machopeur': 'machoke',
      'mackogneur': 'machamp',

      // Ligne évolutive Tentacool
      'tentacool': 'tentacool',
      'tentacruel': 'tentacruel',

      // Ligne évolutive Geodude
      'racaillou': 'geodude',
      'gravalanch': 'graveler',
      'grolem': 'golem',

      // Ligne évolutive Ponyta
      'ponyta': 'ponyta',
      'galopa': 'rapidash',

      // Ligne évolutive Ramoloss
      'ramoloss': 'slowpoke',
      'flagadoss': 'slowbro',
      'roigada': 'slowking',

      // Ligne évolutive Magneti
      'magnéti': 'magnemite',
      'magneti': 'magnemite', // Sans accent
      'magnéton': 'magneton',
      'magneton': 'magneton', // Sans accent
      'magnézone': 'magnezone',
      'magnezone': 'magnezone', // Sans accent

      // Ligne évolutive Canarticho
      'canarticho': 'farfetch\'d',

      // Ligne évolutive Doduo
      'doduo': 'doduo',
      'dodrio': 'dodrio',

      // Ligne évolutive Otaria
      'otaria': 'seel',
      'lamantine': 'dewgong',

      // Ligne évolutive Tadmorv
      'tadmorv': 'grimer',
      'grotadmorv': 'muk',

      // Ligne évolutive Kokiyas
      'kokiyas': 'shellder',
      'crustabri': 'cloyster',

      // Ligne évolutive Onix
      'onix': 'onix',
      'steelix': 'steelix',

      // Ligne évolutive Soporifik
      'soporifik': 'drowzee',
      'hypnomade': 'hypno',

      // Ligne évolutive Krabby
      'krabby': 'krabby',
      'krabbos': 'kingler',
      'krabboss': 'kingler',

      // Ligne évolutive Voltorbe
      'voltorbe': 'voltorb',
      'electrode': 'electrode',

      // Ligne évolutive Noeunoeuf
      'noeunoeuf': 'exeggcute',
      'noadkoko': 'exeggutor',

      // Ligne évolutive Osselait
      'osselait': 'cubone',
      'ossatueur': 'marowak',

      // Ligne évolutive Kicklee
      'kicklee': 'hitmonlee',
      'tygnon': 'hitmonchan',
      'kapoera': 'hitmontop',

      // Ligne évolutive Excelangue
      'excelangue': 'lickitung',
      'coudlangue': 'lickilicky',

      // Ligne évolutive Smogo
      'smogo': 'koffing',
      'smogogo': 'weezing',

      // Ligne évolutive Rhinocorne
      'rhinocorne': 'rhyhorn',
      'rhinoféros': 'rhydon',
      'rhinoferos': 'rhydon', // Sans accent
      'rhinastoc': 'rhyperior',

      // Ligne évolutive Leveinard
      'leveinard': 'chansey',
      'leuphorie': 'blissey',

      // Ligne évolutive Saquedeneu
      'saquedeneu': 'tangela',
      'bouldeneu': 'tangrowth',

      // Ligne évolutive Kangourex
      'kangourex': 'kangaskhan',

      // Ligne évolutive Hypotrempe
      'hypotrempe': 'horsea',
      'hypocéan': 'seadra',
      'hyporoi': 'kingdra',

      // Ligne évolutive Poissirène
      'poissirène': 'goldeen',
      'poissirene': 'goldeen', // Sans accent
      'poissoroy': 'seaking',

      // Ligne évolutive Stari
      'stari': 'staryu',
      'staross': 'starmie',

      // Ligne évolutive M.Mime
      'm. mime': 'mr. mime',
      'm.mime': 'mr. mime',
      'mr mime': 'mr. mime',
      'mr. mime': 'mr. mime',
      'mime': 'mr. mime',

      // Ligne évolutive Insécateur
      'insécateur': 'scyther',
      'insecateur': 'scyther', // Sans accent
      'cizayox': 'scizor',

      // Ligne évolutive Lippoutou
      'lippoutou': 'jynx',

      // Ligne évolutive Elektek
      'elektek': 'electabuzz',
      'elekable': 'electivire',

      // Ligne évolutive Magmar
      'magmar': 'magmar',
      'maganon': 'magmortar',

      // Ligne évolutive Pinsir
      'pinsir': 'pinsir',

      // Ligne évolutive Tauros
      'tauros': 'tauros',

      // Ligne évolutive Eckmega
      'eckmega': 'lapras', // Note: Eckmega n'est pas le bon nom français
      'lokhlass': 'lapras',

      // Ligne évolutive Fantominus
      'fantominus': 'gastly',
      'fantominius': 'gastly', // Variante d'orthographe
      'spectrum': 'haunter',
      'ectoplasma': 'gengar',

      // Pokémon Gen 2
      'germignon': 'chikorita',
      'macronium': 'bayleef',
      'meganium': 'meganium',
      'héricendre': 'cyndaquil',
      'feurisson': 'quilava',
      'typhlosion': 'typhlosion',
      'kaiminus': 'totodile',
      'crocrodil': 'croconaw',
      'crocodil': 'croconaw',
      'aligatueur': 'feraligatr',
      'fouinette': 'sentret',
      'fouinar': 'furret',

      // Pokémon Gen 3
      'arcko': 'treecko',
      'massko': 'grovyle',
      'jungko': 'sceptile',
      'poussifeu': 'torchic',
      'galifeu': 'combusken',
      'braségali': 'blaziken',
      'gobou': 'mudkip',
      'flobio': 'marshtomp',
      'laggron': 'swampert',

      // Pokémon Gen 9 (Paldea)
      'poussacha': 'sprigatito',
      'matourgeon': 'floragato',
      'miascarade': 'meowscarada',
      'chochodile': 'fuecoco',
      'crocogril': 'crocalor',
      'flâmigator': 'skeledirge',
      'coiffeton': 'quaxly',
      'canarbello': 'quaxwell',
      'palmaval': 'quaquaval',

      // Autres Pokémon courants
      'pêchaminus': 'pecharunt',
      'flamigator': 'skeledirge', // Variante d'écriture
      'flâmigator': 'skeledirge',
      'chocodile': 'fuecoco' // Variante d'écriture
    }

    return translations[frenchName.toLowerCase()] || frenchName
  }

  /**
   * Obtenir les couleurs des types Pokémon
   */
  static getTypeColor(type) {
    const typeColors = {
      'Grass': '#78C850',
      'Fire': '#F08030',
      'Water': '#6890F0',
      'Lightning': '#F8D030',
      'Psychic': '#F85888',
      'Ice': '#98D8D8',
      'Fighting': '#C03028',
      'Poison': '#A040A0',
      'Ground': '#E0C068',
      'Flying': '#A890F0',
      'Bug': '#A8B820',
      'Rock': '#B8A038',
      'Ghost': '#705898',
      'Dragon': '#7038F8',
      'Dark': '#705848',
      'Steel': '#B8B8D0',
      'Fairy': '#EE99AC',
      'Normal': '#A8A878',
      'Colorless': '#68A090'
    }

    return typeColors[type] || '#68A090'
  }

}