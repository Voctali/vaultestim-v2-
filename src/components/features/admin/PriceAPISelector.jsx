import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Zap, Globe, Crown } from 'lucide-react'

const STORAGE_KEY = 'vaultestim_price_api_source'

/**
 * Composant pour sélectionner la source des prix :
 * - RapidAPI (CardMarket API TCG) - abonnement requis, 100 req/jour gratuit
 * - Pokemon TCG API - gratuit, illimité
 */
// Déterminer la valeur initiale basée sur localStorage ou .env
function getInitialApiSource() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    return saved
  }
  // Par défaut, utiliser la valeur de .env
  return import.meta.env.VITE_USE_RAPIDAPI === 'true' ? 'rapidapi' : 'pokemontcg'
}

export function PriceAPISelector() {
  const [apiSource, setApiSource] = useState(getInitialApiSource)

  const handleChange = (value) => {
    setApiSource(value)
    localStorage.setItem(STORAGE_KEY, value)

    if (value === 'rapidapi') {
      console.log('🚀 Source des prix : RapidAPI (CardMarket API TCG)')
    } else {
      console.log('🌐 Source des prix : Pokemon TCG API')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Source des Prix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Choisissez la source pour l'actualisation des prix. RapidAPI offre des prix CardMarket précis en EUR,
          tandis que Pokemon TCG API est gratuit et illimité mais avec des prix TCGPlayer en USD.
        </p>

        <RadioGroup value={apiSource} onValueChange={handleChange} className="space-y-4">
          {/* Option RapidAPI */}
          <div className={`flex items-start space-x-4 p-4 border rounded-lg transition-colors ${
            apiSource === 'rapidapi'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}>
            <RadioGroupItem value="rapidapi" id="rapidapi" className="mt-1" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="rapidapi" className="cursor-pointer text-base font-medium flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  RapidAPI (CardMarket)
                </Label>
                {apiSource === 'rapidapi' && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Actif</span>
                )}
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-green-500" />
                  Prix CardMarket en EUR (Near Mint, DE, FR)
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-green-500" />
                  Prix cartes gradées (PSA 10/9, CGC 9)
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-green-500" />
                  Moyennes 7 et 30 jours
                </li>
                <li className="flex items-center gap-2 text-orange-500">
                  <span className="h-3 w-3">⚠️</span>
                  100 requêtes/jour (plan gratuit)
                </li>
              </ul>
            </div>
          </div>

          {/* Option Pokemon TCG API */}
          <div className={`flex items-start space-x-4 p-4 border rounded-lg transition-colors ${
            apiSource === 'pokemontcg'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}>
            <RadioGroupItem value="pokemontcg" id="pokemontcg" className="mt-1" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="pokemontcg" className="cursor-pointer text-base font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Pokemon TCG API
                </Label>
                {apiSource === 'pokemontcg' && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Actif</span>
                )}
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-green-500" />
                  Gratuit et illimité
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-green-500" />
                  Prix TCGPlayer en USD
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-3 w-3">❌</span>
                  Pas de prix CardMarket EUR
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-3 w-3">❌</span>
                  Pas de prix cartes gradées
                </li>
              </ul>
            </div>
          </div>
        </RadioGroup>

        {/* Info sur le changement */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-500">
            ℹ️ <strong>Note :</strong> Le changement prendra effet lors de la prochaine actualisation des prix.
            Les prix déjà en cache ne seront pas affectés.
          </p>
        </div>

        {/* Stats comparatives */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className={`text-center p-3 rounded-lg ${apiSource === 'rapidapi' ? 'bg-primary/10' : ''}`}>
            <p className="text-2xl font-bold golden-glow">100</p>
            <p className="text-sm text-muted-foreground">req/jour RapidAPI</p>
          </div>
          <div className={`text-center p-3 rounded-lg ${apiSource === 'pokemontcg' ? 'bg-primary/10' : ''}`}>
            <p className="text-2xl font-bold golden-glow">∞</p>
            <p className="text-sm text-muted-foreground">req/jour TCG API</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
