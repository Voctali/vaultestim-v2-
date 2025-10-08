import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useCardDatabase } from '@/hooks/useCardDatabase.jsx'
import { AdminService } from '@/services/AdminService'
import { SeriesCardsView } from '@/components/features/database/SeriesCardsView'
import {
  Database,
  Edit3,
  Trash2,
  Plus,
  Save,
  RefreshCw,
  Download,
  Upload,
  Calendar,
  Package,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Square,
  CheckSquare,
  X
} from 'lucide-react'

export function DatabaseAdmin() {
  const {
    seriesDatabase,
    totalDiscoveredCards,
    discoveredCards,
    deleteSeriesBlock,
    updateSeriesBlock,
    createSeriesBlock,
    moveExtensionToBlock,
    moveSeriesBlock,
    mergeBlockIntoBlock,
    deleteMultipleSeriesBlocks,
    deleteMultipleExtensions
  } = useCardDatabase()
  const [editingBlock, setEditingBlock] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentView, setCurrentView] = useState('list') // 'list', 'detail', ou 'cards'
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [selectedSeries, setSelectedSeries] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    endYear: '',
    totalCards: 0,
    extensions: []
  })
  const [selectedBlocks, setSelectedBlocks] = useState([])
  const [selectedExtensions, setSelectedExtensions] = useState([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const touchTimeoutRef = useRef(null)
  const longPressThreshold = 500 // milliseconds

  const handleEditBlock = (block) => {
    setEditingBlock(block)
    setFormData({
      name: block.name,
      year: block.year || new Date().getFullYear(),
      endYear: block.endYear || '',
      totalCards: block.totalCards || 0,
      extensions: block.extensions || []
    })
  }

  const handleSaveBlock = () => {
    if (editingBlock) {
      updateSeriesBlock(editingBlock.id, {
        name: formData.name,
        year: formData.year,
        endYear: formData.endYear || null,
        totalCards: formData.totalCards
      })
      setEditingBlock(null)
    }
  }

  const handleDeleteBlock = (blockId) => {
    const block = seriesDatabase.find(s => s.id === blockId)
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le bloc "${block?.name}" ? Cette action est irréversible et supprimera également toutes les cartes associées.`)) {
      deleteSeriesBlock(blockId)
    }
  }

  const handleCreateBlock = () => {
    const nameInput = document.getElementById('new-block-name')
    const yearInput = document.getElementById('new-block-year')
    const endYearInput = document.getElementById('new-block-end-year')
    const cardsInput = document.getElementById('new-block-cards')

    if (!nameInput.value.trim()) {
      alert('Veuillez saisir un nom pour le bloc')
      return
    }

    const newBlockData = {
      name: nameInput.value.trim(),
      year: parseInt(yearInput.value) || new Date().getFullYear(),
      endYear: endYearInput.value ? parseInt(endYearInput.value) : null,
      totalCards: parseInt(cardsInput.value) || 0
    }

    createSeriesBlock(newBlockData)

    // Reset form
    nameInput.value = ''
    yearInput.value = new Date().getFullYear()
    endYearInput.value = ''
    cardsInput.value = ''

    setShowCreateModal(false)
  }

  const handleBlockClick = (block) => {
    if (!isSelectionMode) {
      setSelectedBlock(block)
      setCurrentView('detail')
      setSelectedExtensions([]) // Reset sélection extensions
    }
  }

  // Long press handler for activating selection mode
  const handleBlockTouchStart = (block) => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
    }

    touchTimeoutRef.current = setTimeout(() => {
      if (!isSelectionMode) {
        setIsSelectionMode(true)
        setSelectedBlocks([block.id])
      }
    }, longPressThreshold)
  }

  const handleBlockTouchEnd = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
    }
  }

  // Navigation into series to view cards
  const handleExtensionClick = (extensionId) => {
    setSelectedSeries(extensionId)
    setCurrentView('cards')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedBlock(null)
    setSelectedSeries(null)
    setSelectedExtensions([]) // Reset sélection extensions
  }

  const handleBackToDetail = () => {
    setCurrentView('detail')
    setSelectedSeries(null)
  }

  const handleMoveExtension = (extensionId, toBlockId) => {
    if (selectedBlock && selectedBlock.id !== toBlockId) {
      moveExtensionToBlock(extensionId, selectedBlock.id, toBlockId)
      // Mettre à jour le bloc sélectionné
      const updatedBlock = seriesDatabase.find(b => b.id === selectedBlock.id)
      setSelectedBlock(updatedBlock)
    }
  }

  const handleExportData = () => {
    const dataToExport = {
      seriesDatabase,
      discoveredCards,
      exportDate: new Date().toISOString()
    }

    const dataStr = JSON.stringify(dataToExport, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `vaultestim-database-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportData = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          // TODO: Implémenter l'importation
          console.log('Données à importer:', data)
          alert('Fonction d\'importation en développement')
        } catch (error) {
          alert('Erreur lors de la lecture du fichier')
        }
      }
      reader.readAsText(file)
    }
  }

  const clearDatabase = () => {
    if (window.confirm('ATTENTION: Voulez-vous vraiment vider toute la base de données ? Cette action est irréversible !')) {
      localStorage.removeItem('vaultestim_discovered_cards')
      localStorage.removeItem('vaultestim_series_database')
      window.location.reload()
    }
  }

  // Gestion de la sélection multiple
  const toggleBlockSelection = (blockId) => {
    setSelectedBlocks(prev => {
      if (prev.includes(blockId)) {
        return prev.filter(id => id !== blockId)
      } else {
        return [...prev, blockId]
      }
    })
  }

  const toggleExtensionSelection = (extensionId) => {
    setSelectedExtensions(prev => {
      if (prev.includes(extensionId)) {
        return prev.filter(id => id !== extensionId)
      } else {
        return [...prev, extensionId]
      }
    })
  }

  const selectAllBlocks = () => {
    if (selectedBlocks.length === seriesDatabase.length) {
      setSelectedBlocks([])
    } else {
      setSelectedBlocks(seriesDatabase.map(series => series.id))
    }
  }

  const selectAllExtensions = () => {
    if (!selectedBlock) return
    const extensions = selectedBlock.extensions || []
    if (selectedExtensions.length === extensions.length) {
      setSelectedExtensions([])
    } else {
      setSelectedExtensions([...extensions])
    }
  }

  const deleteSelectedBlocks = () => {
    if (selectedBlocks.length === 0) return

    const blockNames = selectedBlocks.map(id => {
      const block = seriesDatabase.find(s => s.id === id)
      return block?.name || id
    })

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ces ${selectedBlocks.length} blocs ?\n\n${blockNames.join('\n')}\n\nCette action est irréversible et supprimera également toutes les cartes associées.`)) {
      deleteMultipleSeriesBlocks(selectedBlocks)
      setSelectedBlocks([])
      setIsSelectionMode(false)
    }
  }

  const deleteSelectedExtensions = () => {
    if (selectedExtensions.length === 0 || !selectedBlock) return

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ces ${selectedExtensions.length} extensions du bloc "${selectedBlock.name}" ?\n\nCette action est irréversible et supprimera également toutes les cartes associées.`)) {
      deleteMultipleExtensions(selectedBlock.id, selectedExtensions)
      setSelectedExtensions([])
      // Mettre à jour le bloc sélectionné
      const updatedBlock = seriesDatabase.find(b => b.id === selectedBlock.id)
      setSelectedBlock(updatedBlock)
    }
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedBlocks([])
    setSelectedExtensions([])
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold golden-glow flex items-center">
            <Database className="w-8 h-8 mr-3" />
            {currentView === 'detail' ? (
              <>
                Bloc : {selectedBlock?.name}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToList}
                  className="ml-4 border-primary/20"
                >
                  ← Retour à la liste
                </Button>
              </>
            ) : currentView === 'cards' ? (
              <>
                Série : {selectedSeries}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToDetail}
                  className="ml-4 border-primary/20"
                >
                  ← Retour aux extensions
                </Button>
              </>
            ) : (
              'Administration Base de Données'
            )}
          </h1>
          <p className="text-muted-foreground">
            {currentView === 'detail' ? (
              `Gérer les extensions et cartes du bloc ${selectedBlock?.name}`
            ) : currentView === 'cards' ? (
              `Gérer les cartes de la série ${selectedSeries}`
            ) : (
              'Gérez vos blocs, extensions et cartes découvertes'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {currentView === 'list' && !isSelectionMode && (
            <Button
              variant="outline"
              onClick={() => setIsSelectionMode(true)}
              className="border-purple-500/20 hover:bg-purple-500/10 text-purple-500"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Sélection multiple
            </Button>
          )}
          {currentView === 'list' && isSelectionMode && (
            <>
              <Button
                variant="outline"
                onClick={selectAllBlocks}
                className="border-blue-500/20 hover:bg-blue-500/10 text-blue-500"
              >
                {selectedBlocks.length === seriesDatabase.length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </Button>
              <Button
                variant="outline"
                onClick={deleteSelectedBlocks}
                disabled={selectedBlocks.length === 0}
                className="border-red-500/20 hover:bg-red-500/10 text-red-500 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer ({selectedBlocks.length})
              </Button>
              <Button
                variant="outline"
                onClick={exitSelectionMode}
                className="border-gray-500/20 hover:bg-gray-500/10 text-gray-500"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </>
          )}
          {currentView === 'detail' && selectedBlock && (
            <>
              <Button
                variant="outline"
                onClick={selectAllExtensions}
                className="border-blue-500/20 hover:bg-blue-500/10 text-blue-500"
              >
                {selectedExtensions.length === (selectedBlock.extensions || []).length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </Button>
              <Button
                variant="outline"
                onClick={deleteSelectedExtensions}
                disabled={selectedExtensions.length === 0}
                className="border-red-500/20 hover:bg-red-500/10 text-red-500 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer ({selectedExtensions.length})
              </Button>
            </>
          )}
          {!isSelectionMode && (
            <>
              <Button
                variant="outline"
                onClick={handleExportData}
                className="border-green-500/20 hover:bg-green-500/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('import-input').click()}
                className="border-blue-500/20 hover:bg-blue-500/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
              <input
                id="import-input"
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="golden-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Blocs</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold golden-glow">{seriesDatabase.length}</div>
          </CardContent>
        </Card>

        <Card className="golden-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Extensions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold golden-glow">
              {seriesDatabase.reduce((acc, series) => acc + (series.extensions?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="golden-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cartes Découvertes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold golden-glow">{totalDiscoveredCards}</div>
          </CardContent>
        </Card>

        <Card className="golden-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valeur Totale</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-500">
              {seriesDatabase.reduce((acc, series) => acc + parseFloat(series.totalValue || 0), 0).toFixed(2)}€
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Area */}
      {currentView === 'list' ? (
        /* Blocks Management */
        <Card className="golden-border">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="golden-glow">Gestion des Blocs</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Bloc
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearDatabase}
                  className="border-red-500/20 hover:bg-red-500/10 text-red-500"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Vider DB
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {seriesDatabase.map((series) => (
                <div
                  key={series.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    isSelectionMode
                      ? `border-border/50 hover:bg-accent/50 ${
                          selectedBlocks.includes(series.id)
                            ? 'bg-primary/10 border-primary/30'
                            : ''
                        }`
                      : 'border-border/50 hover:bg-accent/50 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleBlockSelection(series.id)
                    } else {
                      handleBlockClick(series)
                    }
                  }}
                  onMouseDown={() => handleBlockTouchStart(series)}
                  onMouseUp={handleBlockTouchEnd}
                  onMouseLeave={handleBlockTouchEnd}
                  onTouchStart={() => handleBlockTouchStart(series)}
                  onTouchEnd={handleBlockTouchEnd}
                  onTouchCancel={handleBlockTouchEnd}
                >
                  <div className="flex items-center space-x-4">
                    {isSelectionMode ? (
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center cursor-pointer">
                        {selectedBlocks.includes(series.id) ? (
                          <CheckSquare className="w-6 h-6 text-primary" />
                        ) : (
                          <Square className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold golden-glow">{series.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {series.year}{series.endYear ? ` - ${series.endYear}` : ''}
                        </span>
                        <span>{series.totalCards} cartes</span>
                        <span>{(series.extensions || []).length} extensions</span>
                        <Badge variant="secondary" className="text-xs">
                          {series.totalValue || '0.00'}€
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {!isSelectionMode && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveSeriesBlock(series.id, 'up')
                        }}
                        disabled={seriesDatabase.indexOf(series) === 0}
                        title="Déplacer vers le haut"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveSeriesBlock(series.id, 'down')
                        }}
                        disabled={seriesDatabase.indexOf(series) === seriesDatabase.length - 1}
                        title="Déplacer vers le bas"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditBlock(series)
                        }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteBlock(series.id)
                        }}
                        className="border-red-500/20 hover:bg-red-500/10 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : currentView === 'detail' && selectedBlock ? (
        /* Block Detail View */
        <Card className="golden-border">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="golden-glow flex items-center justify-between">
              <span>Extensions du bloc "{selectedBlock.name}"</span>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {(selectedBlock.extensions || []).length} extensions
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {(selectedBlock.extensions || []).map((extensionId) => (
                <div
                  key={extensionId}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedExtensions.includes(extensionId)
                      ? 'bg-primary/10 border-primary/30'
                      : 'border-border/50 hover:bg-accent/50'
                  }`}
                  onClick={() => {
                    if (selectedExtensions.length === 0) {
                      // Brief press - navigate to cards view
                      handleExtensionClick(extensionId)
                    } else {
                      // Selection mode active
                      toggleExtensionSelection(extensionId)
                    }
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                      {selectedExtensions.includes(extensionId) ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{extensionId}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedBlock.cards.filter(card => card.setId === extensionId).length} cartes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Select onValueChange={(value) => handleMoveExtension(extensionId, value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Déplacer vers..." />
                      </SelectTrigger>
                      <SelectContent>
                        {seriesDatabase
                          .filter(block => block.id !== selectedBlock.id)
                          .map((block) => (
                            <SelectItem key={block.id} value={block.id}>
                              {block.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : currentView === 'cards' && selectedSeries ? (
        /* Series Cards View */
        <SeriesCardsView
          seriesId={selectedSeries}
          onBack={handleBackToDetail}
        />
      ) : null}

      {/* Edit Block Modal */}
      {editingBlock && (
        <Dialog open={!!editingBlock} onOpenChange={() => setEditingBlock(null)}>
          <DialogContent className="golden-border bg-background">
            <DialogHeader>
              <DialogTitle className="golden-glow">
                Éditer le bloc "{editingBlock.name}"
              </DialogTitle>
              <DialogDescription>
                Modifiez les propriétés du bloc ou fusionnez-le dans un autre bloc.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="block-name">Nom du bloc</Label>
                <Input
                  id="block-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="golden-border"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="block-year">Année début</Label>
                  <Input
                    id="block-year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="golden-border"
                  />
                </div>
                <div>
                  <Label htmlFor="block-end-year">Année fin (optionnel)</Label>
                  <Input
                    id="block-end-year"
                    type="number"
                    placeholder="Année de fin"
                    value={formData.endYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, endYear: e.target.value }))}
                    className="golden-border"
                  />
                </div>
                <div>
                  <Label htmlFor="block-cards">Total cartes</Label>
                  <Input
                    id="block-cards"
                    type="number"
                    value={formData.totalCards}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalCards: parseInt(e.target.value) }))}
                    className="golden-border"
                  />
                </div>
              </div>
              <div>
                <Label>Extensions ({(formData.extensions || []).length})</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(formData.extensions || []).map((ext, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {ext}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Section Fusion de bloc */}
              <div className="border-t border-border/50 pt-4">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-orange-500 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Fusionner ce bloc dans un autre bloc
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Cette action transformera ce bloc en extension du bloc cible et ne peut pas être annulée.
                  </p>
                  <div className="flex gap-2">
                    <Select onValueChange={(value) => {
                      if (value && window.confirm(`Êtes-vous sûr de vouloir fusionner "${editingBlock.name}" dans le bloc sélectionné ?\n\nCette action est irréversible et transformera ce bloc en extension.`)) {
                        mergeBlockIntoBlock(editingBlock.id, value)
                        setEditingBlock(null)
                      }
                    }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Choisir le bloc de destination..." />
                      </SelectTrigger>
                      <SelectContent>
                        {seriesDatabase
                          .filter(block => block.id !== editingBlock.id)
                          .map((block) => (
                            <SelectItem key={block.id} value={block.id}>
                              {block.name} ({block.year}{block.endYear ? ` - ${block.endYear}` : ''})
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingBlock(null)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveBlock} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Block Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="golden-border bg-background">
          <DialogHeader>
            <DialogTitle className="golden-glow">Créer un nouveau bloc</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau bloc de cartes à votre base de données locale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-block-name">Nom du bloc</Label>
              <Input
                id="new-block-name"
                placeholder="Ex: Scarlet & Violet"
                className="golden-border"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="new-block-year">Année début</Label>
                <Input
                  id="new-block-year"
                  type="number"
                  defaultValue={new Date().getFullYear()}
                  className="golden-border"
                />
              </div>
              <div>
                <Label htmlFor="new-block-end-year">Année fin (optionnel)</Label>
                <Input
                  id="new-block-end-year"
                  type="number"
                  placeholder="Année de fin"
                  className="golden-border"
                />
              </div>
              <div>
                <Label htmlFor="new-block-cards">Total cartes estimé</Label>
                <Input
                  id="new-block-cards"
                  type="number"
                  placeholder="0"
                  className="golden-border"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateBlock} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}