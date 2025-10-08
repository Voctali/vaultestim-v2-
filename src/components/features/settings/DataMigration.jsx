import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DataMigrationService } from '@/services/DataMigrationService'
import { Database, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export function DataMigration() {
  const [hasOldData, setHasOldData] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState(null)
  const [oldDataSummary, setOldDataSummary] = useState(null)

  useEffect(() => {
    checkForOldData()
  }, [])

  const checkForOldData = async () => {
    setIsChecking(true)
    try {
      const hasData = await DataMigrationService.hasOldData()
      setHasOldData(hasData)

      if (hasData) {
        const oldData = await DataMigrationService.getOldLocalData()
        setOldDataSummary({
          collection: oldData.collection.length,
          favorites: oldData.favorites.length,
          wishlist: oldData.wishlist.length,
          discoveredCards: oldData.discoveredCards.length,
          customBlocks: oldData.customBlocks.length
        })
      }
    } catch (error) {
      console.error('Erreur vérification données:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleMigration = async () => {
    setIsMigrating(true)
    setMigrationResult(null)

    try {
      // Récupérer les anciennes données
      const oldData = await DataMigrationService.getOldLocalData()

      // Migrer vers le backend
      const apiUrl = import.meta.env.VITE_API_URL || 'https://192.168.50.137:3000/api'
      const result = await DataMigrationService.migrateToBackend(oldData, apiUrl)

      setMigrationResult(result)

      if (result.success) {
        // Recharger la page pour récupérer les nouvelles données
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      console.error('Erreur migration:', error)
      setMigrationResult({
        success: false,
        errors: [error.message]
      })
    } finally {
      setIsMigrating(false)
    }
  }

  if (isChecking) {
    return (
      <Card className="golden-border">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Vérification des données...</span>
        </CardContent>
      </Card>
    )
  }

  if (!hasOldData && !migrationResult) {
    return (
      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="flex items-center golden-glow">
            <Database className="w-5 h-5 mr-2" />
            Migration de données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Aucune donnée locale à migrer n'a été trouvée.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="golden-border">
      <CardHeader>
        <CardTitle className="flex items-center golden-glow">
          <Database className="w-5 h-5 mr-2" />
          Migration de données
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!migrationResult && (
          <>
            <Alert className="border-blue-500/20 bg-blue-500/10">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-500">
                Des données locales ont été détectées et peuvent être migrées vers votre compte.
              </AlertDescription>
            </Alert>

            {oldDataSummary && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold mb-3">Données détectées :</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {oldDataSummary.collection > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Collection :</span>
                      <span className="font-medium">{oldDataSummary.collection} cartes</span>
                    </div>
                  )}
                  {oldDataSummary.favorites > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Favoris :</span>
                      <span className="font-medium">{oldDataSummary.favorites} cartes</span>
                    </div>
                  )}
                  {oldDataSummary.wishlist > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Liste de souhaits :</span>
                      <span className="font-medium">{oldDataSummary.wishlist} cartes</span>
                    </div>
                  )}
                  {oldDataSummary.discoveredCards > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cartes découvertes :</span>
                      <span className="font-medium">{oldDataSummary.discoveredCards} cartes</span>
                    </div>
                  )}
                  {oldDataSummary.customBlocks > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Blocs personnalisés :</span>
                      <span className="font-medium">{oldDataSummary.customBlocks}</span>
                    </div>
                  )}
                  {oldDataSummary.customExtensions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Extensions modifiées :</span>
                      <span className="font-medium">{oldDataSummary.customExtensions}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={handleMigration}
              disabled={isMigrating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migration en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Migrer mes données
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Cette opération copiera vos données locales vers votre compte. Vos données locales seront conservées.
            </p>
          </>
        )}

        {migrationResult && (
          <div className="space-y-4">
            {migrationResult.success ? (
              <Alert className="border-green-500/20 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  Migration réussie !
                  <div className="mt-2 space-y-1 text-xs">
                    {migrationResult.migrated.collection > 0 && <div>• {migrationResult.migrated.collection} cartes de collection</div>}
                    {migrationResult.migrated.favorites > 0 && <div>• {migrationResult.migrated.favorites} favoris</div>}
                    {migrationResult.migrated.wishlist > 0 && <div>• {migrationResult.migrated.wishlist} cartes wishlist</div>}
                    {migrationResult.migrated.discoveredCards > 0 && <div>• {migrationResult.migrated.discoveredCards} cartes découvertes</div>}
                    {migrationResult.migrated.customBlocks > 0 && <div>• {migrationResult.migrated.customBlocks} blocs personnalisés</div>}
                  </div>
                  <div className="mt-2 text-xs">La page va se recharger...</div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-500/20 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-500">
                  Erreur lors de la migration :<br />
                  {migrationResult.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
