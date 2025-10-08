/**
 * Page de migration vers Supabase
 * Migration sécurisée de vos 8515 cartes + 162 extensions
 */
import React, { useState } from 'react'
import { Database, Cloud, Download, CheckCircle, AlertCircle, ArrowRight, Loader } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { SupabaseMigrationService } from '@/services/SupabaseMigrationService'

export function MigrateToSupabase() {
  const [migrationState, setMigrationState] = useState('idle') // 'idle', 'running', 'success', 'error'
  const [currentStep, setCurrentStep] = useState(null)
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  const handleMigration = async () => {
    try {
      setMigrationState('running')
      setError(null)
      setReport(null)

      // Lancer la migration
      const migrationReport = await SupabaseMigrationService.migrateAll()

      setReport(migrationReport)
      setMigrationState('success')
    } catch (err) {
      console.error('❌ Erreur migration:', err)
      setError(err.message)
      setMigrationState('error')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Cloud className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold font-['Cinzel']">Migration vers Supabase</h1>
          <p className="text-muted-foreground">Synchronisation multi-appareils de vos données</p>
        </div>
      </div>

      {/* État IDLE - Prêt à migrer */}
      {migrationState === 'idle' && (
        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Prêt à migrer vos données
            </CardTitle>
            <CardDescription>
              Migration sécurisée vers Supabase avec backup automatique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informations */}
            <div className="space-y-4">
              <h3 className="font-semibold">✅ Ce qui sera migré :</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cartes découvertes (8515+ cartes)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Extensions (162+ extensions)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Blocs personnalisés</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Extensions déplacées</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Votre collection</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Favoris & Wishlist</span>
                </div>
              </div>

              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  <strong>Backup automatique :</strong> Un backup complet sera créé et téléchargé avant la migration
                </AlertDescription>
              </Alert>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">🎯 Avantages de Supabase :</h4>
                <ul className="space-y-1 text-sm">
                  <li>✅ Synchronisation multi-appareils en temps réel</li>
                  <li>✅ Accès depuis téléphone, tablette, PC</li>
                  <li>✅ Backup automatique quotidien</li>
                  <li>✅ Performances optimisées</li>
                  <li>✅ Onglet Admin fonctionnera parfaitement</li>
                </ul>
              </div>
            </div>

            {/* Bouton de migration */}
            <Button
              onClick={handleMigration}
              size="lg"
              className="w-full"
            >
              <Cloud className="h-5 w-5 mr-2" />
              Lancer la migration
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* État RUNNING - Migration en cours */}
      {migrationState === 'running' && (
        <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader className="h-6 w-6 animate-spin" />
              Migration en cours...
            </CardTitle>
            <CardDescription>
              Veuillez patienter, vos données sont en cours de migration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-lg">Migration de vos données...</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cette opération peut prendre plusieurs minutes selon le nombre de cartes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* État SUCCESS - Migration réussie */}
      {migrationState === 'success' && report && (
        <Card className="border-2 border-green-500 bg-gradient-to-br from-green-500/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Migration réussie ! 🎉
            </CardTitle>
            <CardDescription>
              Vos données ont été migrées avec succès vers Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Résumé de la migration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.steps.map((step, index) => (
                <div key={index} className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-semibold">{step.name}</span>
                  </div>
                  {step.count !== undefined && (
                    <p className="text-2xl font-bold text-green-600">{step.count}</p>
                  )}
                  {step.details && typeof step.details === 'object' && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {Object.entries(step.details).map(([key, value]) => (
                        <div key={key}>{key}: {value}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Durée */}
            <div className="text-center">
              <Badge variant="outline" className="text-lg px-4 py-2">
                ⏱️ Durée : {report.duration_seconds}s
              </Badge>
            </div>

            {/* Avertissements */}
            {report.errors && report.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Avertissements :</strong>
                  <ul className="mt-2 space-y-1">
                    {report.errors.map((err, index) => (
                      <li key={index}>• {err.step}: {err.error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Prochaines étapes */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-3">🎯 Prochaines étapes :</h4>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                <li>Rafraîchissez la page pour charger vos données depuis Supabase</li>
                <li>Vérifiez que toutes vos cartes et extensions sont présentes</li>
                <li>Testez l'onglet Administration pour modifier la base</li>
                <li>Connectez-vous depuis un autre appareil pour tester la synchronisation</li>
              </ol>
            </div>

            {/* Bouton pour rafraîchir */}
            <Button
              onClick={() => window.location.reload()}
              size="lg"
              className="w-full"
            >
              Rafraîchir l'application
            </Button>
          </CardContent>
        </Card>
      )}

      {/* État ERROR - Erreur */}
      {migrationState === 'error' && (
        <Card className="border-2 border-red-500 bg-gradient-to-br from-red-500/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              Erreur de migration
            </CardTitle>
            <CardDescription>
              La migration a échoué, vos données sont intactes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Erreur :</strong> {error}
              </AlertDescription>
            </Alert>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2">🔄 Que faire ?</h4>
              <ul className="space-y-1 text-sm">
                <li>✅ Vos données sont toujours dans IndexedDB (aucune perte)</li>
                <li>✅ Un backup a été téléchargé avant la tentative</li>
                <li>✅ Vous pouvez réessayer en corrigeant l'erreur</li>
              </ul>
            </div>

            <Button
              onClick={() => setMigrationState('idle')}
              size="lg"
              variant="outline"
              className="w-full"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
