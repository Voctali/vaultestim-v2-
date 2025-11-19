import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Power, PowerOff } from 'lucide-react'

const STORAGE_KEY = 'vaultestim_sealed_price_refresh_enabled'

export function SealedPriceRefreshToggle() {
  const [enabled, setEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored === null ? true : stored === 'true' // Activé par défaut
    } catch {
      return true
    }
  })

  const toggleEnabled = () => {
    const newValue = !enabled
    setEnabled(newValue)
    localStorage.setItem(STORAGE_KEY, newValue.toString())

    // Déclencher un événement pour synchroniser avec d'autres composants
    window.dispatchEvent(new CustomEvent('vaultestim_sealed_refresh_toggle', { detail: newValue }))

    console.log(`⚙️ Actualisation automatique des prix produits scellés: ${newValue ? 'ACTIVÉE' : 'DÉSACTIVÉE'}`)
  }

  // Écouter les changements depuis d'autres onglets
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        setEnabled(e.newValue === 'true')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-500" />
            Actualisation Automatique Produits Scellés
          </div>
          <Badge variant={enabled ? 'default' : 'secondary'}>
            {enabled ? 'ACTIVÉE' : 'DÉSACTIVÉE'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Actualise automatiquement les prix du catalogue des produits scellés via RapidAPI (500 produits/jour).
        </p>

        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Batch quotidien :</span>
            <span className="font-semibold">500 produits</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fréquence :</span>
            <span className="font-semibold">Toutes les 24h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Source :</span>
            <span className="font-semibold">RapidAPI CardMarket</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Impact quota :</span>
            <span className="font-semibold text-orange-500">500 requêtes/jour</span>
          </div>
        </div>

        {!enabled && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Actualisation désactivée</strong> : Les prix du catalogue ne seront PAS mis à jour automatiquement.
            </p>
          </div>
        )}

        <Button
          onClick={toggleEnabled}
          variant={enabled ? 'destructive' : 'default'}
          className="w-full"
        >
          {enabled ? (
            <>
              <PowerOff className="h-4 w-4 mr-2" />
              Désactiver l'actualisation automatique
            </>
          ) : (
            <>
              <Power className="h-4 w-4 mr-2" />
              Activer l'actualisation automatique
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Vérifier si l'actualisation automatique est activée
 * @returns {boolean}
 */
export function isSealedPriceRefreshEnabled() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  } catch {
    return true
  }
}
