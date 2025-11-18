import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings as SettingsIcon, Users, BarChart, Heart, Star, Package, RefreshCw, Database, Zap, Info } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { CardCacheService } from '@/services/CardCacheService'
import { SupabaseService } from '@/services/SupabaseService'
import { HybridPriceService } from '@/services/HybridPriceService'
import { QuotaTracker } from '@/services/QuotaTracker'
import { APP_VERSION, BUILD_DATE } from '@/version'
import { useState, useEffect } from 'react'

export function Settings() {
  const { settings, updateSetting } = useSettings()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)
  const [quotaStats, setQuotaStats] = useState(null)

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