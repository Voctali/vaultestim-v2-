import { useState, useEffect, createContext, useContext } from 'react'
import { MultiApiService } from '@/services/MultiApiService'
import { CacheService } from '@/services/CacheService'
import { SupabaseService } from '@/services/SupabaseService'
import { CardCacheService } from '@/services/CardCacheService'
import { BackendApiService } from '@/services/BackendApiService'
import { MigrationService } from '@/services/MigrationService'
import { config } from '@/lib/config'
import { PriceUpdateService } from '@/services/PriceUpdateService'
import { PriceRefreshService } from '@/services/PriceRefreshService'
import { TCGdxService } from '@/services/TCGdxService'
import { supabase } from '@/lib/supabaseClient'
import { setCurrentSession } from '@/lib/sessionStore'

// Configuration pour les APIs
const API_BASE_URL = config.API_BASE_URL // Conservé pour l'administration manuelle

const CardDatabaseContext = createContext()

// Helper pour organiser les cartes par structure hiérarchique Bloc → Extensions → Cartes
const organizeCardsBySet = (cards) => {
  console.log('🗂️ Organisation des cartes par structure hiérarchique...')

  // DEBUG: Compter les cartes me2 au début
  const me2Cards = cards.filter(c => c.set?.id === 'me2' || c.id?.startsWith('me2-'))
  console.log(`🔍 DEBUG: ${me2Cards.length} cartes me2 trouvées dans les ${cards.length} cartes à organiser`)
  if (me2Cards.length > 0) {
    console.log(`🔍 DEBUG: Première carte me2:`, JSON.stringify(me2Cards[0]?.set, null, 2))
  }

  // Première passe : regrouper par extensions
  const extensionGroups = {}
  const blockGroups = {}

  cards.forEach(card => {
    // Informations de l'extension
    const setId = card.set?.id || `unknown-${card.id || Math.random().toString(36).substr(2, 9)}`
    let setName = card.set?.name || 'Extension inconnue'

    // Normaliser les noms d'extensions avec conflits connus
    if (setId === 'svp') {
      setName = 'Scarlet & Violet Promos' // Nom unifié pour éviter "Black Star Promos" vs "Promos"
    }

    // Déterminer le bloc correct en utilisant TOUJOURS le mapping de TCGdxService
    // Priorité : originalSeries > series > nom de l'extension
    const seriesForMapping = card.set?.originalSeries || card.set?.series || card.series || 'Pokemon TCG'
    const blockName = TCGdxService.getBlockFromSeries(seriesForMapping, setName)

    // DEBUG: Log pour les cartes Mega Evolution (me2)
    if (setId === 'me2' || setId?.startsWith('me2')) {
      console.log(`🔍 DEBUG ME2 - Carte: ${card.name}, setId: ${setId}, setName: ${setName}`)
      console.log(`   originalSeries: ${card.set?.originalSeries}, series: ${card.set?.series}, card.series: ${card.series}`)
      console.log(`   seriesForMapping: "${seriesForMapping}" → blockName: "${blockName}"`)
    }

    // Log pour cartes avec informations manquantes
    if (!card.set?.id || !card.set?.name) {
      console.log(`⚠️ Carte "${card.name}" avec informations partielles → Extension: "${setName}", Bloc: "${blockName}"`)
    }

    // Créer ou mettre à jour l'extension
    if (!extensionGroups[setId]) {
      extensionGroups[setId] = {
        id: setId,
        name: setName,
        series: blockName, // Le bloc parent
        cards: [],
        releaseDate: card.set?.releaseDate || new Date().toISOString(),
        logo: card.set?.logo || '',
        total: 0 // Sera calculé après
      }
    } else {
      // Si l'extension existe déjà, s'assurer que les informations sont cohérentes
      if (extensionGroups[setId].name !== setName) {
        console.log(`⚠️ Conflit de nom pour l'extension ${setId}: "${extensionGroups[setId].name}" vs "${setName}" - Conservation du premier`)
      }
      if (extensionGroups[setId].series !== blockName) {
        console.log(`⚠️ Conflit de bloc pour l'extension ${setId}: "${extensionGroups[setId].series}" vs "${blockName}" - Conservation du premier`)
      }
    }

    // Vérifier les doublons de cartes avant d'ajouter
    const cardExists = extensionGroups[setId].cards.some(existingCard => existingCard.id === card.id)
    if (!cardExists) {
      extensionGroups[setId].cards.push(card)
    } else {
      console.log(`⚠️ Carte dupliquée ignorée: ${card.name} (${card.id}) dans l'extension ${setName}`)
    }
  })

  // Deuxième passe : regrouper les extensions par blocs
  Object.values(extensionGroups).forEach(extension => {
    const blockName = extension.series

    if (!blockGroups[blockName]) {
      blockGroups[blockName] = {
        id: `block-${blockName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: blockName,
        series_count: 0,
        cards_count: 0,
        extensions: [],
        cards: [],
        releaseDate: extension.releaseDate,
        minDate: extension.releaseDate,
        maxDate: extension.releaseDate
      }
    }

    // Calculer le total de cartes dans l'extension
    extension.total = extension.cards.length

    // Ajouter l'extension au bloc (éviter les doublons)
    if (!blockGroups[blockName].extensions.includes(extension.id)) {
      blockGroups[blockName].extensions.push(extension.id)
      blockGroups[blockName].series_count++
    }

    // Ajouter les cartes au bloc (éviter les doublons de cartes)
    extension.cards.forEach(card => {
      const cardExists = blockGroups[blockName].cards.some(existingCard => existingCard.id === card.id)
      if (!cardExists) {
        blockGroups[blockName].cards.push(card)
        blockGroups[blockName].cards_count++
      }
    })

    // Mettre à jour les dates du bloc
    if (extension.releaseDate < blockGroups[blockName].minDate) {
      blockGroups[blockName].minDate = extension.releaseDate
    }
    if (extension.releaseDate > blockGroups[blockName].maxDate) {
      blockGroups[blockName].maxDate = extension.releaseDate
    }
  })

  // Retourner les extensions avec les informations de bloc mises à jour
  const result = Object.values(extensionGroups)

  console.log(`✅ Organisation terminée:`)
  console.log(`📦 ${Object.keys(blockGroups).length} blocs créés`)
  console.log(`📚 ${result.length} extensions organisées`)
  console.log(`🎴 ${cards.length} cartes réparties`)

  // Log des blocs créés
  Object.values(blockGroups).forEach(block => {
    console.log(`📦 Bloc "${block.name}": ${block.series_count} extensions, ${block.cards_count} cartes`)
  })

  // DEBUG: Vérifier spécifiquement le bloc Mega Evolution
  const megaEvolutionBlock = blockGroups['Mega Evolution']
  if (megaEvolutionBlock) {
    console.log(`✅ DEBUG: Bloc "Mega Evolution" créé avec ${megaEvolutionBlock.cards_count} cartes et ${megaEvolutionBlock.series_count} extensions`)
    console.log(`   Extensions: ${megaEvolutionBlock.extensions.join(', ')}`)
  } else {
    console.log(`❌ DEBUG: Bloc "Mega Evolution" NON CRÉÉ!`)
    console.log(`   Blocs disponibles: ${Object.keys(blockGroups).join(', ')}`)
  }

  // DEBUG: Vérifier si l'extension me2 existe
  const me2Extension = extensionGroups['me2']
  if (me2Extension) {
    console.log(`✅ DEBUG: Extension me2 créée avec ${me2Extension.cards.length} cartes, bloc: "${me2Extension.series}"`)
  } else {
    console.log(`❌ DEBUG: Extension me2 NON CRÉÉE!`)
  }

  return result
}

export function CardDatabaseProvider({ children }) {
  const [discoveredCards, setDiscoveredCards] = useState([])
  const [seriesDatabase, setSeriesDatabase] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Charger la base de données locale au démarrage (SEULEMENT quand auth est prête)
  const [authInitialized, setAuthInitialized] = useState(false)

  useEffect(() => {
    // Nettoyer le cache obsolète au démarrage
    TCGdxService.cleanObsoleteCache()

    // Vérifier l'authentification
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        console.log('✅ [CardDB] Auth prête, démarrage chargement...')
        setAuthInitialized(true)
      }
    }

    checkAuth()

    // Écouter les événements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔄 [CardDB] Auth event: ${event}, session:`, session?.user?.email || 'null')

      // Stocker la session dans le store global
      setCurrentSession(session)

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ [CardDB] SIGNED_IN détecté')
        // IMPORTANT : Attendre 500ms pour que getSession() soit prêt
        setTimeout(() => {
          console.log('✅ [CardDB] Délai écoulé, activation du chargement')
          setAuthInitialized(true)
        }, 500)
      } else if (event === 'SIGNED_OUT') {
        console.log('⚠️ [CardDB] SIGNED_OUT détecté')
        setAuthInitialized(false)
        setDiscoveredCards([])
        setSeriesDatabase([])
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Charger les données SEULEMENT quand authentifié
  useEffect(() => {
    if (!authInitialized) return

    const initializeDatabase = async () => {
      // Nettoyer d'abord le cache
      CacheService.cleanLegacyApiData()
      cleanDemoDataFromCache()

      // Vider le cache de recherche pour les termes récemment traduits
      clearSearchCache('ectoplasma')
      clearSearchCache('fantominius')
      clearSearchCache('fantominus')
      clearSearchCache('salamèche')
      clearSearchCache('chenipan')

      // Forcer le vidage du cache chenipan
      console.log('🧹 Nettoyage forcé du cache chenipan...')
      localStorage.removeItem('tcg_search_chenipan_500')
      localStorage.removeItem('vaultestim_cache_tcg_search_chenipan_500')

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('chenipan')) {
          localStorage.removeItem(key)
          console.log(`🧹 Cache supprimé: ${key}`)
        }
      }

      await loadFromLocalStorage()

      // Démarrer la mise à jour des prix
      setTimeout(() => {
        PriceUpdateService.updateOnAppLoad((progress) => {
          console.log(`💰 Mise à jour prix: ${progress.progress}% (${progress.updated}/${progress.total})`)
        })
      }, 2000)
    }

    initializeDatabase()

    // Démarrer la synchronisation en arrière-plan
    const cleanupBackgroundSync = startBackgroundSync()

    return () => {
      cleanupBackgroundSync()
    }
  }, [authInitialized])

  // NOTE: Sauvegarde backend dans addDiscoveredCards et updateSeriesDatabase
  // L'état est synchronisé avec le backend pour le multi-device

  // Sauvegarde automatique des séries dans Supabase
  useEffect(() => {
    if (seriesDatabase.length > 0) {
      SupabaseService.saveSeriesDatabase(seriesDatabase)
        .then(() => {
          console.log(`📚 ${seriesDatabase.length} séries sauvegardées dans Supabase`)
        })
        .catch(error => {
          console.error('❌ Erreur sauvegarde séries:', error)
        })
    }
  }, [seriesDatabase])

  // Nettoyer le cache des anciennes APIs (TCGdx, PokemonTCG, etc.)
  const cleanOldApiCache = async () => {
    try {
      console.log('🔄 Début nettoyage du cache des anciennes APIs...')
      const savedCards = localStorage.getItem('vaultestim_discovered_cards')
      if (savedCards) {
        const cardsData = JSON.parse(savedCards)
        console.log(`📦 ${cardsData.length} cartes trouvées dans le cache avant nettoyage`)

        // Filtrer les cartes qui contiennent des URLs d'anciennes APIs ou les données de démonstration corrompues
        const cleanedCards = cardsData.filter(card => {
          const imageUrl = card.images?.large || card.images?.small || ''

          // Supprimer uniquement les anciennes APIs (GARDER pokemontcg.io)
          const hasOldApiUrl = imageUrl.includes('tcgdx.net') ||
                              imageUrl.includes('tcgdex.net') ||
                              card._source === 'tcgdx' ||
                              card._source === 'limitless'

          // Supprimer les cartes de démonstration
          const isDemoCard = card._source === 'demo' && card.id?.startsWith('demo-ptcg-')

          // Vérifier que l'image est valide (pokemontcg.io est l'API qu'on veut garder)
          const hasValidImage = card.image &&
            card.image.startsWith('https://images.pokemontcg.io/') &&
            card.images?.large &&
            card.images.large.startsWith('https://images.pokemontcg.io/')

          const shouldKeep = !hasOldApiUrl && !isDemoCard && hasValidImage

          // Debug logging pour comprendre ce qui est supprimé
          if (!shouldKeep) {
            console.log(`🗑️ Suppression carte: ${card.name} - Source: ${card._source} - Image: ${card.image} - OldAPI: ${hasOldApiUrl} - Demo: ${isDemoCard} - ValidImage: ${hasValidImage}`)
          }

          return shouldKeep // Garder les cartes Pokemon TCG valides
        })

        if (cleanedCards.length !== cardsData.length) {
          console.log(`🧹 Nettoyage cache: ${cardsData.length - cleanedCards.length} cartes supprimées (anciennes APIs)`)
          if (cleanedCards.length === 0) {
            localStorage.removeItem('vaultestim_discovered_cards')
          } else {
            localStorage.setItem('vaultestim_discovered_cards', JSON.stringify(cleanedCards))
          }
        }

        // Nettoyer complètement toutes les données des anciennes APIs dans le cache
        CacheService.cleanLegacyApiData()

        // Vider tous les caches de recherche pour forcer un rafraîchissement
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('vaultestim_search_cache_')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        console.log(`🧹 ${keysToRemove.length} caches de recherche vidés pour rafraîchissement`)
      }

      // Nettoyer aussi les séries qui pourraient contenir des références aux anciennes APIs
      const savedSeries = localStorage.getItem('vaultestim_series_database')
      if (savedSeries) {
        const seriesData = JSON.parse(savedSeries)

        // Supprimer les séries qui ne viennent pas de RapidAPI
        const cleanedSeries = seriesData.filter(series => {
          return !series._source || series._source === 'rapidapi' || series._source === 'rapidapi-demo'
        })

        if (cleanedSeries.length !== seriesData.length) {
          console.log(`🧹 Nettoyage séries: ${seriesData.length - cleanedSeries.length} séries supprimées (anciennes APIs)`)
          if (cleanedSeries.length === 0) {
            localStorage.removeItem('vaultestim_series_database')
          } else {
            localStorage.setItem('vaultestim_series_database', JSON.stringify(cleanedSeries))
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors du nettoyage du cache:', error)
      // En cas d'erreur, vider complètement le cache pour repartir sur des bases saines
      localStorage.removeItem('vaultestim_discovered_cards')
      localStorage.removeItem('vaultestim_series_database')
      console.log('🗑️ Cache complètement vidé suite à l\'erreur')
    }
  }

  const loadLocalDatabase = async () => {
    try {
      console.log('🔄 Chargement de la base de données depuis le cache local...')
      setIsLoading(true)

      // Charger depuis le localStorage uniquement (plus de serveur backend)
      const savedCards = localStorage.getItem('vaultestim_discovered_cards')
      const savedSeries = localStorage.getItem('vaultestim_series_database')

      if (savedCards) {
        const cardsData = JSON.parse(savedCards)
        setDiscoveredCards(cardsData)
        console.log(`📦 ${cardsData.length} cartes chargées depuis le cache local`)
      }

      if (savedSeries) {
        const seriesData = JSON.parse(savedSeries)
        setSeriesDatabase(seriesData)
        console.log(`📦 ${seriesData.length} séries chargées depuis le cache local`)
      }

      // Si aucune donnée en cache, initialiser avec des séries vides
      if (!savedCards && !savedSeries) {
        console.log('✅ Cache local initialisé')
        setDiscoveredCards([])
        setSeriesDatabase([])
      }

    } catch (error) {
      console.error('❌ Erreur lors du chargement depuis le cache local:', error)
      setDiscoveredCards([])
      setSeriesDatabase([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadFromLocalStorage = async () => {
    try {
      setIsLoading(true)
      console.log('🚀 Démarrage chargement intelligent avec cache...')

      // 1. Vérifier la version du cache (invalide automatiquement si obsolète)
      const isCacheValid = await CardCacheService.checkCacheVersion()

      // 2. Vérifier si on a un cache local
      const hasCachedData = await CardCacheService.hasCachedData()
      const lastSyncTimestamp = await CardCacheService.getLastSyncTimestamp()

      if (isCacheValid && hasCachedData && lastSyncTimestamp) {
        console.log(`⚡ Cache local trouvé ! Dernière sync: ${lastSyncTimestamp}`)

        // 1.1 Charger depuis le cache local (instantané)
        const cachedCards = await CardCacheService.getAllCards()
        console.log(`📦 ${cachedCards.length} cartes chargées depuis le cache local (instantané)`)

        // Recalculer les blocs
        const recalculatedCards = cachedCards.map(card => {
          const originalSeries = card.set?.originalSeries || card.set?.series || card.series || 'Pokemon TCG'
          const setName = card.set?.name || ''
          const correctBlock = TCGdxService.getBlockFromSeries(originalSeries, setName)

          return {
            ...card,
            set: {
              ...card.set,
              series: correctBlock
            },
            series: correctBlock
          }
        })

        setDiscoveredCards(recalculatedCards)

        // Reconstruire la base de séries
        const rebuiltSeries = organizeCardsBySet(recalculatedCards)
        setSeriesDatabase(rebuiltSeries)
        console.log(`✅ Interface prête avec ${recalculatedCards.length} cartes depuis le cache`)

        // 1.2 Synchroniser en arrière-plan (delta sync)
        setTimeout(async () => {
          try {
            console.log('🔄 Synchronisation incrémentale en arrière-plan...')
            const newCards = await SupabaseService.loadCardsModifiedSince(lastSyncTimestamp)

            if (newCards.length > 0) {
              console.log(`🆕 ${newCards.length} nouvelles cartes depuis la dernière sync`)

              // Fusionner avec le cache existant
              const existingIds = new Set(cachedCards.map(c => c.id))
              const trulyNewCards = newCards.filter(c => !existingIds.has(c.id))

              if (trulyNewCards.length > 0) {
                // Sauvegarder dans le cache local
                await CardCacheService.saveCards(trulyNewCards)

                // Mettre à jour l'état React
                setDiscoveredCards(prev => {
                  const updated = [...prev, ...trulyNewCards]
                  const rebuiltSeries = organizeCardsBySet(updated)
                  setSeriesDatabase(rebuiltSeries)
                  return updated
                })

                console.log(`✅ ${trulyNewCards.length} nouvelles cartes ajoutées au cache et à l'interface`)
              } else {
                console.log('✅ Cache déjà à jour, aucune nouvelle carte')
              }

              // Mettre à jour le timestamp
              await CardCacheService.updateLastSyncTimestamp()
            } else {
              console.log('✅ Aucune nouvelle carte, cache à jour')
            }
          } catch (syncError) {
            console.warn('⚠️ Erreur synchronisation arrière-plan:', syncError)
            // Non bloquant - l'utilisateur a déjà ses données du cache
          }
        }, 2000)

        // 1.3 Actualisation automatique des prix (une fois par jour, 150 cartes/jour)
        setTimeout(async () => {
          try {
            console.log('💰 Vérification actualisation automatique des prix cartes...')
            const allCards = await CardCacheService.getAllCards()

            await PriceRefreshService.autoRefresh(allCards, (progress) => {
              console.log(`💰 Actualisation prix cartes: ${progress.current}/${progress.total} (${progress.percentage}%) - ${progress.currentCard}`)
            })

            // Actualisation automatique des prix du catalogue produits scellés (après les cartes)
            console.log('💰 Vérification actualisation automatique des prix produits catalogue...')
            const { SealedProductPriceRefreshService } = await import('@/services/SealedProductPriceRefreshService')

            await SealedProductPriceRefreshService.autoRefreshIfNeeded((progress) => {
              console.log(`💰 Actualisation prix catalogue produits: ${progress.current}/${progress.total} (${Math.round((progress.current / progress.total) * 100)}%)`)
            })

          } catch (refreshError) {
            console.warn('⚠️ Erreur actualisation prix:', refreshError)
            // Non bloquant
          }
        }, 5000) // Attendre 5s après le chargement initial

      } else {
        // 2. Pas de cache : téléchargement complet depuis Supabase (première fois)
        console.log('📡 Pas de cache local, téléchargement complet depuis Supabase...')

        const cardsFromBackend = await SupabaseService.loadDiscoveredCards()

        if (cardsFromBackend.length > 0) {
          console.log(`📦 ${cardsFromBackend.length} cartes chargées depuis Supabase`)

          // Recalculer les blocs
          const recalculatedCards = cardsFromBackend.map(card => {
            const originalSeries = card.set?.originalSeries || card.set?.series || card.series || 'Pokemon TCG'
            const setName = card.set?.name || ''
            const correctBlock = TCGdxService.getBlockFromSeries(originalSeries, setName)

            return {
              ...card,
              set: {
                ...card.set,
                series: correctBlock
              },
              series: correctBlock
            }
          })

          console.log(`✅ Blocs recalculés pour ${recalculatedCards.length} cartes`)
          setDiscoveredCards(recalculatedCards)

          // Reconstruire la base de séries
          const rebuiltSeries = organizeCardsBySet(recalculatedCards)
          setSeriesDatabase(rebuiltSeries)
          console.log(`✅ Base de séries reconstruite avec ${rebuiltSeries.length} extensions`)

          // Sauvegarder dans le cache local pour la prochaine fois
          console.log('💾 Sauvegarde dans le cache local...')
          await CardCacheService.saveCards(recalculatedCards)
          await CardCacheService.updateLastSyncTimestamp()
          console.log('✅ Cache local initialisé pour les prochaines connexions')

        } else {
          console.log('📦 Aucune carte dans Supabase - initialisation vide')
          setDiscoveredCards([])
          setSeriesDatabase([])
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement:', error)
      console.error('⚠️ Initialisation vide - Les cartes seront chargées via recherches')
      setDiscoveredCards([])
      setSeriesDatabase([])
    } finally {
      setIsLoading(false)
    }
  }

  const initializeBaseSeries = () => {
    // Ne plus initialiser avec des séries factices - sera alimenté via les vraies recherches
    setSeriesDatabase([])
  }

  const searchCards = async (query, abortSignal = null) => {
    if (!query.trim()) {
      return []
    }

    setIsLoading(true)
    try {
      console.log(`🔍 Recherche optimisée: "${query}"`)

      // Traduire la query pour les APIs (Pokémon + Dresseurs)
      const translatedQuery = TCGdxService.translateToEnglish(query.toLowerCase().trim())
      if (translatedQuery !== query.toLowerCase().trim()) {
        console.log(`🌐 Traduction appliquée: "${query}" → "${translatedQuery}"`)
      }

      // Vérifier si la recherche a été annulée
      if (abortSignal?.aborted) {
        console.log('🛑 Recherche annulée par l\'utilisateur')
        return []
      }

      // 1. Recherche instantanée dans le cache local d'abord
      const localResults = await searchInLocalCache(query)

      // Vérifier à nouveau l'annulation
      if (abortSignal?.aborted) {
        console.log('🛑 Recherche annulée par l\'utilisateur')
        return []
      }

      // Si on a déjà de bons résultats locaux, les retourner MAIS continuer la recherche API
      const highScoreResults = localResults.filter(card => card._searchScore >= 50)
      if (highScoreResults.length >= 5) {
        console.log(`⚡ Résultats instantanés depuis cache local: ${highScoreResults.length} cartes`)

        // Lancer la recherche API en arrière-plan pour découvrir de nouvelles cartes
        setTimeout(async () => {
          try {
            // Vérifier l'annulation avant la recherche en arrière-plan
            if (abortSignal?.aborted) return

            console.log(`🔍 Recherche API en arrière-plan pour découvrir de nouvelles cartes...`)
            const apiResults = await MultiApiService.searchCards(translatedQuery, 500)

            // Vérifier l'annulation après la recherche
            if (abortSignal?.aborted) return

            if (apiResults && apiResults.length > 0) {
              addDiscoveredCards(apiResults)
              updateSeriesDatabase(apiResults)
              console.log(`🆕 ${apiResults.length} nouvelles cartes découvertes en arrière-plan`)
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              console.log('🛑 Recherche arrière-plan annulée')
            } else {
              console.warn('⚠️ Recherche arrière-plan échouée:', error.message)
            }
          }
        }, 100)

        setIsLoading(false)
        return highScoreResults
      }

      // 2. Recherche directe avec RapidAPI
      console.log(`📡 Recherche avec APIs distantes: "${query}" → "${translatedQuery}"`)
      const apiResults = await MultiApiService.searchCards(translatedQuery, 500)

      // Vérifier l'annulation après la recherche API
      if (abortSignal?.aborted) {
        console.log('🛑 Recherche annulée par l\'utilisateur')
        return []
      }

      if (apiResults.length > 0) {
        // Ajouter les cartes trouvées à la base de données locale
        addDiscoveredCards(apiResults)

        // Organiser par extensions
        updateSeriesDatabase(apiResults)

        // Combiner avec les résultats locaux et éviter les doublons
        const combinedResults = [...apiResults]
        const existingIds = new Set(apiResults.map(card => card.id))

        localResults.forEach(card => {
          if (!existingIds.has(card.id)) {
            combinedResults.push(card)
          }
        })

        console.log(`✅ ${combinedResults.length} cartes trouvées (${apiResults.length} API + ${localResults.length} cache)`)
        return combinedResults
      }

      // 4. Si l'API échoue, retourner les résultats locaux
      if (localResults.length > 0) {
        console.log(`🔄 Fallback vers cache local: ${localResults.length} cartes`)
        return localResults
      }

      console.warn(`⚠️ Aucun résultat trouvé pour: "${query}"`)
      return []
    } catch (error) {
      // Vérifier si c'est une erreur d'annulation
      if (error.name === 'AbortError' || abortSignal?.aborted) {
        console.log('🛑 Recherche annulée par l\'utilisateur')
        return []
      }

      console.error('❌ Erreur de recherche:', error)

      // Fallback vers la base de données locale uniquement
      const localResults = await searchInLocalCache(query)
      if (localResults.length > 0) {
        console.log(`🔄 Fallback vers base locale: ${localResults.length} cartes trouvées`)
        return localResults
      }

      console.warn(`⚠️ Aucun résultat local trouvé pour: "${query}"`)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Recherche optimisée dans le cache local et la base de données locale
  const searchInLocalCache = async (query) => {
    const results = []
    const queryLower = query.toLowerCase().trim()

    // Inclure la traduction française -> anglaise dans la recherche locale
    const translatedQuery = TCGdxService.translateToEnglish(queryLower)
    const translatedQueryLower = translatedQuery.toLowerCase()

    console.log(`🔍 Recherche locale avec traduction: "${queryLower}" → "${translatedQuery}"`)

    // Score et tri pour meilleure pertinence
    const scoredResults = []

    // 1. Rechercher dans le cache de CacheService avec score
    const cacheResults = MultiApiService.searchInCache ?
      MultiApiService.searchInCache(query) : []

    cacheResults.forEach(card => {
      // Tester avec le terme original ET le terme traduit
      const scoreOriginal = calculateRelevanceScore(card, queryLower)
      const scoreTranslated = queryLower !== translatedQueryLower ?
        calculateRelevanceScore(card, translatedQueryLower) : 0
      const finalScore = Math.max(scoreOriginal, scoreTranslated)

      if (finalScore > 0) {
        scoredResults.push({ card, score: finalScore, source: 'cache' })
      }
    })

    // 2. Rechercher dans les cartes découvertes chargées depuis le backend
    const localResults = discoveredCards.filter(card => {
      if (!card.name) return false

      // Tester avec le terme original ET le terme traduit
      const scoreOriginal = calculateRelevanceScore(card, queryLower)
      const scoreTranslated = queryLower !== translatedQueryLower ?
        calculateRelevanceScore(card, translatedQueryLower) : 0

      return Math.max(scoreOriginal, scoreTranslated) > 0
    })

    // Éviter les doublons et ajouter les scores
    const existingIds = new Set(cacheResults.map(card => card.id))

    localResults.forEach(card => {
      if (!existingIds.has(card.id)) {
        // Utiliser le même calcul de score que pour le filtrage
        const scoreOriginal = calculateRelevanceScore(card, queryLower)
        const scoreTranslated = queryLower !== translatedQueryLower ?
          calculateRelevanceScore(card, translatedQueryLower) : 0
        const finalScore = Math.max(scoreOriginal, scoreTranslated)

        scoredResults.push({ card, score: finalScore, source: 'local' })
      }
    })

    // 3. Trier par score décroissant et retourner les cartes
    const sortedResults = scoredResults
      .sort((a, b) => b.score - a.score)
      .map(item => {
        return {
          ...item.card,
          _searchScore: item.score,
          _searchSource: item.source
        }
      })

    console.log(`🔍 Recherche locale "${query}": ${sortedResults.length} résultats trouvés`)
    return sortedResults
  }

  // Calculer le score de pertinence d'une carte pour une recherche
  const calculateRelevanceScore = (card, queryLower) => {
    if (!card.name) return 0

    const cardName = card.name.toLowerCase()
    const cardNameFr = card.name_fr?.toLowerCase() || ''
    let score = 0

    // Exclure uniquement les cartes de démonstration (pas les vraies cartes API)
    if (card._source === 'demo') {
      return 0
    }

    // Exclure les cartes corrompues
    if (card.image && card.image.includes('tyradex')) {
      return 0
    }

    // Helper pour vérifier la correspondance par mot complet (évite faux positifs comme "lino" dans "linoone")
    const matchesWordBoundary = (text, query) => {
      return text === query || // Exact match
        text.startsWith(query + ' ') || // Début: "grant "
        text.includes(' ' + query + ' ') || // Milieu: " grant "
        text.endsWith(' ' + query) // Fin: " grant"
    }

    // Helper pour vérifier si le mot est au début (ex: "Lady" au début de "Lady Outing")
    const startsWithWord = (text, query) => {
      return text === query || text.startsWith(query + ' ')
    }

    // Correspondance exacte (score maximum)
    if (cardName === queryLower || cardNameFr === queryLower) {
      score += 100
    }
    // Commence par la requête (score élevé - ex: "Lady" dans "Lady Outing")
    else if (startsWithWord(cardName, queryLower) || startsWithWord(cardNameFr, queryLower)) {
      score += 70
    }
    // Contient la requête comme mot complet (score moyen - ex: "lady" dans "Parasol Lady")
    else if (matchesWordBoundary(cardName, queryLower) || matchesWordBoundary(cardNameFr, queryLower)) {
      score += 30
    }
    // Fallback : contient la requête (pour compatibilité avec anciens comportements, mais score plus faible)
    // Note: Ce cas devrait rarement être utilisé maintenant avec le word boundary
    else if (cardName.includes(queryLower) || cardNameFr.includes(queryLower)) {
      score += 10 // Réduit de 25 à 10 pour pénaliser les faux positifs
    }
    // Si aucune correspondance dans le nom, vérifier les autres champs mais avec score très faible
    else {
      // Bonus pour les autres champs seulement si pas de correspondance dans le nom
      if (card.set?.name?.toLowerCase().includes(queryLower)) {
        score += 5
      }
      if (card.artist?.toLowerCase().includes(queryLower)) {
        score += 3
      }
      if (card.types?.some(type => type.toLowerCase().includes(queryLower))) {
        score += 8
      }
      if (card.rarity?.toLowerCase().includes(queryLower)) {
        score += 4
      }

      // Si toujours pas de correspondance significative, retourner 0
      if (score < 5) {
        return 0
      }
    }

    // Bonus pour les autres champs (si correspondance dans le nom trouvée)
    if (score >= 25) {
      if (card.set?.name?.toLowerCase().includes(queryLower)) {
        score += 10
      }
      if (card.artist?.toLowerCase().includes(queryLower)) {
        score += 5
      }
      if (card.types?.some(type => type.toLowerCase().includes(queryLower))) {
        score += 15
      }
      if (card.rarity?.toLowerCase().includes(queryLower)) {
        score += 8
      }
    }

    // Bonus pour les cartes populaires/récentes
    if (card.marketPrice && parseFloat(card.marketPrice) > 10) {
      score += 5
    }
    if (card.rarity && ['rare', 'ultra rare', 'secret rare'].includes(card.rarity.toLowerCase())) {
      score += 3
    }

    return score
  }


  /**
   * Nettoyer les URLs de redirection prices.pokemontcg.io d'une carte
   * Retourne la carte avec l'URL supprimée si c'est une redirection
   */
  const addDiscoveredCards = (newCards) => {
    setDiscoveredCards(prevCards => {
      const existingCardsMap = new Map(prevCards.map(card => [card.id, card]))
      const uniqueNewCards = []
      const priceUpdatedCards = []

      // Timestamp actuel pour tracer les mises à jour
      const currentTimestamp = new Date().toISOString()

      newCards.forEach(card => {
        if (!existingCardsMap.has(card.id)) {
          // Carte complètement nouvelle
          uniqueNewCards.push(card)
        } else {
          // Carte existante : mettre à jour les prix ET les structures complètes
          const existingCard = existingCardsMap.get(card.id)
          const updatedCard = {
            ...existingCard,
            // Mise à jour des champs de prix uniquement
            marketPrice: card.marketPrice,
            marketPriceDetails: card.marketPriceDetails,
            tcgPlayerPrice: card.tcgPlayerPrice,
            cardMarketPrice: card.cardMarketPrice,
            // IMPORTANT : Sauvegarder aussi les structures complètes pour référence future
            cardmarket: card.cardmarket || existingCard.cardmarket,
            tcgplayer: card.tcgplayer || existingCard.tcgplayer,
            _timestamp: currentTimestamp
          }

          priceUpdatedCards.push(updatedCard)
          existingCardsMap.set(card.id, updatedCard)

          // Logger chaque mise à jour de prix
          const priceDisplay = card.marketPrice || card.tcgPlayerPrice || card.cardMarketPrice || 'N/A'
          console.log(`🔄 Prix mis à jour pour "${card.name}": ${priceDisplay}€`)
        }
      })

      if (uniqueNewCards.length > 0 || priceUpdatedCards.length > 0) {
        // Log des résultats
        if (uniqueNewCards.length > 0) {
          console.log(`📦 Ajout de ${uniqueNewCards.length} nouvelles cartes avec TOUS leurs détails`)
        }
        if (priceUpdatedCards.length > 0) {
          console.log(`💰 Mise à jour des prix pour ${priceUpdatedCards.length} cartes existantes`)
        }

        // Combiner toutes les cartes à sauvegarder : nouvelles + mises à jour de prix
        const cardsToSave = [...uniqueNewCards, ...priceUpdatedCards]

        // Sauvegarder dans Supabase (ACCUMULATION - pas de remplacement)
        if (uniqueNewCards.length > 0) {
          // Ajouter les nouvelles cartes sans supprimer les anciennes
          SupabaseService.addDiscoveredCards(uniqueNewCards)
            .then((addedCount) => {
              console.log(`✅ Supabase: ${addedCount} nouvelles cartes ajoutées`)
            })
            .catch((error) => {
              console.error('❌ Erreur ajout cartes Supabase:', error)
              console.error('⚠️ Les cartes restent en mémoire locale')
            })

          // Sauvegarder aussi dans le cache local IndexedDB
          CardCacheService.saveCards(uniqueNewCards)
            .then((savedCount) => {
              console.log(`💾 Cache local: ${savedCount} nouvelles cartes ajoutées`)
            })
            .catch((error) => {
              console.warn('⚠️ Erreur sauvegarde cache local:', error)
              // Non bloquant - les cartes sont déjà dans Supabase
            })
        }

        // IMPORTANT: Sauvegarder aussi les cartes avec prix mis à jour
        if (priceUpdatedCards.length > 0) {
          console.log(`💰 ${priceUpdatedCards.length} prix mis à jour`)

          // Sauvegarder dans IndexedDB (cache local rapide)
          CardCacheService.saveCards(priceUpdatedCards)
            .then((savedCount) => {
              console.log(`💾 Cache local: ${savedCount} cartes avec prix mis à jour sauvegardées`)
            })
            .catch((error) => {
              console.warn('⚠️ Erreur sauvegarde prix dans cache local:', error)
            })

          // Sauvegarder dans Supabase (synchronisation multi-device)
          SupabaseService.addDiscoveredCards(priceUpdatedCards)
            .then((addedCount) => {
              console.log(`☁️ Supabase: ${addedCount} cartes avec prix synchronisées (multi-device)`)
            })
            .catch((error) => {
              console.warn('⚠️ Erreur sauvegarde prix dans Supabase:', error)
            })
        }

        // Retourner l'état mis à jour immédiatement
        const updatedCards = Array.from(existingCardsMap.values())
        console.log(`🚀 Total après traitement: ${updatedCards.length} cartes (${uniqueNewCards.length} nouvelles, ${priceUpdatedCards.length} prix mis à jour)`)

        return updatedCards
      }

      return prevCards
    })
  }

  const updateSeriesDatabase = (newCards) => {
    // Organiser les cartes par sets/séries avec RapidAPI
    const extensionsBySet = organizeCardsBySet(newCards)

    setSeriesDatabase(prevSeries => {
      const updatedSeries = [...prevSeries]

      extensionsBySet.forEach(newExtension => {
        const existingSeriesIndex = updatedSeries.findIndex(series =>
          series.id === newExtension.id || series.name.toLowerCase() === newExtension.name.toLowerCase()
        )

        if (existingSeriesIndex !== -1) {
          // Mettre à jour l'extension existante
          const existingSeries = updatedSeries[existingSeriesIndex]
          const existingCardIds = new Set(existingSeries.cards.map(card => card.id))
          const uniqueNewCards = newExtension.cards.filter(card => !existingCardIds.has(card.id))

          if (uniqueNewCards.length > 0) {
            // Fusionner les extensions - Ajouter l'ID de l'extension si ce n'est pas déjà fait
            const allExtensions = [...(existingSeries.extensions || []), newExtension.id]
            const uniqueExtensions = [...new Set(allExtensions)]

            updatedSeries[existingSeriesIndex] = {
              ...existingSeries,
              cards: [...existingSeries.cards, ...uniqueNewCards],
              totalCards: existingSeries.totalCards + uniqueNewCards.length,
              extensions: uniqueExtensions,
              releaseDate: newExtension.releaseDate // Mettre à jour avec la date la plus récente
            }
            console.log(`🔄 Mise à jour de l'extension "${existingSeries.name}" avec ${uniqueNewCards.length} nouvelles cartes`)
          }
        } else {
          // Ajouter une nouvelle extension
          const startYear = new Date(newExtension.releaseDate || '2023').getFullYear()

          const newSeries = {
            id: newExtension.id,
            name: newExtension.name,
            year: startYear,
            endYear: null,
            block: newExtension.series,
            totalCards: newExtension.cards.length,
            ownedCards: 0,
            extensions: [newExtension.id],
            cards: newExtension.cards,
            progress: 0,
            totalValue: '0.00',
            releaseDate: newExtension.releaseDate
          }
          updatedSeries.push(newSeries)
          console.log(`➕ Nouvelle extension ajoutée: "${newSeries.name}" avec ${newSeries.totalCards} cartes`)
        }
      })

      // Trier par année décroissante
      return updatedSeries.sort((a, b) => (b.year || 2023) - (a.year || 2023))
    })
  }

  const getSeriesStats = (seriesId) => {
    const series = seriesDatabase.find(s => s.id === seriesId)
    if (!series) return null

    const totalValue = series.cards.reduce((sum, card) => {
      return sum + parseFloat(card.marketPrice || 0)
    }, 0)

    return {
      ...series,
      totalValue: totalValue.toFixed(2),
      progress: series.totalCards > 0 ? (series.ownedCards / series.totalCards * 100).toFixed(1) : 0
    }
  }

  const searchInLocalDatabase = (query) => {
    if (!query.trim()) return []

    const queryLower = query.toLowerCase()
    return discoveredCards.filter(card =>
      card.name.toLowerCase().includes(queryLower) ||
      card.setName?.toLowerCase().includes(queryLower) ||
      card.artist?.toLowerCase().includes(queryLower)
    )
  }

  const getCardsBySet = async (setId) => {
    // Chercher dans le cache local avec multiples critères
    const localCards = discoveredCards.filter(card => {
      // Recherche directe par ID
      if (card.setId === setId || card.set_id === setId || card.set?.id === setId) {
        return true
      }

      // Recherche par nom de série/bloc
      if (card.set?.name === setId || card.set?.series === setId) {
        return true
      }

      // Recherche pour les cartes avec ID généré (unknown-)
      if (setId.startsWith('unknown-') && (!card.set?.id || !card.set?.name)) {
        return true
      }

      return false
    })

    console.log(`🗂️ ${localCards.length} cartes trouvées en local pour le set ${setId}`)

    // Si aucune carte trouvée, essayer une recherche plus flexible
    if (localCards.length === 0) {
      const similarCards = discoveredCards.filter(card =>
        (card.set?.id && card.set.id.includes(setId)) ||
        (card.set?.name && card.set.name.toLowerCase().includes(setId.toLowerCase())) ||
        (card.set?.series && card.set.series.toLowerCase().includes(setId.toLowerCase())) ||
        (card.set?.code && card.set.code.toLowerCase() === setId.toLowerCase())
      )

      if (similarCards.length > 0) {
        console.log(`🔍 ${similarCards.length} cartes similaires trouvées pour ${setId}`)
        return similarCards
      }
    }

    return localCards
  }

  // Fonctions d'administration
  const deleteSeriesBlock = (blockId) => {
    setSeriesDatabase(prevSeries => {
      const updatedSeries = prevSeries.filter(series => series.id !== blockId)
      console.log(`🗑️ Bloc supprimé: "${blockId}"`)
      return updatedSeries
    })
  }

  const updateSeriesBlock = (blockId, newData) => {
    setSeriesDatabase(prevSeries => {
      const updatedSeries = prevSeries.map(series => {
        if (series.id === blockId) {
          return { ...series, ...newData }
        }
        return series
      })
      console.log(`📝 Bloc mis à jour: "${blockId}"`)
      return updatedSeries
    })
  }

  const createSeriesBlock = (blockData) => {
    const newBlock = {
      id: blockData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: blockData.name,
      year: blockData.year || new Date().getFullYear(),
      endYear: blockData.endYear || null,
      totalCards: blockData.totalCards || 0,
      ownedCards: 0,
      extensions: [],
      cards: [],
      progress: 0,
      totalValue: '0.00'
    }

    setSeriesDatabase(prevSeries => {
      const updatedSeries = [...prevSeries, newBlock]
      console.log(`➕ Nouveau bloc créé: "${newBlock.name}"`)
      return updatedSeries.sort((a, b) => (b.year || 2023) - (a.year || 2023))
    })

    return newBlock
  }

  const moveExtensionToBlock = (extensionId, fromBlockId, toBlockId) => {
    setSeriesDatabase(prevSeries => {
      const updatedSeries = prevSeries.map(series => {
        if (series.id === fromBlockId) {
          // Retirer l'extension du bloc source
          const updatedExtensions = (series.extensions || []).filter(ext => ext !== extensionId)
          // Filtrer les cartes de cette extension
          const remainingCards = series.cards.filter(card => card.setId !== extensionId)

          return {
            ...series,
            extensions: updatedExtensions,
            cards: remainingCards,
            totalCards: remainingCards.length
          }
        } else if (series.id === toBlockId) {
          // Ajouter l'extension au bloc de destination
          const newExtensions = [...(series.extensions || []), extensionId]
          // Trouver les cartes de cette extension dans discoveredCards
          const extensionCards = discoveredCards.filter(card => card.setId === extensionId)
          const newCards = [...series.cards, ...extensionCards]

          return {
            ...series,
            extensions: newExtensions,
            cards: newCards,
            totalCards: newCards.length
          }
        }
        return series
      })

      console.log(`🔄 Extension "${extensionId}" déplacée de "${fromBlockId}" vers "${toBlockId}"`)
      return updatedSeries
    })

    // Mettre à jour les cartes pour qu'elles pointent vers le bon bloc
    setDiscoveredCards(prevCards => {
      return prevCards.map(card => {
        if (card.setId === extensionId) {
          const newBlock = seriesDatabase.find(s => s.id === toBlockId)
          return {
            ...card,
            block: newBlock?.name || toBlockId
          }
        }
        return card
      })
    })
  }

  // Déplacer un bloc vers le haut ou le bas
  const moveSeriesBlock = (blockId, direction) => {
    setSeriesDatabase(prevSeries => {
      const currentIndex = prevSeries.findIndex(series => series.id === blockId)
      if (currentIndex === -1) return prevSeries

      const newIndex = direction === 'up'
        ? Math.max(0, currentIndex - 1)
        : Math.min(prevSeries.length - 1, currentIndex + 1)

      if (currentIndex === newIndex) return prevSeries

      const newSeries = [...prevSeries]
      const [movedItem] = newSeries.splice(currentIndex, 1)
      newSeries.splice(newIndex, 0, movedItem)

      console.log(`📁 Bloc "${movedItem.name}" déplacé vers ${direction === 'up' ? 'le haut' : 'le bas'}`)
      return newSeries
    })
  }

  // Fusionner un bloc dans un autre bloc (le bloc source devient une extension du bloc cible)
  const mergeBlockIntoBlock = (sourceBlockId, targetBlockId) => {
    setSeriesDatabase(prevSeries => {
      const sourceBlock = prevSeries.find(s => s.id === sourceBlockId)
      const targetBlock = prevSeries.find(s => s.id === targetBlockId)

      if (!sourceBlock || !targetBlock || sourceBlockId === targetBlockId) {
        return prevSeries
      }

      // Créer un ID d'extension à partir du nom du bloc source
      const extensionId = sourceBlock.name.toLowerCase().replace(/[^a-z0-9]/g, '-')

      const updatedSeries = prevSeries.map(series => {
        if (series.id === targetBlockId) {
          // Ajouter toutes les extensions du bloc source au bloc cible
          const newExtensions = [...(series.extensions || [])]

          // Si le bloc source a des extensions, les ajouter
          if (sourceBlock.extensions && sourceBlock.extensions.length > 0) {
            newExtensions.push(...sourceBlock.extensions)
          } else {
            // Sinon, traiter le bloc source comme une seule extension
            newExtensions.push(extensionId)
          }

          // Fusionner toutes les cartes
          const newCards = [...series.cards, ...sourceBlock.cards]

          return {
            ...series,
            extensions: [...new Set(newExtensions)], // Supprimer les doublons
            cards: newCards,
            totalCards: newCards.length
          }
        }
        return series
      }).filter(series => series.id !== sourceBlockId) // Supprimer le bloc source

      console.log(`🔄 Bloc "${sourceBlock.name}" fusionné dans "${targetBlock.name}"`)
      return updatedSeries
    })

    // Mettre à jour les cartes pour qu'elles pointent vers le bon bloc
    setDiscoveredCards(prevCards => {
      return prevCards.map(card => {
        const sourceBlock = seriesDatabase.find(s => s.id === sourceBlockId)
        if (sourceBlock && sourceBlock.cards.some(c => c.id === card.id)) {
          const targetBlock = seriesDatabase.find(s => s.id === targetBlockId)
          return {
            ...card,
            block: targetBlock?.name || targetBlockId
          }
        }
        return card
      })
    })
  }

  // Supprimer plusieurs blocs à la fois
  const deleteMultipleSeriesBlocks = (blockIds) => {
    setSeriesDatabase(prevSeries => {
      const updatedSeries = prevSeries.filter(series => !blockIds.includes(series.id))
      console.log(`🗑️ Suppression de ${blockIds.length} blocs`)
      return updatedSeries
    })
  }

  // Supprimer plusieurs extensions d'un bloc
  const deleteMultipleExtensions = (blockId, extensionIds) => {
    setSeriesDatabase(prevSeries => {
      const updatedSeries = prevSeries.map(series => {
        if (series.id === blockId) {
          const updatedExtensions = (series.extensions || []).filter(ext => !extensionIds.includes(ext))
          const remainingCards = series.cards.filter(card => !extensionIds.includes(card.setId))

          return {
            ...series,
            extensions: updatedExtensions,
            cards: remainingCards,
            totalCards: remainingCards.length
          }
        }
        return series
      })

      console.log(`🗑️ Suppression de ${extensionIds.length} extensions du bloc "${blockId}"`)
      return updatedSeries
    })

    // Supprimer aussi les cartes correspondantes de discoveredCards
    setDiscoveredCards(prevCards => {
      return prevCards.filter(card => !extensionIds.includes(card.setId))
    })
  }

  // Get cards by series ID
  const getCardsBySeries = (seriesId) => {
    return discoveredCards.filter(card => card.setId === seriesId)
  }

  // Update a specific card in the database
  const updateCardInDatabase = (cardId, updatedData) => {
    setDiscoveredCards(prevCards => {
      return prevCards.map(card =>
        card.id === cardId ? { ...card, ...updatedData } : card
      )
    })

    // Also update in series database
    setSeriesDatabase(prevSeries => {
      return prevSeries.map(series => ({
        ...series,
        cards: series.cards.map(card =>
          card.id === cardId ? { ...card, ...updatedData } : card
        )
      }))
    })

    console.log(`✏️ Carte mise à jour:`, updatedData)
  }

  // Delete a card from the database
  const deleteCardFromDatabase = (cardId) => {
    setDiscoveredCards(prevCards => {
      return prevCards.filter(card => card.id !== cardId)
    })

    // Also remove from series database
    setSeriesDatabase(prevSeries => {
      return prevSeries.map(series => ({
        ...series,
        cards: series.cards.filter(card => card.id !== cardId),
        totalCards: series.cards.filter(card => card.id !== cardId).length
      }))
    })

    console.log(`🗑️ Carte supprimée: ${cardId}`)
  }

  // Move card to another series
  const moveCardToSeries = (cardId, targetSeriesId) => {
    const card = discoveredCards.find(c => c.id === cardId)
    if (!card) return

    const updatedCard = {
      ...card,
      setId: targetSeriesId,
      series: targetSeriesId
    }

    // Update in discovered cards
    setDiscoveredCards(prevCards => {
      return prevCards.map(c =>
        c.id === cardId ? updatedCard : c
      )
    })

    // Update in series database
    setSeriesDatabase(prevSeries => {
      return prevSeries.map(series => {
        if (series.id === targetSeriesId) {
          // Add card to target series
          return {
            ...series,
            cards: [...series.cards, updatedCard],
            totalCards: series.cards.length + 1,
            extensions: [...new Set([...(series.extensions || []), targetSeriesId])]
          }
        } else {
          // Remove card from other series
          return {
            ...series,
            cards: series.cards.filter(c => c.id !== cardId),
            totalCards: series.cards.filter(c => c.id !== cardId).length
          }
        }
      })
    })

    console.log(`📦 Carte déplacée vers la série: ${targetSeriesId}`)
  }

  // Fonctions de gestion du cache
  const getCacheStats = () => {
    return CacheService.getCacheStats()
  }

  const clearCache = () => {
    return CacheService.clearAllCache()
  }

  const cleanDemoDataFromCache = () => {
    let cleanedCount = 0
    const cardsToRemove = []

    // Parcourir le localStorage pour trouver les cartes de démonstration
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key && key.startsWith('vaultestim_cards_')) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const cacheEntry = JSON.parse(cached)
            const card = cacheEntry.data

            // Vérifier si c'est une carte de démonstration
            if (card._source === 'demo' || card._source === 'tcgdx' ||
                card.id?.startsWith('demo-') ||
                (card.image && !card.image.startsWith('https://images.pokemontcg.io/'))) {
              cardsToRemove.push(key)
              cleanedCount++
            }
          }
        } catch (error) {
          // Supprimer les entrées corrompues aussi
          cardsToRemove.push(key)
          cleanedCount++
        }
      }
    }

    // Supprimer les cartes identifiées
    cardsToRemove.forEach(key => {
      localStorage.removeItem(key)
    })

    console.log(`🧹 ${cleanedCount} cartes de démonstration supprimées du cache`)
    return cleanedCount
  }

  const clearSearchCache = (searchTerm) => {
    const cacheKey = `tcg_search_${searchTerm}_500`

    // Essayer plusieurs formats de clés possibles
    const possibleKeys = [
      `vaultestim_cache_${cacheKey}`,
      cacheKey,
      `tcg_search_${searchTerm}_500`
    ]

    let cleared = false
    possibleKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        console.log(`🧹 Cache de recherche vidé pour: "${searchTerm}" (clé: ${key})`)
        cleared = true
      }
    })

    return cleared
  }

  const getApiStatus = () => {
    return MultiApiService.getApiStatus()
  }

  const checkApiHealth = async () => {
    return await MultiApiService.checkAllApis()
  }

  const getSystemStats = () => {
    return MultiApiService.getStats()
  }

  // Pré-charger les cartes populaires en arrière-plan
  const preloadPopularCards = async () => {
    const popularQueries = [
      'Charizard', 'Pikachu', 'Mewtwo', 'Lugia', 'Rayquaza',
      'dracaufeu', 'pikachu', 'miaouss', 'salamèche', 'tortank',
      'florizarre', 'leviator', 'pêchaminus', 'flamigator'
    ]

    console.log('🚀 Pré-chargement des cartes populaires en arrière-plan...')
    let preloaded = 0

    for (const query of popularQueries) {
      try {
        // Vérifier si déjà en cache
        const cached = CacheService.getCacheSearch(query)
        if (!cached) {
          // Rechercher et mettre en cache (sans attendre)
          const searchPromise = searchCards(query).then(results => {
            if (results.length > 0) {
              preloaded++
              console.log(`✅ Pré-chargé "${query}": ${results.length} cartes`)
            }
          }).catch(error => {
            console.warn(`⚠️ Échec pré-chargement de "${query}":`, error.message)
          })

          // Ne pas attendre pour éviter de bloquer
          searchPromise

          // Petite pause pour éviter de surcharger les APIs
          await new Promise(resolve => setTimeout(resolve, 800))
        } else {
          console.log(`📦 "${query}" déjà en cache`)
        }
      } catch (error) {
        console.warn(`⚠️ Erreur pré-chargement "${query}":`, error.message)
      }
    }

    console.log(`🎯 Pré-chargement terminé: ${preloaded} nouvelles requêtes cachées`)
  }

  // Synchronisation périodique en arrière-plan
  const startBackgroundSync = () => {
    // Nettoyer le cache expiré toutes les 10 minutes
    const cleanupInterval = setInterval(() => {
      const cleaned = CacheService.cleanExpiredCache()
      if (cleaned > 0) {
        console.log(`🧹 Nettoyage automatique: ${cleaned} entrées expirées supprimées`)
      }
    }, 10 * 60 * 1000)

    // Vérifier la santé des APIs toutes les 15 minutes
    const healthCheckInterval = setInterval(async () => {
      try {
        const results = await MultiApiService.checkAllApis()
        const failedApis = results.filter(r => r.status === 'ERROR')

        if (failedApis.length > 0) {
          console.warn(`⚠️ APIs en échec: ${failedApis.map(r => r.api).join(', ')}`)
        } else {
          console.log('✅ Toutes les APIs fonctionnent correctement')
        }
      } catch (error) {
        console.warn('❌ Échec vérification APIs:', error.message)
      }
    }, 15 * 60 * 1000)

    // Pré-chargement automatique désactivé pour éviter les recherches non sollicitées
    // const preloadInterval = setInterval(() => {
    //   console.log('🔄 Actualisation des cartes populaires...')
    //   preloadPopularCards()
    // }, 60 * 60 * 1000)

    // Retourner une fonction de nettoyage
    return () => {
      clearInterval(cleanupInterval)
      clearInterval(healthCheckInterval)
      // clearInterval(preloadInterval) // Désactivé avec le pré-chargement
    }
  }

  // Migration des prix : récupérer les structures complètes de prix pour toutes les cartes existantes
  const migratePrices = async (onProgress = null, cancelSignal = null) => {
    try {
      console.log('🔄 Démarrage de la migration des prix...')
      console.log('⚠️ Cette opération peut prendre plusieurs minutes pour 14,000+ cartes')

      // Charger toutes les cartes depuis le cache local
      const allCards = discoveredCards

      if (allCards.length === 0) {
        console.log('⚠️ Aucune carte à migrer')
        return { success: 0, errors: 0, total: 0 }
      }

      // IMPORTANT : Calculer d'abord combien de cartes ont DÉJÀ les prix
      const cardsWithPrices = allCards.filter(card => card.cardmarket || card.tcgplayer)
      const cardsWithoutPrices = allCards.filter(card => !card.cardmarket && !card.tcgplayer)
      const alreadyMigrated = cardsWithPrices.length

      console.log(`📊 ${allCards.length} cartes totales`)
      console.log(`✅ ${alreadyMigrated} cartes déjà migrées`)
      console.log(`⏭️ ${cardsWithoutPrices.length} cartes restantes à migrer`)

      if (cardsWithoutPrices.length === 0) {
        console.log('🎉 Toutes les cartes sont déjà migrées !')
        return {
          success: 0,
          errors: 0,
          skipped: allCards.length,
          total: allCards.length,
          alreadyComplete: true
        }
      }

      // Configuration du traitement par batch
      const BATCH_SIZE = 10 // Réduire pour éviter rate limiting
      const DELAY_BETWEEN_BATCHES = 2000 // 2 secondes entre chaque batch

      let processedCount = 0
      let updatedCount = 0
      let errorCount = 0
      let skippedCount = 0 // NE PAS initialiser avec alreadyMigrated (évite double comptage)

      // Appeler onProgress avec l'état initial pour afficher la progression de départ
      const initialProgress = Math.ceil((alreadyMigrated / allCards.length) * 100)
      if (onProgress) {
        onProgress({
          total: allCards.length,
          processed: 0,
          updated: 0,
          skipped: alreadyMigrated,
          errors: 0,
          progress: initialProgress,
          alreadyMigrated: alreadyMigrated
        })
      }

      // Traiter par batches
      for (let i = 0; i < allCards.length; i += BATCH_SIZE) {
        // Vérifier si la migration a été annulée
        if (cancelSignal?.cancelled) {
          console.log('⏸️ Migration interrompue par l\'utilisateur')
          return {
            success: updatedCount,
            errors: errorCount,
            skipped: skippedCount,
            total: allCards.length,
            interrupted: true,
            progress: Math.round((processedCount / allCards.length) * 100)
          }
        }

        const batch = allCards.slice(i, Math.min(i + BATCH_SIZE, allCards.length))

        // Traiter toutes les cartes du batch en parallèle
        const batchPromises = batch.map(async (card) => {
          try {
            // Vérifier si la carte a déjà les structures de prix
            if (card.cardmarket || card.tcgplayer) {
              skippedCount++
              return null // Déjà migrée
            }

            // Récupérer les données fraîches de l'API Pokemon TCG
            const response = await fetch(`/api/pokemontcg/v2/cards/${card.id}`)

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`)
            }

            const data = await response.json()
            const freshCard = data.data

            if (freshCard) {
              updatedCount++

              // Créer la carte mise à jour avec les structures complètes
              return {
                ...card,
                cardmarket: freshCard.cardmarket || null,
                tcgplayer: freshCard.tcgplayer || null,
                marketPrice: freshCard.cardmarket?.prices?.averageSellPrice || freshCard.tcgplayer?.prices?.holofoil?.market || card.marketPrice,
                _timestamp: new Date().toISOString()
              }
            }

            return null
          } catch (error) {
            errorCount++
            console.warn(`⚠️ Erreur migration prix pour ${card.name} (${card.id}):`, error.message)
            return null
          }
        })

        // Attendre que toutes les cartes du batch soient traitées
        const batchResults = await Promise.all(batchPromises)

        // Filtrer les résultats valides et sauvegarder
        const validResults = batchResults.filter(card => card !== null)
        if (validResults.length > 0) {
          // Sauvegarder dans IndexedDB (cache local rapide)
          await CardCacheService.saveCards(validResults)

          // Sauvegarder dans Supabase (synchronisation multi-device)
          SupabaseService.addDiscoveredCards(validResults)
            .then((addedCount) => {
              console.log(`☁️ Supabase: ${addedCount} cartes avec prix synchronisées (multi-device)`)
            })
            .catch((error) => {
              console.warn('⚠️ Erreur sauvegarde prix dans Supabase:', error)
            })

          // Mettre à jour l'état React
          setDiscoveredCards(prevCards => {
            const cardsMap = new Map(prevCards.map(c => [c.id, c]))
            validResults.forEach(updatedCard => {
              cardsMap.set(updatedCard.id, updatedCard)
            })
            return Array.from(cardsMap.values())
          })
        }

        processedCount += batch.length

        // Calculer la progression RÉELLE en incluant les cartes déjà migrées
        // alreadyMigrated = cartes qui avaient les prix AVANT la migration
        // processedCount = cartes traitées PENDANT la migration
        // Total migré = cartes avec prix (alreadyMigrated + updatedCount nouvellement migrées)
        const totalWithPrices = alreadyMigrated + updatedCount
        const progress = Math.min(100, Math.ceil((totalWithPrices / allCards.length) * 100))

        // Log de progression
        console.log(`🔄 Migration: ${processedCount}/${allCards.length} cartes (${progress}%) | ✅ ${updatedCount} migrées | ⏭️ ${skippedCount} déjà OK | ❌ ${errorCount} erreurs`)

        // Callback de progression
        if (onProgress) {
          onProgress({
            total: allCards.length,
            processed: processedCount,
            updated: updatedCount,
            skipped: skippedCount,
            errors: errorCount,
            progress: progress,
            alreadyMigrated: alreadyMigrated // Pour affichage dans l'UI
          })
        }

        // Pause entre les batches pour éviter le rate limiting
        if (i + BATCH_SIZE < allCards.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
        }
      }

      // Mettre à jour le timestamp de synchronisation
      await CardCacheService.updateLastSyncTimestamp()

      console.log(`✅ Migration terminée !`)
      console.log(`   📊 Total: ${allCards.length} cartes`)
      console.log(`   ✅ Migrées: ${updatedCount} cartes`)
      console.log(`   ⏭️ Déjà OK: ${skippedCount} cartes`)
      console.log(`   ❌ Erreurs: ${errorCount} cartes`)

      return {
        success: updatedCount,
        errors: errorCount,
        skipped: skippedCount,
        total: allCards.length
      }

    } catch (error) {
      console.error('❌ Erreur lors de la migration des prix:', error)
      throw error
    }
  }

  /**
   * Migrer les attaques pour toutes les cartes
   * Récupère attacks, abilities, weaknesses, resistances, retreat_cost depuis l'API Pokemon TCG
   */
  const migrateAttacks = async (onProgress = null, cancelSignal = null) => {
    try {
      console.log('🔄 Démarrage de la migration des attaques...')
      console.log('⚠️ Cette opération peut prendre plusieurs minutes')

      const allCards = discoveredCards

      if (allCards.length === 0) {
        console.log('⚠️ Aucune carte à migrer')
        return { success: 0, errors: 0, total: 0 }
      }

      // Calculer combien de cartes ont déjà les attaques
      const cardsWithAttacks = allCards.filter(card =>
        card.attacks && Array.isArray(card.attacks) && card.attacks.length > 0
      )
      const cardsWithoutAttacks = allCards.filter(card =>
        !card.attacks || !Array.isArray(card.attacks) || card.attacks.length === 0
      )
      const alreadyMigrated = cardsWithAttacks.length

      console.log(`📊 ${allCards.length} cartes totales`)
      console.log(`✅ ${alreadyMigrated} cartes avec attaques`)
      console.log(`⏭️ ${cardsWithoutAttacks.length} cartes sans attaques`)

      if (cardsWithoutAttacks.length === 0) {
        console.log('🎉 Toutes les cartes ont déjà leurs attaques !')
        return {
          success: 0,
          errors: 0,
          skipped: allCards.length,
          total: allCards.length,
          alreadyComplete: true
        }
      }

      // Configuration
      const BATCH_SIZE = 10
      const DELAY_BETWEEN_BATCHES = 2000 // 2 secondes

      let processedCount = 0
      let updatedCount = 0
      let errorCount = 0
      let skippedCount = alreadyMigrated
      let notFoundCount = 0

      // Traiter par batches
      for (let i = 0; i < allCards.length; i += BATCH_SIZE) {
        // Vérifier annulation
        if (cancelSignal?.cancelled) {
          console.log('⏸️ Migration interrompue par l\'utilisateur')
          return {
            success: updatedCount,
            errors: errorCount,
            skipped: skippedCount,
            total: allCards.length,
            interrupted: true,
            progress: Math.round((processedCount / allCards.length) * 100)
          }
        }

        const batch = allCards.slice(i, Math.min(i + BATCH_SIZE, allCards.length))

        // Traiter le batch en parallèle
        const batchPromises = batch.map(async (card) => {
          try {
            // Vérifier si la carte a déjà les attaques
            if (card.attacks && Array.isArray(card.attacks) && card.attacks.length > 0) {
              skippedCount++
              return null
            }

            // Récupérer depuis l'API Pokemon TCG
            const response = await fetch(`/api/pokemontcg/v2/cards/${card.id}`)

            if (!response.ok) {
              if (response.status === 404) {
                notFoundCount++
                console.warn(`⚠️ Carte non trouvée: ${card.name} (${card.id})`)
                return null
              }
              throw new Error(`API error: ${response.status}`)
            }

            const data = await response.json()
            const freshCard = data.data

            if (freshCard) {
              // Vérifier si on a des données à ajouter
              const hasData = freshCard.attacks || freshCard.abilities || freshCard.weaknesses ||
                             freshCard.resistances || freshCard.retreatCost

              if (hasData) {
                updatedCount++

                // Créer la carte mise à jour
                return {
                  ...card,
                  attacks: freshCard.attacks || null,
                  abilities: freshCard.abilities || null,
                  weaknesses: freshCard.weaknesses || null,
                  resistances: freshCard.resistances || null,
                  retreat_cost: freshCard.retreatCost || null,
                  _timestamp: new Date().toISOString()
                }
              }
            }

            return null
          } catch (error) {
            errorCount++
            console.warn(`⚠️ Erreur migration attaques pour ${card.name} (${card.id}):`, error.message)
            return null
          }
        })

        // Attendre que le batch soit terminé
        const batchResults = await Promise.all(batchPromises)

        // Filtrer et sauvegarder les résultats valides
        const validResults = batchResults.filter(card => card !== null)
        if (validResults.length > 0) {
          // Sauvegarder dans IndexedDB
          await CardCacheService.saveCards(validResults)

          // Sauvegarder dans Supabase (CRITIQUE: await ajouté)
          try {
            const addedCount = await SupabaseService.addDiscoveredCards(validResults)
            console.log(`☁️ Supabase: ${addedCount} cartes avec attaques synchronisées`)
          } catch (error) {
            console.warn('⚠️ Erreur sauvegarde attaques dans Supabase:', error)
          }

          // Mettre à jour l'état React
          setDiscoveredCards(prevCards => {
            const cardsMap = new Map(prevCards.map(c => [c.id, c]))
            validResults.forEach(updatedCard => {
              cardsMap.set(updatedCard.id, updatedCard)
            })
            return Array.from(cardsMap.values())
          })
        }

        processedCount += batch.length

        // Calculer la progression
        const progress = Math.min(100, Math.round((processedCount / allCards.length) * 100))

        console.log(`🔄 Migration: ${processedCount}/${allCards.length} cartes (${progress}%) | ✅ ${updatedCount} migrées | ⏭️ ${skippedCount} déjà OK | ❌ ${errorCount} erreurs | ⚠️ ${notFoundCount} non trouvées`)

        // Callback de progression
        if (onProgress) {
          onProgress(progress)
        }

        // Pause entre les batches
        if (i + BATCH_SIZE < allCards.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
        }
      }

      // Mettre à jour le timestamp
      await CardCacheService.updateLastSyncTimestamp()

      console.log(`✅ Migration des attaques terminée !`)
      console.log(`   📊 Total: ${allCards.length} cartes`)
      console.log(`   ✅ Migrées: ${updatedCount} cartes`)
      console.log(`   ⏭️ Déjà OK: ${skippedCount} cartes`)
      console.log(`   ❌ Erreurs: ${errorCount} cartes`)
      console.log(`   ⚠️ Non trouvées: ${notFoundCount} cartes`)

      return {
        success: updatedCount,
        errors: errorCount,
        skipped: skippedCount,
        total: allCards.length,
        notFound: notFoundCount
      }

    } catch (error) {
      console.error('❌ Erreur lors de la migration des attaques:', error)
      throw error
    }
  }

// Réessayer uniquement les cartes sans prix
  const retryCardsWithoutPrices = async (onProgress = null, cancelSignal = null) => {
    try {
      console.log('🔄 Retry des cartes sans prix...')

      // Filtrer uniquement les cartes SANS prix
      const cardsWithoutPrices = discoveredCards.filter(card => !card.cardmarket && !card.tcgplayer)

      if (cardsWithoutPrices.length === 0) {
        console.log('✅ Toutes les cartes ont déjà des prix !')
        return {
          success: 0,
          errors: 0,
          skipped: 0,
          total: 0,
          cardsStillWithoutPrices: [],
          alreadyComplete: true
        }
      }

      console.log(`📊 ${cardsWithoutPrices.length} cartes sans prix à réessayer`)

      const BATCH_SIZE = 10
      const DELAY_BETWEEN_BATCHES = 2000 // 2 secondes

      let processedCount = 0
      let updatedCount = 0
      let errorCount = 0
      const cardsStillWithoutPrices = [] // Liste des cartes qui n'ont toujours pas de prix après retry

      // Traiter par batches
      for (let i = 0; i < cardsWithoutPrices.length; i += BATCH_SIZE) {
        // Vérifier annulation
        if (cancelSignal?.cancelled) {
          console.log('⏸️ Retry interrompu par l\'utilisateur')
          return {
            success: updatedCount,
            errors: errorCount,
            skipped: 0,
            total: cardsWithoutPrices.length,
            cardsStillWithoutPrices,
            interrupted: true,
            progress: Math.round((processedCount / cardsWithoutPrices.length) * 100)
          }
        }

        const batch = cardsWithoutPrices.slice(i, Math.min(i + BATCH_SIZE, cardsWithoutPrices.length))

        // Traiter le batch
        const batchPromises = batch.map(async (card) => {
          try {
            // Récupérer depuis l'API Pokemon TCG
            const response = await fetch(`/api/pokemontcg/v2/cards/${card.id}`)

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`)
            }

            const data = await response.json()
            const freshCard = data.data

            if (freshCard) {
              // Vérifier si l'API retourne des prix
              if (freshCard.cardmarket || freshCard.tcgplayer) {
                updatedCount++

                return {
                  ...card,
                  cardmarket: freshCard.cardmarket || null,
                  tcgplayer: freshCard.tcgplayer || null,
                  marketPrice: freshCard.cardmarket?.prices?.averageSellPrice || freshCard.tcgplayer?.prices?.holofoil?.market || card.marketPrice,
                  _timestamp: new Date().toISOString()
                }
              } else {
                // L'API ne fournit pas de prix pour cette carte
                cardsStillWithoutPrices.push({
                  id: card.id,
                  name: card.name,
                  set: card.set?.name || 'Unknown',
                  number: card.number || 'N/A',
                  rarity: card.rarity || 'Unknown'
                })
                return null
              }
            }

            return null
          } catch (error) {
            errorCount++
            console.warn(`⚠️ Erreur retry prix pour ${card.name} (${card.id}):`, error.message)
            // Ajouter aussi aux cartes sans prix en cas d'erreur
            cardsStillWithoutPrices.push({
              id: card.id,
              name: card.name,
              set: card.set?.name || 'Unknown',
              number: card.number || 'N/A',
              rarity: card.rarity || 'Unknown',
              error: error.message
            })
            return null
          }
        })

        const batchResults = await Promise.all(batchPromises)
        const validResults = batchResults.filter(card => card !== null)

        // Sauvegarder les cartes avec prix récupérés
        if (validResults.length > 0) {
          await CardCacheService.saveCards(validResults)

          SupabaseService.addDiscoveredCards(validResults)
            .catch((error) => {
              console.warn('⚠️ Erreur sauvegarde prix dans Supabase:', error)
            })

          // Mettre à jour React state
          setDiscoveredCards(prevCards => {
            const cardsMap = new Map(prevCards.map(c => [c.id, c]))
            validResults.forEach(updatedCard => {
              cardsMap.set(updatedCard.id, updatedCard)
            })
            return Array.from(cardsMap.values())
          })
        }

        processedCount += batch.length

        const progress = Math.min(100, Math.round((processedCount / cardsWithoutPrices.length) * 100))

        console.log(`🔄 Retry: ${processedCount}/${cardsWithoutPrices.length} cartes (${progress}%) | ✅ ${updatedCount} récupérés | ❌ ${errorCount} erreurs | 🚫 ${cardsStillWithoutPrices.length} toujours sans prix`)

        if (onProgress) {
          onProgress({
            total: cardsWithoutPrices.length,
            processed: processedCount,
            updated: updatedCount,
            errors: errorCount,
            stillWithoutPrices: cardsStillWithoutPrices.length,
            progress: progress
          })
        }

        // Pause entre batches
        if (i + BATCH_SIZE < cardsWithoutPrices.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
        }
      }

      await CardCacheService.updateLastSyncTimestamp()

      console.log(`✅ Retry terminé !`)
      console.log(`   📊 Total: ${cardsWithoutPrices.length} cartes`)
      console.log(`   ✅ Prix récupérés: ${updatedCount} cartes`)
      console.log(`   ❌ Erreurs: ${errorCount} cartes`)
      console.log(`   🚫 Toujours sans prix: ${cardsStillWithoutPrices.length} cartes`)

      return {
        success: updatedCount,
        errors: errorCount,
        skipped: 0,
        total: cardsWithoutPrices.length,
        cardsStillWithoutPrices
      }

    } catch (error) {
      console.error('❌ Erreur lors du retry des prix:', error)
      throw error
    }
  }


    // Rafraîchir les prix de toutes les cartes dans la base de données

  /**
   * Convertir les URLs de redirection prices.pokemontcg.io en URLs directes CardMarket
   * Résout le problème de lenteur (10-20s → 2-3s)
   */
  const refreshAllPrices = async () => {
    try {
      console.log('🔄 Démarrage de la mise à jour automatique des prix...')

      // Charger toutes les cartes depuis le backend
      const allCards = await BackendApiService.getDiscoveredCards()

      if (allCards.length === 0) {
        console.log('⚠️ Aucune carte à mettre à jour')
        return
      }

      // Obtenir tous les IDs uniques de cartes
      const uniqueCardIds = [...new Set(allCards.map(card => card.id))]
      console.log(`📊 ${uniqueCardIds.length} cartes uniques à mettre à jour`)

      // Configuration du traitement par batch
      const BATCH_SIZE = 20
      const DELAY_BETWEEN_BATCHES = 1000 // 1 seconde

      let processedCount = 0
      let updatedCount = 0
      let errorCount = 0

      // Traiter par batches
      for (let i = 0; i < uniqueCardIds.length; i += BATCH_SIZE) {
        const batch = uniqueCardIds.slice(i, Math.min(i + BATCH_SIZE, uniqueCardIds.length))

        // Traiter toutes les cartes du batch en parallèle
        const batchPromises = batch.map(async (cardId) => {
          try {
            // Récupérer les données fraîches de l'API
            const freshCardData = await TCGdxService.getCardById(cardId)

            if (freshCardData && freshCardData.marketPrice) {
              updatedCount++
              return freshCardData
            }

            return null
          } catch (error) {
            errorCount++
            console.warn(`⚠️ Erreur mise à jour prix pour ${cardId}:`, error.message)
            return null
          }
        })

        // Attendre que toutes les cartes du batch soient traitées
        const batchResults = await Promise.all(batchPromises)

        // Filtrer les résultats valides et mettre à jour via addDiscoveredCards
        const validResults = batchResults.filter(card => card !== null)
        if (validResults.length > 0) {
          addDiscoveredCards(validResults)
        }

        processedCount += batch.length

        // Log de progression
        console.log(`🔄 Mise à jour des prix: ${processedCount}/${uniqueCardIds.length} cartes traitées (${updatedCount} mises à jour, ${errorCount} erreurs)`)

        // Pause entre les batches pour éviter le rate limiting
        if (i + BATCH_SIZE < uniqueCardIds.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
        }
      }

      console.log(`✅ Mise à jour des prix terminée: ${updatedCount}/${uniqueCardIds.length} cartes mises à jour avec succès`)

      if (errorCount > 0) {
        console.warn(`⚠️ ${errorCount} erreurs rencontrées lors de la mise à jour`)
      }

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour automatique des prix:', error)
    }
  }

  const value = {
    // État
    discoveredCards,
    seriesDatabase,
    isLoading,

    // Actions
    searchCards,
    searchInLocalDatabase,
    getCardsBySet,
    getSeriesStats,
    addDiscoveredCards,
    updateSeriesDatabase,

    // Fonctions d'administration
    deleteSeriesBlock,
    updateSeriesBlock,
    createSeriesBlock,
    moveExtensionToBlock,
    moveSeriesBlock,
    mergeBlockIntoBlock,
    deleteMultipleSeriesBlocks,
    deleteMultipleExtensions,

    // Gestion des cartes individuelles
    getCardsBySeries,
    updateCardInDatabase,
    deleteCardFromDatabase,

    // Statistiques Backend
    getStorageStats: async () => {
      try {
        // Retourner les stats depuis le state chargé depuis backend
        const stats = {
          cards: discoveredCards.length,
          series: seriesDatabase.length,
          storage: 'backend',
          unlimited: true
        }
        console.log('📊 Statistiques Backend:', stats)
        return stats
      } catch (error) {
        console.error('❌ Erreur stats:', error)
        return { cards: 0, series: 0, storage: 'backend', unlimited: true }
      }
    },

    // Fonction pour récupérer TOUTES les cartes et les sauvegarder dans le backend
    recoverAllCards: async () => {
      console.log('🔄 Récupération complète de TOUTES les cartes...')

      // Liste des Pokémon populaires pour récupérer un maximum de cartes
      const pokemonList = [
        'pikachu', 'charizard', 'blastoise', 'venusaur', 'mewtwo', 'mew',
        'lugia', 'ho-oh', 'celebi', 'rayquaza', 'groudon', 'kyogre',
        'dialga', 'palkia', 'giratina', 'arceus', 'reshiram', 'zekrom',
        'kyurem', 'xerneas', 'yveltal', 'zygarde', 'solgaleo', 'lunala',
        'necrozma', 'zacian', 'zamazenta', 'eternatus', 'calyrex',

        // Starters populaires
        'bulbasaur', 'charmander', 'squirtle', 'chikorita', 'cyndaquil',
        'totodile', 'treecko', 'torchic', 'mudkip', 'turtwig', 'chimchar',
        'piplup', 'snivy', 'tepig', 'oshawott', 'chespin', 'fennekin',
        'froakie', 'rowlet', 'litten', 'popplio', 'grookey', 'scorbunny',
        'sobble', 'sprigatito', 'fuecoco', 'quaxly',

        // Pokémon iconiques
        'gengar', 'alakazam', 'machamp', 'golem', 'dragonite', 'gyarados',
        'lapras', 'eevee', 'vaporeon', 'jolteon', 'flareon', 'espeon',
        'umbreon', 'leafeon', 'glaceon', 'sylveon', 'lucario', 'garchomp',
        'metagross', 'salamence', 'tyranitar', 'aggron', 'swampert'
      ]

      let totalRecovered = 0

      for (const pokemon of pokemonList) {
        try {
          console.log(`🔍 Recherche complète: ${pokemon}`)
          const results = await searchCards(pokemon)

          if (results && results.length > 0) {
            totalRecovered += results.length
            console.log(`✅ ${pokemon}: ${results.length} cartes récupérées (Total: ${totalRecovered})`)
          }

          // Pause entre recherches pour éviter le rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.warn(`⚠️ Erreur récupération ${pokemon}:`, error.message)
        }
      }

      console.log(`🎉 Récupération terminée ! ${totalRecovered} cartes récupérées au total`)
      return totalRecovered
    },
    moveCardToSeries,

    // Gestion du cache et APIs
    getCacheStats,
    clearCache,
    cleanDemoDataFromCache,
    clearSearchCache,
    getApiStatus,
    checkApiHealth,
    getSystemStats,
    preloadPopularCards,
    searchInLocalCache,
    startBackgroundSync,
    refreshAllPrices,
    migratePrices, // Migration ponctuelle des prix pour cartes existantes
    migrateAttacks, // Migration ponctuelle des attaques pour cartes existantes
    retryCardsWithoutPrices, // Retry uniquement les cartes sans prix

    // Recherche rapide et suggestions
    quickSearch: searchInLocalCache,
    calculateRelevanceScore,

    // Utilitaires
    totalDiscoveredCards: discoveredCards.length,
    totalSeries: seriesDatabase.length
  }

  return (
    <CardDatabaseContext.Provider value={value}>
      {children}
    </CardDatabaseContext.Provider>
  )
}

export function useCardDatabase() {
  const context = useContext(CardDatabaseContext)
  if (!context) {
    throw new Error('useCardDatabase must be used within a CardDatabaseProvider')
  }
  return context
}