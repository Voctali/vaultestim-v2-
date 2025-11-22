import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CardImage } from '@/components/features/explore/CardImage'
import { CardMarketLink } from '@/components/features/collection/CardMarketLinks'
import { useCollection } from '@/hooks/useCollection.jsx'
import { formatCardPrice, formatCardPriceWithCondition } from '@/utils/priceFormatter'
import { translateCondition } from '@/utils/cardConditions'
import { translateCardName } from '@/utils/cardTranslations'
import { getAvailableVersions } from '@/utils/cardVersions'
import { ArrowLeft, Edit2, Save, X, Heart, List, Trash2, ExternalLink, Plus, Minus, Flag } from 'lucide-react'

export function CardDetailsModal({ isOpen, onClose, card, allCardsOfSameType = [] }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const { removeFromCollection, updateCardInCollection, toggleFavorite, toggleWishlist, favorites, wishlist, collection } = useCollection()

  // Grouper les cartes identiques par version ET état
  const getCardsGroupedByVersionAndCondition = () => {
    if (!card) return []

    // Trouver toutes les cartes identiques (même card_id)
    const cardIdToMatch = card.card_id || card.id
    const identicalCards = collection.filter(c =>
      (c.card_id || c.id) === cardIdToMatch
    )

    // Grouper par version + état
    const grouped = {}
    identicalCards.forEach(c => {
      const version = c.version || 'Normale'
      const condition = c.condition || 'Proche du neuf'
      const key = `${version}|||${condition}` // Utiliser un séparateur unique

      if (!grouped[key]) {
        grouped[key] = {
          version,
          condition,
          cards: [],
          totalQuantity: 0
        }
      }
      grouped[key].cards.push(c)
      grouped[key].totalQuantity += (c.quantity || 1)
    })

    // Convertir en tableau et trier par version puis état
    return Object.values(grouped).sort((a, b) => {
      if (a.version !== b.version) {
        return a.version.localeCompare(b.version)
      }
      return a.condition.localeCompare(b.condition)
    })
  }

  const groupedCards = getCardsGroupedByVersionAndCondition()
  const totalQuantity = groupedCards.reduce((sum, group) => sum + group.totalQuantity, 0)

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

    const cardIdToMatch = card.card_id || card.id
    const identicalCards = collection.filter(c =>
      (c.card_id || c.id) === cardIdToMatch
    )

    const totalCopies = identicalCards.reduce((sum, c) => sum + (c.quantity || 1), 0)

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer TOUS les exemplaires de cette carte (${totalCopies} carte(s)) ?`)) {
      identicalCards.forEach(c => {
        removeFromCollection(c.id)
      })
      onClose()
    }
  }


  // Augmenter la quantité d'un groupe (version + état)
  const handleIncreaseQuantity = (version, condition) => {
    // Trouver la première carte du groupe et augmenter sa quantité
    const group = groupedCards.find(g => g.version === version && g.condition === condition)
    if (group && group.cards.length > 0) {
      const firstCard = group.cards[0]
      updateCardInCollection(firstCard.id, {
        ...firstCard,
        quantity: (firstCard.quantity || 1) + 1
      })
    }
  }

  // Diminuer la quantité d'un groupe (version + état)
  const handleDecreaseQuantity = (version, condition) => {
    const group = groupedCards.find(g => g.version === version && g.condition === condition)
    if (!group || group.cards.length === 0) return

    // Si totalQuantity > 1, on diminue
    if (group.totalQuantity > 1) {
      // Trouver la première carte avec quantity > 1, sinon prendre la première
      const cardToUpdate = group.cards.find(c => (c.quantity || 1) > 1) || group.cards[0]

      if ((cardToUpdate.quantity || 1) > 1) {
        // Diminuer la quantité
        updateCardInCollection(cardToUpdate.id, {
          ...cardToUpdate,
          quantity: (cardToUpdate.quantity || 1) - 1
        })
      } else {
        // Supprimer cette carte (quantité = 1)
        removeFromCollection(cardToUpdate.id)

        // Si c'était la dernière carte de la collection, fermer la modale
        if (totalQuantity === 1) {
          onClose()
        }
      }
    }
  }

  // Supprimer toutes les cartes d'un groupe (version + état)
  const handleDeleteGroup = (version, condition) => {
    const group = groupedCards.find(g => g.version === version && g.condition === condition)
    if (!group) return

    if (window.confirm(`Supprimer ${group.totalQuantity} carte(s) en version "${version}" (${translateCondition(condition)}) ?`)) {
      group.cards.forEach(c => {
        removeFromCollection(c.id)
      })

      // Si toutes les cartes sont supprimées, fermer la modale
      if (group.totalQuantity === totalQuantity) {
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

            {/* Quantités par version et état */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold golden-glow">Vos exemplaires ({totalQuantity})</h3>

              <div className="space-y-2">
                {groupedCards.map((group) => {
                  const isCurrentCard = group.cards.some(c => c.id === card.id)

                  return (
                    <div
                      key={`${group.version}-${group.condition}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isCurrentCard ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 border-muted'
                      }`}
                    >
                      {/* Drapeau et informations */}
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">🇫🇷</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{group.version}</span>
                          <span className="text-xs text-muted-foreground">{translateCondition(group.condition)}</span>
                          {/* Prix selon version et condition */}
                          <span className="text-xs text-green-500 font-semibold mt-0.5">
                            {formatCardPriceWithCondition(card, group.condition, 2, group.version)}
                          </span>
                        </div>
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex items-center gap-2">
                        {/* Bouton diminuer ou supprimer */}
                        {group.totalQuantity === 1 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGroup(group.version, group.condition)}
                            className="h-9 w-9 p-0 hover:bg-red-500/10"
                            title="Supprimer cet exemplaire"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDecreaseQuantity(group.version, group.condition)}
                            className="h-9 w-9 p-0 hover:bg-accent"
                            title="Diminuer la quantité"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Quantité */}
                        <span className="text-lg font-bold min-w-[2rem] text-center">
                          {group.totalQuantity}
                        </span>

                        {/* Bouton augmenter */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleIncreaseQuantity(group.version, group.condition)}
                          className="h-9 w-9 p-0 hover:bg-accent"
                          title="Augmenter la quantité"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
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
              <h1 className="text-2xl font-bold golden-glow">{translateCardName(card.name)}</h1>
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
                {/* CardMarket - Composant optimisé avec copie et fallback */}
                <CardMarketLink card={card} />
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
                        {getAvailableVersions(card).map((version) => (
                          <SelectItem key={version.value} value={version.value}>
                            {version.label}
                          </SelectItem>
                        ))}
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
                            <SelectItem value="PCA">PCA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-grade">Note</Label>
                        <Select value={editData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                          <SelectTrigger className="golden-border">
                            <SelectValue placeholder="Choisir..." />
                          </SelectTrigger>
                          <SelectContent>
                                                        {editData.gradeCompany === 'PCA' && (
                              <>
                                <SelectItem value="10+">10+ - COLLECTOR</SelectItem>
                                <SelectItem value="10">10 - NEUF SUP'</SelectItem>
                                <SelectItem value="9.5">9.5 - NEUF</SelectItem>
                                <SelectItem value="9">9 - PROCHE DU NEUF</SelectItem>
                                <SelectItem value="8">8 - EXCELLENT - PROCHE DU NEUF</SelectItem>
                                <SelectItem value="7">7 - EXCELLENT</SelectItem>
                                <SelectItem value="6">6 - TRÈS BON</SelectItem>
                                <SelectItem value="5">5 - BON</SelectItem>
                                <SelectItem value="4">4 - CORRECT</SelectItem>
                                <SelectItem value="3">3 - MOYEN</SelectItem>
                                <SelectItem value="2">2 - MAUVAIS</SelectItem>
                                <SelectItem value="1">1 - TRÈS MAUVAIS</SelectItem>
                              </>
                            )}
                            {editData.gradeCompany === 'PSA' && (
                              <>
                                <SelectItem value="10">10 - GEM MINT</SelectItem>
                                <SelectItem value="9">9 - MINT</SelectItem>
                                <SelectItem value="8.5">8.5 - NM-MT +</SelectItem>
                                <SelectItem value="8">8 - NM-MT</SelectItem>
                                <SelectItem value="7">7 - NM</SelectItem>
                                <SelectItem value="6">6 - EX-MT</SelectItem>
                                <SelectItem value="5">5 - EX</SelectItem>
                                <SelectItem value="4">4 - VG-EX</SelectItem>
                                <SelectItem value="3">3 - VG</SelectItem>
                                <SelectItem value="2">2 - GOOD</SelectItem>
                                <SelectItem value="1.5">1.5 - FR</SelectItem>
                                <SelectItem value="1">1 - PR</SelectItem>
                                <SelectItem value="N0">N0 - AUTHENTIC</SelectItem>
                                <SelectItem value="AA">AA - ALTERED AUTHENTIC</SelectItem>
                              </>
                            )}
                            {editData.gradeCompany && editData.gradeCompany !== 'PCA' && editData.gradeCompany !== 'PSA' && (
                              <>
                                <SelectItem value="10">10 (Pristine/Gem Mint)</SelectItem>
                                <SelectItem value="9.5">9.5 (Gem Mint)</SelectItem>
                                <SelectItem value="9">9 (Mint)</SelectItem>
                                <SelectItem value="8.5">8.5 (Near Mint+)</SelectItem>
                                <SelectItem value="8">8 (Near Mint)</SelectItem>
                                <SelectItem value="7.5">7.5 (Near Mint-)</SelectItem>
                                <SelectItem value="7">7 (Excellent-Near Mint)</SelectItem>
                                <SelectItem value="6">6 (Excellent)</SelectItem>
                                <SelectItem value="5">5 (Very Good-Excellent)</SelectItem>
                                <SelectItem value="4">4 (Very Good)</SelectItem>
                                <SelectItem value="3">3 (Good)</SelectItem>
                                <SelectItem value="2">2 (Good-Fair)</SelectItem>
                                <SelectItem value="1">1 (Poor)</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
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