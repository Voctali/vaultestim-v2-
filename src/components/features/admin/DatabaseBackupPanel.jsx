import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Upload, Database, Info, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { DatabaseBackupService } from '@/services/DatabaseBackupService'
import { useAuth } from '@/hooks/useAuth'

export function DatabaseBackupPanel() {
  const { user } = useAuth()
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState(0)
  const [backupStats, setBackupStats] = useState(null)
  const [restoreResults, setRestoreResults] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Créer et télécharger un backup
  const handleCreateBackup = async () => {
    if (!user?.id) {
      setError('Utilisateur non connecté')
      return
    }

    setIsCreatingBackup(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('📦 Création du backup...')
      const backup = await DatabaseBackupService.createBackup(user.id)

      // Télécharger le backup
      DatabaseBackupService.downloadBackup(backup)

      setSuccess(`Backup créé avec succès ! ${backup.data.discovered_cards?.length || 0} cartes, ${backup.data.user_collection?.length || 0} en collection`)
      console.log('✅ Backup téléchargé')
    } catch (error) {
      console.error('❌ Erreur création backup:', error)
      setError(`Erreur création backup: ${error.message}`)
    } finally {
      setIsCreatingBackup(false)
    }
  }

  // Analyser un fichier backup
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(null)
    setBackupStats(null)

    try {
      console.log('📊 Analyse du backup...')
      const stats = await DatabaseBackupService.getBackupStats(file)
      setBackupStats(stats)
      console.log('✅ Stats:', stats)
    } catch (error) {
      console.error('❌ Erreur lecture backup:', error)
      setError(`Fichier invalide: ${error.message}`)
    }
  }

  // Restaurer un backup
  const handleRestoreBackup = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    // Confirmation
    if (!window.confirm('⚠️ ATTENTION : La restauration va écraser toutes vos données actuelles.\n\nÊtes-vous sûr de vouloir continuer ?')) {
      event.target.value = '' // Reset input
      return
    }

    setIsRestoring(true)
    setError(null)
    setSuccess(null)
    setRestoreResults(null)
    setRestoreProgress(0)

    try {
      console.log('📥 Restauration du backup...')
      const results = await DatabaseBackupService.restoreBackup(
        file,
        user.id,
        (progress) => setRestoreProgress(progress)
      )

      setRestoreResults(results)

      if (results.errors.length > 0) {
        setError(`Restauration terminée avec ${results.errors.length} erreur(s)`)
      } else {
        setSuccess('Restauration terminée avec succès ! Actualisez la page pour voir les changements.')
      }

      console.log('✅ Restauration terminée:', results)
    } catch (error) {
      console.error('❌ Erreur restauration:', error)
      setError(`Erreur restauration: ${error.message}`)
    } finally {
      setIsRestoring(false)
      event.target.value = '' // Reset input
    }
  }

  return (
    <div className="space-y-6">
      {/* Créer un backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Créer un backup
          </CardTitle>
          <CardDescription>
            Télécharge un fichier JSON contenant toutes vos données Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="w-full"
          >
            {isCreatingBackup ? (
              <>
                <Database className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Télécharger un backup complet
              </>
            )}
          </Button>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p><strong>Le backup inclut :</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Toutes les cartes découvertes (base commune)</li>
                  <li>Votre collection personnelle</li>
                  <li>Vos favoris et wishlist</li>
                  <li>Vos produits scellés et ventes</li>
                  <li>Vos matchings CardMarket</li>
                  <li>Toutes les extensions</li>
                </ul>
                <p className="mt-2 text-muted-foreground">
                  💡 Conservez ce fichier en lieu sûr (cloud, disque dur externe)
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Analyser un backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Analyser un backup
          </CardTitle>
          <CardDescription>
            Voir le contenu d'un fichier backup sans le restaurer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
            />
          </div>

          {backupStats && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 font-semibold">
                <Database className="h-4 w-4" />
                Statistiques du backup
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Version:</span>
                  <span className="ml-2 font-medium">{backupStats.version}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <span className="ml-2 font-medium">
                    {new Date(backupStats.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t">
                  <div className="font-medium mb-2">Contenu:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Cartes découvertes: <strong>{backupStats.tables.discovered_cards}</strong></div>
                    <div>Collection: <strong>{backupStats.tables.user_collection}</strong></div>
                    <div>Favoris: <strong>{backupStats.tables.user_favorites}</strong></div>
                    <div>Wishlist: <strong>{backupStats.tables.user_wishlist}</strong></div>
                    <div>Produits scellés: <strong>{backupStats.tables.sealed_products}</strong></div>
                    <div>Ventes: <strong>{backupStats.tables.sales}</strong></div>
                    <div>Lots doublons: <strong>{backupStats.tables.duplicate_lots}</strong></div>
                    <div>Matchings: <strong>{backupStats.tables.user_cardmarket_matches}</strong></div>
                    <div className="col-span-2">Extensions: <strong>{backupStats.tables.discovered_sets}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restaurer un backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restaurer un backup
          </CardTitle>
          <CardDescription>
            ⚠️ Attention : Cette action va remplacer toutes vos données actuelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>AVERTISSEMENT :</strong> La restauration va écraser toutes vos données actuelles.
              Créez un backup avant de restaurer si vous voulez conserver vos données actuelles.
            </AlertDescription>
          </Alert>

          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              disabled={isRestoring}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-destructive file:text-destructive-foreground
                hover:file:bg-destructive/90
                cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {isRestoring && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Restauration en cours...</span>
                <span className="font-medium">{restoreProgress}%</span>
              </div>
              <Progress value={restoreProgress} />
            </div>
          )}

          {restoreResults && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 font-semibold">
                {restoreResults.errors.length > 0 ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                Résultats de la restauration
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Cartes découvertes: <strong>{restoreResults.discovered_cards}</strong></div>
                <div>Collection: <strong>{restoreResults.user_collection}</strong></div>
                <div>Favoris: <strong>{restoreResults.user_favorites}</strong></div>
                <div>Wishlist: <strong>{restoreResults.user_wishlist}</strong></div>
                <div>Produits scellés: <strong>{restoreResults.sealed_products}</strong></div>
                <div>Ventes: <strong>{restoreResults.sales}</strong></div>
                <div>Lots doublons: <strong>{restoreResults.duplicate_lots}</strong></div>
                <div>Matchings: <strong>{restoreResults.user_cardmarket_matches}</strong></div>
                <div className="col-span-2">Extensions: <strong>{restoreResults.discovered_sets}</strong></div>
              </div>
              {restoreResults.errors.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-destructive font-medium mb-1">Erreurs:</div>
                  <div className="text-xs space-y-1">
                    {restoreResults.errors.map((err, i) => (
                      <div key={i}>• {err.table}: {err.error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages de succès/erreur */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
