import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Download, RefreshCw, Check, AlertCircle, Loader2, Package, Calendar, Hash, Zap } from 'lucide-react'
import NewExtensionDiscoveryService from '@/services/NewExtensionDiscoveryService'
import { RapidAPIService } from '@/services/RapidAPIService'
import { useCardDatabase } from '@/hooks/useCardDatabase'

const ExtensionDiscoveryPanel = () => {
  const { addDiscoveredCards, updateSeriesDatabase, discoveredCards, seriesDatabase } = useCardDatabase()

  const [loading, setLoading] = useState(false)
  const [discovering, setDiscovering] = useState(false)
  const [importing, setImporting] = useState(false)
  const [newExtensions, setNewExtensions] = useState([])
  const [selectedExtensions, setSelectedExtensions] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [progress, setProgress] = useState(null)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [importResults, setImportResults] = useState(null)

  // État pour import manuel RapidAPI
  const [rapidAPISlug, setRapidAPISlug] = useState('')
  const [rapidAPIImporting, setRapidAPIImporting] = useState(false)
  const [rapidAPIResult, setRapidAPIResult] = useState(null)

  // Import manuel via RapidAPI
  const handleRapidAPIImport = async () => {
    if (!rapidAPISlug.trim()) return

    setRapidAPIImporting(true)
    setError(null)
    setRapidAPIResult(null)

    try {
      const slug = rapidAPISlug.trim().toLowerCase()
      console.log(`⚡ Import manuel RapidAPI: "${slug}"`)

      // Vérifier si l'extension existe déjà
      const existingExtension = seriesDatabase.find(series =>
        series.name.toLowerCase().includes(slug.replace(/-/g, ' '))
      )

      const existingCardsCount = discoveredCards.filter(card =>
        card.set?.name?.toLowerCase().includes(slug.replace(/-/g, ' '))
      ).length

      if (existingExtension || existingCardsCount > 0) {
        const message = existingExtension
          ? `L'extension existe déjà avec ${existingExtension.totalCards || existingCardsCount} cartes. Réimporter ?`
          : `${existingCardsCount} cartes existent déjà. Continuer ?`

        if (!window.confirm(message)) {
          setRapidAPIImporting(false)
          return
        }
      }

      // Importer via RapidAPI
      const cards = await RapidAPIService.importAllCardsByExpansion(slug, (progressData) => {
        setProgress({
          message: `Import ${progressData.setName || slug}`,
          current: progressData.count,
          total: progressData.total,
          setName: progressData.setName
        })
      })

      console.log(`✅ ${cards.length} cartes importées via RapidAPI`)

      // Calculer les stats AVANT de sauvegarder
      const existingCardIds = new Set(discoveredCards.map(c => c.id))
      const newCardsCount = cards.filter(card => !existingCardIds.has(card.id)).length
      const updatedCardsCount = cards.length - newCardsCount

      // Sauvegarder les cartes
      await addDiscoveredCards(cards)
      await updateSeriesDatabase(cards)

      setRapidAPIResult({
        success: true,
        count: cards.length,
        newCount: newCardsCount,
        updatedCount: updatedCardsCount,
        setName: cards[0]?.set?.name || slug
      })

      setRapidAPISlug('')
    } catch (err) {
      console.error('❌ Erreur import RapidAPI:', err)
      setError(err.message)
      setRapidAPIResult({ success: false, error: err.message })
    } finally {
      setRapidAPIImporting(false)
      setProgress(null)
    }
  }

  // Découvrir les nouvelles extensions
  const handleDiscover = async () => {
    setDiscovering(true)
    setError(null)
    setNewExtensions([])
    setSelectedExtensions(new Set())

    try {
      const result = await NewExtensionDiscoveryService.discoverNewExtensions(setProgress)
      setNewExtensions(result.newSets)
      setStats({
        total: result.totalApiSets,
        existing: result.existingSets,
        new: result.newSetsCount
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setDiscovering(false)
      setProgress(null)
    }
  }

  // Basculer la sélection d'une extension
  const toggleSelection = (setId) => {
    const newSelection = new Set(selectedExtensions)
    if (newSelection.has(setId)) {
      newSelection.delete(setId)
    } else {
      newSelection.add(setId)
    }
    setSelectedExtensions(newSelection)
  }

  // Sélectionner/désélectionner tout
  const toggleSelectAll = () => {
    if (selectedExtensions.size === filteredExtensions.length) {
      setSelectedExtensions(new Set())
    } else {
      setSelectedExtensions(new Set(filteredExtensions.map(ext => ext.id)))
    }
  }

  // Importer les extensions sélectionnées
  const handleImport = async () => {
    if (selectedExtensions.size === 0) return

    setImporting(true)
    setError(null)
    setImportResults(null)

    try {
      // Récupérer les objets extensions complets (avec slug) pour l'import via RapidAPI
      const extensionsToImport = newExtensions.filter(ext => selectedExtensions.has(ext.id))
      const results = await NewExtensionDiscoveryService.importMultipleExtensions(
        extensionsToImport,
        setProgress,
        addDiscoveredCards
      )

      setImportResults(results)

      // Marquer les extensions importées avec succès comme "isImported"
      const successIds = new Set(
        results.details
          .filter(r => r.success)
          .map(r => r.setId)
      )
      setNewExtensions(prev => prev.map(ext =>
        successIds.has(ext.id) ? { ...ext, isImported: true } : ext
      ))
      setSelectedExtensions(new Set())

      // Mettre à jour les stats
      if (stats) {
        setStats({
          ...stats,
          existing: stats.existing + results.success,
          new: stats.new - results.success
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
      setProgress(null)
    }
  }

  // Helper pour obtenir le nom de la série (peut être string ou objet)
  const getSeriesName = (series) => {
    if (!series) return ''
    if (typeof series === 'string') return series
    if (typeof series === 'object' && series.name) return series.name
    return ''
  }

  // Filtrer les extensions par recherche et dédupliquer par ID
  const filteredExtensions = React.useMemo(() => {
    // D'abord dédupliquer par ID (garder la première occurrence)
    const seen = new Set()
    const deduplicated = newExtensions.filter(ext => {
      if (seen.has(ext.id)) return false
      seen.add(ext.id)
      return true
    })

    // Ensuite filtrer par recherche
    if (!searchQuery) return deduplicated
    const query = searchQuery.toLowerCase()
    return deduplicated.filter(ext => {
      const seriesName = getSeriesName(ext.series)
      return (
        ext.id.toLowerCase().includes(query) ||
        ext.name.toLowerCase().includes(query) ||
        seriesName.toLowerCase().includes(query)
      )
    })
  }, [newExtensions, searchQuery])

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-amber-400 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Découverte de Nouvelles Extensions
        </CardTitle>
        <CardDescription className="text-gray-400">
          Parcourez et importez les extensions depuis l'API Pokemon TCG (nouvelles extensions en premier, puis déjà importées)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bouton de découverte */}
        <div className="flex gap-2">
          <Button
            onClick={handleDiscover}
            disabled={discovering || importing || rapidAPIImporting}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {discovering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Rechercher nouvelles extensions
              </>
            )}
          </Button>
        </div>

        {/* Import manuel via RapidAPI */}
        {RapidAPIService.isAvailable() && (
          <div className="p-4 bg-purple-900/30 border border-purple-700 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <span className="font-medium text-purple-300">Import manuel via RapidAPI</span>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Slug de l'extension (ex: phantasmal-flames)"
                value={rapidAPISlug}
                onChange={(e) => setRapidAPISlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="bg-gray-900 border-gray-700"
                onKeyDown={(e) => e.key === 'Enter' && handleRapidAPIImport()}
              />
              <Button
                onClick={handleRapidAPIImport}
                disabled={!rapidAPISlug.trim() || rapidAPIImporting || importing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {rapidAPIImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-400">
              Pour les extensions récentes non détectées automatiquement.
              Trouvez le slug dans l'URL CardMarket (ex: /Singles/<strong>phantasmal-flames</strong>/)
            </p>

            {/* Résultat import RapidAPI */}
            {rapidAPIResult && (
              <div className={`p-3 rounded-lg ${
                rapidAPIResult.success
                  ? 'bg-green-900/30 border border-green-700'
                  : 'bg-red-900/30 border border-red-700'
              }`}>
                {rapidAPIResult.success ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 text-sm">
                      {rapidAPIResult.newCount > 0
                        ? `${rapidAPIResult.newCount} nouvelles cartes de "${rapidAPIResult.setName}" importées`
                        : `${rapidAPIResult.count} cartes de "${rapidAPIResult.setName}" mises à jour`}
                      {rapidAPIResult.updatedCount > 0 && rapidAPIResult.newCount > 0 &&
                        ` (${rapidAPIResult.updatedCount} mises à jour)`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 text-sm">{rapidAPIResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-900 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400">Total API</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.existing}</div>
              <div className="text-xs text-gray-400">Importées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.new}</div>
              <div className="text-xs text-gray-400">Nouvelles</div>
            </div>
          </div>
        )}

        {/* Progression */}
        {progress && (
          <div className="p-4 bg-gray-900 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{progress.message || progress.status}</span>
              {progress.current && progress.total && (
                <span className="text-amber-400">
                  {progress.current}/{progress.total}
                </span>
              )}
            </div>
            {progress.current && progress.total && (
              <Progress
                value={(progress.current / progress.total) * 100}
                className="h-2"
              />
            )}
            {progress.setName && (
              <div className="text-xs text-gray-500">
                Extension: {progress.setName}
              </div>
            )}
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Résultats d'import */}
        {importResults && (
          <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-green-400 font-medium">Import terminé</span>
            </div>
            <div className="text-sm text-gray-300">
              {importResults.success}/{importResults.total} extensions importées
              ({importResults.totalCards} cartes)
            </div>
            {importResults.failed > 0 && (
              <div className="text-sm text-red-400">
                {importResults.failed} échec(s)
              </div>
            )}
          </div>
        )}

        {/* Liste des nouvelles extensions */}
        {newExtensions.length > 0 && (
          <div className="space-y-3">
            {/* Barre de recherche et sélection */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filtrer par nom, ID ou série..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="border-gray-600"
              >
                {selectedExtensions.size === filteredExtensions.length ? 'Désélectionner' : 'Tout sélectionner'}
              </Button>
            </div>

            {/* Bouton d'import */}
            {selectedExtensions.size > 0 && (
              <Button
                onClick={handleImport}
                disabled={importing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Importer {selectedExtensions.size} extension(s)
                  </>
                )}
              </Button>
            )}

            {/* Liste des extensions */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
              {filteredExtensions.map((ext) => (
                <div
                  key={ext.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedExtensions.has(ext.id)
                      ? 'bg-amber-900/30 border-amber-600'
                      : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => toggleSelection(ext.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedExtensions.has(ext.id)}
                      onCheckedChange={() => toggleSelection(ext.id)}
                      className="mt-1"
                    />

                    {/* Logo de l'extension */}
                    {ext.images?.logo && (
                      <img
                        src={ext.images.logo}
                        alt={ext.name}
                        className="h-8 w-auto object-contain"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate flex items-center gap-2">
                        {ext.name}
                        {ext.isImported && (
                          <Badge className="text-xs bg-green-600/30 text-green-400 border-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Déjà importée
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-gray-600">
                          <Hash className="h-3 w-3 mr-1" />
                          {ext.id}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(ext.releaseDate)}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-gray-600">
                          {ext.total ? `${ext.total} ${ext.total === 1 ? 'carte' : 'cartes'}` : 'Nombre inconnu'}
                        </Badge>
                      </div>
                      {ext.series && (
                        <div className="text-xs text-gray-500 mt-1">
                          Série: {getSeriesName(ext.series)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredExtensions.length === 0 && searchQuery && (
              <div className="text-center text-gray-500 py-4">
                Aucune extension ne correspond à "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Message si aucune nouvelle extension */}
        {stats && stats.new === 0 && !discovering && (
          <div className="text-center text-green-400 py-4">
            <Check className="h-8 w-8 mx-auto mb-2" />
            Toutes les extensions sont à jour ! ({stats.existing} extensions importées)
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ExtensionDiscoveryPanel
