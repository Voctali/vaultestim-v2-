import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings as SettingsIcon, Users, BarChart, Heart, Star, Package, RefreshCw, Database, Zap, Info, Eye, Target, Search } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { CardCacheService } from '@/services/CardCacheService'
import { SupabaseService } from '@/services/SupabaseService'
import { HybridPriceService } from '@/services/HybridPriceService'
import { QuotaTracker } from '@/services/QuotaTracker'
import { supabase } from '@/lib/supabaseClient'
import { APP_VERSION, BUILD_DATE } from '@/version'
import { useState, useEffect } from 'react'

export function Settings() {
  const { settings, updateSetting } = useSettings()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)
  const [quotaStats, setQuotaStats] = useState(null)
  const [diagResult, setDiagResult] = useState(null)
  const [isDiagnosing, setIsDiagnosing] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState(null)

  // Charger les stats RapidAPI au montage
  useEffect(() => {
    loadQuotaStats()
  }, [])

  const loadQuotaStats = () => {
    const stats = HybridPriceService.getStats()
    setQuotaStats(stats)
  }

  const handleResetQuota = () => {
    if (confirm('Réinitialiser le quota à 0 ? (Uniquement pour tests)')) {
      QuotaTracker.forceReset()
      loadQuotaStats()
    }
  }

  const handleForceSync = async () => {
    try {
      setIsSyncing(true)
      setSyncStatus('sync')

      // Forcer la synchronisation depuis Supabase
      await CardCacheService.forceSyncFromSupabase(SupabaseService)

      setSyncStatus('success')

      // Recharger la page après 1 seconde pour appliquer les changements
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation forcée:', error)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus(null), 5000)
      setIsSyncing(false)
    }
  }

  // Diagnostic de la collection Supabase
  const handleDiagnostic = async () => {
    try {
      setIsDiagnosing(true)
      setDiagResult(null)

      // Récupérer l'utilisateur
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setDiagResult({ error: 'Non connecté' })
        return
      }

      const userId = session.user.id
      console.log('🔍 [Diagnostic] User ID:', userId)

      // Compter toutes les cartes avec pagination - récupérer TOUTES les colonnes pertinentes
      let allCards = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('user_collection')
          .select('id, card_id, name, series, extension, set, quantity')
          .eq('user_id', userId)
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
          console.error('❌ [Diagnostic] Erreur:', error)
          setDiagResult({ error: error.message })
          return
        }

        if (data.length === 0 || data.length < pageSize) {
          allCards = allCards.concat(data)
          hasMore = false
        } else {
          allCards = allCards.concat(data)
          page++
        }
      }

      // Grouper par extension (series corrigé)
      const byExtension = {}
      allCards.forEach(card => {
        const ext = card.series || card.set?.name || card.extension || 'Inconnue'
        byExtension[ext] = (byExtension[ext] || 0) + 1
      })

      // Grouper par set.name (plus précis - distingue White Flare de Black Bolt)
      const bySetName = {}
      allCards.forEach(card => {
        const setName = card.set?.name || card.series || 'Inconnue'
        bySetName[setName] = (bySetName[setName] || 0) + 1
      })

      // Compter les cartes UNIQUES (groupées par card_id)
      const uniqueCardIds = new Set(allCards.map(c => c.card_id))
      const totalUniqueCards = uniqueCardIds.size

      // Compter les exemplaires totaux (somme des quantités)
      const totalExemplaires = allCards.reduce((sum, card) => sum + (card.quantity || 1), 0)

      // Trier par nombre
      const sorted = Object.entries(byExtension)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25) // Top 25

      const sortedBySetName = Object.entries(bySetName)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25)

      // Chercher les cartes par set ID dans card_id
      const sv9Cards = allCards.filter(c => c.card_id?.toLowerCase().startsWith('sv9-'))
      const sv8pt5Cards = allCards.filter(c => c.card_id?.toLowerCase().startsWith('sv8pt5-')) // Prismatic
      const sv10Cards = allCards.filter(c => c.card_id?.toLowerCase().startsWith('sv10-'))
      const me1Cards = allCards.filter(c => c.card_id?.toLowerCase().startsWith('me1-')) // Mega Evolution
      const me2Cards = allCards.filter(c => c.card_id?.toLowerCase().startsWith('me2-')) // Mega Evolution 2
      const mepCards = allCards.filter(c => c.card_id?.toLowerCase().startsWith('mep-')) // Mega Evolution Promos
      const zsv10pt5Cards = allCards.filter(c => c.card_id?.toLowerCase().startsWith('zsv10pt5-')) // White Flare / Black Bolt
      const sv08Cards = allCards.filter(c => c.card_id?.toLowerCase().startsWith('sv08-') || c.card_id?.toLowerCase().startsWith('sv8-')) // Surging Sparks
      const sv1Cards = allCards.filter(c => c.card_id?.toLowerCase().startsWith('sv1-')) // SV base
      const sv3pt5Cards = allCards.filter(c => c.card_id?.toLowerCase().startsWith('sv3pt5-')) // 151

      // Séparer White Flare et Black Bolt par set.name
      const whiteFlareCards = allCards.filter(c =>
        c.set?.name?.toLowerCase().includes('white flare') ||
        c.set?.name?.toLowerCase().includes('flamme blanche')
      )
      const blackBoltCards = allCards.filter(c =>
        c.set?.name?.toLowerCase().includes('black bolt') ||
        c.set?.name?.toLowerCase().includes('foudre noire')
      )

      // Compter les card_id UNIQUES par extension
      const uniqueMe1 = new Set(me1Cards.map(c => c.card_id)).size
      const uniqueMe2 = new Set(me2Cards.map(c => c.card_id)).size
      const uniqueMep = new Set(mepCards.map(c => c.card_id)).size
      const uniqueWhiteFlare = new Set(whiteFlareCards.map(c => c.card_id)).size
      const uniqueBlackBolt = new Set(blackBoltCards.map(c => c.card_id)).size
      const uniqueSv08 = new Set(sv08Cards.map(c => c.card_id)).size
      const uniqueSv1 = new Set(sv1Cards.map(c => c.card_id)).size
      const uniqueSv3pt5 = new Set(sv3pt5Cards.map(c => c.card_id)).size

      console.log('📊 [Diagnostic] Total lignes DB:', allCards.length)
      console.log('📊 [Diagnostic] Total cartes uniques:', totalUniqueCards)
      console.log('📊 [Diagnostic] Total exemplaires:', totalExemplaires)
      console.log('📦 [Diagnostic] Par extension (series):', byExtension)
      console.log('📦 [Diagnostic] Par set.name:', bySetName)
      console.log('🎯 [Diagnostic] ME1 (Mega Evolution):', me1Cards.length, 'lignes,', uniqueMe1, 'uniques')
      console.log('🎯 [Diagnostic] ME2 (Mega Evolution 2):', me2Cards.length, 'lignes,', uniqueMe2, 'uniques')
      console.log('🎯 [Diagnostic] MEP (Mega Promos):', mepCards.length, 'lignes,', uniqueMep, 'uniques')
      console.log('🎯 [Diagnostic] White Flare:', whiteFlareCards.length, 'lignes,', uniqueWhiteFlare, 'uniques')
      console.log('🎯 [Diagnostic] Black Bolt:', blackBoltCards.length, 'lignes,', uniqueBlackBolt, 'uniques')
      console.log('🎯 [Diagnostic] SV08 (Surging Sparks):', sv08Cards.length, 'lignes,', uniqueSv08, 'uniques')
      console.log('🎯 [Diagnostic] SV1 (Base):', sv1Cards.length, 'lignes,', uniqueSv1, 'uniques')
      console.log('🎯 [Diagnostic] SV3pt5 (151):', sv3pt5Cards.length, 'lignes,', uniqueSv3pt5, 'uniques')

      // Exemples de cartes par extension problématique
      console.log('📝 [Diagnostic] Exemples White Flare:', whiteFlareCards.slice(0, 5).map(c => ({ card_id: c.card_id, name: c.name, series: c.series })))
      console.log('📝 [Diagnostic] Exemples Black Bolt:', blackBoltCards.slice(0, 5).map(c => ({ card_id: c.card_id, name: c.name, series: c.series })))

      setDiagResult({
        total: allCards.length,
        totalUniqueCards,
        totalExemplaires,
        extensions: sorted,
        extensionsBySetName: sortedBySetName,
        me1Cards: me1Cards.length,
        me2Cards: me2Cards.length,
        mepCards: mepCards.length,
        uniqueMe1,
        uniqueMe2,
        uniqueMep,
        whiteFlareCards: whiteFlareCards.length,
        blackBoltCards: blackBoltCards.length,
        uniqueWhiteFlare,
        uniqueBlackBolt,
        sv08Cards: sv08Cards.length,
        uniqueSv08,
        sv1Cards: sv1Cards.length,
        uniqueSv1,
        sv3pt5Cards: sv3pt5Cards.length,
        uniqueSv3pt5,
        sv9Cards: sv9Cards.length,
        sv8pt5Cards: sv8pt5Cards.length,
        sv10Cards: sv10Cards.length,
        zsv10pt5Cards: zsv10pt5Cards.length,
        sampleWhiteFlare: whiteFlareCards.slice(0, 3),
        sampleBlackBolt: blackBoltCards.slice(0, 3),
        sampleMe1: me1Cards.slice(0, 3)
      })
    } catch (error) {
      console.error('❌ [Diagnostic] Erreur:', error)
      setDiagResult({ error: error.message })
    } finally {
      setIsDiagnosing(false)
    }
  }

  // Corriger les noms d'extensions dans la collection
  const handleFixExtensions = async () => {
    if (!confirm('Corriger les noms d\'extensions pour toutes vos cartes ?\n\nCette opération va mettre à jour le champ "series" avec le nom correct de l\'extension (ex: "Journey Together" au lieu de "Scarlet & Violet").')) {
      return
    }

    try {
      setIsFixing(true)
      setFixResult(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setFixResult({ error: 'Non connecté' })
        return
      }

      const userId = session.user.id

      // Récupérer toutes les cartes avec le champ set (qui contient le bon nom)
      let allCards = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('user_collection')
          .select('id, card_id, series, set')
          .eq('user_id', userId)
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) throw error

        if (data.length === 0 || data.length < pageSize) {
          allCards = allCards.concat(data)
          hasMore = false
        } else {
          allCards = allCards.concat(data)
          page++
        }
      }

      console.log(`🔧 [Fix] ${allCards.length} cartes à vérifier`)

      // Filtrer les cartes qui ont besoin d'être corrigées
      const cardsToFix = allCards.filter(card => {
        const setName = card.set?.name
        return setName && card.series !== setName
      })

      console.log(`🔧 [Fix] ${cardsToFix.length} cartes à corriger`)

      if (cardsToFix.length === 0) {
        setFixResult({ fixed: 0, message: 'Toutes les cartes sont déjà correctement catégorisées !' })
        return
      }

      // Corriger par lots de 100
      let fixedCount = 0
      const batchSize = 100

      for (let i = 0; i < cardsToFix.length; i += batchSize) {
        const batch = cardsToFix.slice(i, i + batchSize)

        for (const card of batch) {
          const { error } = await supabase
            .from('user_collection')
            .update({ series: card.set.name, extension: card.set.name })
            .eq('id', card.id)

          if (!error) {
            fixedCount++
          } else {
            console.error(`❌ Erreur correction ${card.id}:`, error)
          }
        }

        console.log(`🔧 [Fix] Progression: ${Math.min(i + batchSize, cardsToFix.length)}/${cardsToFix.length}`)
      }

      setFixResult({ fixed: fixedCount, total: cardsToFix.length })
      console.log(`✅ [Fix] ${fixedCount} cartes corrigées`)

    } catch (error) {
      console.error('❌ [Fix] Erreur:', error)
      setFixResult({ error: error.message })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold golden-glow flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3" />
            Paramètres
          </h1>
          <p className="text-muted-foreground">
            Configurez votre application et vos préférences de partage
          </p>
        </div>
      </div>

      {/* Paramètres de Partage */}
      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="golden-glow flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Partage avec les Amis
          </CardTitle>
          <CardDescription>
            Contrôlez ce que vos amis peuvent voir de votre profil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Partage Collection */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <Label htmlFor="share-collection" className="text-base font-medium cursor-pointer">
                  Partager ma collection
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permettre à vos amis de voir toutes les cartes de votre collection
                </p>
              </div>
            </div>
            <Switch
              id="share-collection"
              checked={settings.shareCollection}
              onCheckedChange={(checked) => updateSetting('shareCollection', checked)}
            />
          </div>

          {/* Partage Statistiques */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <BarChart className="w-5 h-5 text-green-500 mt-1" />
              <div>
                <Label htmlFor="share-stats" className="text-base font-medium cursor-pointer">
                  Partager mes statistiques
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permettre à vos amis de voir vos statistiques de collection et de ventes
                </p>
              </div>
            </div>
            <Switch
              id="share-stats"
              checked={settings.shareStats}
              onCheckedChange={(checked) => updateSetting('shareStats', checked)}
            />
          </div>

          {/* Partage Favoris */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-red-500 mt-1" />
              <div>
                <Label htmlFor="share-favorites" className="text-base font-medium cursor-pointer">
                  Partager mes favoris
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permettre à vos amis de voir vos cartes favorites
                </p>
              </div>
            </div>
            <Switch
              id="share-favorites"
              checked={settings.shareFavorites}
              onCheckedChange={(checked) => updateSetting('shareFavorites', checked)}
            />
          </div>

          {/* Partage Wishlist */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-yellow-500 mt-1" />
              <div>
                <Label htmlFor="share-wishlist" className="text-base font-medium cursor-pointer">
                  Partager ma wishlist
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permettre à vos amis de voir votre liste de souhaits
                </p>
              </div>
            </div>
            <Switch
              id="share-wishlist"
              checked={settings.shareWishlist}
              onCheckedChange={(checked) => updateSetting('shareWishlist', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Affichage Collection */}
      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="golden-glow flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Affichage Collection
          </CardTitle>
          <CardDescription>
            Personnalisez l'affichage de votre progression
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Masterset */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-amber-500 mt-1" />
              <div>
                <Label htmlFor="masterset-mode" className="text-base font-medium cursor-pointer">
                  Mode Masterset
                </Label>
                <p className="text-sm text-muted-foreground">
                  Comptabiliser toutes les versions (Normale, Holo, Reverse, etc.) dans la progression.
                  Désactivé = 1 exemplaire suffit peu importe la version.
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-green-400">✓ Mode Base (désactivé)</span> : Pikachu Normale OU Holo = 1/1 carte
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-amber-400">★ Mode Masterset (activé)</span> : Pikachu = 5 versions → besoin de toutes pour 5/5
                  </p>
                </div>
              </div>
            </div>
            <Switch
              id="masterset-mode"
              checked={settings.mastersetMode}
              onCheckedChange={(checked) => updateSetting('mastersetMode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cache et Synchronisation */}
      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="golden-glow flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Cache et Synchronisation
          </CardTitle>
          <CardDescription>
            Gérez le cache local et la synchronisation avec Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-medium mb-1">Synchronisation forcée</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Si vous constatez des différences entre vos appareils, cette action vide le cache local
                et recharge toutes les cartes depuis Supabase.
              </p>
              <Button
                onClick={handleForceSync}
                disabled={isSyncing}
                variant={syncStatus === 'error' ? 'destructive' : syncStatus === 'success' ? 'default' : 'outline'}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Synchronisation...' :
                 syncStatus === 'success' ? 'Synchronisation réussie !' :
                 syncStatus === 'error' ? 'Erreur de synchronisation' :
                 'Forcer la synchronisation'}
              </Button>
            </div>
          </div>

          {/* Diagnostic Collection */}
          <div className="border-t border-border/50 pt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-base font-medium mb-1">Diagnostic Collection</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Vérifier le nombre de cartes stockées dans Supabase (indépendamment du cache local).
                </p>
                <Button
                  onClick={handleDiagnostic}
                  disabled={isDiagnosing}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Search className={`w-4 h-4 mr-2 ${isDiagnosing ? 'animate-pulse' : ''}`} />
                  {isDiagnosing ? 'Analyse en cours...' : 'Lancer le diagnostic'}
                </Button>
              </div>
            </div>

            {/* Résultats du diagnostic */}
            {diagResult && (
              <div className="mt-4 p-4 bg-secondary/50 rounded-lg space-y-3">
                {diagResult.error ? (
                  <p className="text-red-500">❌ Erreur: {diagResult.error}</p>
                ) : (
                  <>
                    {/* Résumé global */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <Badge variant="default" className="text-lg px-4 py-1">
                        {diagResult.total} lignes DB
                      </Badge>
                      <Badge variant="outline" className="text-lg px-4 py-1">
                        {diagResult.totalUniqueCards} cartes uniques
                      </Badge>
                      <Badge variant="secondary" className="text-lg px-4 py-1">
                        {diagResult.totalExemplaires} exemplaires
                      </Badge>
                    </div>

                    {/* Extensions problématiques - détaillées */}
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm font-medium text-red-400 mb-2">⚠️ Extensions critiques (lignes / uniques):</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between bg-background/50 px-2 py-1 rounded">
                          <span>ME1 (Mega Evolution)</span>
                          <span className="font-mono">{diagResult.me1Cards || 0} / <span className="text-green-400">{diagResult.uniqueMe1 || 0}</span></span>
                        </div>
                        <div className="flex justify-between bg-background/50 px-2 py-1 rounded">
                          <span>ME2 (Mega Evolution 2)</span>
                          <span className="font-mono">{diagResult.me2Cards || 0} / <span className="text-green-400">{diagResult.uniqueMe2 || 0}</span></span>
                        </div>
                        <div className="flex justify-between bg-background/50 px-2 py-1 rounded">
                          <span>White Flare</span>
                          <span className="font-mono">{diagResult.whiteFlareCards || 0} / <span className="text-green-400">{diagResult.uniqueWhiteFlare || 0}</span></span>
                        </div>
                        <div className="flex justify-between bg-background/50 px-2 py-1 rounded">
                          <span>Black Bolt</span>
                          <span className="font-mono">{diagResult.blackBoltCards || 0} / <span className="text-green-400">{diagResult.uniqueBlackBolt || 0}</span></span>
                        </div>
                        <div className="flex justify-between bg-background/50 px-2 py-1 rounded">
                          <span>SV08 (Surging Sparks)</span>
                          <span className="font-mono">{diagResult.sv08Cards || 0} / <span className="text-green-400">{diagResult.uniqueSv08 || 0}</span></span>
                        </div>
                        <div className="flex justify-between bg-background/50 px-2 py-1 rounded">
                          <span>SV1 (Base)</span>
                          <span className="font-mono">{diagResult.sv1Cards || 0} / <span className="text-green-400">{diagResult.uniqueSv1 || 0}</span></span>
                        </div>
                        <div className="flex justify-between bg-background/50 px-2 py-1 rounded">
                          <span>SV3pt5 (151)</span>
                          <span className="font-mono">{diagResult.sv3pt5Cards || 0} / <span className="text-green-400">{diagResult.uniqueSv3pt5 || 0}</span></span>
                        </div>
                        <div className="flex justify-between bg-background/50 px-2 py-1 rounded">
                          <span>ZSV10pt5 (WF+BB total)</span>
                          <span className="font-mono">{diagResult.zsv10pt5Cards || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Exemples de cartes */}
                    {(diagResult.sampleWhiteFlare?.length > 0 || diagResult.sampleBlackBolt?.length > 0) && (
                      <div className="text-xs text-muted-foreground mt-2 p-2 bg-background/30 rounded">
                        {diagResult.sampleWhiteFlare?.length > 0 && (
                          <>
                            <p className="font-medium text-blue-400">Exemples White Flare:</p>
                            {diagResult.sampleWhiteFlare.map((c, i) => (
                              <p key={i}>{c.card_id} - {c.name} (series: {c.series})</p>
                            ))}
                          </>
                        )}
                        {diagResult.sampleBlackBolt?.length > 0 && (
                          <>
                            <p className="font-medium text-purple-400 mt-2">Exemples Black Bolt:</p>
                            {diagResult.sampleBlackBolt.map((c, i) => (
                              <p key={i}>{c.card_id} - {c.name} (series: {c.series})</p>
                            ))}
                          </>
                        )}
                        {diagResult.sampleMe1?.length > 0 && (
                          <>
                            <p className="font-medium text-orange-400 mt-2">Exemples ME1:</p>
                            {diagResult.sampleMe1.map((c, i) => (
                              <p key={i}>{c.card_id} - {c.name} (series: {c.series})</p>
                            ))}
                          </>
                        )}
                      </div>
                    )}

                    {/* Bouton de correction */}
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-yellow-400 mb-3">
                        ⚠️ Si vos extensions apparaissent sous "Scarlet & Violet" au lieu de leur vrai nom,
                        cliquez sur le bouton ci-dessous pour corriger.
                      </p>
                      <Button
                        onClick={handleFixExtensions}
                        disabled={isFixing}
                        variant="outline"
                        className="w-full"
                      >
                        {isFixing ? '🔧 Correction en cours...' : '🔧 Corriger les noms d\'extensions'}
                      </Button>
                      {fixResult && (
                        <p className={`text-sm mt-2 ${fixResult.error ? 'text-red-500' : 'text-green-500'}`}>
                          {fixResult.error ? `❌ ${fixResult.error}` :
                           fixResult.message ? `✅ ${fixResult.message}` :
                           `✅ ${fixResult.fixed}/${fixResult.total} cartes corrigées !`}
                        </p>
                      )}
                    </div>

                    {/* Top extensions par set.name */}
                    {diagResult.extensionsBySetName && (
                      <div className="text-sm mt-4">
                        <p className="font-medium mb-2">Top 25 extensions (par set.name):</p>
                        <div className="grid grid-cols-2 gap-1 text-xs max-h-60 overflow-y-auto">
                          {diagResult.extensionsBySetName.map(([ext, count]) => (
                            <div key={ext} className="flex justify-between bg-background/50 px-2 py-1 rounded">
                              <span className="truncate">{ext}</span>
                              <span className="font-mono ml-2">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques RapidAPI */}
      {quotaStats && (
        <Card className="golden-border">
          <CardHeader>
            <CardTitle className="golden-glow flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Système Hybride de Prix
            </CardTitle>
            <CardDescription>
              Gestion automatique RapidAPI (précis) → Pokemon TCG API (fallback gratuit)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* État RapidAPI */}
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">RapidAPI</span>
                <Badge variant={quotaStats.rapidApiEnabled ? 'default' : 'secondary'}>
                  {quotaStats.rapidApiEnabled ? '✅ Activé' : '❌ Désactivé'}
                </Badge>
              </div>
              {quotaStats.rapidApiEnabled && (
                <span className="text-xs text-muted-foreground">
                  Prix EUR précis + cartes gradées
                </span>
              )}
            </div>

            {/* Quota */}
            {quotaStats.rapidApiEnabled && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quota quotidien</span>
                  <Badge
                    variant={quotaStats.quota.isExhausted ? 'destructive' : quotaStats.quota.isNearLimit ? 'warning' : 'default'}
                  >
                    {quotaStats.quota.used} / {quotaStats.quota.limit}
                  </Badge>
                </div>

                {/* Barre de progression */}
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      quotaStats.quota.isExhausted
                        ? 'bg-red-500'
                        : quotaStats.quota.isNearLimit
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${quotaStats.quota.percentUsed}%` }}
                  />
                </div>

                {/* Détails */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Utilisées</p>
                    <p className="font-semibold text-lg">{quotaStats.quota.used}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Restantes</p>
                    <p className="font-semibold text-lg text-green-500">{quotaStats.quota.remaining}</p>
                  </div>
                </div>

                {/* Reset */}
                <div className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                  <span className="text-xs text-muted-foreground">
                    Réinitialisation automatique : {quotaStats.quota.resetAt.toLocaleTimeString('fr-FR')}
                  </span>
                </div>

                {/* Recommandation */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400">
                    💡 {quotaStats.recommendation}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadQuotaStats}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Rafraîchir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetQuota}
                    className="flex-1"
                  >
                    Reset Quota (Test)
                  </Button>
                </div>
              </div>
            )}

            {/* Message si désactivé */}
            {!quotaStats.rapidApiEnabled && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  ℹ️ RapidAPI désactivé. L'application utilise uniquement Pokemon TCG API.
                  Pour activer RapidAPI, configurez VITE_USE_RAPIDAPI=true dans .env
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informations */}
      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="golden-glow flex items-center">
            <Info className="w-5 h-5 mr-2" />
            À propos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">VaultEstim</h3>
              <p className="text-sm text-muted-foreground">
                Application de gestion de collection Pokémon
              </p>
            </div>
            <Badge variant="outline" className="text-amber-400 border-amber-400/50">
              v{APP_VERSION}
            </Badge>
          </div>

          <div className="pt-2 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Version</p>
                <p className="font-medium">{APP_VERSION}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date de build</p>
                <p className="font-medium">{BUILD_DATE}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
            <p>© 2025 VaultEstim Team</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}