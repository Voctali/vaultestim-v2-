import { useState, useEffect } from 'react'
import { useCardDatabase } from '@/hooks/useCardDatabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Swords, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'

/**
 * Panneau de migration des attaques
 * Permet de récupérer les attaques/abilities/weaknesses pour toutes les cartes
 */
export function AttacksMigrationPanel() {
  const { discoveredCards, migrateAttacks } = useCardDatabase()
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    withAttacks: 0,
    withoutAttacks: 0,
    coverage: 0
  })
  const [results, setResults] = useState(null)
  const [cancelSignal, setCancelSignal] = useState(null)

  // Calculer les statistiques au chargement
  useEffect(() => {
    if (!discoveredCards || discoveredCards.length === 0) return

    const withAttacks = discoveredCards.filter(card =>
      card.attacks && Array.isArray(card.attacks) && card.attacks.length > 0
    ).length
    const withoutAttacks = discoveredCards.length - withAttacks
    const coverage = ((withAttacks / discoveredCards.length) * 100).toFixed(1)

    setStats({
      total: discoveredCards.length,
      withAttacks,
      withoutAttacks,
      coverage: parseFloat(coverage)
    })

    // Initialiser la barre de progression au niveau actuel
    setProgress(parseFloat(coverage))
  }, [discoveredCards])

  const handleStartMigration = async () => {
    setIsRunning(true)
    setResults(null)

    // Créer un signal d'annulation
    const signal = { cancelled: false }
    setCancelSignal(signal)

    try {
      const result = await migrateAttacks((progressValue) => {
        setProgress(progressValue)
      }, signal)

      setResults(result)

      // Recalculer les stats après migration
      if (!result.interrupted) {
        const withAttacks = discoveredCards.filter(card =>
          card.attacks && Array.isArray(card.attacks) && card.attacks.length > 0
        ).length
        const withoutAttacks = discoveredCards.length - withAttacks
        const coverage = ((withAttacks / discoveredCards.length) * 100).toFixed(1)

        setStats({
          total: discoveredCards.length,
          withAttacks,
          withoutAttacks,
          coverage: parseFloat(coverage)
        })
      }
    } catch (error) {
      console.error('Erreur migration attaques:', error)
      setResults({
        success: 0,
        errors: 1,
        error: error.message,
        interrupted: true
      })
    } finally {
      setIsRunning(false)
      setCancelSignal(null)
    }
  }

  const handleCancel = () => {
    if (cancelSignal) {
      cancelSignal.cancelled = true
      console.log('🛑 Annulation de la migration demandée')
    }
  }

  return (
    <Card className="border-orange-900/20 bg-gradient-to-br from-background via-orange-950/5 to-background">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-orange-500" />
          <CardTitle>Migration des Attaques</CardTitle>
        </div>
        <CardDescription>
          Récupère les attaques, talents, faiblesses et résistances pour toutes les cartes depuis l'API Pokemon TCG
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total cartes</p>
            <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avec attaques</p>
            <p className="text-2xl font-bold text-green-500">{stats.withAttacks.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Sans attaques</p>
            <p className="text-2xl font-bold text-orange-500">{stats.withoutAttacks.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Couverture</p>
            <p className="text-2xl font-bold text-blue-500">{stats.coverage}%</p>
          </div>
        </div>

        {/* Barre de progression */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Résultats */}
        {results && (
          <div className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Migrées</p>
                <p className="font-medium">{results.success || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Erreurs</p>
                <p className="font-medium">{results.errors || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Ignorées</p>
                <p className="font-medium">{results.skipped || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {results?.interrupted && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Migration interrompue à {progress.toFixed(1)}%. Vous pouvez la reprendre à tout moment.
            </AlertDescription>
          </Alert>
        )}

        {results?.success > 0 && !results?.interrupted && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              Migration terminée avec succès ! {results.success} cartes ont été mises à jour.
            </AlertDescription>
          </Alert>
        )}

        {isRunning && (
          <Alert variant="warning" className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              <strong>Important :</strong> Ne quittez pas cette page pendant la migration.
              Si vous quittez, la migration s'arrêtera mais vous pourrez la reprendre à {progress.toFixed(0)}%.
            </AlertDescription>
          </Alert>
        )}

        {/* Informations */}
        <div className="text-sm text-muted-foreground space-y-1 p-4 bg-muted/20 rounded-lg">
          <p className="font-medium mb-2">Informations :</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>La migration traite 10 cartes toutes les 2 secondes pour éviter le rate limiting</li>
            <li>Les cartes avec attaques existantes sont automatiquement sautées</li>
            <li>Vous pouvez interrompre avec le bouton "Annuler" et reprendre plus tard</li>
            <li>La progression est sauvegardée : les cartes déjà migrées ne seront pas retraitées</li>
            <li>Données récupérées : attaques, talents (abilities), faiblesses, résistances, coût de retraite</li>
          </ul>
        </div>

        {/* Boutons */}
        <div className="flex gap-2">
          <Button
            onClick={handleStartMigration}
            disabled={isRunning || stats.withoutAttacks === 0}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migration en cours...
              </>
            ) : (
              <>
                <Swords className="mr-2 h-4 w-4" />
                {stats.withoutAttacks === 0 ? 'Toutes les cartes ont des attaques' : `Migrer ${stats.withoutAttacks.toLocaleString()} cartes`}
              </>
            )}
          </Button>

          {isRunning && (
            <Button
              onClick={handleCancel}
              variant="destructive"
            >
              Annuler
            </Button>
          )}
        </div>

        {/* Estimation du temps */}
        {stats.withoutAttacks > 0 && !isRunning && (
          <p className="text-xs text-muted-foreground text-center">
            Temps estimé : ~{Math.round((stats.withoutAttacks / 5) / 60)} minutes
            ({Math.ceil(stats.withoutAttacks / 10)} batches de 10 cartes)
          </p>
        )}
      </CardContent>
    </Card>
  )
}
