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
import { Download, Package, Calendar, TrendingUp, CheckCircle, AlertCircle, X, Zap } from 'lucide-react'
import SetImportService from '@/services/SetImportService'
import { RapidAPIService } from '@/services/RapidAPIService'

export function SetImportPanel() {
  const { addDiscoveredCards, updateSeriesDatabase, discoveredCards, seriesDatabase } = useCardDatabase()
  const [sets, setSets] = useState([])
  const [selectedSet, setSelectedSet] = useState(null)
  const [isLoadingSets, setIsLoadingSets] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [abortController, setAbortController] = useState(null)
  const [seriesFilter, setSeriesFilter] = useState('all')
  const [series, setSeries] = useState([])
  const [setIdInput, setSetIdInput] = useState('')
  const [setNameSearch, setSetNameSearch] = useState('')
  const [useRapidAPI, setUseRapidAPI] = useState(RapidAPIService.isAvailable())
  const [rapidAPISlug, setRapidAPISlug] = useState('')

  // NE PAS charger automatiquement pour éviter les timeouts
  // Les extensions seront chargées à la demande (clic sur dropdown ou bouton)

  const loadSets = async () => {
    setIsLoadingSets(true)
    try {
      const allSets = await SetImportService.getAllSets()
      setSets(allSets)
      console.log(`📚 ${allSets.length} extensions chargées`)
    } catch (error) {
      console.error('❌ Erreur lors du chargement des extensions:', error)
      // Ne pas bloquer l'interface si ça échoue
      alert(error.message || 'Erreur lors du chargement des extensions. Utilisez la recherche par ID.')
    } finally {
      setIsLoadingSets(false)
    }
  }


  const handleSearchById = async () => {
    if (!setIdInput.trim()) return

    try {
      const setInfo = await SetImportService.getSetInfo(setIdInput.trim().toLowerCase())
      setSelectedSet(setInfo)
      console.log('📦 Extension trouvée par ID:', setInfo)
    } catch (error) {
      console.error('❌ Extension non trouvée:', error)
      alert(`Extension "${setIdInput}" non trouvée. Vérifiez l'ID (ex: me02, sv08, etc.)`)
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
    // Vérifier qu'on a soit une extension sélectionnée, soit un slug RapidAPI
    if (!selectedSet && !(useRapidAPI && rapidAPISlug)) {
      console.log('⚠️ Aucune extension sélectionnée et pas de slug RapidAPI')
      return
    }

    setIsImporting(true)
    setProgress(null)
    setResult(null)

    // Créer un AbortController pour annuler l'import
    const controller = new AbortController()
    setAbortController(controller)

    try {
      // Déterminer la source d'import
      const importSource = useRapidAPI ? 'RapidAPI' : 'Pokemon TCG API'
      const setName = selectedSet?.name || rapidAPISlug
      const setId = selectedSet?.id || rapidAPISlug

      console.log(`📦 Import de ${setName} via ${importSource}...`)

      // VÉRIFICATION DES DOUBLONS : Vérifier si l'extension existe déjà
      const existingExtension = seriesDatabase.find(series =>
        series.id === setId ||
        series.name.toLowerCase() === setName.toLowerCase()
      )

      // Compter les cartes existantes de cette extension
      const existingCardsCount = discoveredCards.filter(card =>
        card.set?.id === setId ||
        card.setId === setId ||
        card.set?.name?.toLowerCase() === setName.toLowerCase()
      ).length

      if (existingExtension || existingCardsCount > 0) {
        const message = existingExtension
          ? `L'extension "${setName}" existe déjà avec ${existingExtension.totalCards || existingCardsCount} cartes. Voulez-vous quand même réimporter ? (les nouvelles cartes seront fusionnées)`
          : `${existingCardsCount} cartes de cette extension existent déjà. Voulez-vous continuer ?`

        if (!window.confirm(message)) {
          setIsImporting(false)
          setAbortController(null)
          setResult({ cancelled: true, message: 'Import annulé - extension déjà existante' })
          return
        }
        console.log(`⚠️ Réimport de l'extension existante autorisé par l'utilisateur`)
      }

      let cards = []

      // Import via RapidAPI ou Pokemon TCG API
      if (useRapidAPI && rapidAPISlug) {
        // Import via RapidAPI (CardMarket)
        console.log(`⚡ Import via RapidAPI avec slug: "${rapidAPISlug}"`)
        cards = await RapidAPIService.importAllCardsByExpansion(
          rapidAPISlug,
          (progressData) => {
            setProgress({
              ...progressData,
              setName: rapidAPISlug
            })
          }
        )
      } else if (selectedSet) {
        // Import via Pokemon TCG API
        cards = await SetImportService.importSetCards(
          selectedSet.id,
          (progressData) => {
            setProgress(progressData)
          },
          controller.signal
        )
      } else {
        throw new Error('Aucune extension sélectionnée')
      }

      console.log(`✅ ${cards.length} cartes importées depuis ${importSource}`)

      // Filtrer les cartes déjà présentes pour éviter les doublons
      const existingCardIds = new Set(discoveredCards.map(c => c.id))
      const newCards = cards.filter(card => !existingCardIds.has(card.id))
      const updatedCards = cards.filter(card => existingCardIds.has(card.id))

      console.log(`📊 ${newCards.length} nouvelles cartes, ${updatedCards.length} cartes à mettre à jour`)

      // Ajouter les cartes à la base de données locale
      await addDiscoveredCards(cards)

      // Mettre à jour l'organisation par extensions
      await updateSeriesDatabase(cards)

      setResult({
        success: true,
        count: cards.length,
        newCount: newCards.length,
        updatedCount: updatedCards.length,
        setName: setName,
        source: importSource
      })

      console.log(`🎉 Import terminé: ${newCards.length} nouvelles cartes, ${updatedCards.length} mises à jour (via ${importSource})`)
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

  // Filtrer les extensions par série ET par nom
  const filteredSets = sets.filter(set => {
    const matchesSeries = seriesFilter === 'all' || set.series === seriesFilter
    const matchesName = !setNameSearch || set.name.toLowerCase().includes(setNameSearch.toLowerCase())
    return matchesSeries && matchesName
  })

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
        {/* Bouton pour charger les extensions */}
        {sets.length === 0 && !isLoadingSets && (
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg space-y-3">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>💡 Astuce:</strong> Pour parcourir toutes les extensions disponibles, cliquez ci-dessous.
              Si vous connaissez l'ID de l'extension (ex: me02), utilisez directement la recherche par ID plus bas.
            </p>
            <Button
              onClick={loadSets}
              disabled={isLoadingSets}
              variant="outline"
              className="w-full"
            >
              📚 Charger toutes les extensions (peut prendre 10-15s)
            </Button>
          </div>
        )}

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

        {/* Recherche par nom d'extension */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rechercher par nom</label>
          <input
            type="text"
            value={setNameSearch}
            onChange={(e) => setSetNameSearch(e.target.value)}
            placeholder="Ex: Mega Evolution, Scarlet & Violet..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {filteredSets.length} extension(s) trouvée(s) • Total chargées: {sets.length}
          </p>
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


        {/* Recherche manuelle par ID */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Ou rechercher par ID (ex: me02, sv08)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={setIdInput}
              onChange={(e) => setSetIdInput(e.target.value.toLowerCase())}
              placeholder="me02"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              onKeyDown={(e) => e.key === 'Enter' && handleSearchById()}
            />
            <Button
              onClick={handleSearchById}
              disabled={!setIdInput.trim() || isLoadingSets}
              variant="outline"
            >
              🔍 Rechercher
            </Button>
          </div>
        </div>

        {/* Toggle RapidAPI */}
        {RapidAPIService.isAvailable() && (
          <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-sm">Import via RapidAPI (CardMarket)</span>
              </div>
              <Button
                variant={useRapidAPI ? "default" : "outline"}
                size="sm"
                onClick={() => setUseRapidAPI(!useRapidAPI)}
                className={useRapidAPI ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {useRapidAPI ? "✓ Activé" : "Désactivé"}
              </Button>
            </div>

            {useRapidAPI && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug CardMarket de l'extension</label>
                <input
                  type="text"
                  value={rapidAPISlug}
                  onChange={(e) => setRapidAPISlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="phantasmal-flames"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Pour trouver le slug, allez sur CardMarket et copiez le nom de l'extension dans l'URL
                  (ex: cardmarket.com/fr/Pokemon/Products/Singles/<strong>phantasmal-flames</strong>)
                </p>
              </div>
            )}

            <p className="text-xs text-purple-600 dark:text-purple-400">
              ⚡ RapidAPI est plus rapide pour les nouvelles extensions et inclut les prix CardMarket
            </p>
          </div>
        )}

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
                    ? result.newCount > 0
                      ? `${result.newCount} nouvelles cartes de "${result.setName}" ajoutées${result.updatedCount > 0 ? `, ${result.updatedCount} mises à jour` : ''} (via ${result.source || 'Pokemon TCG API'}).`
                      : `Toutes les ${result.count} cartes de "${result.setName}" existaient déjà (mises à jour effectuées).`
                    : result.cancelled
                    ? result.message || 'L\'import a été annulé par l\'utilisateur.'
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
            disabled={(!selectedSet && !(useRapidAPI && rapidAPISlug)) || isImporting}
            className={`flex-1 ${useRapidAPI && rapidAPISlug ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
          >
            {useRapidAPI && rapidAPISlug ? (
              <Zap className="w-4 h-4 mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isImporting
              ? 'Import en cours...'
              : useRapidAPI && rapidAPISlug
                ? `Importer via RapidAPI`
                : 'Importer l\'extension'}
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
