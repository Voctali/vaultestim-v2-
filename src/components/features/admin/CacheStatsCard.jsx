import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCardDatabase } from '@/hooks/useCardDatabase.jsx'
import {
  Database,
  Zap,
  Trash2,
  RefreshCw,
  HardDrive,
  Clock,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export function CacheStatsCard() {
  const {
    getCacheStats,
    clearCache,
    getApiStatus,
    checkApiHealth,
    getSystemStats,
    preloadPopularCards
  } = useCardDatabase()

  const [stats, setStats] = useState(null)
  const [apiStatus, setApiStatus] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPreloading, setIsPreloading] = useState(false)

  const refreshStats = async () => {
    setIsRefreshing(true)
    try {
      const cacheStats = getCacheStats()
      const systemStats = getSystemStats()
      const apis = getApiStatus()

      setStats({ ...cacheStats, ...systemStats })
      setApiStatus(apis)
    } catch (error) {
      console.error('Erreur refresh stats:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleClearCache = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vider tout le cache ? Cela supprimera toutes les données cachées.')) {
      const cleared = clearCache()
      console.log(`🗑️ ${cleared} entrées supprimées du cache`)
      refreshStats()
    }
  }

  const handleCheckApis = async () => {
    setIsRefreshing(true)
    try {
      const results = await checkApiHealth()
      console.log('🔄 Vérification APIs:', results)
      refreshStats()
    } catch (error) {
      console.error('Erreur vérification APIs:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handlePreload = async () => {
    setIsPreloading(true)
    try {
      await preloadPopularCards()
      refreshStats()
    } catch (error) {
      console.error('Erreur pré-chargement:', error)
    } finally {
      setIsPreloading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getApiStatusIcon = (api) => {
    if (api.available) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    return <AlertCircle className="w-4 h-4 text-red-500" />
  }

  useEffect(() => {
    refreshStats()

    // Rafraîchir automatiquement toutes les 30 secondes
    const interval = setInterval(refreshStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!stats) {
    return (
      <Card className="golden-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2">Chargement des statistiques...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="golden-border">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="golden-glow flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Cache & APIs
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={refreshStats}
              disabled={isRefreshing}
              className="border-blue-500/20"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePreload}
              disabled={isPreloading}
              className="border-green-500/20"
            >
              <Zap className="w-4 h-4 mr-1" />
              {isPreloading ? 'Pré-chargement...' : 'Pré-charger'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearCache}
              className="border-red-500/20 hover:bg-red-500/10 text-red-500"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Vider Cache
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Statistiques du Cache */}
          <div>
            <h3 className="text-lg font-semibold golden-glow mb-4">📊 Statistiques du Cache</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{stats.cards || 0}</div>
                <div className="text-sm text-muted-foreground">Cartes</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-500">{stats.searches || 0}</div>
                <div className="text-sm text-muted-foreground">Recherches</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-500">{stats.prices || 0}</div>
                <div className="text-sm text-muted-foreground">Prix</div>
              </div>
              <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-500">{stats.expired || 0}</div>
                <div className="text-sm text-muted-foreground">Expirées</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center">
                <HardDrive className="w-4 h-4 mr-1" />
                Taille: {formatFileSize(stats.totalSize || 0)}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {stats.totalEntries || 0} entrées au total
              </div>
            </div>
          </div>

          {/* Statut des APIs */}
          <div>
            <h3 className="text-lg font-semibold golden-glow mb-4">🌐 Statut des APIs</h3>
            <div className="space-y-3">
              {apiStatus.map((api, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                  <div className="flex items-center">
                    {getApiStatusIcon(api)}
                    <span className="ml-2 font-medium">{api.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {api.errorCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {api.errorCount} erreurs
                      </Badge>
                    )}
                    <Badge
                      variant={api.available ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {api.available ? 'Disponible' : 'Indisponible'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {api.lastSuccess}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button
                onClick={handleCheckApis}
                disabled={isRefreshing}
                variant="outline"
                className="w-full border-primary/20"
              >
                <Wifi className="w-4 h-4 mr-2" />
                Vérifier toutes les APIs
              </Button>
            </div>
          </div>

          {/* Performance */}
          <div>
            <h3 className="text-lg font-semibold golden-glow mb-4">⚡ Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-accent/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">APIs Disponibles</span>
                  <span className="text-lg font-bold text-green-500">
                    {stats.availableApis || 0}/{stats.totalApis || 0}
                  </span>
                </div>
              </div>
              <div className="bg-accent/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cache Hit Rate</span>
                  <span className="text-lg font-bold text-blue-500">
                    {stats.totalEntries > 0 ?
                      Math.round(((stats.totalEntries - (stats.expired || 0)) / stats.totalEntries) * 100) : 0
                    }%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}