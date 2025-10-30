import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCardDatabase } from '@/hooks/useCardDatabase.jsx'
import { Download, Package, Calendar, TrendingUp, CheckCircle, AlertCircle, X } from 'lucide-react'
import SetImportService from '@/services/SetImportService'

export function SetImportPanel() {
  const { addDiscoveredCards, updateSeriesDatabase } = useCardDatabase()
  const [sets, setSets] = useState([])
  const [selectedSet, setSelectedSet] = useState(null)
  const [isLoadingSets, setIsLoadingSets] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [abortController, setAbortController] = useState(null)
  const [seriesFilter, setSeriesFilter] = useState('all')
  const [series, setSeries] = useState([])

  // Charger les extensions au montage
  useEffect(() => {
    loadSets()
    loadSeries()
  }, [])

  const loadSets = async () => {
    setIsLoadingSets(true)
    try {
      const allSets = await SetImportService.getAllSets()
      setSets(allSets)
      console.log(`📚 ${allSets.length} extensions chargées`)
    } catch (error) {
      console.error('❌ Erreur lors du chargement des extensions:', error)
    } finally {
      setIsLoadingSets(false)
    }
  }

  const loadSeries = async () => {
    try {
      const allSeries = await SetImportService.getAllSeries()
      setSeries(allSeries)
    } catch (error) {
      console.error('❌ Erreur lors du chargement des séries:', error)
    }
  }

  const handleSetSelect = async (setId) => {
    try {
      const setInfo = await SetImportService.getSetInfo(setId)
      setSelectedSet(setInfo)
      console.log('📦 Extension sélectionnée:', setInfo)
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'extension:', error)
    }
  }

  const handleImport = async () => {
    if (!selectedSet) return

    setIsImporting(true)
    setProgress(null)
    setResult(null)

    // Créer un AbortController pour annuler l'import
    const controller = new AbortController()
    setAbortController(controller)

    try {
      console.log(`📦 Import de ${selectedSet.name} (${selectedSet.id})...`)

      // Importer toutes les cartes de l'extension
      const cards = await SetImportService.importSetCards(
        selectedSet.id,
        (progressData) => {
          setProgress(progressData)
        },
        controller.signal
      )

      console.log(`✅ ${cards.length} cartes importées`)

      // Ajouter les cartes à la base de données locale
      await addDiscoveredCards(cards)

      // Mettre à jour l'organisation par extensions
      await updateSeriesDatabase(cards)

      setResult({
        success: true,
        count: cards.length,
        setName: selectedSet.name
      })

      console.log(`🎉 Import terminé: ${cards.length} cartes ajoutées à la base de données`)
    } catch (error) {
      if (error.message === 'Import annulé') {
        console.log('🛑 Import annulé par l\'utilisateur')
        setResult({ cancelled: true })
      } else {
        console.error('❌ Erreur lors de l\'import:', error)
        setResult({ error: error.message })
      }
    } finally {
      setIsImporting(false)
      setAbortController(null)
    }
  }

  const handleCancel = () => {
    if (abortController) {
      abortController.abort()
      console.log('🛑 Annulation de l\'import demandée...')
    }
  }

  // Filtrer les extensions par série
  const filteredSets = seriesFilter === 'all'
    ? sets
    : sets.filter(set => set.series === seriesFilter)

  // Calculer le pourcentage de progression
  const progressPercentage = progress
    ? Math.round((progress.count / progress.total) * 100)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Import Automatique d'Extension
        </CardTitle>
        <CardDescription>
          Importez automatiquement toutes les cartes d'une extension en un clic.
          Les cartes seront ajoutées à la base commune et disponibles pour tous les utilisateurs.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filtre par série */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Filtrer par série</label>
          <Select value={seriesFilter} onValueChange={setSeriesFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les séries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les séries</SelectItem>
              {series.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sélection de l'extension */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Sélectionner une extension</label>
          <Select onValueChange={handleSetSelect} disabled={isLoadingSets}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingSets ? "Chargement..." : "Choisir une extension"} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {filteredSets.map(set => (
                <SelectItem key={set.id} value={set.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{set.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {set.total} cartes
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(set.releaseDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Infos de l'extension sélectionnée */}
        {selectedSet && !isImporting && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{selectedSet.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedSet.series}</p>
              </div>
              {selectedSet.images?.logo && (
                <img
                  src={selectedSet.images.logo}
                  alt={selectedSet.name}
                  className="h-12 object-contain"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span><strong>{selectedSet.total}</strong> cartes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{new Date(selectedSet.releaseDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            {selectedSet.releaseDate > new Date().toISOString() && (
              <Badge variant="secondary" className="w-full justify-center">
                📅 Extension à venir
              </Badge>
            )}
          </div>
        )}

        {/* Barre de progression */}
        {isImporting && progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Import en cours...</span>
              <span className="text-muted-foreground">
                {progress.count} / {progress.total} cartes ({progressPercentage}%)
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>Page {progress.page || 1} • {progress.setName}</span>
            </div>
          </div>
        )}

        {/* Résultat de l'import */}
        {result && !isImporting && (
          <div className={`p-4 rounded-lg ${
            result.success
              ? 'bg-green-500/10 border border-green-500/20'
              : result.cancelled
              ? 'bg-yellow-500/10 border border-yellow-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              ) : result.cancelled ? (
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {result.success
                    ? 'Import réussi !'
                    : result.cancelled
                    ? 'Import annulé'
                    : 'Erreur lors de l\'import'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.success
                    ? `${result.count} cartes de "${result.setName}" ont été ajoutées à la base de données commune.`
                    : result.cancelled
                    ? 'L\'import a été annulé par l\'utilisateur.'
                    : result.error || 'Une erreur est survenue.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={!selectedSet || isImporting}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {isImporting ? 'Import en cours...' : 'Importer l\'extension'}
          </Button>

          {isImporting && (
            <Button
              variant="destructive"
              onClick={handleCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          )}
        </div>

        {/* Avertissement */}
        {isImporting && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ <strong>Important :</strong> Ne quittez pas cette page pendant l'import.
            </p>
          </div>
        )}

        {/* Informations */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
            <strong>ℹ️ Fonctionnement :</strong>
            <br />
            • Les cartes sont importées depuis l'API Pokemon TCG officielle
            <br />
            • Elles sont ajoutées à la base commune (visible par tous les utilisateurs)
            <br />
            • L'import peut prendre quelques secondes selon la taille de l'extension
            <br />
            • Vous pouvez importer des extensions à venir avant leur sortie officielle
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
