import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useCollection } from '@/hooks/useCollection.jsx'
import { CardImage } from '@/components/features/explore/CardImage'
import { SaleModal } from '@/components/features/collection/SaleModal'
import { BatchSaleModal } from '@/components/features/collection/BatchSaleModal'
import { CollectionTabs } from '@/components/features/navigation/CollectionTabs'
import { CardVersionBadges } from '@/components/features/collection/CardVersionBadges'
import { translateCondition } from '@/utils/cardConditions'
import { translatePokemonName } from '@/utils/pokemonTranslations'
import { translateTrainerName } from '@/utils/trainerTranslations'
import { translateCardName } from '@/utils/cardTranslations'
import {
  Copy,
  Search,
  Filter,
  Plus,
  Package,
  Trash2,
  Edit3,
  ShoppingBag,
  Calculator,
  Euro
} from 'lucide-react'

export function Duplicates() {
  const { duplicates, duplicateBatches, createDuplicateBatch, updateDuplicateBatch, deleteDuplicateBatch, createSale, collection } = useCollection()
  const [currentTab, setCurrentTab] = useState('duplicates') // 'duplicates' ou 'batches'
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [selectedCards, setSelectedCards] = useState([])
  const [cardQuantities, setCardQuantities] = useState({}) // Pour stocker les quantités par carte
  const [batchName, setBatchName] = useState('')
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showBatchSaleModal, setShowBatchSaleModal] = useState(false)
  const [cardToSell, setCardToSell] = useState(null)
  const [batchToSell, setBatchToSell] = useState(null)

  // Filtrer les doublons selon la recherche (duplicates vient du Context et est déjà mémorisé)
  const duplicateCards = duplicates.filter(card => {
    if (!searchTerm.trim()) return true

    // Recherche bilingue : français et anglais
    const searchLower = searchTerm.toLowerCase().trim()
    const cardNameLower = card.name.toLowerCase()

    // Recherche directe dans le nom anglais de la carte
    const matchesEnglish = (
      cardNameLower === searchLower ||
      cardNameLower.startsWith(searchLower + ' ') ||
      cardNameLower.includes(' ' + searchLower + ' ') ||
      cardNameLower.endsWith(' ' + searchLower)
    )

    // Si l'utilisateur recherche en français, traduire vers l'anglais
    let translatedSearch = translatePokemonName(searchLower)
    if (translatedSearch === searchLower) {
      translatedSearch = translateTrainerName(searchLower)
    }
    // Recherche par mot complet pour éviter faux positifs (ex: "eri" ne doit PAS matcher "Erika")
    const matchesTranslated = translatedSearch !== searchLower && (
      cardNameLower === translatedSearch || // Exact match
      cardNameLower.startsWith(translatedSearch + ' ') || // "eri " au début
      cardNameLower.includes(' ' + translatedSearch + ' ') || // " eri " au milieu
      cardNameLower.endsWith(' ' + translatedSearch) // " eri" à la fin
    )

    return matchesEnglish || matchesTranslated
  })

  // Calculer la valeur totale d'un lot
  const calculateBatchValue = (cards) => {
    return cards.reduce((total, card) => {
      const price = parseFloat(card.marketPrice || card.value || 0)
      const quantity = cardQuantities[card.id] || card.batchQuantity || 1
      return total + (price * quantity)
    }, 0).toFixed(2)
  }

  const handleCreateBatch = () => {
    if (!batchName.trim() || selectedCards.length === 0) {
      alert('Veuillez saisir un nom et sélectionner des cartes')
      return
    }

    // Créer une copie des cartes avec les quantités spécifiées
    const cardsWithQuantities = selectedCards.map(card => ({
      ...card,
      batchQuantity: cardQuantities[card.id] || 1 // Utiliser la quantité spécifiée ou 1 par défaut
    }))

    const newBatch = {
      id: Date.now().toString(),
      name: batchName.trim(),
      cards: cardsWithQuantities,
      createdAt: new Date().toISOString(),
      totalValue: calculateBatchValue(cardsWithQuantities)
    }

    createDuplicateBatch(newBatch)

    // Reset
    setBatchName('')
    setSelectedCards([])
    setCardQuantities({})
    setShowCreateBatchModal(false)
  }

  const handleEditBatch = (batch) => {
    setEditingBatch(batch)
    setBatchName(batch.name)
    setSelectedCards([...batch.cards])

    // Restaurer les quantités des cartes
    const quantities = {}
    batch.cards.forEach(card => {
      quantities[card.id] = card.batchQuantity || 1
    })
    setCardQuantities(quantities)

    setShowCreateBatchModal(true)
  }

  const handleUpdateBatch = () => {
    if (!batchName.trim() || selectedCards.length === 0) {
      alert('Veuillez saisir un nom et sélectionner des cartes')
      return
    }

    // Créer une copie des cartes avec les quantités spécifiées
    const cardsWithQuantities = selectedCards.map(card => ({
      ...card,
      batchQuantity: cardQuantities[card.id] || 1
    }))

    const updatedBatch = {
      ...editingBatch,
      name: batchName.trim(),
      cards: cardsWithQuantities,
      totalValue: calculateBatchValue(cardsWithQuantities)
    }

    updateDuplicateBatch(updatedBatch)

    // Reset
    setBatchName('')
    setSelectedCards([])
    setCardQuantities({})
    setShowCreateBatchModal(false)
    setEditingBatch(null)
  }

  const handleDeleteBatch = (batchId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
      deleteDuplicateBatch(batchId)
    }
  }

  const toggleCardSelection = (card) => {
    setSelectedCards(prev => {
      const exists = prev.find(c => c.id === card.id)
      if (exists) {
        // Retirer la carte et supprimer sa quantité
        setCardQuantities(prevQty => {
          const newQty = { ...prevQty }
          delete newQty[card.id]
          return newQty
        })
        return prev.filter(c => c.id !== card.id)
      } else {
        // Ajouter la carte et initialiser sa quantité à 1
        setCardQuantities(prevQty => ({
          ...prevQty,
          [card.id]: 1
        }))
        return [...prev, card]
      }
    })
  }

  const updateCardQuantity = (cardId, quantity, maxQuantity) => {
    const parsedQty = parseInt(quantity) || 1
    const validQty = Math.max(1, Math.min(parsedQty, maxQuantity))
    setCardQuantities(prev => ({
      ...prev,
      [cardId]: validQty
    }))
  }

  const handleSellCard = (card) => {
    setCardToSell(card)
    setShowSaleModal(true)
  }

  const handleSellBatch = (batch) => {
    setBatchToSell(batch)
    setShowBatchSaleModal(true)
  }

  const handleSaleSubmit = (saleData) => {
    createSale(saleData)
    setShowSaleModal(false)
    setShowBatchSaleModal(false)
    setCardToSell(null)
    setBatchToSell(null)
    alert('Vente enregistrée avec succès !')
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold golden-glow mb-2 flex items-center">
            <Copy className="w-8 h-8 mr-3" />
            Gestion des Doublons
          </h1>
          <p className="text-muted-foreground hidden lg:block">
            Gérez vos cartes en double et créez des lots pour la vente
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une carte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 golden-border"
              style={{ textTransform: 'none' }}
            />
          </div>
          <Button variant="outline" className="border-primary/20 hidden lg:flex">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Collection Tabs - Mobile uniquement */}
      <CollectionTabs />

      {/* Search Mobile */}
      <div className="lg:hidden relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une carte..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 golden-border"
          style={{ textTransform: 'none' }}
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-border">
        <button
          onClick={() => setCurrentTab('duplicates')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'duplicates'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Copy className="w-4 h-4 inline mr-2" />
          Doublons ({duplicateCards.length})
        </button>
        <button
          onClick={() => setCurrentTab('batches')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === 'batches'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Lots de doublons ({(duplicateBatches || []).length})
        </button>
      </div>

      {/* Content */}
      {currentTab === 'duplicates' ? (
        /* Duplicates Tab */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold golden-glow">
              Cartes en double ({duplicateCards.length})
            </h2>
            <Button
              onClick={() => setShowCreateBatchModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un lot
            </Button>
          </div>

          {(() => {
            console.log('🎨 [Duplicates] Rendu - duplicateCards.length:', duplicateCards.length)
            console.log('🎨 [Duplicates] Première carte:', duplicateCards[0])
            return null
          })()}

          {duplicateCards.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {duplicateCards.map((card) => (
                <Card key={card.id} className="golden-border card-hover cursor-pointer group overflow-hidden">
                  <CardContent className="p-4">
                    {/* Card Image */}
                    <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-200">
                      <CardImage
                        card={card}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        x{card.quantity || 2}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 h-8 p-0 bg-green-500/80 text-white hover:bg-green-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCardSelection(card)
                          }}
                        >
                          {selectedCards.find(c => c.id === card.id) ? '✓' : '+'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 bg-blue-500/80 text-white hover:bg-blue-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSellCard(card)
                          }}
                          title="Vendre cette carte"
                        >
                          <Euro className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Badges des versions possédées */}
                    <CardVersionBadges
                      cardId={card.card_id || card.id}
                      collection={collection}
                      card={card}
                      isUserCopy={true}
                      className="mb-2"
                    />

                    {/* Card Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm golden-glow truncate" title={translateCardName(card.name)}>
                        {translateCardName(card.name)}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{card.series}</p>

                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-xs">
                          {card.rarity}
                        </Badge>
                        <p className="text-xs text-orange-500">{translateCondition(card.condition)}</p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-green-500">{card.marketPrice || card.value || '0.00'}€</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="golden-border text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold golden-glow mb-2">
                  Aucun doublon
                </h3>
                <p className="text-muted-foreground">
                  Vous n'avez pas de cartes en double
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Batches Tab */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold golden-glow">
              Lots de doublons ({(duplicateBatches || []).length})
            </h2>
            <Button
              onClick={() => setShowCreateBatchModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau lot
            </Button>
          </div>

          {(duplicateBatches || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(duplicateBatches || []).map((batch) => (
                <Card key={batch.id} className="golden-border">
                  <CardHeader className="border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="golden-glow flex items-center">
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        {batch.name}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => handleSellBatch(batch)}
                          title="Vendre ce lot"
                        >
                          <Euro className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditBatch(batch)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBatch(batch.id)}
                          className="border-red-500/20 hover:bg-red-500/10 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="w-4 h-4" />
                          {batch.cards.length} cartes
                        </div>
                        <div className="flex items-center gap-2 text-lg font-bold text-green-500">
                          <Calculator className="w-4 h-4" />
                          {batch.totalValue}€
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Créé le {new Date(batch.createdAt).toLocaleDateString('fr-FR')}
                      </div>

                      {/* Preview des premières cartes */}
                      <div className="grid grid-cols-4 gap-2">
                        {batch.cards.slice(0, 4).map((card, index) => (
                          <div
                            key={index}
                            className="aspect-[3/4] rounded overflow-hidden bg-muted"
                            title={translateCardName(card.name)}
                          >
                            <CardImage
                              card={card}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {batch.cards.length > 4 && (
                          <div className="aspect-[3/4] rounded bg-muted/50 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                              +{batch.cards.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="golden-border text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold golden-glow mb-2">
                  Aucun lot créé
                </h3>
                <p className="text-muted-foreground mb-4">
                  Créez des lots de cartes en double pour organiser vos ventes
                </p>
                <Button
                  onClick={() => setShowCreateBatchModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer mon premier lot
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Batch Modal */}
      <Dialog open={showCreateBatchModal} onOpenChange={setShowCreateBatchModal}>
        <DialogContent className="max-w-4xl golden-border bg-background">
          <DialogHeader>
            <DialogTitle className="golden-glow">
              {editingBatch ? 'Modifier le lot' : 'Créer un nouveau lot'}
            </DialogTitle>
            <DialogDescription>
              {editingBatch ? 'Modifiez le nom et la sélection de cartes de ce lot.' : 'Créez un nouveau lot de doublons avec un nom personnalisé.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="batch-name">Nom du lot</Label>
              <Input
                id="batch-name"
                placeholder="Ex: Lot Pikachu vintage"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="golden-border"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Sélectionner les cartes ({selectedCards.length})</Label>
                <div className="text-lg font-bold text-green-500">
                  Total: {calculateBatchValue(selectedCards)}€
                </div>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
                {duplicateCards.map((card) => {
                  const isSelected = selectedCards.find(c => c.id === card.id)
                  const maxQuantity = card.quantity || 2
                  const batchQuantity = cardQuantities[card.id] || 1
                  return (
                    <div key={card.id} className="space-y-2">
                      <div
                        className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-green-500 scale-95' : 'hover:scale-105'
                        }`}
                        onClick={() => toggleCardSelection(card)}
                      >
                        <CardImage
                          card={card}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-1 py-0.5 rounded font-medium">
                          x{maxQuantity}
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                              ✓
                            </div>
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateCardQuantity(card.id, batchQuantity - 1, maxQuantity)
                            }}
                            className="bg-accent hover:bg-accent/80 text-foreground rounded px-2 py-1 text-sm font-bold"
                          >
                            -
                          </button>
                          <Input
                            type="number"
                            min="1"
                            max={maxQuantity}
                            value={batchQuantity}
                            onChange={(e) => {
                              e.stopPropagation()
                              updateCardQuantity(card.id, e.target.value, maxQuantity)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-center py-1 h-8"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateCardQuantity(card.id, batchQuantity + 1, maxQuantity)
                            }}
                            className="bg-accent hover:bg-accent/80 text-foreground rounded px-2 py-1 text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowCreateBatchModal(false)
                setEditingBatch(null)
                setBatchName('')
                setSelectedCards([])
              }}>
                Annuler
              </Button>
              <Button
                onClick={editingBatch ? handleUpdateBatch : handleCreateBatch}
                className="bg-green-600 hover:bg-green-700"
              >
                {editingBatch ? 'Modifier' : 'Créer'} le lot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Modals */}
      <SaleModal
        isOpen={showSaleModal}
        onClose={() => {
          setShowSaleModal(false)
          setCardToSell(null)
        }}
        onSubmit={handleSaleSubmit}
        card={cardToSell}
      />

      <BatchSaleModal
        isOpen={showBatchSaleModal}
        onClose={() => {
          setShowBatchSaleModal(false)
          setBatchToSell(null)
        }}
        onSubmit={handleSaleSubmit}
        batch={batchToSell}
      />
    </div>
  )
}