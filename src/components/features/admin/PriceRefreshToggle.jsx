import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DollarSign, Zap, ZapOff } from 'lucide-react'

const STORAGE_KEY_CARDS = 'vaultestim_price_refresh_enabled'
const STORAGE_KEY_SEALED = 'vaultestim_sealed_price_refresh_enabled'

export function PriceRefreshToggle() {
  const [cardsEnabled, setCardsEnabled] = useState(true)
  const [sealedEnabled, setSealedEnabled] = useState(true)

  // Charger l'état au montage
  useEffect(() => {
    const cardsState = localStorage.getItem(STORAGE_KEY_CARDS)
    const sealedState = localStorage.getItem(STORAGE_KEY_SEALED)

    if (cardsState !== null) {
      setCardsEnabled(cardsState === 'true')
    }
    if (sealedState !== null) {
      setSealedEnabled(sealedState === 'true')
    }
  }, [])

  const handleToggleCards = (enabled) => {
    setCardsEnabled(enabled)
    localStorage.setItem(STORAGE_KEY_CARDS, enabled.toString())

    if (enabled) {
      console.log('✅ Actualisation automatique des prix des cartes ACTIVÉE')
    } else {
      console.log('❌ Actualisation automatique des prix des cartes DÉSACTIVÉE')
    }
  }

  const handleToggleSealed = (enabled) => {
    setSealedEnabled(enabled)
    localStorage.setItem(STORAGE_KEY_SEALED, enabled.toString())

    if (enabled) {
      console.log('✅ Actualisation automatique des prix des produits scellés ACTIVÉE')
    } else {
      console.log('❌ Actualisation automatique des prix des produits scellés DÉSACTIVÉE')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Actualisation Automatique des Prix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Contrôlez l'actualisation automatique des prix au démarrage de l'application.
          Désactiver ces options peut accélérer le chargement si vous n'avez pas besoin des prix à jour.
        </p>

        {/* Prix des cartes */}
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {cardsEnabled ? (
                <Zap className="h-4 w-4 text-green-500" />
              ) : (
                <ZapOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="cards-toggle" className="cursor-pointer text-base font-medium">
                Prix des Cartes
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {cardsEnabled ? (
                <>Actualise automatiquement 1500 cartes par jour au démarrage</>
              ) : (
                <>Actualisation désactivée - Les prix ne seront pas mis à jour</>
              )}
            </p>
          </div>
          <Switch
            id="cards-toggle"
            checked={cardsEnabled}
            onCheckedChange={handleToggleCards}
          />
        </div>

        {/* Prix des produits scellés */}
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {sealedEnabled ? (
                <Zap className="h-4 w-4 text-green-500" />
              ) : (
                <ZapOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="sealed-toggle" className="cursor-pointer text-base font-medium">
                Prix des Produits Scellés
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {sealedEnabled ? (
                <>Actualise automatiquement 500 produits par jour au démarrage</>
              ) : (
                <>Actualisation désactivée - Les prix ne seront pas mis à jour</>
              )}
            </p>
          </div>
          <Switch
            id="sealed-toggle"
            checked={sealedEnabled}
            onCheckedChange={handleToggleSealed}
          />
        </div>

        {/* Avertissement */}
        {(!cardsEnabled || !sealedEnabled) && (
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-sm text-orange-500">
              ⚠️ <strong>Attention :</strong> Les prix affichés peuvent être obsolètes si l'actualisation est désactivée.
              Réactivez-la pour obtenir les prix les plus récents.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold golden-glow">
              {cardsEnabled ? '1500' : '0'}
            </p>
            <p className="text-sm text-muted-foreground">
              cartes/jour
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold golden-glow">
              {sealedEnabled ? '500' : '0'}
            </p>
            <p className="text-sm text-muted-foreground">
              produits/jour
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
