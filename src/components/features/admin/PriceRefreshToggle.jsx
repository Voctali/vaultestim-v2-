import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DollarSign, Zap, ZapOff, Settings } from 'lucide-react'

const STORAGE_KEY_CARDS = 'vaultestim_price_refresh_enabled'
const STORAGE_KEY_SEALED = 'vaultestim_sealed_price_refresh_enabled'
const STORAGE_KEY_CARDS_LIMIT = 'vaultestim_price_refresh_cards_limit'
const STORAGE_KEY_SEALED_LIMIT = 'vaultestim_price_refresh_sealed_limit'

// Valeurs par défaut
const DEFAULT_CARDS_LIMIT = 1500
const DEFAULT_SEALED_LIMIT = 500

// Fonction helper pour récupérer les limites (exportée pour les services)
export function getCardsLimit() {
  const stored = localStorage.getItem(STORAGE_KEY_CARDS_LIMIT)
  return stored ? parseInt(stored, 10) : DEFAULT_CARDS_LIMIT
}

export function getSealedLimit() {
  const stored = localStorage.getItem(STORAGE_KEY_SEALED_LIMIT)
  return stored ? parseInt(stored, 10) : DEFAULT_SEALED_LIMIT
}

export function PriceRefreshToggle() {
  const [cardsEnabled, setCardsEnabled] = useState(true)
  const [sealedEnabled, setSealedEnabled] = useState(true)
  const [cardsLimit, setCardsLimit] = useState(DEFAULT_CARDS_LIMIT)
  const [sealedLimit, setSealedLimit] = useState(DEFAULT_SEALED_LIMIT)

  // Charger l'état au montage
  useEffect(() => {
    const cardsState = localStorage.getItem(STORAGE_KEY_CARDS)
    const sealedState = localStorage.getItem(STORAGE_KEY_SEALED)
    const storedCardsLimit = localStorage.getItem(STORAGE_KEY_CARDS_LIMIT)
    const storedSealedLimit = localStorage.getItem(STORAGE_KEY_SEALED_LIMIT)

    if (cardsState !== null) {
      setCardsEnabled(cardsState === 'true')
    }
    if (sealedState !== null) {
      setSealedEnabled(sealedState === 'true')
    }
    if (storedCardsLimit !== null) {
      setCardsLimit(parseInt(storedCardsLimit, 10))
    }
    if (storedSealedLimit !== null) {
      setSealedLimit(parseInt(storedSealedLimit, 10))
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

  const handleCardsLimitChange = (value) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setCardsLimit(numValue)
      localStorage.setItem(STORAGE_KEY_CARDS_LIMIT, numValue.toString())
      console.log(`📊 Limite cartes/jour mise à jour: ${numValue}`)
    }
  }

  const handleSealedLimitChange = (value) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setSealedLimit(numValue)
      localStorage.setItem(STORAGE_KEY_SEALED_LIMIT, numValue.toString())
      console.log(`📊 Limite produits scellés/jour mise à jour: ${numValue}`)
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
        <div className="p-4 border border-border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
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
                  <>Actualise automatiquement les cartes au démarrage</>
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
          {cardsEnabled && (
            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="cards-limit" className="text-sm text-muted-foreground whitespace-nowrap">
                Limite par jour :
              </Label>
              <Input
                id="cards-limit"
                type="number"
                min="0"
                max="5000"
                value={cardsLimit}
                onChange={(e) => handleCardsLimitChange(e.target.value)}
                className="w-24 h-8 text-center"
              />
              <span className="text-sm text-muted-foreground">cartes</span>
            </div>
          )}
        </div>

        {/* Prix des produits scellés */}
        <div className="p-4 border border-border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
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
                  <>Actualise automatiquement les produits au démarrage</>
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
          {sealedEnabled && (
            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="sealed-limit" className="text-sm text-muted-foreground whitespace-nowrap">
                Limite par jour :
              </Label>
              <Input
                id="sealed-limit"
                type="number"
                min="0"
                max="2000"
                value={sealedLimit}
                onChange={(e) => handleSealedLimitChange(e.target.value)}
                className="w-24 h-8 text-center"
              />
              <span className="text-sm text-muted-foreground">produits</span>
            </div>
          )}
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
              {cardsEnabled ? cardsLimit : '0'}
            </p>
            <p className="text-sm text-muted-foreground">
              cartes/jour
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold golden-glow">
              {sealedEnabled ? sealedLimit : '0'}
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
