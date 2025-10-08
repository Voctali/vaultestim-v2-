import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Database, Info } from 'lucide-react'

export function IndexedDBDiagnostic() {
  const [diagnosticResult, setDiagnosticResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostic = async () => {
    setLoading(true)
    const result = {
      databases: [],
      localStorage: {},
      summary: {}
    }

    try {
      // Vérifier IndexedDB
      const databases = await indexedDB.databases()
      result.databases = databases.map(db => db.name)

      // Essayer d'ouvrir VaultEstimDB
      const openDB = (dbName, version) => {
        return new Promise((resolve) => {
          const request = indexedDB.open(dbName, version)
          request.onerror = () => resolve(null)
          request.onsuccess = () => resolve(request.result)
          request.onupgradeneeded = () => {}
        })
      }

      const db = await openDB('VaultEstimDB', 3)
      if (db) {
        const stores = Array.from(db.objectStoreNames)
        result.summary.stores = stores

        // Compter les données dans chaque store
        for (const storeName of stores) {
          try {
            const transaction = db.transaction([storeName], 'readonly')
            const store = transaction.objectStore(storeName)
            const countRequest = store.count()

            await new Promise((resolve) => {
              countRequest.onsuccess = () => {
                result.summary[storeName] = countRequest.result
                resolve()
              }
              countRequest.onerror = () => {
                result.summary[storeName] = 'Erreur'
                resolve()
              }
            })
          } catch (error) {
            result.summary[storeName] = 'Erreur: ' + error.message
          }
        }

        db.close()
      }

      // Vérifier localStorage (ancien et nouveau systèmes)
      const lsKeys = [
        'vaultestim_collection',
        'vaultestim_favorites',
        'vaultestim_wishlist',
        'vaultestim_discovered_cards',
        'vaultestim_series_database',
        'vaultestim_custom_blocks',
        'vaultestim_custom_extensions'
      ]
      for (const key of lsKeys) {
        const data = localStorage.getItem(key)
        if (data) {
          try {
            const parsed = JSON.parse(data)
            result.localStorage[key] = Array.isArray(parsed) ? parsed.length : typeof parsed
          } catch {
            result.localStorage[key] = 'Erreur parsing'
          }
        }
      }

      setDiagnosticResult(result)
    } catch (error) {
      setDiagnosticResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="golden-border">
      <CardHeader>
        <CardTitle className="flex items-center golden-glow">
          <Database className="w-5 h-5 mr-2" />
          Diagnostic IndexedDB
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Cet outil vérifie l'état de votre base de données locale (IndexedDB) pour identifier les données disponibles pour la migration.
          </AlertDescription>
        </Alert>

        <Button onClick={runDiagnostic} disabled={loading}>
          {loading ? 'Analyse en cours...' : 'Lancer le diagnostic'}
        </Button>

        {diagnosticResult && (
          <div className="space-y-3 text-sm">
            {diagnosticResult.error ? (
              <Alert variant="destructive">
                <AlertDescription>Erreur : {diagnosticResult.error}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-semibold mb-2">Bases de données IndexedDB détectées :</h4>
                  <div className="space-y-1">
                    {diagnosticResult.databases.length > 0 ? (
                      diagnosticResult.databases.map(db => (
                        <div key={db}>• {db}</div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">Aucune base de données trouvée</div>
                    )}
                  </div>
                </div>

                {diagnosticResult.summary.stores && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Stores VaultEstimDB :</h4>
                    <div className="space-y-1">
                      {diagnosticResult.summary.stores.map(store => (
                        <div key={store}>
                          • {store}: {diagnosticResult.summary[store]} éléments
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(diagnosticResult.localStorage).length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Données localStorage :</h4>
                    <div className="space-y-1">
                      {Object.entries(diagnosticResult.localStorage).map(([key, value]) => (
                        <div key={key}>
                          • {key}: {value} cartes
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {diagnosticResult.databases.length === 0 &&
                 Object.keys(diagnosticResult.localStorage).length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Aucune donnée locale trouvée. Il est possible que les données aient déjà été migrées ou supprimées.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
