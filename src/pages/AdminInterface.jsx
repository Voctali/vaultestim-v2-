import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/useSettings'
import { Palette, Eye, Star, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function AdminInterface() {
  const navigate = useNavigate()
  const { settings, updateSetting } = useSettings()

  return (
    <div className="space-y-6 p-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
            className="border-primary/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour Admin
          </Button>
          <div>
            <h1 className="text-3xl font-bold golden-glow flex items-center">
              <Palette className="w-8 h-8 mr-3" />
              Gestion de l'Interface
            </h1>
            <p className="text-muted-foreground">
              Personnalisez l'affichage et les options visuelles de l'application
            </p>
          </div>
        </div>
      </div>

      {/* Options d'affichage */}
      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="golden-glow flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Options d'Affichage
          </CardTitle>
          <CardDescription>
            Configurez les éléments visuels de l'interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle Icônes de Rareté */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-amber-500 mt-1" />
              <div>
                <Label htmlFor="show-rarity-icons" className="text-base font-medium cursor-pointer">
                  Afficher les icônes de rareté
                </Label>
                <p className="text-sm text-muted-foreground">
                  Affiche les icônes détaillées par rareté (●◆★) dans la progression des extensions.
                  Désactiver cache uniquement le compteur et les icônes.
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-green-400">✓ Activé</span> : Icônes ●◆★★★ visibles avec compteurs (ex: ★ 5/10)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-red-400">✗ Désactivé</span> : Icônes cachées, seule la barre de progression est affichée
                  </p>
                </div>
              </div>
            </div>
            <Switch
              id="show-rarity-icons"
              checked={settings.showRarityIcons ?? true}
              onCheckedChange={(checked) => updateSetting('showRarityIcons', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="golden-border bg-blue-500/5 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Palette className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-400 mb-1">
                À propos de cette section
              </h3>
              <p className="text-sm text-muted-foreground">
                Cette section permet aux administrateurs de personnaliser l'apparence et le comportement
                visuel de l'application pour tous les utilisateurs. Les modifications prises ici s'appliquent
                globalement à l'interface.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
