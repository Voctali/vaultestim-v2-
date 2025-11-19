/**
 * QuotaAlert - Affichage du quota RapidAPI avec alertes
 */

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Clock, TrendingUp } from 'lucide-react'
import { QuotaTracker } from '@/services/QuotaTracker'

export function QuotaAlert({ compact = false }) {
  const [stats, setStats] = useState(null)
  const [timeUntilReset, setTimeUntilReset] = useState('')

  // Charger les stats au montage et toutes les 10 secondes
  useEffect(() => {
    const updateStats = () => {
      const quotaStats = QuotaTracker.getStats()
      setStats(quotaStats)
    }

    updateStats()
    const interval = setInterval(updateStats, 10000) // Rafraîchir toutes les 10s

    return () => clearInterval(interval)
  }, [])

  // Calculer le temps restant jusqu'au reset
  useEffect(() => {
    if (!stats?.resetAt) return

    const updateCountdown = () => {
      const now = Date.now()
      const diff = stats.resetAt.getTime() - now

      if (diff <= 0) {
        setTimeUntilReset('Reset imminent...')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [stats?.resetAt])

  if (!stats) return null

  // Ne rien afficher si quota non utilisé
  if (stats.used === 0 && compact) return null

  // Déterminer la variante de l'alerte
  let variant = 'default'
  let icon = <TrendingUp className="h-4 w-4" />
  let title = '📊 Quota RapidAPI'

  if (stats.percentUsed >= 95) {
    variant = 'destructive'
    icon = <AlertCircle className="h-4 w-4" />
    title = '🚨 QUOTA CRITIQUE'
  } else if (stats.percentUsed >= 90) {
    variant = 'destructive'
    icon = <AlertCircle className="h-4 w-4" />
    title = '⚠️ QUOTA ÉLEVÉ'
  } else if (stats.percentUsed >= 70) {
    // Utiliser une classe custom pour orange
    variant = 'default'
    icon = <AlertCircle className="h-4 w-4 text-orange-500" />
    title = '⚠️ Attention au quota'
  }

  // Version compacte (badge uniquement)
  if (compact) {
    return (
      <Badge
        variant={stats.percentUsed >= 90 ? 'destructive' : 'outline'}
        className="gap-1"
      >
        <TrendingUp className="h-3 w-3" />
        {stats.used}/{stats.limit} ({stats.percentUsed}%)
      </Badge>
    )
  }

  // Version complète
  return (
    <Alert variant={variant} className={stats.percentUsed >= 90 ? 'border-red-500 bg-red-50 dark:bg-red-950' : stats.percentUsed >= 70 ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' : ''}>
      {icon}
      <AlertDescription>
        <div className="space-y-3">
          {/* Titre */}
          <div className="font-semibold flex items-center justify-between">
            <span>{title}</span>
            <Badge variant={stats.percentUsed >= 90 ? 'destructive' : 'outline'}>
              {stats.used}/{stats.limit}
            </Badge>
          </div>

          {/* Barre de progression */}
          <div>
            <Progress
              value={stats.percentUsed}
              className="h-3"
            />
            <div className="flex justify-between items-center mt-1 text-xs">
              <span className="text-muted-foreground">
                {stats.remaining} requête{stats.remaining > 1 ? 's' : ''} restante{stats.remaining > 1 ? 's' : ''}
              </span>
              <span className={stats.percentUsed >= 90 ? 'text-red-600 font-bold' : 'text-muted-foreground'}>
                {stats.percentUsed}%
              </span>
            </div>
          </div>

          {/* Compte à rebours */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Reset dans : <strong className="text-foreground">{timeUntilReset}</strong></span>
          </div>

          {/* Messages d'alerte */}
          {stats.percentUsed >= 95 && (
            <div className="text-sm font-medium text-red-600 dark:text-red-400">
              ⚠️ Quota quasi épuisé ! Encore {stats.remaining} requête{stats.remaining > 1 ? 's' : ''} disponible{stats.remaining > 1 ? 's' : ''}.
              {stats.remaining === 0 ? ' Les requêtes sont bloquées.' : ' Évitez les nouvelles requêtes.'}
            </div>
          )}

          {stats.percentUsed >= 90 && stats.percentUsed < 95 && (
            <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
              ⚠️ Quota élevé. Limitez l'utilisation jusqu'au reset.
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
