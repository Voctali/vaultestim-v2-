import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Settings as SettingsIcon, Users, BarChart, Heart, Star, Package, RefreshCw, Database } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useCardDatabase } from '@/hooks/useCardDatabase'
import { CardCacheService } from '@/services/CardCacheService'
import { SupabaseService } from '@/services/SupabaseService'
import { useState } from 'react'

export function Settings() {
  const { settings, updateSetting } = useSettings()
  const { setDiscoveredCards, setSeriesDatabase } = useCardDatabase()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)

  const handleForceSync = async () => {
    try {
      setIsSyncing(true)
      setSyncStatus('sync')

      // Forcer la synchronisation depuis Supabase
      const cards = await CardCacheService.forceSyncFromSupabase(SupabaseService)

      // Mettre à jour l'état React
      setDiscoveredCards(cards)

      // Reconstruire la base de séries (logique du useCardDatabase)
      const seriesMap = new Map()
      cards.forEach(card => {
        const seriesId = card.set?.id
        if (!seriesId) return

        if (!seriesMap.has(seriesId)) {
          seriesMap.set(seriesId, {
            id: seriesId,
            name: card.set.name,
            series: card.set.series,
            printedTotal: card.set.printedTotal || 0,
            total: card.set.total || 0,
            releaseDate: card.set.releaseDate,
            images: card.set.images,
            block: card.set.block,
            cards: []
          })
        }
        seriesMap.get(seriesId).cards.push(card)
      })

      const seriesArray = Array.from(seriesMap.values())
      setSeriesDatabase(seriesArray)

      setSyncStatus('success')
      setTimeout(() => setSyncStatus(null), 3000)
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation forcée:', error)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus(null), 5000)
    } finally {
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

      {/* Informations */}
      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="golden-glow">À propos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>VaultEstim v2 - Application de gestion de collection Pokémon</p>
          <p>Version 2.0.0</p>
        </CardContent>
      </Card>
    </div>
  )
}