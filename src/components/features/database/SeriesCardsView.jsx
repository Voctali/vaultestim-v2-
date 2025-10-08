import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CardImage } from '@/components/features/explore/CardImage'
import { useCardDatabase } from '@/hooks/useCardDatabase.jsx'
import {
  Edit3,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Search,
  Filter,
  CheckSquare,
  Square,
  Move,
  Download,
  AlertTriangle
} from 'lucide-react'

export function SeriesCardsView({ series, onBack }) {
  const {
    seriesDatabase,
    discoveredCards,
    updateCardInDatabase,
    deleteCardFromDatabase,
    moveCardToSeries,
    deleteMultipleCards,
    moveMultipleCards
  } = useCardDatabase()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCards, setSelectedCards] = useState([])
  const [editingCard, setEditingCard] = useState(null)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [targetSeriesId, setTargetSeriesId] = useState('')
  const [editData, setEditData] = useState({
    name: '',
    series: '',
    rarity: '',
    hp: '',
    types: [],
    marketPrice: ''
  })

  // Filtrer les cartes de cette série
  const seriesCards = useMemo(() => {
    const filtered = discoveredCards.filter(card => {
      // Chercher dans les extensions de cette série
      const belongsToSeries = series.extensions?.some(extensionId =>
        card.setId === extensionId || card.set?.id === extensionId
      )

      // Appliquer le filtre de recherche
      if (searchTerm) {
        const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             card.series?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             card.rarity?.toLowerCase().includes(searchTerm.toLowerCase())
        return belongsToSeries && matchesSearch
      }

      return belongsToSeries
    })

    // Trier les cartes par numéro (ordre croissant)
    return filtered.sort((a, b) => {
      const numA = a.number || ''
      const numB = b.number || ''

      // Extraire la partie numérique du début
      const matchA = numA.match(/^(\d+)/)
      const matchB = numB.match(/^(\d+)/)

      if (matchA && matchB) {
        const intA = parseInt(matchA[1])
        const intB = parseInt(matchB[1])

        if (intA !== intB) {
          return intA - intB
        }
      }

      // Si les nombres sont égaux ou absents, comparer alphabétiquement
      return numA.localeCompare(numB)
    })
  }, [discoveredCards, series, searchTerm])

  const handleCardClick = (card) => {
    if (selectedCards.length > 0) {
      toggleCardSelection(card.id)
    } else {
      handleEditCard(card)
    }
  }

  const handleCardLongPress = (card) => {
    toggleCardSelection(card.id)
  }

  const toggleCardSelection = (cardId) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId)
      } else {
        return [...prev, cardId]
      }
    })
  }

  const selectAllCards = () => {
    if (selectedCards.length === seriesCards.length) {
      setSelectedCards([])
    } else {
      setSelectedCards(seriesCards.map(card => card.id))
    }
  }

  const clearSelection = () => {
    setSelectedCards([])
  }

  const handleEditCard = (card) => {
    setEditingCard(card)
    setEditData({
      name: card.name || '',
      series: card.series || '',
      rarity: card.rarity || '',
      hp: card.hp?.toString() || '',
      types: card.types || [],
      marketPrice: card.marketPrice?.toString() || card.value?.toString() || ''
    })
  }

  const handleSaveCard = () => {
    if (!editingCard) return

    const updatedCard = {
      ...editingCard,
      name: editData.name,
      series: editData.series,
      rarity: editData.rarity,
      hp: editData.hp ? parseInt(editData.hp) : null,
      types: editData.types,
      marketPrice: editData.marketPrice ? parseFloat(editData.marketPrice) : null,
      value: editData.marketPrice ? parseFloat(editData.marketPrice) : editingCard.value
    }

    updateCardInDatabase(editingCard.id, updatedCard)
    setEditingCard(null)
  }

  const handleDeleteCard = (cardId) => {
    const card = seriesCards.find(c => c.id === cardId)
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la carte "${card?.name}" ?\n\nCette action est irréversible.`)) {
      deleteCardFromDatabase(cardId)
      setSelectedCards(prev => prev.filter(id => id !== cardId))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedCards.length === 0) return

    const cardNames = selectedCards.map(id => {
      const card = seriesCards.find(c => c.id === id)
      return card?.name || id
    }).slice(0, 5) // Limiter l'affichage à 5 noms

    const displayNames = cardNames.join('\n')
    const moreCount = selectedCards.length - cardNames.length

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ces ${selectedCards.length} cartes ?\n\n${displayNames}${moreCount > 0 ? `\n... et ${moreCount} autres` : ''}\n\nCette action est irréversible.`

    if (window.confirm(confirmMessage)) {
      deleteMultipleCards(selectedCards)
      setSelectedCards([])
    }
  }

  const handleMoveSelected = () => {
    if (selectedCards.length === 0 || !targetSeriesId) return

    const targetSeries = seriesDatabase.find(s => s.id === targetSeriesId)
    if (!targetSeries) return

    const confirmMessage = `Êtes-vous sûr de vouloir déplacer ces ${selectedCards.length} cartes vers "${targetSeries.name}" ?`

    if (window.confirm(confirmMessage)) {
      moveMultipleCards(selectedCards, targetSeriesId)
      setSelectedCards([])
      setShowMoveDialog(false)
      setTargetSeriesId('')
    }
  }

  const exportSeriesCards = () => {
    const dataToExport = {
      series: series,
      cards: seriesCards,
      exportDate: new Date().toISOString()
    }

    const dataStr = JSON.stringify(dataToExport, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `series-${series.name.replace(/[^a-z0-9]/gi, '-')}-cards.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-primary/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h2 className="text-2xl font-bold golden-glow">{series.name}</h2>
            <p className="text-muted-foreground">
              {seriesCards.length} cartes • {series.extensions?.length || 0} extensions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedCards.length > 0 ? (
            <>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {selectedCards.length} sélectionnée{selectedCards.length > 1 ? 's' : ''}
              </Badge>
              <Button
                variant="outline"
                onClick={() => setShowMoveDialog(true)}
                className="border-blue-500/20 hover:bg-blue-500/10 text-blue-500"
              >
                <Move className="w-4 h-4 mr-2" />
                Déplacer
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteSelected}
                className="border-red-500/20 hover:bg-red-500/10 text-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
              <Button
                variant="outline"
                onClick={clearSelection}
                className="border-gray-500/20"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={selectAllCards}
                className="border-blue-500/20 hover:bg-blue-500/10 text-blue-500"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Tout sélectionner
              </Button>
              <Button
                variant="outline"
                onClick={exportSeriesCards}
                className="border-green-500/20 hover:bg-green-500/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans cette série..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 golden-border"
          />
        </div>
        <Button variant="outline" className="border-primary/20">
          <Filter className="w-4 h-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {seriesCards.map((card) => (
          <Card
            key={card.id}
            className={`golden-border card-hover cursor-pointer group overflow-hidden transition-all duration-200 ${
              selectedCards.includes(card.id)
                ? 'ring-2 ring-primary bg-primary/5'
                : ''
            }`}
            onClick={() => handleCardClick(card)}
            onContextMenu={(e) => {
              e.preventDefault()
              handleCardLongPress(card)
            }}
            onTouchStart={(e) => {
              // Gérer l'appui prolongé sur mobile
              const touchTimer = setTimeout(() => {
                handleCardLongPress(card)
              }, 500)

              const handleTouchEnd = () => {
                clearTimeout(touchTimer)
                document.removeEventListener('touchend', handleTouchEnd)
              }

              document.addEventListener('touchend', handleTouchEnd)
            }}
          >
            <CardContent className="p-3">
              {/* Card Image */}
              <div className="relative aspect-[3/4] mb-2 rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                <CardImage
                  card={card}
                  className="w-full h-full object-cover"
                />

                {/* Selection Indicator */}
                {selectedCards.includes(card.id) && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1">
                    <CheckSquare className="w-3 h-3" />
                  </div>
                )}

                {/* Rarity Badge */}
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {card.rarity || 'Commune'}
                </div>
              </div>

              {/* Card Info */}
              <div className="space-y-1">
                <h3 className="font-semibold text-xs golden-glow truncate" title={card.name}>
                  {card.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate" title={card.series}>
                  {card.series}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-green-500">
                    {card.marketPrice || card.value || '0.00'}€
                  </div>
                  {card.hp && (
                    <div className="text-xs text-muted-foreground">
                      HP: {card.hp}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {seriesCards.length === 0 && (
        <Card className="border-muted">
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucune carte trouvée</h3>
              <p>
                {searchTerm
                  ? `Aucune carte ne correspond à "${searchTerm}"`
                  : 'Cette série ne contient aucune carte'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
          <DialogContent className="golden-border bg-background max-w-2xl">
            <DialogHeader>
              <DialogTitle className="golden-glow">
                Modifier la carte "{editingCard.name}"
              </DialogTitle>
              <DialogDescription>
                Modifiez les informations de cette carte dans votre base de données.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Image */}
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                  <CardImage
                    card={editingCard}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="card-name">Nom de la carte</Label>
                  <Input
                    id="card-name"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="golden-border"
                  />
                </div>

                <div>
                  <Label htmlFor="card-series">Série</Label>
                  <Input
                    id="card-series"
                    value={editData.series}
                    onChange={(e) => setEditData(prev => ({ ...prev, series: e.target.value }))}
                    className="golden-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="card-rarity">Rareté</Label>
                    <Select
                      value={editData.rarity}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, rarity: value }))}
                    >
                      <SelectTrigger className="golden-border">
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Commune">Commune</SelectItem>
                        <SelectItem value="Peu commune">Peu commune</SelectItem>
                        <SelectItem value="Rare">Rare</SelectItem>
                        <SelectItem value="Rare Holo">Rare Holo</SelectItem>
                        <SelectItem value="Ultra Rare">Ultra Rare</SelectItem>
                        <SelectItem value="Secret Rare">Secret Rare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="card-hp">HP</Label>
                    <Input
                      id="card-hp"
                      type="number"
                      placeholder="HP"
                      value={editData.hp}
                      onChange={(e) => setEditData(prev => ({ ...prev, hp: e.target.value }))}
                      className="golden-border"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="card-price">Prix marché (€)</Label>
                  <Input
                    id="card-price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editData.marketPrice}
                    onChange={(e) => setEditData(prev => ({ ...prev, marketPrice: e.target.value }))}
                    className="golden-border"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditingCard(null)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSaveCard}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteCard(editingCard.id)}
                    className="border-red-500/20 hover:bg-red-500/10 text-red-500"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Move Cards Modal */}
      {showMoveDialog && (
        <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
          <DialogContent className="golden-border bg-background">
            <DialogHeader>
              <DialogTitle className="golden-glow">
                Déplacer {selectedCards.length} carte{selectedCards.length > 1 ? 's' : ''}
              </DialogTitle>
              <DialogDescription>
                Choisissez la série de destination pour ces cartes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Série de destination</Label>
                <Select
                  value={targetSeriesId}
                  onValueChange={setTargetSeriesId}
                >
                  <SelectTrigger className="golden-border">
                    <SelectValue placeholder="Choisir une série..." />
                  </SelectTrigger>
                  <SelectContent>
                    {seriesDatabase
                      .filter(s => s.id !== series.id)
                      .map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.year}{s.endYear ? ` - ${s.endYear}` : ''})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-500">Attention</p>
                    <p className="text-muted-foreground">
                      Cette action déplacera définitivement les cartes sélectionnées vers la série choisie.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMoveDialog(false)
                    setTargetSeriesId('')
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleMoveSelected}
                  disabled={!targetSeriesId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Move className="w-4 h-4 mr-2" />
                  Déplacer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}