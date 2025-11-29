import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Zap, Globe, Crown, Shield, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { QuotaTracker } from '@/services/QuotaTracker'

const STORAGE_KEY = 'vaultestim_price_api_source'

/**
 * Composant complet pour gérer les paramètres RapidAPI :
 * - Source des prix (RapidAPI vs Pokemon TCG API)
 * - Plan RapidAPI (Basic 100 req vs Pro 3000 req)
 * - Seuil de sécurité (désactivation automatique)
 * - Statistiques quota en temps réel
 */
export function RapidAPIQuotaSettings() {
  // État local
  const [apiSource, setApiSource] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved
    return import.meta.env.VITE_USE_RAPIDAPI === 'true' ? 'rapidapi' : 'pokemontcg'
  })

  const [settings, setSettings] = useState(() => QuotaTracker.getSettings())
  const [stats, setStats] = useState(() => QuotaTracker.getStats())

  // Rafraîchir les stats régulièrement
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(QuotaTracker.getStats())
    }, 5000) // Toutes les 5 secondes

    return () => clearInterval(interval)
  }, [])

  // Gérer le changement de source API
  const handleSourceChange = (value) => {
    setApiSource(value)
    localStorage.setItem(STORAGE_KEY, value)

    if (value === 'rapidapi') {
      console.log('🚀 Source des prix : RapidAPI (CardMarket API TCG)')
    } else {
      console.log('🌐 Source des prix : Pokemon TCG API')
    }
  }

  // Gérer le changement de plan
  const handlePlanChange = (planId) => {
    const newSettings = { ...settings, plan: planId }
    setSettings(newSettings)
    QuotaTracker.saveSettings(newSettings)
    QuotaTracker.updateLimit()
    setStats(QuotaTracker.getStats())
  }

  // Gérer le changement de seuil de sécurité
  const handleThresholdChange = (value) => {
    const newSettings = { ...settings, safetyThreshold: value[0] }
    setSettings(newSettings)
    QuotaTracker.saveSettings(newSettings)
    setStats(QuotaTracker.getStats())
  }

  // Réactiver manuellement RapidAPI
  const handleReEnable = () => {
    QuotaTracker.reEnable()
    setStats(QuotaTracker.getStats())
  }

  // Forcer le reset du quota (debug)
  const handleForceReset = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le compteur de quota ? Cette action est irréversible.')) {
      QuotaTracker.forceReset()
      setStats(QuotaTracker.getStats())
    }
  }

  // Synchroniser avec RapidAPI
  const handleSync = async () => {
    const result = await QuotaTracker.syncWithRapidAPI()
    if (result.success) {
      setStats(QuotaTracker.getStats())
    }
  }

  const plans = QuotaTracker.getAvailablePlans()

  return (
    <div className="space-y-6">
      {/* Source des prix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Source des Prix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choisissez la source pour l'actualisation des prix.
          </p>

          <RadioGroup value={apiSource} onValueChange={handleSourceChange} className="space-y-3">
            {/* Option RapidAPI */}
            <div className={`flex items-start space-x-4 p-4 border rounded-lg transition-colors ${
              apiSource === 'rapidapi'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}>
              <RadioGroupItem value="rapidapi" id="rapidapi" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="rapidapi" className="cursor-pointer text-base font-medium flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  RapidAPI (CardMarket)
                  {apiSource === 'rapidapi' && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Actif</span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Prix CardMarket en EUR • Cartes gradées • Moyennes 7j/30j
                </p>
              </div>
            </div>

            {/* Option Pokemon TCG API */}
            <div className={`flex items-start space-x-4 p-4 border rounded-lg transition-colors ${
              apiSource === 'pokemontcg'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}>
              <RadioGroupItem value="pokemontcg" id="pokemontcg" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="pokemontcg" className="cursor-pointer text-base font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Pokemon TCG API
                  {apiSource === 'pokemontcg' && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Actif</span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Gratuit illimité • Prix TCGPlayer en USD
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Configuration RapidAPI (visible uniquement si RapidAPI sélectionné) */}
      {apiSource === 'rapidapi' && (
        <>
          {/* Plan RapidAPI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Plan RapidAPI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sélectionnez votre plan RapidAPI pour adapter la limite quotidienne.
              </p>

              <RadioGroup
                value={settings.plan}
                onValueChange={handlePlanChange}
                className="grid grid-cols-2 gap-4"
              >
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handlePlanChange(plan.id)}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      settings.plan === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={plan.id} id={plan.id} />
                    <div>
                      <Label htmlFor={plan.id} className="cursor-pointer font-medium">
                        {plan.name}
                      </Label>
                      <p className="text-2xl font-bold golden-glow">{plan.limit.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">requêtes/jour</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Seuil de sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Seuil de Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                RapidAPI sera automatiquement désactivé quand ce pourcentage du quota est atteint.
                Le système basculera alors sur Pokemon TCG API jusqu'au reset à minuit.
              </p>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Seuil de désactivation</Label>
                  <span className="text-2xl font-bold golden-glow">{settings.safetyThreshold}%</span>
                </div>

                <Slider
                  value={[settings.safetyThreshold]}
                  onValueChange={handleThresholdChange}
                  min={50}
                  max={100}
                  step={1}
                  className="w-full"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50% (prudent)</span>
                  <span>75%</span>
                  <span>100% (risqué)</span>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-400">
                  <strong>Avec {settings.safetyThreshold}% :</strong> RapidAPI sera désactivé après{' '}
                  <span className="font-bold">
                    {Math.floor(stats.limit * settings.safetyThreshold / 100)}
                  </span>{' '}
                  requêtes sur {stats.limit}.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques en temps réel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quota en Temps Réel
                {stats.autoDisabled && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded ml-2">
                    Désactivé
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barre de progression */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{stats.used} / {stats.limit} requêtes</span>
                  <span className={stats.percentUsed >= stats.safetyThreshold ? 'text-red-400' : ''}>
                    {stats.percentUsed}%
                  </span>
                </div>
                <Progress
                  value={stats.percentUsed}
                  className={`h-3 ${stats.percentUsed >= stats.safetyThreshold ? '[&>div]:bg-red-500' : ''}`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span className="text-yellow-500">Alerte: {stats.warningThreshold}%</span>
                  <span className="text-red-500">Blocage: {stats.blockThreshold}%</span>
                  <span>{stats.limit}</span>
                </div>
              </div>

              {/* État du système */}
              <div className={`p-4 rounded-lg border ${
                stats.autoDisabled
                  ? 'bg-red-500/10 border-red-500/20'
                  : stats.isNearLimit
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-green-500/10 border-green-500/20'
              }`}>
                <div className="flex items-center gap-2">
                  {stats.autoDisabled ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <div>
                        <p className="font-medium text-red-400">RapidAPI désactivé automatiquement</p>
                        <p className="text-sm text-muted-foreground">
                          Fallback actif sur Pokemon TCG API. Reset à {stats.resetAt.toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </>
                  ) : stats.isNearLimit ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      <div>
                        <p className="font-medium text-yellow-400">Proche de la limite</p>
                        <p className="text-sm text-muted-foreground">
                          {stats.remaining} requêtes restantes. Désactivation à {stats.blockThreshold}%.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="font-medium text-green-400">RapidAPI actif</p>
                        <p className="text-sm text-muted-foreground">
                          {stats.remaining} requêtes disponibles. Reset dans {stats.hoursUntilReset}h.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Synchroniser avec RapidAPI
                </Button>

                {stats.autoDisabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReEnable}
                    className="gap-2 border-green-500/50 text-green-400 hover:bg-green-500/10"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Réactiver RapidAPI
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleForceReset}
                  className="text-muted-foreground hover:text-red-400"
                >
                  Reset compteur (debug)
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
