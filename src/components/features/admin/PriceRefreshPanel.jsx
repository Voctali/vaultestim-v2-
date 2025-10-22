/**
 * PriceRefreshPanel - Panneau d'actualisation intelligente des prix
 *
 * Affiche les statistiques d'actualisation et permet de forcer une mise à jour manuelle
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { useCardDatabase } from '@/hooks/useCardDatabase'
import { PriceRefreshService } from '@/services/PriceRefreshService'

export function PriceRefreshPanel() {
  const { discoveredCards } = useCardDatabase()
  const [stats, setStats] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState(null)

  // Charger les statistiques au montage
  useEffect(() => {
    if (discoveredCards.length > 0) {
      const refreshStats = PriceRefreshService.getRefreshStats(discoveredCards)
      setStats(refreshStats)
    }
  }, [discoveredCards])

  // Forcer l'actualisation manuelle
  const handleForceRefresh = async () => {
    try {
      setIsRefreshing(true)
      setProgress({ current: 0, total: discoveredCards.length, percentage: 0 })
      setResults(null)

      const refreshResults = await PriceRefreshService.forceRefreshAll(
        discoveredCards,
        (progressData) => {
          setProgress(progressData)
        }
      )

      setResults(refreshResults)

      // Recharger les stats
      const newStats = PriceRefreshService.getRefreshStats(discoveredCards)
      setStats(newStats)

    } catch (error) {
      console.error('❌ Erreur actualisation forcée:', error)
      alert(`Erreur: ${error.message}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Actualisation batch quotidien
  const handleDailyBatch = async () => {
    try {
      setIsRefreshing(true)
      setProgress({ current: 0, total: PriceRefreshService.BATCH_SIZE, percentage: 0 })
      setResults(null)

      const refreshResults = await PriceRefreshService.autoRefresh(
        discoveredCards,
        (progressData) => {
          setProgress(progressData)
        }
      )

      if (refreshResults.skipped) {
        alert(`Actualisation non nécessaire: ${refreshResults.reason === 'too_recent' ? 'Dernière actualisation < 24h' : 'Aucune carte à actualiser'}`)
      } else {
        setResults(refreshResults)
      }

      // Recharger les stats
      const newStats = PriceRefreshService.getRefreshStats(discoveredCards)
      setStats(newStats)

    } catch (error) {
      console.error('❌ Erreur actualisation batch:', error)
      alert(`Erreur: ${error.message}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Actualisation Automatique des Prix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Chargement des statistiques...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Actualisation Automatique des Prix
        </CardTitle>
        <CardDescription>
          Mise à jour intelligente quotidienne : 150 cartes/jour, cycle complet en ~{Math.ceil(stats.total / 150)} jours
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{stats.total.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Cartes totales</div>
          </div>

          <div className="p-4 rounded-lg bg-green-500/10">
            <div className="text-2xl font-bold text-green-600">{stats.withPrices.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Avec prix</div>
          </div>

          <div className="p-4 rounded-lg bg-orange-500/10">
            <div className="text-2xl font-bold text-orange-600">{stats.needsUpdate.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">À actualiser</div>
          </div>

          <div className="p-4 rounded-lg bg-blue-500/10">
            <div className="text-2xl font-bold text-blue-600">{stats.recentlyUpdated.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Récentes (&lt; 7j)</div>
          </div>
        </div>

        {/* Dernière actualisation */}
        {stats.lastRefresh && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Dernière actualisation</div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats.lastRefresh.toLocaleString('fr-FR', {
                  dateStyle: 'full',
                  timeStyle: 'short'
                })}
              </div>
              {stats.nextRefresh && (
                <div className="text-sm text-muted-foreground mt-1">
                  Prochaine actualisation auto : {stats.nextRefresh.toLocaleString('fr-FR', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Barre de progression */}
        {isRefreshing && progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Actualisation en cours...</span>
              <span className="text-muted-foreground">
                {progress.current}/{progress.total} ({progress.percentage}%)
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {progress.currentCard && `En cours : ${progress.currentCard}`}
              {progress.batch && ` • Batch ${progress.batch}/${progress.totalBatches}`}
            </div>
          </div>
        )}

        {/* Résultats */}
        {results && !isRefreshing && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Actualisation terminée</div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-green-600 font-medium">✅ {results.success}</span>
                  <span className="text-muted-foreground"> mis à jour</span>
                </div>
                <div>
                  <span className="text-orange-600 font-medium">⏭️ {results.skipped}</span>
                  <span className="text-muted-foreground"> skippés</span>
                </div>
                <div>
                  <span className="text-red-600 font-medium">❌ {results.errors}</span>
                  <span className="text-muted-foreground"> erreurs</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Info */}
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="text-sm space-y-1">
              <div className="font-medium">📊 Stratégie d'actualisation intelligente :</div>
              <ul className="ml-4 space-y-1 text-muted-foreground">
                <li>• <strong>Automatique</strong> : 150 cartes/jour au démarrage (si > 24h)</li>
                <li>• <strong>Priorisation</strong> : Cartes à forte valeur et consultées récemment</li>
                <li>• <strong>Cycle complet</strong> : {Math.ceil(stats.total / 150)} jours pour actualiser toutes les cartes</li>
                <li>• <strong>Skip</strong> : Cartes &lt; 0.10€ sont moins prioritaires</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <Button
            onClick={handleDailyBatch}
            disabled={isRefreshing}
            variant="default"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser Batch Quotidien (150 cartes)
          </Button>

          <Button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="flex-1"
          >
            <TrendingUp className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Forcer Actualisation Complète
          </Button>
        </div>

        {isRefreshing && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ Important :</strong> Ne quittez pas cette page pendant l'actualisation.
              {progress && progress.totalBatches > 1 && (
                <div className="mt-1 text-sm">
                  Batch {progress.batch || 1}/{progress.totalBatches} • Progression globale : {progress.overallProgress}%
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
