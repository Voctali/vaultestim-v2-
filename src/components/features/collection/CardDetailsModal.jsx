import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CardImage } from '@/components/features/explore/CardImage'
import { useCollection } from '@/hooks/useCollection.jsx'
import { formatCardPrice } from '@/utils/priceFormatter'
import { translateCondition } from '@/utils/cardConditions'
import { ArrowLeft, Edit2, Save, X, Heart, List, Trash2, ExternalLink } from 'lucide-react'

export function CardDetailsModal({ isOpen, onClose, card, allCardsOfSameType = [] }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const { removeFromCollection, updateCardInCollection, toggleFavorite, toggleWishlist, favorites, wishlist, collection } = useCollection()

  // Grouper les cartes identiques par état et version
  const getCardsGrouped = () => {
    if (!card) return { byCondition: {}, byVersion: {} }

    // Trouver toutes les cartes identiques (même nom et même série)
    const identicalCards = collection.filter(c =>
      c.name === card.name && c.series === card.series
    )

    // Grouper par état
    const byCondition = {}
    identicalCards.forEach(c => {
      const condition = c.condition || 'Proche du neuf'
      if (!byCondition[condition]) {
        byCondition[condition] = []
      }
      byCondition[condition].push(c)
    })

    // Grouper par version
    const byVersion = {}
    identicalCards.forEach(c => {
      const version = c.version || 'Normale'
      if (!byVersion[version]) {
        byVersion[version] = []
      }
      byVersion[version].push(c)
    })

    return { byCondition, byVersion }
  }

  const { byCondition: cardsByCondition, byVersion: cardsByVersion } = getCardsGrouped()
  const totalQuantity = Object.values(cardsByCondition).reduce((sum, cards) =>
    sum + cards.reduce((cardSum, c) => cardSum + (c.quantity || 1), 0), 0
  )

  useEffect(() => {
    if (card) {
      setEditData({
        quantity: card.quantity || 1,
        condition: card.condition || 'Proche du neuf',
        version: card.version || 'Normale',
        purchasePrice: card.purchasePrice || '',
        isGraded: card.isGraded || false,
        gradeCompany: card.gradeCompany || '',
        grade: card.grade || ''
      })
    }
  }, [card])

  const handleSave = () => {
    if (card) {
      updateCardInCollection(card.id, editData)
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    if (card && window.confirm('Êtes-vous sûr de vouloir supprimer cette carte de votre collection ?')) {
      removeFromCollection(card.id)
      onClose()
    }
  }

  const handleDeleteAllCopies = () => {
    if (!card) return

    const identicalCards = collection.filter(c =>
      c.name === card.name && c.series === card.series
    )

    const totalCopies = identicalCards.reduce((sum, c) => sum + (c.quantity || 1), 0)

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer TOUS les exemplaires de cette carte (${totalCopies} carte(s)) ?`)) {
      identicalCards.forEach(c => {
        removeFromCollection(c.id)
      })
      onClose()
    }
  }

  const handleDeleteByCondition = (condition) => {
    const cardsToDelete = cardsByCondition[condition]
    const totalToDelete = cardsToDelete.reduce((sum, c) => sum + (c.quantity || 1), 0)

    if (window.confirm(`Supprimer ${totalToDelete} carte(s) en état "${condition}" ?`)) {
      cardsToDelete.forEach(c => {
        removeFromCollection(c.id)
      })

      // Si toutes les cartes sont supprimées, fermer la modale
      if (totalToDelete === totalQuantity) {
        onClose()
      }
    }
  }

  const handleDeleteByVersion = (version) => {
    const cardsToDelete = cardsByVersion[version]
    const totalToDelete = cardsToDelete.reduce((sum, c) => sum + (c.quantity || 1), 0)

    if (window.confirm(`Supprimer ${totalToDelete} carte(s) en version "${version}" ?`)) {
      cardsToDelete.forEach(c => {
        removeFromCollection(c.id)
      })

      // Si toutes les cartes sont supprimées, fermer la modale
      if (totalToDelete === totalQuantity) {
        onClose()
      }
    }
  }

  const handleToggleFavorite = () => {
    if (card) {
      toggleFavorite(card)
    }
  }

  const handleToggleWishlist = () => {
    if (card) {
      toggleWishlist(card)
    }
  }

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  if (!card) return null

  const isFavorite = favorites.find(fav => fav.id === card.id)
  const isInWishlist = wishlist.find(wish => wish.id === card.id)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto golden-border bg-background">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="golden-glow flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Edit2 className="w-5 h-5" />
                    Modifier la carte
                  </>
                ) : (
                  <>Détails de la carte</>
                )}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Modifiez les détails de cette carte dans votre collection"
                  : "Consultez les détails de cette carte de votre collection"
                }
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleFavorite}
                    className="hover:bg-accent"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleWishlist}
                    className="hover:bg-accent"
                  >
                    <List className={`w-4 h-4 ${isInWishlist ? 'fill-blue-500 text-blue-500' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="hover:bg-accent"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-accent"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card Display */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] max-w-sm mx-auto">
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl golden-border">
                <CardImage
                  card={card}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Quantités par état et version */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold golden-glow">Vos exemplaires ({totalQuantity})</h3>

              {/* Par état */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Par état</h4>
                {Object.entries(cardsByCondition).map(([condition, cards]) => {
                  const totalForCondition = cards.reduce((sum, c) => sum + (c.quantity || 1), 0)
                  const isCurrentCard = cards.some(c => c.id === card.id)

                  return (
                    <div
                      key={condition}
                      className={`flex items-center justify-between gap-2 p-2 rounded border ${
                        isCurrentCard ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 border-muted'
                      }`}
                    >
                      <span className="text-sm font-medium flex-1">{translateCondition(condition)}</span>
                      <Badge variant={isCurrentCard ? "default" : "secondary"}>
                        {totalForCondition}x
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteByCondition(condition)}
                        className="h-8 w-8 p-0 hover:bg-red-500/10"
                        title={`Supprimer ${totalForCondition} carte(s) en état "${translateCondition(condition)}"`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )
                })}
              </div>

              {/* Par version */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Par version</h4>
                {Object.entries(cardsByVersion).map(([version, cards]) => {
                  const totalForVersion = cards.reduce((sum, c) => sum + (c.quantity || 1), 0)
                  const isCurrentCard = cards.some(c => c.id === card.id)

                  return (
                    <div
                      key={version}
                      className={`flex items-center justify-between gap-2 p-2 rounded border ${
                        isCurrentCard ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 border-muted'
                      }`}
                    >
                      <span className="text-sm font-medium flex-1">{version}</span>
                      <Badge variant={isCurrentCard ? "default" : "secondary"}>
                        {totalForVersion}x
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteByVersion(version)}
                        className="h-8 w-8 p-0 hover:bg-red-500/10"
                        title={`Supprimer ${totalForVersion} carte(s) en version "${version}"`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Card Information and Form */}
          <div className="space-y-6">
            {/* Card Basic Info */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold golden-glow">{card.name}</h1>
              <p className="text-muted-foreground">{card.series}</p>
              <p className="text-sm text-muted-foreground">{card.block}</p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{card.rarity}</Badge>
                {card.type && <Badge variant="outline">{card.type}</Badge>}
                {card.pokemonType && <Badge variant="outline">{card.pokemonType}</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {card.hp && (
                  <div>
                    <span className="font-medium">HP:</span> {card.hp}
                  </div>
                )}
                {card.artist && (
                  <div>
                    <span className="font-medium">Artiste:</span> {card.artist}
                  </div>
                )}
              </div>

              <div className="text-sm">
                <span className="font-medium">Prix marché:</span>
                <span className="ml-2 font-bold text-green-500">{formatCardPrice(card)}</span>
              </div>

              {/* Liens vers les marketplaces */}
              <div className="flex flex-wrap gap-3 text-sm">
                {/* CardMarket - Utiliser URL directe ou générer lien de recherche */}
                {(card.cardMarketPrice?.url || card.name) && (
                  <a
                    href={
                      card.cardMarketPrice?.url ||
                      `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name + ' ' + (card.set?.name || card.extension || ''))}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                    title={card.cardMarketPrice?.url ? 'Lien direct vers la carte' : 'Rechercher sur CardMarket'}
                  >
                    <ExternalLink className="w-4 h-4" />
                    CardMarket (EUR) {!card.cardMarketPrice?.url && '🔍'}
                  </a>
                )}
                {/* TCGPlayer - Générer lien de recherche direct */}
                {card.name && (
                  <a
                    href={`https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodeURIComponent(card.name + ' ' + (card.set?.name || card.extension || ''))}&page=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                    title="Rechercher sur TCGPlayer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    TCGPlayer (USD) 🔍
                  </a>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                Ajouté le {card.displayDate}
              </div>
            </div>

            {/* Edit Form or Details */}
            {isEditing ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <h3 className="text-lg font-semibold golden-glow">Modifier les détails</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-quantity">Quantité</Label>
                    <Input
                      id="edit-quantity"
                      type="number"
                      min="1"
                      value={editData.quantity}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                      className="golden-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-condition">État</Label>
                    <Select value={editData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                      <SelectTrigger className="golden-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Neuf">Neuf</SelectItem>
                        <SelectItem value="Proche du neuf">Proche du neuf</SelectItem>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Bon">Bon</SelectItem>
                        <SelectItem value="Moyen">Moyen</SelectItem>
                        <SelectItem value="Mauvais">Mauvais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-version">Version</Label>
                    <Select value={editData.version} onValueChange={(value) => handleInputChange('version', value)}>
                      <SelectTrigger className="golden-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normale">Normale</SelectItem>
                        <SelectItem value="Reverse Holo">Reverse Holo</SelectItem>
                        <SelectItem value="Holo">Holo</SelectItem>
                        <SelectItem value="Full Art">Full Art</SelectItem>
                        <SelectItem value="Alternate Art">Alternate Art</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-purchasePrice">Prix d'achat (€)</Label>
                    <Input
                      id="edit-purchasePrice"
                      type="number"
                      step="0.01"
                      value={editData.purchasePrice}
                      onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                      className="golden-border"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-isGraded"
                      checked={editData.isGraded}
                      onCheckedChange={(checked) => handleInputChange('isGraded', checked)}
                    />
                    <Label htmlFor="edit-isGraded">Carte gradée</Label>
                  </div>

                  {editData.isGraded && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div className="space-y-2">
                        <Label htmlFor="edit-gradeCompany">Société de gradation</Label>
                        <Select value={editData.gradeCompany} onValueChange={(value) => handleInputChange('gradeCompany', value)}>
                          <SelectTrigger className="golden-border">
                            <SelectValue placeholder="Choisir..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PSA">PSA</SelectItem>
                            <SelectItem value="BGS">BGS/Beckett</SelectItem>
                            <SelectItem value="CGC">CGC</SelectItem>
                            <SelectItem value="SGC">SGC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-grade">Note</Label>
                        <Input
                          id="edit-grade"
                          placeholder="ex: 10, 9.5..."
                          value={editData.grade}
                          onChange={(e) => handleInputChange('grade', e.target.value)}
                          className="golden-border"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteAllCopies}
                    className="px-4"
                    title="Supprimer tous les exemplaires"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            ) : (
              /* Informations complémentaires et actions */
              <div className="space-y-4">
                {/* Informations de l'exemplaire courant */}
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">Prix d'achat:</span>
                    <span className="ml-2">{card.purchasePrice ? `${card.purchasePrice}€` : 'Non renseigné'}</span>
                  </div>

                  {card.isGraded && (
                    <div className="p-3 bg-primary/10 border border-primary/30 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">Carte Gradée</Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div><span className="font-medium">Société:</span> {card.gradeCompany}</div>
                        <div><span className="font-medium">Note:</span> {card.grade}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-black hover:bg-gray-900 text-white"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAllCopies}
                    className="px-4"
                    title="Supprimer tous les exemplaires"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}