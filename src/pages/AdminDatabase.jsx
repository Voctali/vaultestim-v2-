/**
 * Page d'administration de la base de données
 * Accessible via Administration > Base de Données
 */
import React, { useState, useEffect } from 'react'
import {
  Database,
  Zap,
  RefreshCw,
  BarChart3,
  Search,
  Server,
  HardDrive,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Settings,
  Upload,
  Trash2
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

import { DatabaseService } from '@/services/DatabaseService'
import { DatabaseSearch } from '@/components/features/database/DatabaseSearch'
import { FileUpload } from '@/components/features/database/FileUpload'
import { DatabaseManager } from '@/components/features/database/DatabaseManager'
import { config } from '@/lib/config'

export function AdminDatabase() {
  const [stats, setStats] = useState(null)
  const [syncStatus, setSyncStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  /**
   * Charger les données de la page
   */
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Charger en parallèle
      const [statsResponse, syncResponse] = await Promise.all([
        DatabaseService.getStats(),
        DatabaseService.getSyncStatus()
      ])

      setStats(statsResponse)
      setSyncStatus(syncResponse)
      setLastUpdate(new Date())

    } catch (err) {
      setError(err.message)
      console.error('Erreur chargement admin DB:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Déclencher une synchronisation
   */
  const handleSync = async (type = 'full') => {
    try {
      const response = await DatabaseService.triggerSync(type)

      // Afficher le message de succès
      alert(`✅ ${response.message}`)

      // Recharger le statut après 2 secondes
      setTimeout(loadData, 2000)

    } catch (err) {
      alert(`❌ Erreur: ${err.message}`)
    }
  }

  /**
   * Tester la connectivité API
   */
  const testConnection = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/health`)
      const data = await response.json()

      alert(`✅ API connectée!\n\nStatus: ${data.status}\nServices: ${JSON.stringify(data.services, null, 2)}`)
    } catch (err) {
      alert(`❌ API non disponible: ${err.message}`)
    }
  }

  /**
   * Gérer l'upload de fichiers
   */
  const handleFileUpload = (results) => {
    console.log('Résultats de l\'upload:', results)

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    if (successCount > 0) {
      alert(`✅ ${successCount} fichier(s) importé(s) avec succès!`)
      // Recharger les données pour refléter les nouvelles importations
      loadData()
    }

    if (errorCount > 0) {
      const errorMessages = results
        .filter(r => r.status === 'error')
        .map(r => `${r.file}: ${r.message}`)
        .join('\n')
      alert(`❌ ${errorCount} erreur(s):\n${errorMessages}`)
    }
  }

  /**
   * Supprimer toute la base de données
   */
  const handleClearDatabase = async () => {
    const confirmed = window.confirm(
      '⚠️ ATTENTION ⚠️\n\n' +
      'Cette action va supprimer TOUTES les données :\n' +
      '• Toutes les cartes (2000+ cartes)\n' +
      '• Tous les sets et extensions\n' +
      '• Tout l\'historique de recherche\n' +
      '• Cache et données locales\n\n' +
      'Cette action est IRRÉVERSIBLE !\n\n' +
      'Êtes-vous absolument certain de vouloir continuer ?'
    )

    if (!confirmed) return

    const doubleConfirm = window.confirm(
      '🔴 DERNIÈRE CONFIRMATION 🔴\n\n' +
      'Vous allez perdre TOUTES vos données de façon permanente.\n\n' +
      'Tapez "SUPPRIMER" dans la prochaine boîte pour confirmer.'
    )

    if (!doubleConfirm) return

    const userInput = prompt('Tapez "SUPPRIMER" en majuscules pour confirmer :')
    if (userInput !== 'SUPPRIMER') {
      alert('❌ Suppression annulée - texte incorrect')
      return
    }

    try {
      // 1. Vider le localStorage
      localStorage.removeItem('vaultestim_discovered_cards')
      localStorage.removeItem('vaultestim_series_database')
      localStorage.removeItem('vaultestim_search_cache')
      localStorage.removeItem('vaultestim_collection')

      // 2. Appeler l'API backend pour vider la base de données serveur
      console.log('🗑️ Suppression des données backend...')
      const response = await fetch(`${config.API_BASE_URL}/database/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Réponse serveur:', result)

      alert(`✅ Base de données complètement vidée!\n\n` +
            `• ${result.cleared.cards} cartes supprimées\n` +
            `• ${result.cleared.sets} sets\n` +
            `• Cache local vidé\n\n` +
            `La page va se recharger.`)

      // Recharger la page pour reinitialiser l'état
      window.location.reload()

    } catch (error) {
      console.error('❌ Erreur suppression:', error)
      alert(`❌ Erreur lors de la suppression: ${error.message}\n\nLe localStorage a été vidé mais le serveur pourrait encore contenir des données.`)

      // Recharger quand même pour vider le cache local
      window.location.reload()
    }
  }

  // Charger les données au montage
  useEffect(() => {
    // Désactiver le chargement automatique pour utiliser seulement les données locales
    setLoading(false)
    setStats({
      total_sets: 0,
      total_cards: 0,
      cards_with_prices: 0,
      recent_prices: 0,
      topSets: [],
      distribution: {
        types: [],
        rarities: []
      }
    })
    setSyncStatus({ isRunning: false, lastSync: null, stats: { sets: { added: 0, errors: 0 }, cards: { added: 0, errors: 0 }, prices: { added: 0, errors: 0 }, images: { cached: 0, errors: 0 } } })

    // Auto-refresh désactivé pour utiliser les données locales
    // const interval = setInterval(loadData, 30000)
    // return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Base de Données</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Chargement des données...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Base de Données</h1>
            <p className="text-muted-foreground">
              Gestion et monitoring de la base de données cartes Pokémon
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={testConnection}>
            <Server className="h-4 w-4 mr-2" />
            Test API
          </Button>
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Alertes */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur de connexion à la base de données: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Statut de connexion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Statut du Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`} />
              <div>
                <div className="font-medium">API Backend</div>
                <div className="text-sm text-muted-foreground">
                  {error ? 'Déconnecté' : 'Connecté'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${syncStatus?.isRunning ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <div>
                <div className="font-medium">Synchronisation</div>
                <div className="text-sm text-muted-foreground">
                  {syncStatus?.isRunning ? 'En cours' : 'Disponible'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Dernière MAJ</div>
                <div className="text-sm text-muted-foreground">
                  {lastUpdate.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques générales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Extensions</p>
                  <p className="text-2xl font-bold">{stats?.total_sets || 0}</p>
                </div>
                <HardDrive className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cartes</p>
                  <p className="text-2xl font-bold">{(stats?.total_cards || 0).toLocaleString()}</p>
                </div>
                <Database className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avec Prix</p>
                  <p className="text-2xl font-bold">{(stats?.cards_with_prices || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{Math.round(((stats?.cards_with_prices || 0) / (stats?.total_cards || 1)) * 100)}% de couverture</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prix Récents</p>
                  <p className="text-2xl font-bold">{stats?.recent_prices || 0}</p>
                  <p className="text-xs text-muted-foreground">Dernières 24h</p>
                </div>
                <Activity className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglets principaux */}
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
          <TabsTrigger value="search">Recherche</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="manage">Gestion</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Onglet Synchronisation */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Synchronisation des Données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Statut sync */}
              {syncStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Statut Actuel</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {syncStatus.isRunning ? (
                          <Pause className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Play className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm">
                          {syncStatus.isRunning ? 'Synchronisation en cours' : 'Prêt à synchroniser'}
                        </span>
                      </div>
                      {syncStatus.lastSync && (
                        <div className="text-sm text-muted-foreground">
                          Dernière sync: {new Date(syncStatus.lastSync).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Statistiques</h4>
                    <div className="text-sm space-y-1">
                      <div>Extensions: +{syncStatus.stats.sets.added} ajoutées, {syncStatus.stats.sets.errors} erreurs</div>
                      <div>Cartes: +{syncStatus.stats.cards.added} ajoutées, {syncStatus.stats.cards.errors} erreurs</div>
                      <div>Prix: +{syncStatus.stats.prices.added} ajoutés, {syncStatus.stats.prices.errors} erreurs</div>
                      <div>Images: +{syncStatus.stats.images.cached} mises en cache, {syncStatus.stats.images.errors} erreurs</div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Actions de synchronisation */}
              <div>
                <h4 className="font-medium mb-3">Actions Disponibles</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    onClick={() => handleSync('full')}
                    disabled={syncStatus?.isRunning}
                    className="w-full"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Sync Complète
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSync('sets')}
                    disabled={syncStatus?.isRunning}
                  >
                    <HardDrive className="h-4 w-4 mr-2" />
                    Extensions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSync('cards')}
                    disabled={syncStatus?.isRunning}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Cartes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSync('prices')}
                    disabled={syncStatus?.isRunning}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Prix
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> La synchronisation complète peut prendre plusieurs minutes.
                  Les données seront mises à jour automatiquement.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Recherche */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Recherche Avancée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Interface de recherche complète dans la base de données
              </p>
              <DatabaseSearch />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Import */}
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import de Fichiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Importez des données JSON ou CSV pour alimenter la base de données
              </p>
              <FileUpload onUpload={handleFileUpload} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Gestion */}
        <TabsContent value="manage">
          <DatabaseManager />
        </TabsContent>

        {/* Onglet Statistiques */}
        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <>
              {/* Top Extensions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Extensions (par nombre de cartes)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(stats.topSets || []).slice(0, 8).map((set, index) => (
                      <div key={set.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <div className="font-medium">{set.name}</div>
                            <div className="text-sm text-muted-foreground">{set.series}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{set.cardCount} cartes</div>
                          <div className="text-sm text-muted-foreground">
                            {set.releaseDate ? new Date(set.releaseDate).getFullYear() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Répartition par type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition par Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(stats.distribution?.types || []).map(type => (
                        <div key={type.name} className="flex items-center justify-between">
                          <span>{type.name}</span>
                          <Badge variant="secondary">{type.count.toLocaleString()}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Répartition par Rareté</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(stats.distribution?.rarities || []).slice(0, 8).map(rarity => (
                        <div key={rarity.name} className="flex items-center justify-between">
                          <span className="text-sm">{rarity.name}</span>
                          <Badge variant="outline">{rarity.count.toLocaleString()}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Onglet Configuration */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Configuration backend dans <code>server/.env</code>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">URLs API</h4>
                  <div className="text-sm space-y-1 font-mono bg-muted p-3 rounded">
                    <div>Backend: {config.API_BASE_URL}</div>
                    <div>Health: {config.API_BASE_URL}/health</div>
                    <div>Stats: {config.API_BASE_URL}/stats</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Actions Système</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open(`${config.API_BASE_URL}/health`, '_blank')}>
                      Ouvrir API Health
                    </Button>
                    <Button variant="outline" onClick={() => window.open('/test-frontend.html', '_blank')}>
                      Interface de Test
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950 dark:border-red-800">
                  <h4 className="font-medium mb-2 text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Zone Dangereuse
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    Ces actions sont irréversibles et supprimeront définitivement vos données.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Button
                        variant="destructive"
                        onClick={handleClearDatabase}
                        className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer toute la base de données
                      </Button>
                      <p className="text-xs text-red-500 mt-1">
                        Supprime toutes les cartes, sets, cache et données locales
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}