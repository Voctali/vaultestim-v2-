import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useCardDatabase } from '@/hooks/useCardDatabase.jsx'
import { buildBlocksHierarchy } from '@/services/BlockHierarchyService'
import { CardMarketUrlFixService } from '@/services/CardMarketUrlFixService'
import { QuotaTracker } from '@/services/QuotaTracker'
import { RapidAPIService } from '@/services/RapidAPIService'
import { supabase } from '@/lib/supabaseClient'
import {
  Search,
  Zap,
  AlertCircle,
  Play,
  Square,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  SkipForward,
  RefreshCw,
  Settings2
} from 'lucide-react'

export function CardMarketDebugPanel() {
  const { discoveredCards, seriesDatabase } = useCardDatabase()

  // États pour les sélecteurs
  const [selectedBlock, setSelectedBlock] = useState('all')
  const [selectedExtension, setSelectedExtension] = useState('all')
  const [maxCards, setMaxCards] = useState(50)

  // États pour le quota
  const [quotaStats, setQuotaStats] = useState(null)
  const [timeUntilReset, setTimeUntilReset] = useState('')

  // États pour la correction
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const shouldStopRef = useRef(false)

  // Construire la hiérarchie des blocs
  const blocks = useMemo(() => {
    if (!discoveredCards?.length || !seriesDatabase?.length) return []
    return buildBlocksHierarchy(discoveredCards, seriesDatabase, [], [])
  }, [discoveredCards, seriesDatabase])

  // Extensions du bloc sélectionné
  const availableExtensions = useMemo(() => {
    if (selectedBlock === 'all') {
      // Toutes les extensions de tous les blocs
      return blocks.flatMap(block =>
        block.extensions.map(ext => ({
          ...ext,
          blockName: block.name
        }))
      ).sort((a, b) => {
        // Trier par date décroissante
        if (!a.releaseDate && !b.releaseDate) return 0
        if (!a.releaseDate) return 1
        if (!b.releaseDate) return -1
        return new Date(b.releaseDate) - new Date(a.releaseDate)
      })
    }

    const block = blocks.find(b => b.id === selectedBlock)
    return block?.extensions || []
  }, [blocks, selectedBlock])

  // Charger les stats du quota
  useEffect(() => {
    const updateStats = () => {
      const stats = QuotaTracker.getStats()
      setQuotaStats(stats)
    }

    updateStats()
    const interval = setInterval(updateStats, 5000) // Rafraîchir toutes les 5s

    return () => clearInterval(interval)
  }, [])

  // Compte à rebours reset quota
  useEffect(() => {
    if (!quotaStats?.resetAt) return

    const updateCountdown = () => {
      const now = Date.now()
      const diff = quotaStats.resetAt.getTime() - now

      if (diff <= 0) {
        setTimeUntilReset('Reset imminent...')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeUntilReset(`${hours}h ${minutes}m`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Toutes les minutes

    return () => clearInterval(interval)
  }, [quotaStats?.resetAt])

  // Helper pour obtenir tous les IDs d'une extension (incluant Gallery/TG)
  const getExtensionIds = useCallback((extId) => {
    const ids = [extId]
    ids.push(`${extId}tg`) // Trainer Gallery
    ids.push(`${extId}gg`) // Galarian Gallery
    return ids
  }, [])

  // État pour les statistiques chargées depuis Supabase
  const [selectionStats, setSelectionStats] = useState({
    total: 0,
    withoutUrl: 0,
    validUrl: 0,
    invalidUrl: 0,
    percentage: 0,
    loading: true
  })

  // Mode de correction : 'missing' (sans URL), 'invalid' (URLs invalides) ou 'broken' (URLs cassées/404)
  const [correctionMode, setCorrectionMode] = useState('missing')

  // État pour la vérification des URLs cassées
  const [brokenUrlsCount, setBrokenUrlsCount] = useState(null)
  const [isCheckingBroken, setIsCheckingBroken] = useState(false)

  // Helper pour vérifier si une URL est valide (format tcggo.com ou CardMarket avec ID carte)
  // URLs invalides : se terminent par le nom de l'extension sans ID de carte
  // Exemple invalide : https://www.cardmarket.com/fr/Pokemon/Products/Singles/Crown-Zenith
  // Exemple valide : https://tcggo.com/external/cm/123456?language=2
  // Exemple valide : https://www.cardmarket.com/fr/Pokemon/Products/Singles/Crown-Zenith/Pikachu-V-123
  const isValidCardMarketUrl = (url) => {
    if (!url) return false

    // Format tcggo.com est toujours valide (nouveau format avec ID)
    if (url.includes('tcggo.com/external/cm/')) return true

    // Format CardMarket direct : doit avoir un nom de carte après l'extension
    // Regex : /Singles/Extension-Name/Card-Name (au moins 2 segments après Singles)
    const singlesMatch = url.match(/\/Singles\/([^/]+)\/([^/?]+)/)
    if (singlesMatch && singlesMatch[2]) {
      // Il y a un nom de carte après l'extension
      return true
    }

    // Sinon c'est invalide (pointe vers la page extension uniquement)
    return false
  }

  // Charger les statistiques depuis Supabase (source de vérité)
  useEffect(() => {
    const loadStats = async () => {
      setSelectionStats(prev => ({ ...prev, loading: true }))

      try {
        // Construire la liste des IDs d'extensions à filtrer
        let extensionIds = null

        if (selectedExtension !== 'all') {
          extensionIds = getExtensionIds(selectedExtension)
        } else if (selectedBlock !== 'all') {
          const block = blocks.find(b => b.id === selectedBlock)
          if (block && block.extensions.length > 0) {
            extensionIds = block.extensions.flatMap(ext => getExtensionIds(ext.id))
          }
        }

        // Requête pour le total
        let totalQuery = supabase
          .from('discovered_cards')
          .select('id', { count: 'exact', head: true })

        if (extensionIds) {
          totalQuery = totalQuery.in('set_id', extensionIds)
        }

        const { count: total, error: totalError } = await totalQuery
        if (totalError) throw totalError

        // Requête pour les cartes sans URL
        let withoutUrlQuery = supabase
          .from('discovered_cards')
          .select('id', { count: 'exact', head: true })
          .is('cardmarket_url', null)

        if (extensionIds) {
          withoutUrlQuery = withoutUrlQuery.in('set_id', extensionIds)
        }

        const { count: withoutUrl, error: withoutUrlError } = await withoutUrlQuery
        if (withoutUrlError) throw withoutUrlError

        // Requête pour les cartes avec URL (pour analyser valides vs invalides)
        let withUrlQuery = supabase
          .from('discovered_cards')
          .select('cardmarket_url')
          .not('cardmarket_url', 'is', null)

        if (extensionIds) {
          withUrlQuery = withUrlQuery.in('set_id', extensionIds)
        }

        const { data: cardsWithUrl, error: withUrlError } = await withUrlQuery
        if (withUrlError) throw withUrlError

        // Compter URLs valides vs invalides
        let validUrl = 0
        let invalidUrl = 0

        if (cardsWithUrl) {
          cardsWithUrl.forEach(card => {
            if (isValidCardMarketUrl(card.cardmarket_url)) {
              validUrl++
            } else {
              invalidUrl++
            }
          })
        }

        const percentage = total > 0 ? Math.round((validUrl / total) * 100) : 0

        setSelectionStats({
          total: total || 0,
          withoutUrl: withoutUrl || 0,
          validUrl,
          invalidUrl,
          percentage,
          loading: false
        })

      } catch (error) {
        console.error('❌ Erreur chargement stats:', error)
        setSelectionStats({ total: 0, withoutUrl: 0, validUrl: 0, invalidUrl: 0, percentage: 0, loading: false })
      }
    }

    loadStats()
  }, [selectedBlock, selectedExtension, blocks, getExtensionIds, lastResult]) // Recharger aussi après une correction

  // Reset extension quand le bloc change
  useEffect(() => {
    setSelectedExtension('all')
    setBrokenUrlsCount(null) // Reset le compteur d'URLs cassées
  }, [selectedBlock])

  // Reset le compteur d'URLs cassées quand l'extension change
  useEffect(() => {
    setBrokenUrlsCount(null)
  }, [selectedExtension])

  // Fonction pour vérifier les URLs cassées via RapidAPI
  const checkBrokenUrls = useCallback(async () => {
    if (isCheckingBroken || isRunning) return

    // Vérifier RapidAPI disponible
    if (!RapidAPIService.isAvailable()) {
      alert('RapidAPI non disponible. Activez-le dans .env avec VITE_USE_RAPIDAPI=true')
      return
    }

    setIsCheckingBroken(true)
    setBrokenUrlsCount(null)

    try {
      // Construire la liste des IDs d'extensions à filtrer
      let extensionIds = null
      if (selectedExtension !== 'all') {
        extensionIds = getExtensionIds(selectedExtension)
      } else if (selectedBlock !== 'all') {
        const block = blocks.find(b => b.id === selectedBlock)
        if (block && block.extensions.length > 0) {
          extensionIds = block.extensions.flatMap(ext => getExtensionIds(ext.id))
        }
      }

      // Charger les cartes avec URL valide (format tcggo.com)
      let query = supabase
        .from('discovered_cards')
        .select('id, name, number, set, cardmarket_url')
        .like('cardmarket_url', '%tcggo.com/external/cm/%')
        .order('id', { ascending: true })
        .limit(50) // Limiter pour économiser le quota

      if (extensionIds) {
        query = query.in('set_id', extensionIds)
      }

      const { data: cardsWithUrl, error } = await query
      if (error) throw error

      if (!cardsWithUrl || cardsWithUrl.length === 0) {
        setBrokenUrlsCount(0)
        setIsCheckingBroken(false)
        return
      }

      console.log(`🔍 Vérification de ${cardsWithUrl.length} URLs...`)

      let brokenCount = 0
      const sampleSize = Math.min(cardsWithUrl.length, 20) // Vérifier max 20 cartes

      for (let i = 0; i < sampleSize; i++) {
        const card = cardsWithUrl[i]

        // Vérifier le quota
        const quotaCheck = QuotaTracker.canMakeRequest()
        if (!quotaCheck.allowed) {
          console.warn('⚠️ Quota atteint pendant la vérification')
          break
        }

        try {
          // Extraire l'ID CardMarket de l'URL tcggo
          const currentId = card.cardmarket_url.match(/\/cm\/(\d+)/)?.[1]

          // Rechercher la carte via RapidAPI pour obtenir l'URL actuelle
          const searchTerm = `${card.name} ${card.number || ''}`.trim()
          const result = await RapidAPIService.searchCards(searchTerm, { limit: 1 })
          QuotaTracker.incrementUsage()

          if (result.data && result.data.length > 0) {
            const apiCard = result.data[0]
            const newUrl = apiCard.links?.cardmarket

            if (newUrl) {
              // Extraire le nouvel ID
              const newId = newUrl.match(/\/cm\/(\d+)/)?.[1] ||
                           newUrl.match(/cardmarket\.com.*\/([^/?]+)$/)?.[1]

              // Si l'ID est différent ou si l'ancien ID n'existe plus dans la nouvelle URL
              if (currentId && newId && currentId !== newId) {
                brokenCount++
                console.log(`❌ URL cassée: ${card.name} (ancien: ${currentId}, nouveau: ${newId})`)
              }
            } else {
              // Pas de lien CardMarket dans l'API = carte supprimée ?
              brokenCount++
              console.log(`❌ URL cassée: ${card.name} (carte non trouvée dans l'API)`)
            }
          } else {
            brokenCount++
            console.log(`❌ URL cassée: ${card.name} (aucun résultat API)`)
          }

          // Pause entre requêtes
          await new Promise(resolve => setTimeout(resolve, 200))

        } catch (err) {
          console.error(`Erreur vérification ${card.name}:`, err.message)
        }
      }

      // Extrapoler le nombre total d'URLs cassées basé sur l'échantillon
      const brokenRatio = brokenCount / sampleSize
      const estimatedTotal = Math.round(cardsWithUrl.length * brokenRatio)

      setBrokenUrlsCount(estimatedTotal)
      setQuotaStats(QuotaTracker.getStats())

      console.log(`✅ Vérification terminée: ~${estimatedTotal} URLs cassées estimées (${brokenCount}/${sampleSize} dans l'échantillon)`)

    } catch (err) {
      console.error('❌ Erreur vérification URLs:', err)
      setBrokenUrlsCount(0)
    } finally {
      setIsCheckingBroken(false)
    }
  }, [isCheckingBroken, isRunning, selectedBlock, selectedExtension, blocks, getExtensionIds])

  // Fonction de correction ciblée
  const startCorrection = useCallback(async () => {
    if (isRunning) return

    // Vérifier RapidAPI disponible
    if (!RapidAPIService.isAvailable()) {
      alert('RapidAPI non disponible. Activez-le dans .env avec VITE_USE_RAPIDAPI=true')
      return
    }

    // Vérifier quota
    const quotaCheck = QuotaTracker.canMakeRequest()
    if (!quotaCheck.allowed) {
      alert(`Quota insuffisant: ${quotaCheck.message}`)
      return
    }

    setIsRunning(true)
    shouldStopRef.current = false
    setProgress({ current: 0, total: 0, updated: 0, errors: 0, skipped: 0 })
    setLastResult(null)

    try {
      let cardsToFix = []

      // Construire la liste des IDs d'extensions à filtrer
      let extensionIds = null
      if (selectedExtension !== 'all') {
        extensionIds = getExtensionIds(selectedExtension)
      } else if (selectedBlock !== 'all') {
        const block = blocks.find(b => b.id === selectedBlock)
        if (block && block.extensions.length > 0) {
          extensionIds = block.extensions.flatMap(ext => getExtensionIds(ext.id))
        }
      }

      if (correctionMode === 'missing') {
        // Mode "sans URL" : requête simple avec IS NULL
        let query = supabase
          .from('discovered_cards')
          .select('id, name, number, set')
          .is('cardmarket_url', null)
          .order('id', { ascending: true })

        if (extensionIds) {
          query = query.in('set_id', extensionIds)
        }

        query = query.limit(maxCards)

        const { data, error } = await query
        if (error) throw error
        cardsToFix = data || []

      } else if (correctionMode === 'invalid') {
        // Mode "URLs invalides" : charger les cartes avec URL puis filtrer côté client
        let query = supabase
          .from('discovered_cards')
          .select('id, name, number, set, cardmarket_url')
          .not('cardmarket_url', 'is', null)
          .order('id', { ascending: true })

        if (extensionIds) {
          query = query.in('set_id', extensionIds)
        }

        const { data, error } = await query
        if (error) throw error

        // Filtrer les URLs invalides côté client
        const invalidCards = (data || []).filter(card => !isValidCardMarketUrl(card.cardmarket_url))
        cardsToFix = invalidCards.slice(0, maxCards)

      } else if (correctionMode === 'broken') {
        // Mode "URLs cassées" : charger les cartes avec URL tcggo.com et vérifier via RapidAPI
        let query = supabase
          .from('discovered_cards')
          .select('id, name, number, set, cardmarket_url')
          .like('cardmarket_url', '%tcggo.com/external/cm/%')
          .order('id', { ascending: true })

        if (extensionIds) {
          query = query.in('set_id', extensionIds)
        }

        const { data, error } = await query
        if (error) throw error

        // On prend toutes les cartes avec URL tcggo.com, on vérifiera une par une
        cardsToFix = (data || []).slice(0, maxCards)
      }

      if (!cardsToFix || cardsToFix.length === 0) {
        setLastResult({
          updated: 0,
          errors: 0,
          skipped: 0,
          total: 0,
          message: correctionMode === 'missing'
            ? 'Aucune carte sans URL dans cette sélection'
            : correctionMode === 'invalid'
              ? 'Aucune carte avec URL invalide dans cette sélection'
              : 'Aucune carte avec URL tcggo.com dans cette sélection'
        })
        setIsRunning(false)
        return
      }

      console.log(`🔧 Correction de ${cardsToFix.length} cartes...`)

      let updated = 0
      let errors = 0
      let skipped = 0

      for (let i = 0; i < cardsToFix.length; i++) {
        // Vérifier si on doit arrêter
        if (shouldStopRef.current) {
          console.log('⏹️ Correction arrêtée par l\'utilisateur')
          break
        }

        const card = cardsToFix[i]

        // Vérifier le quota avant chaque requête
        const quotaCheck = QuotaTracker.canMakeRequest()
        if (!quotaCheck.allowed) {
          console.warn(`⚠️ Quota atteint: ${quotaCheck.message}`)
          break
        }

        try {
          // Rechercher la carte via RapidAPI
          const searchTerm = `${card.name} ${card.number || ''}`.trim()
          const result = await RapidAPIService.searchCards(searchTerm, { limit: 1 })

          // Incrémenter le quota immédiatement après la requête
          QuotaTracker.incrementUsage()

          if (result.data && result.data.length > 0) {
            const apiCard = result.data[0]
            let cardmarketUrl = apiCard.links?.cardmarket

            if (cardmarketUrl) {
              // Ajouter le paramètre language=2 (français)
              cardmarketUrl = CardMarketUrlFixService.addLanguageParam(cardmarketUrl)

              // En mode 'broken', vérifier si l'URL a changé
              if (correctionMode === 'broken') {
                const currentId = card.cardmarket_url?.match(/\/cm\/(\d+)/)?.[1]
                const newId = cardmarketUrl.match(/\/cm\/(\d+)/)?.[1]

                if (currentId === newId) {
                  // L'URL est identique, pas besoin de mettre à jour
                  skipped++
                  console.log(`⏭️ [${i + 1}/${cardsToFix.length}] ${card.name}: URL identique (ID: ${currentId})`)
                  continue
                }
                console.log(`🔄 [${i + 1}/${cardsToFix.length}] ${card.name}: ID changé ${currentId} → ${newId}`)
              }

              // Mettre à jour dans Supabase
              const { error: updateError } = await supabase
                .from('discovered_cards')
                .update({ cardmarket_url: cardmarketUrl })
                .eq('id', card.id)

              if (updateError) throw updateError

              updated++
              console.log(`✅ [${i + 1}/${cardsToFix.length}] ${card.name}: ${cardmarketUrl}`)
            } else {
              skipped++
              console.log(`⏭️ [${i + 1}/${cardsToFix.length}] ${card.name}: Pas de lien CardMarket`)
            }
          } else {
            skipped++
            console.log(`⏭️ [${i + 1}/${cardsToFix.length}] ${card.name}: Aucun résultat`)
          }

        } catch (err) {
          errors++
          console.error(`❌ [${i + 1}/${cardsToFix.length}] ${card.name}:`, err.message)
        }

        // Mettre à jour la progression
        setProgress({
          current: i + 1,
          total: cardsToFix.length,
          updated,
          errors,
          skipped
        })

        // Rafraîchir le quota
        setQuotaStats(QuotaTracker.getStats())

        // Pause entre requêtes
        if (i < cardsToFix.length - 1) {
          await new Promise(resolve => setTimeout(resolve, CardMarketUrlFixService.REQUEST_DELAY_MS))
        }
      }

      setLastResult({
        updated,
        errors,
        skipped,
        total: cardsToFix.length,
        message: shouldStopRef.current ? 'Correction arrêtée' : 'Correction terminée'
      })

    } catch (err) {
      console.error('❌ Erreur correction:', err)
      setLastResult({
        updated: progress?.updated || 0,
        errors: (progress?.errors || 0) + 1,
        skipped: progress?.skipped || 0,
        total: progress?.total || 0,
        message: `Erreur: ${err.message}`
      })
    } finally {
      setIsRunning(false)
      shouldStopRef.current = false
    }
  }, [isRunning, selectedBlock, selectedExtension, maxCards, blocks, progress, correctionMode, getExtensionIds])

  // Arrêter la correction
  const stopCorrection = useCallback(() => {
    shouldStopRef.current = true
  }, [])

  // Synchroniser le quota avec RapidAPI
  const syncQuota = useCallback(async () => {
    const result = await QuotaTracker.syncWithRapidAPI()
    if (result.success) {
      setQuotaStats(QuotaTracker.getStats())
    }
  }, [])

  return (
    <Card className="golden-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Correction URLs CardMarket
        </CardTitle>
        <CardDescription>
          Corrigez les liens CardMarket manquants via RapidAPI par bloc ou extension
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Section Quota RapidAPI */}
        <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Quota RapidAPI</span>
            </div>
            <Button variant="ghost" size="sm" onClick={syncQuota} title="Synchroniser avec RapidAPI">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {quotaStats && (
            <>
              <div className="flex items-center gap-4">
                <Progress
                  value={quotaStats.percentUsed}
                  className="flex-1 h-3"
                />
                <Badge
                  variant={quotaStats.percentUsed >= 90 ? 'destructive' : quotaStats.percentUsed >= 70 ? 'warning' : 'outline'}
                  className="min-w-[80px] justify-center"
                >
                  {quotaStats.used}/{quotaStats.limit}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className={quotaStats.percentUsed >= 90 ? 'text-red-500 font-medium' : ''}>
                  {quotaStats.remaining} requête{quotaStats.remaining > 1 ? 's' : ''} restante{quotaStats.remaining > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Reset dans {timeUntilReset}
                </span>
              </div>

              {quotaStats.percentUsed >= 90 && (
                <div className="text-sm text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Quota presque épuisé ! Limitez les corrections.
                </div>
              )}
            </>
          )}
        </div>

        {/* Sélecteurs Bloc / Extension */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sélecteur de bloc */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Bloc
            </label>
            <div className="relative">
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer hover:bg-accent/50 transition-colors"
                disabled={isRunning}
              >
                <option value="all">📦 Tous les blocs</option>
                {blocks.map(block => (
                  <option key={block.id} value={block.id}>
                    {block.name} ({block.totalExtensions} ext.)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Sélecteur d'extension */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Extension
            </label>
            <div className="relative">
              <select
                value={selectedExtension}
                onChange={(e) => setSelectedExtension(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer hover:bg-accent/50 transition-colors"
                disabled={isRunning}
              >
                <option value="all">
                  📁 Toutes les extensions {selectedBlock !== 'all' ? 'du bloc' : ''}
                </option>
                {availableExtensions.map(ext => (
                  <option key={ext.id} value={ext.id}>
                    {ext.name} ({ext.cardsCount || 0} cartes)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Limite de cartes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Nombre maximum de cartes à corriger
          </label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="1"
              max="500"
              value={maxCards}
              onChange={(e) => setMaxCards(Math.min(500, Math.max(1, parseInt(e.target.value) || 50)))}
              className="w-32"
              disabled={isRunning}
            />
            <div className="flex gap-2">
              {[25, 50, 100, 200].map(n => (
                <Button
                  key={n}
                  variant={maxCards === n ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMaxCards(n)}
                  disabled={isRunning}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Limiter pour économiser le quota RapidAPI (max 500)
          </p>
        </div>

        {/* Statistiques de la sélection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">
              {selectionStats.loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : selectionStats.total.toLocaleString()}
            </div>
            <div className="text-xs text-blue-400/70">Total</div>
          </div>
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">
              {selectionStats.loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : selectionStats.validUrl.toLocaleString()}
            </div>
            <div className="text-xs text-green-400/70">URLs valides</div>
          </div>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {selectionStats.loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : selectionStats.invalidUrl.toLocaleString()}
            </div>
            <div className="text-xs text-yellow-400/70">URLs invalides</div>
          </div>
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-400">
              {selectionStats.loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : selectionStats.withoutUrl.toLocaleString()}
            </div>
            <div className="text-xs text-orange-400/70">Sans URL</div>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">
              {selectionStats.loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : `${selectionStats.percentage}%`}
            </div>
            <div className="text-xs text-purple-400/70">Complété</div>
          </div>
        </div>

        {/* Mode de correction */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Mode de correction</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={correctionMode === 'missing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCorrectionMode('missing')}
              disabled={isRunning}
              className={correctionMode === 'missing' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Sans URL ({selectionStats.withoutUrl})
            </Button>
            <Button
              variant={correctionMode === 'invalid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCorrectionMode('invalid')}
              disabled={isRunning}
              className={correctionMode === 'invalid' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
            >
              <XCircle className="w-4 h-4 mr-1" />
              URLs invalides ({selectionStats.invalidUrl})
            </Button>
            <Button
              variant={correctionMode === 'broken' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCorrectionMode('broken')}
              disabled={isRunning}
              className={correctionMode === 'broken' ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              <XCircle className="w-4 h-4 mr-1" />
              URLs cassées (404)
              {brokenUrlsCount !== null && ` (~${brokenUrlsCount})`}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {correctionMode === 'missing'
              ? 'Corrige les cartes sans aucun lien CardMarket'
              : correctionMode === 'invalid'
                ? 'Re-corrige les cartes avec des liens invalides (ancien format slug)'
                : 'Vérifie et corrige les URLs tcggo.com dont l\'ID CardMarket a changé'}
          </p>
          {correctionMode === 'broken' && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkBrokenUrls}
                disabled={isCheckingBroken || isRunning || selectionStats.validUrl === 0}
              >
                {isCheckingBroken ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-1" />
                    Estimer URLs cassées
                  </>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                (Consomme ~20 requêtes pour échantillonner)
              </span>
            </div>
          )}
        </div>

        {/* Estimation */}
        {!selectionStats.loading && (
          (correctionMode === 'missing' && selectionStats.withoutUrl > 0) ||
          (correctionMode === 'invalid' && selectionStats.invalidUrl > 0) ||
          (correctionMode === 'broken' && selectionStats.validUrl > 0)
        ) && !isRunning && (
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>
                {correctionMode === 'broken' ? (
                  <>
                    <strong>{Math.min(selectionStats.validUrl, maxCards)}</strong> URLs seront vérifiées
                    (consommera <strong>{Math.min(selectionStats.validUrl, maxCards)}</strong> requêtes RapidAPI)
                  </>
                ) : (
                  <>
                    <strong>{Math.min(correctionMode === 'missing' ? selectionStats.withoutUrl : selectionStats.invalidUrl, maxCards)}</strong> cartes seront corrigées
                    (consommera <strong>{Math.min(correctionMode === 'missing' ? selectionStats.withoutUrl : selectionStats.invalidUrl, maxCards)}</strong> requêtes RapidAPI)
                  </>
                )}
              </span>
            </div>
            {correctionMode !== 'broken' && (correctionMode === 'missing' ? selectionStats.withoutUrl : selectionStats.invalidUrl) > maxCards && (
              <div className="mt-1 text-xs text-orange-500">
                ⚠️ {(correctionMode === 'missing' ? selectionStats.withoutUrl : selectionStats.invalidUrl) - maxCards} cartes supplémentaires resteront à corriger
              </div>
            )}
            {correctionMode === 'broken' && (
              <div className="mt-1 text-xs text-blue-400">
                ℹ️ Seules les URLs dont l'ID CardMarket a changé seront mises à jour
              </div>
            )}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex items-center gap-4">
          {!isRunning ? (
            <Button
              onClick={startCorrection}
              disabled={
                selectionStats.loading ||
                (correctionMode === 'missing' && selectionStats.withoutUrl === 0) ||
                (correctionMode === 'invalid' && selectionStats.invalidUrl === 0) ||
                (correctionMode === 'broken' && selectionStats.validUrl === 0) ||
                (quotaStats && quotaStats.remaining === 0)
              }
              className={`flex-1 ${
                correctionMode === 'missing'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : correctionMode === 'invalid'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Play className="w-4 h-4 mr-2" />
              {correctionMode === 'missing'
                ? `Corriger les cartes sans URL (${Math.min(selectionStats.withoutUrl, maxCards)})`
                : correctionMode === 'invalid'
                  ? `Re-corriger les URLs invalides (${Math.min(selectionStats.invalidUrl, maxCards)})`
                  : `Vérifier et corriger les URLs cassées (${Math.min(selectionStats.validUrl, maxCards)})`}
            </Button>
          ) : (
            <Button
              onClick={stopCorrection}
              variant="destructive"
              className="flex-1"
            >
              <Square className="w-4 h-4 mr-2" />
              Arrêter
            </Button>
          )}
        </div>

        {/* Progression en cours */}
        {isRunning && progress && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Correction en cours...
              </span>
              <Badge variant="outline">
                {progress.current}/{progress.total}
              </Badge>
            </div>

            <Progress
              value={(progress.current / progress.total) * 100}
              className="h-2"
            />

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-1 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                {progress.updated} corrigées
              </div>
              <div className="flex items-center gap-1 text-orange-400">
                <SkipForward className="w-4 h-4" />
                {progress.skipped} ignorées
              </div>
              <div className="flex items-center gap-1 text-red-400">
                <XCircle className="w-4 h-4" />
                {progress.errors} erreurs
              </div>
            </div>
          </div>
        )}

        {/* Résultat final */}
        {lastResult && !isRunning && (
          <div className={`p-4 rounded-lg border ${
            lastResult.errors > 0
              ? 'bg-red-500/10 border-red-500/30'
              : lastResult.updated > 0
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-muted/50 border-border'
          }`}>
            <div className="font-medium mb-2">{lastResult.message}</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-1 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                {lastResult.updated} corrigées
              </div>
              <div className="flex items-center gap-1 text-orange-400">
                <SkipForward className="w-4 h-4" />
                {lastResult.skipped} ignorées
              </div>
              <div className="flex items-center gap-1 text-red-400">
                <XCircle className="w-4 h-4" />
                {lastResult.errors} erreurs
              </div>
            </div>
          </div>
        )}

        {/* Conseils */}
        <div className="text-xs text-muted-foreground border-t border-border pt-4 space-y-1">
          <div className="font-semibold text-foreground mb-2">💡 Conseils d'utilisation :</div>
          <div>• Sélectionnez un bloc ou une extension pour cibler la correction</div>
          <div>• Limitez le nombre de cartes pour économiser le quota (100 req/jour gratuit)</div>
          <div>• Les cartes déjà corrigées ne consomment pas de quota</div>
          <div>• Vous pouvez arrêter et reprendre la correction à tout moment</div>
        </div>
      </CardContent>
    </Card>
  )
}
