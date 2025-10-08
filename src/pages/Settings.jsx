import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings as SettingsIcon, Users, BarChart, Heart, Star, Package } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'

export function Settings() {
  const { settings, updateSetting } = useSettings()

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