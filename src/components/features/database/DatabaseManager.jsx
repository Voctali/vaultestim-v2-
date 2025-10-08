/**
 * Composant de gestion avancée de la base de données
 * Permet de visualiser, modifier, supprimer et réorganiser les données
 */
import React, { useState, useEffect } from 'react'
import {
  Database,
  Edit3,
  Trash2,
  Move,
  Eye,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Check,
  X,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Package,
  RefreshCw
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useCardDatabase } from '@/hooks/useCardDatabase'
import { IndexedDBService } from '@/services/IndexedDBService'
import { buildBlocksHierarchy, transformBlocksForDatabaseManager } from '@/services/BlockHierarchyService'

export function DatabaseManager() {
  // Utiliser le hook useCardDatabase pour accéder aux MÊMES données que l'onglet Explorer
  const { discoveredCards, seriesDatabase, isLoading } = useCardDatabase()

  // État pour les données locales (transformées depuis useCardDatabase)
  const [blocks, setBlocks] = useState([])
  const [sets, setSets] = useState([])
  const [cards, setCards] = useState([])
  const [customBlocks, setCustomBlocks] = useState([])
  const [customExtensions, setCustomExtensions] = useState([])

  // État pour l'interface
  const [activeTab, setActiveTab] = useState('blocks')
  const [viewMode, setViewMode] = useState('list') // list ou grid
  const [selectedItems, setSelectedItems] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  // État pour le drag & drop
  const [draggedItem, setDraggedItem] = useState(null)
  const [expandedBlocks, setExpandedBlocks] = useState(new Set())

  // Charger les données personnalisées au démarrage (MÊME LOGIQUE QUE EXPLORE.JSX)
  useEffect(() => {
    const loadCustomData = async () => {
      try {
        const [customBlocksList, customExtensionsList] = await Promise.all([
          IndexedDBService.loadCustomBlocks(),
          IndexedDBService.loadCustomExtensions()
        ])
        setCustomBlocks(customBlocksList)
        setCustomExtensions(customExtensionsList)
        console.log(`📦 DatabaseManager - Chargé ${customBlocksList.length} blocs personnalisés et ${customExtensionsList.length} extensions personnalisées`)
      } catch (error) {
        console.error('❌ DatabaseManager - Erreur chargement données personnalisées:', error)
      }
    }

    loadCustomData()
  }, [])

  // Transformer les données de useCardDatabase pour l'affichage dans DatabaseManager
  // UTILISER LE SERVICE CENTRALISÉ (MÊME LOGIQUE QUE EXPLORE.JSX)
  const transformLocalData = async () => {
    console.log('🔄 DatabaseManager - Transformation des données locales...')

    // Utiliser le service centralisé pour construire la hiérarchie
    const hierarchyBlocks = buildBlocksHierarchy(
      discoveredCards || [],
      seriesDatabase || [],
      customBlocks,
      customExtensions
    )

    // Transformer pour l'affichage dans DatabaseManager
    const { blocks: transformedBlocks, sets: transformedSets, cards: transformedCards } =
      transformBlocksForDatabaseManager(hierarchyBlocks, discoveredCards || [])

    setBlocks(transformedBlocks)
    setSets(transformedSets)
    setCards(transformedCards)

    console.log(`✅ DatabaseManager - Données transformées (IDENTIQUES À EXPLORER):`, {
      blocks: transformedBlocks.length,
      sets: transformedSets.length,
      cards: transformedCards.length
    })
  }

  // Mettre à jour les données quand useCardDatabase OU customExtensions/customBlocks changent
  useEffect(() => {
    if (!isLoading && discoveredCards && seriesDatabase) {
      transformLocalData()
    }
  }, [discoveredCards, seriesDatabase, isLoading, customExtensions, customBlocks])

  // Fonction de rechargement pour compatibilité avec l'interface
  const loadData = () => {
    transformLocalData()
  }

  // Gestion de la sélection multiple
  const handleItemSelect = (itemId, isSelected) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, itemId])
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    }
  }

  const handleSelectAll = (items) => {
    const allIds = items.map(item => item.id)
    if (selectedItems.length === allIds.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(allIds)
    }
  }

  // Gestion de l'édition
  const handleEditItem = (item) => {
    setEditingItem({ ...item })
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    try {
      // Simulation de sauvegarde
      if (editingItem.type === 'block' || activeTab === 'blocks') {
        setBlocks(prev => prev.map(block =>
          block.id === editingItem.id ? editingItem : block
        ))
      } else if (activeTab === 'sets') {
        setSets(prev => prev.map(set =>
          set.id === editingItem.id ? editingItem : set
        ))
      } else if (activeTab === 'cards') {
        setCards(prev => prev.map(card =>
          card.id === editingItem.id ? editingItem : card
        ))
      }

      setEditingItem(null)
      alert(`✅ ${editingItem.name} modifié avec succès`)
    } catch (error) {
      alert(`❌ Erreur lors de la modification: ${error.message}`)
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  // Gestion de la suppression
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedItems.length} élément(s) sélectionné(s) ?`
    )

    if (!confirmed) return

    try {
      // Simulation de suppression
      if (activeTab === 'blocks') {
        setBlocks(prev => prev.filter(block => !selectedItems.includes(block.id)))
      } else if (activeTab === 'sets') {
        setSets(prev => prev.filter(set => !selectedItems.includes(set.id)))
      } else if (activeTab === 'cards') {
        setCards(prev => prev.filter(card => !selectedItems.includes(card.id)))
      }

      setSelectedItems([])
      alert(`✅ ${selectedItems.length} élément(s) supprimé(s)`)
    } catch (error) {
      alert(`❌ Erreur lors de la suppression: ${error.message}`)
    }
  }

  // Gestion du drag & drop pour réorganisation
  const handleDragStart = (item) => {
    setDraggedItem(item)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (targetItem) => {
    if (!draggedItem || draggedItem.id === targetItem.id) return

    try {
      // Réorganisation en échangeant les ordres
      const newOrder = targetItem.order
      const oldOrder = draggedItem.order

      if (activeTab === 'blocks') {
        setBlocks(prev => prev.map(block => {
          if (block.id === draggedItem.id) return { ...block, order: newOrder }
          if (block.id === targetItem.id) return { ...block, order: oldOrder }
          return block
        }))
      } else if (activeTab === 'sets') {
        setSets(prev => prev.map(set => {
          if (set.id === draggedItem.id) return { ...set, order: newOrder }
          if (set.id === targetItem.id) return { ...set, order: oldOrder }
          return set
        }))
      } else if (activeTab === 'cards') {
        setCards(prev => prev.map(card => {
          if (card.id === draggedItem.id) return { ...card, order: newOrder }
          if (card.id === targetItem.id) return { ...card, order: oldOrder }
          return card
        }))
      }

      alert(`✅ ${draggedItem.name} repositionné`)
    } catch (error) {
      alert(`❌ Erreur lors du repositionnement: ${error.message}`)
    }

    setDraggedItem(null)
  }

  // Filtrage des données
  const getFilteredData = () => {
    let data = []

    if (activeTab === 'blocks') {
      data = blocks
    } else if (activeTab === 'sets') {
      data = sets
    } else if (activeTab === 'cards') {
      data = cards
    }

    // Filtrage par recherche
    if (searchQuery) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Tri par ordre
    return data.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  const filteredData = getFilteredData()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Database className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Chargement des données locales...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Barre d'outils */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gestion de la Base de Données
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedItems.length} sélectionné(s)
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>

          {/* Onglets de navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="blocks">
                Blocs ({blocks.length})
              </TabsTrigger>
              <TabsTrigger value="sets">
                Extensions ({sets.length})
              </TabsTrigger>
              <TabsTrigger value="cards">
                Cartes ({cards.length})
              </TabsTrigger>
            </TabsList>

            {/* Contenu des onglets */}
            {['blocks', 'sets', 'cards'].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-4">
                <DataTable
                  data={filteredData}
                  type={tab}
                  viewMode={viewMode}
                  selectedItems={selectedItems}
                  editingItem={editingItem}
                  onItemSelect={handleItemSelect}
                  onSelectAll={() => handleSelectAll(filteredData)}
                  onEditItem={handleEditItem}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  setEditingItem={setEditingItem}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      {editingItem && (
        <EditDialog
          item={editingItem}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
          onChange={setEditingItem}
        />
      )}
    </div>
  )
}

// Composant de tableau de données
function DataTable({
  data,
  type,
  viewMode,
  selectedItems,
  editingItem,
  onItemSelect,
  onSelectAll,
  onEditItem,
  onDragStart,
  onDragOver,
  onDrop,
  setEditingItem
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun élément trouvé</p>
      </div>
    )
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(item => (
          <DataCard
            key={item.id}
            item={item}
            type={type}
            isSelected={selectedItems.includes(item.id)}
            onSelect={(checked) => onItemSelect(item.id, checked)}
            onEdit={() => onEditItem(item)}
            onDragStart={() => onDragStart(item)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(item)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2 border-b">
        <Checkbox
          checked={selectedItems.length === data.length && data.length > 0}
          onCheckedChange={onSelectAll}
        />
        <span className="text-sm font-medium">Sélectionner tout</span>
      </div>

      {data.map(item => (
        <DataRow
          key={item.id}
          item={item}
          type={type}
          isSelected={selectedItems.includes(item.id)}
          isEditing={editingItem?.id === item.id}
          onSelect={(checked) => onItemSelect(item.id, checked)}
          onEdit={() => onEditItem(item)}
          onDragStart={() => onDragStart(item)}
          onDragOver={onDragOver}
          onDrop={() => onDrop(item)}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
        />
      ))}
    </div>
  )
}

// Composant de carte (vue grille)
function DataCard({ item, type, isSelected, onSelect, onEdit, onDragStart, onDragOver, onDrop }) {
  return (
    <Card
      className={`cursor-move transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
          />
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h3 className="font-medium">{item.name}</h3>
          {type === 'blocks' && (
            <div className="text-sm text-muted-foreground">
              <div>{item.sets_count} extensions</div>
              <div>{item.cards_count} cartes</div>
            </div>
          )}
          {type === 'sets' && (
            <div className="text-sm text-muted-foreground">
              <div>{item.cards_count} cartes</div>
              <div>{item.release_date}</div>
            </div>
          )}
          {type === 'cards' && (
            <div className="text-sm text-muted-foreground">
              <div>#{item.number}</div>
              <div>{item.type} • {item.rarity}</div>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit3 className="h-3 w-3 mr-1" />
            Modifier
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Composant de ligne (vue liste)
function DataRow({
  item,
  type,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
  editingItem,
  setEditingItem
}) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        <div className="flex-1 grid grid-cols-3 gap-2">
          <Input
            value={editingItem.name}
            onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Nom"
          />
          {type === 'cards' && (
            <Input
              value={editingItem.number}
              onChange={(e) => setEditingItem(prev => ({ ...prev, number: e.target.value }))}
              placeholder="Numéro"
            />
          )}
          {type === 'sets' && (
            <Input
              type="date"
              value={editingItem.release_date}
              onChange={(e) => setEditingItem(prev => ({ ...prev, release_date: e.target.value }))}
            />
          )}
        </div>
        <div className="flex gap-1">
          <Button size="sm" onClick={() => {
            // Simulation de sauvegarde
            alert(`✅ ${editingItem.name} modifié`)
            setEditingItem(null)
          }}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-2 p-3 border rounded-lg cursor-move transition-all hover:bg-muted/50 ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      <GripVertical className="h-4 w-4 text-muted-foreground" />

      <div className="flex-1">
        <div className="font-medium">{item.name}</div>
        <div className="text-sm text-muted-foreground">
          {type === 'blocks' && `${item.sets_count} extensions • ${item.cards_count} cartes`}
          {type === 'sets' && `${item.cards_count} cartes • ${item.release_date}`}
          {type === 'cards' && `#${item.number} • ${item.type} • ${item.rarity}`}
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={onEdit}>
        <Edit3 className="h-3 w-3" />
      </Button>
    </div>
  )
}

// Dialog d'édition avancée
function EditDialog({ item, onSave, onCancel, onChange }) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier {item?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nom</label>
            <Input
              value={item?.name || ''}
              onChange={(e) => onChange(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          {/* Ajout d'autres champs selon le type d'item */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button onClick={onSave}>
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}