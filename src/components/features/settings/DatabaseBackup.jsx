/**
 * Composant pour gérer le backup et la restauration de la base de données locale
 */
import React, { useState } from 'react'
import { Download, Upload, Database, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { BackupService } from '@/services/BackupService'

export function DatabaseBackup() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportStatus, setExportStatus] = useState(null)
  const [importStatus, setImportStatus] = useState(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [backupPreview, setBackupPreview] = useState(null)
  const [importOptions, setImportOptions] = useState({
    restoreDatabase: true,
    restoreUserData: true,
    restoreImages: true,
    clearExisting: false
  })

  /**
   * Exporter les données vers un fichier JSON
   */
  const handleExport = async () => {
    try {
      setIsExporting(true)
      setExportStatus(null)

      const result = await BackupService.exportBackup()

      setExportStatus({
        type: 'success',
        message: `✅ Backup exporté avec succès: ${result.filename}`,
        details: `Taille: ${(result.size / 1024 / 1024).toFixed(2)} MB • ${result.stats.totalCards} cartes • ${result.stats.collectionSize} en collection • ${result.stats.duplicateBatchesCount} lots de doublons • ${result.stats.salesCount} ventes`
      })

      console.log('✅ Export terminé:', result)
    } catch (error) {
      console.error('❌ Erreur export:', error)
      setExportStatus({
        type: 'error',
        message: `❌ Erreur lors de l'export: ${error.message}`
      })
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * Gérer la sélection d'un fichier de backup
   */
  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setImportStatus(null)
      const backupData = await BackupService.importBackupFile(file)
      const preview = BackupService.getBackupPreview(backupData)

      setSelectedFile(file)
      setBackupPreview({ data: backupData, preview })
      setShowImportDialog(true)

      console.log('📋 Aperçu du backup:', preview)
    } catch (error) {
      console.error('❌ Erreur lecture fichier:', error)
      setImportStatus({
        type: 'error',
        message: `❌ Fichier invalide: ${error.message}`
      })
    }
  }

  /**
   * Confirmer l'import et restaurer les données
   */
  const handleConfirmImport = async () => {
    if (!backupPreview?.data) return

    try {
      setIsImporting(true)
      setShowImportDialog(false)
      setImportStatus(null)

      const result = await BackupService.restoreBackup(backupPreview.data, importOptions)

      setImportStatus({
        type: 'success',
        message: `✅ Données restaurées avec succès`,
        details: `${result.restoredCount.cards} cartes • ${result.restoredCount.series} extensions • ${result.restoredCount.collection} en collection • ${result.restoredCount.favorites} favoris • ${result.restoredCount.wishlist} wishlist • ${result.restoredCount.duplicateBatches} lots de doublons • ${result.restoredCount.sales} ventes`
      })

      // Recharger la page après 2 secondes pour rafraîchir les données
      setTimeout(() => {
        window.location.reload()
      }, 2000)

      console.log('✅ Import terminé:', result)
    } catch (error) {
      console.error('❌ Erreur import:', error)
      setImportStatus({
        type: 'error',
        message: `❌ Erreur lors de l'import: ${error.message}`
      })
    } finally {
      setIsImporting(false)
      setSelectedFile(null)
      setBackupPreview(null)
    }
  }

  /**
   * Annuler l'import
   */
  const handleCancelImport = () => {
    setShowImportDialog(false)
    setSelectedFile(null)
    setBackupPreview(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sauvegarde de la Base de Données
          </CardTitle>
          <CardDescription>
            Exportez ou importez toutes vos données : cartes, extensions, blocs, collection, favoris et liste de souhaits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statut d'export */}
          {exportStatus && (
            <Alert variant={exportStatus.type === 'success' ? 'default' : 'destructive'}>
              {exportStatus.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div>{exportStatus.message}</div>
                {exportStatus.details && (
                  <div className="text-xs mt-1 opacity-80">{exportStatus.details}</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Statut d'import */}
          {importStatus && (
            <Alert variant={importStatus.type === 'success' ? 'default' : 'destructive'}>
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div>{importStatus.message}</div>
                {importStatus.details && (
                  <div className="text-xs mt-1 opacity-80">{importStatus.details}</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Boutons d'action */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Export */}
            <Button
              onClick={handleExport}
              disabled={isExporting || isImporting}
              className="w-full"
              variant="default"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter le Backup
                </>
              )}
            </Button>

            {/* Import */}
            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={isExporting || isImporting}
                className="hidden"
                id="backup-file-input"
              />
              <Button
                onClick={() => document.getElementById('backup-file-input').click()}
                disabled={isExporting || isImporting}
                className="w-full"
                variant="outline"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer un Backup
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• L'export crée un fichier JSON contenant toutes vos données locales</p>
            <p>• L'import vous permet de restaurer vos données depuis un fichier de backup</p>
            <p>• Les images uploadées sont incluses dans le backup (peut créer un fichier volumineux)</p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation d'import */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmer l'import du backup</DialogTitle>
            <DialogDescription>
              Vérifiez les informations ci-dessous avant de restaurer vos données.
            </DialogDescription>
          </DialogHeader>

          {backupPreview && (
            <div className="space-y-4">
              {/* Informations du backup */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fichier:</span>
                  <span className="font-medium">{selectedFile?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="font-medium">{backupPreview.preview.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de création:</span>
                  <span className="font-medium">{backupPreview.preview.createdAt}</span>
                </div>
              </div>

              {/* Statistiques */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="font-medium text-sm mb-2">Contenu du backup:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Cartes: {backupPreview.preview.stats.totalCards}</div>
                  <div>Extensions: {backupPreview.preview.stats.totalSeries}</div>
                  <div>Collection: {backupPreview.preview.stats.collectionSize}</div>
                  <div>Favoris: {backupPreview.preview.stats.favoritesCount}</div>
                  <div>Liste de souhaits: {backupPreview.preview.stats.wishlistCount}</div>
                  <div>Lots de doublons: {backupPreview.preview.stats.duplicateBatchesCount}</div>
                  <div>Ventes: {backupPreview.preview.stats.salesCount}</div>
                  <div>Images: {backupPreview.preview.stats.imagesCount}</div>
                </div>
              </div>

              {/* Options d'import */}
              <div className="space-y-3">
                <div className="font-medium text-sm">Options de restauration:</div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restore-database"
                    checked={importOptions.restoreDatabase}
                    onCheckedChange={(checked) =>
                      setImportOptions(prev => ({ ...prev, restoreDatabase: checked }))
                    }
                  />
                  <Label htmlFor="restore-database" className="text-sm cursor-pointer">
                    Restaurer la base de données (cartes, extensions, blocs)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restore-user-data"
                    checked={importOptions.restoreUserData}
                    onCheckedChange={(checked) =>
                      setImportOptions(prev => ({ ...prev, restoreUserData: checked }))
                    }
                  />
                  <Label htmlFor="restore-user-data" className="text-sm cursor-pointer">
                    Restaurer les données utilisateur (collection, favoris, wishlist)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restore-images"
                    checked={importOptions.restoreImages}
                    onCheckedChange={(checked) =>
                      setImportOptions(prev => ({ ...prev, restoreImages: checked }))
                    }
                  />
                  <Label htmlFor="restore-images" className="text-sm cursor-pointer">
                    Restaurer les images uploadées ({backupPreview.preview.stats.imagesCount})
                  </Label>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Checkbox
                    id="clear-existing"
                    checked={importOptions.clearExisting}
                    onCheckedChange={(checked) =>
                      setImportOptions(prev => ({ ...prev, clearExisting: checked }))
                    }
                  />
                  <Label htmlFor="clear-existing" className="text-sm cursor-pointer font-medium text-destructive">
                    Supprimer les données existantes avant l'import
                  </Label>
                </div>
              </div>

              {/* Avertissement */}
              {importOptions.clearExisting && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Attention: Cette action supprimera toutes vos données actuelles avant d'importer le backup.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelImport}>
              Annuler
            </Button>
            <Button onClick={handleConfirmImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                'Confirmer l\'import'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
