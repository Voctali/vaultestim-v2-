import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useCardDatabase } from '@/hooks/useCardDatabase.jsx'
import { Download, RefreshCw, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'

export function PriceMigrationPanel() {
  const { migratePrices, retryCardsWithoutPrices, discoveredCards } = useCardDatabase()
  const [isMigrating, setIsMigrating] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [cancelSignal, setCancelSignal] = useState(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryResult, setRetryResult] = useState(null)

  const handleMigrate = async () => {
    setIsMigrating(true)
    setProgress({ processed: 0, total: 0, progress: 0, updated: 0, skipped: 0, errors: 0 })
    setResult(null)

    // Créer un signal d'annulation
    const signal = { cancelled: false }
    setCancelSignal(signal)

    try {
      const migrationResult = await migratePrices((progressData) => {
        setProgress(progressData)
      }, signal)

      setResult(migrationResult)

      if (migrationResult.interrupted) {
        console.log('⏸️ Migration interrompue:', migrationResult)
      } else {
        console.log('✅ Migration terminée:', migrationResult)
      }
    } catch (error) {
      console.error('❌ Erreur migration:', error)
      setResult({ error: error.message })
    } finally {
      setIsMigrating(false)
      setCancelSignal(null)
    }
  }


  const handleRetry = async () => {
    setIsRetrying(true)
    setProgress({ processed: 0, total: 0, progress: 0, updated: 0, errors: 0, stillWithoutPrices: 0 })
    setRetryResult(null)

    const signal = { cancelled: false }
    setCancelSignal(signal)

    try {
      const result = await retryCardsWithoutPrices((progressData) => {
        setProgress(progressData)
      }, signal)

      setRetryResult(result)
      console.log('✅ Retry terminé:', result)
    } catch (error) {
      console.error('❌ Erreur retry:', error)
      setRetryResult({ error: error.message })
    } finally {
      setIsRetrying(false)
      setCancelSignal(null)
    }
  }

  const handleCancel = () => {
    if (cancelSignal) {
      cancelSignal.cancelled = true
      console.log('🛑 Annulation de la migration demandée...')
    }
  }

  // Calculer les statistiques des prix
  const cardsWithPrices = discoveredCards.filter(card => card.cardmarket || card.tcgplayer).length
  const cardsWithoutPrices = discoveredCards.length - cardsWithPrices
  const pricesCoverage = discoveredCards.length > 0
    ? Math.round((cardsWithPrices / discoveredCards.length) * 100)
    : 0

  const estimatedTime = Math.ceil((cardsWithoutPrices * 2) / 60) // 2 secondes par carte, converti en minutes

  return (
    <Card className="golden-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Migration des Prix
        </CardTitle>
        <CardDescription>
          Récupérer les structures complètes de prix (CardMarket & TCGPlayer) pour toutes les cartes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-sm text-blue-400 mb-1">Cartes totales</div>
            <div className="text-2xl font-bold text-blue-400">{discoveredCards.length.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-sm text-green-400 mb-1">Avec prix</div>
            <div className="text-2xl font-bold text-green-400">{cardsWithPrices.toLocaleString()}</div>
            <div className="text-xs text-green-400/70">{pricesCoverage}% couverture</div>
          </div>
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="text-sm text-orange-400 mb-1">Sans prix</div>
            <div className="text-2xl font-bold text-orange-400">{cardsWithoutPrices.toLocaleString()}</div>
            <div className="text-xs text-orange-400/70">~{estimatedTime} min restantes</div>
          </div>
        </div>

        {/* Barre de progression globale */}
        {!isMigrating && !result && cardsWithoutPrices > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression globale</span>
              <span className="font-semibold">{pricesCoverage}%</span>
            </div>
            <Progress value={pricesCoverage} className="h-2" />
          </div>
        )}

        {/* Progression de la migration en cours */}
        {isMigrating && progress && (
          <div className="space-y-4">
            {/* Avertissement Important */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2 text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Important :</strong> Ne quittez pas cette page pendant la migration. Si vous quittez, la migration s'arrêtera mais vous pourrez la reprendre à {progress.progress}%.
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Migration en cours...</span>
                <span className="font-semibold">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress.processed} / {progress.total} cartes</span>
                <span>
                  ✅ {progress.updated} | ⏭️ {progress.skipped} | ❌ {progress.errors}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-green-500/10 rounded text-center">
                <div className="text-green-400 font-semibold">{progress.updated}</div>
                <div className="text-green-400/70">Migrées</div>
              </div>
              <div className="p-2 bg-blue-500/10 rounded text-center">
                <div className="text-blue-400 font-semibold">{progress.skipped}</div>
                <div className="text-blue-400/70">Déjà OK</div>
              </div>
              <div className="p-2 bg-red-500/10 rounded text-center">
                <div className="text-red-400 font-semibold">{progress.errors}</div>
                <div className="text-red-400/70">Erreurs</div>
              </div>
            </div>
          </div>
        )}

        {/* Résultats */}
        {result && !result.error && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <CheckCircle className="w-5 h-5" />
              Migration terminée avec succès !
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Total</div>
                <div className="font-semibold">{result.total}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Migrées</div>
                <div className="font-semibold text-green-400">{result.success}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Déjà OK</div>
                <div className="font-semibold text-blue-400">{result.skipped}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Erreurs</div>
                <div className="font-semibold text-red-400">{result.errors}</div>
              </div>
            </div>
          </div>
        )}

        {result && result.error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-red-400 font-semibold">
              <AlertCircle className="w-5 h-5" />
              Erreur lors de la migration
            </div>
            <div className="text-sm text-red-400/70">{result.error}</div>
          </div>
        )}

        {/* Résultat interruption */}
        {result && result.interrupted && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-yellow-400 font-semibold">
              <AlertCircle className="w-5 h-5" />
              Migration interrompue
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Progression</div>
                <div className="font-semibold text-yellow-400">{result.progress}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Migrées</div>
                <div className="font-semibold text-green-400">{result.success}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Déjà OK</div>
                <div className="font-semibold text-blue-400">{result.skipped}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Erreurs</div>
                <div className="font-semibold text-red-400">{result.errors}</div>
              </div>
            </div>
            <div className="text-sm text-yellow-400/70 mt-2">
              Vous pouvez relancer la migration - elle reprendra automatiquement là où elle s'est arrêtée.
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-3">
          <Button
            onClick={handleRetry}
            disabled={isRetrying || isMigrating || cardsWithoutPrices === 0}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Retry en cours...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry cartes sans prix ({cardsWithoutPrices})
              </>
            )}
          </Button>

          <Button
            onClick={handleMigrate}
            disabled={isMigrating || cardsWithoutPrices === 0}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isMigrating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Migration en cours...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {result?.interrupted ? 'Reprendre la migration' : `Lancer la migration (${cardsWithoutPrices} cartes)`}
              </>
            )}
          </Button>

          {isMigrating && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              className="md:w-auto"
            >
              Annuler
            </Button>
          )}

          {result && !isMigrating && (
            <Button
              variant="outline"
              onClick={() => {
                setResult(null)
                setProgress(null)
              }}
              className="border-primary/20"
            >
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Informations */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">Info</Badge>
            <div>
              <div>• La migration traite <strong>10 cartes toutes les 2 secondes</strong> pour éviter le rate limiting</div>
              <div>• Les cartes avec prix existants sont <strong>automatiquement sautées</strong></div>
              <div>• Vous pouvez <strong>interrompre</strong> avec le bouton "Annuler" et <strong>reprendre</strong> plus tard</div>
              <div>• La progression est sauvegardée : les cartes déjà migrées ne seront pas retraitées</div>
              <div className="text-yellow-400">• ⚠️ <strong>Restez sur cette page</strong> pendant la migration (sinon elle s'arrête)</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
