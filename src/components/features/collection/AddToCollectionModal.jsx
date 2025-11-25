import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CardImage } from '@/components/features/explore/CardImage'
import { CardMarketLink } from '@/components/features/collection/CardMarketLinks'
import { AVAILABLE_CONDITIONS, translateCondition } from '@/utils/cardConditions'
import { formatCardPriceWithCondition, formatCardPrice } from '@/utils/priceFormatter'
import { translateCardName } from '@/utils/cardTranslations'
import { getAvailableVersions, getDefaultVersion } from '@/utils/cardVersions'
import { ArrowLeft, Plus, Minus, Trash2, ExternalLink, Package } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection.jsx'
import { useToast } from '@/hooks/useToast'

export function AddToCollectionModal({ isOpen, onClose, onSubmit, card }) {
  const { collection, updateCardInCollection, removeFromCollection } = useCollection()
  const { toast } = useToast()

  // Obtenir les versions disponibles pour cette carte
  const availableVersions = getAvailableVersions(card)
  const defaultVersion = getDefaultVersion(card)

  const [formData, setFormData] = useState({
    quantity: 1,
    condition: 'near_mint', // État par défaut (Quasi-neuf)
    version: defaultVersion,
    language: 'Français', // Langue par défaut
    purchasePrice: '',
    isGraded: false
  })

  // Obtenir tous les exemplaires de cette carte déjà en collection
  const getExistingCopies = () => {
    if (!card) return []

    // Filtrer les cartes de la collection qui correspondent à l'ID de la carte
    const copies = collection.filter(c => c.card_id === card.id)

    // Regrouper par état et version
    const grouped = {}
    copies.forEach(copy => {
      const key = `${copy.condition}_${copy.version}`
      if (!grouped[key]) {
        grouped[key] = {
          condition: copy.condition,
          version: copy.version,
          quantity: 0
        }
      }
      grouped[key].quantity += (copy.quantity || 1)
    })

    return Object.values(grouped)
  }

  const existingCopies = getExistingCopies()
  const totalCopies = existingCopies.reduce((sum, copy) => sum + copy.quantity, 0)

  // Debug: Afficher les informations de la carte dans la console
  if (card && isOpen) {
    console.log('📋 Carte sélectionnée pour ajout à la collection:', {
      name: card.name,
      setName: card.set?.name,
      setSeries: card.set?.series,
      series: card.series,
      number: card.number,
      cardMarketPrice: card.cardMarketPrice,
      cardMarketURL: card.cardmarket?.url,
      tcgPlayerPrice: card.tcgPlayerPrice,
      tcgPlayerURL: card.tcgPlayerPrice?.url
    })
  }

  // Handlers pour modification rapide de quantité
  const handleIncreaseQuantity = (version, condition) => {
    if (!card) return

    // Trouver toutes les cartes correspondantes dans la collection
    const matchingCards = collection.filter(c =>
      c.card_id === card.id &&
      c.version === version &&
      c.condition === condition
    )

    if (matchingCards.length > 0) {
      // Augmenter la quantité de la première carte trouvée
      updateCardInCollection(matchingCards[0].id, { ...matchingCards[0], quantity: (matchingCards[0].quantity || 1) + 1 })
      toast({
        title: 'Quantité augmentée',
        description: `${translateCardName(card.name)} (${version}, ${translateCondition(condition)})`,
        variant: 'success'
      })
    }
  }

  const handleDecreaseQuantity = (version, condition) => {
    if (!card) return

    const matchingCards = collection.filter(c =>
      c.card_id === card.id &&
      c.version === version &&
      c.condition === condition
    )

    if (matchingCards.length > 0) {
      // Cas 1: Une seule entrée avec quantity > 1 → diminuer la quantité
      if (matchingCards[0].quantity > 1) {
        const newQuantity = matchingCards[0].quantity - 1
        updateCardInCollection(matchingCards[0].id, { ...matchingCards[0], quantity: newQuantity })
        toast({
          title: 'Quantité diminuée',
          description: `${translateCardName(card.name)} (${version}, ${translateCondition(condition)})`,
          variant: 'success'
        })
      }
      // Cas 2: Plusieurs entrées séparées (chacune avec quantity=1) → supprimer la première
      else if (matchingCards.length > 1) {
        removeFromCollection(matchingCards[0].id)
        toast({
          title: 'Exemplaire supprimé',
          description: `${translateCardName(card.name)} (${version}, ${translateCondition(condition)})`,
          variant: 'success'
        })
      }
      // Cas 3: Une seule entrée avec quantity=1 → ne rien faire (utiliser le bouton poubelle)
      // Ce cas est géré par le bouton Trash2 dans l'UI
    }
  }

  const handleDeleteGroup = (version, condition) => {
    if (!card) return

    const matchingCards = collection.filter(c =>
      c.card_id === card.id &&
      c.version === version &&
      c.condition === condition
    )

    if (matchingCards.length > 0) {
      // Supprimer tous les exemplaires de ce groupe
      matchingCards.forEach(c => removeFromCollection(c.id))
      toast({
        title: 'Exemplaire supprimé',
        description: `${translateCardName(card.name)} (${version}, ${translateCondition(condition)})`,
        variant: 'success'
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Passer uniquement les données du formulaire
    onSubmit(formData)
    // Reset form
    setFormData({
      quantity: 1,
      condition: 'near_mint',
      version: 'Normale',
      language: 'Français',
      purchasePrice: '',
      isGraded: false
    })
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!card) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto golden-border bg-background">
        <DialogHeader>
          <DialogTitle className="golden-glow">
            Ajouter à ma collection
          </DialogTitle>
          <DialogDescription>
            Personnalisez les détails de cette carte avant de l'ajouter à votre collection.
          </DialogDescription>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Retour à la collection
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card Display */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] max-w-sm mx-auto">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                <CardImage
                  card={card}
                  className="w-full h-full object-cover"
                />
                {/* Badge "Non possédée" si la carte n'est pas en collection */}
                {totalCopies === 0 && (
                  <div className="absolute top-2 left-2 bg-red-500/90 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                    Non possédée
                  </div>
                )}
              </div>
              {/* Close button on card */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white hover:bg-black/70"
                onClick={onClose}
              >
                ×
              </Button>
            </div>
          </div>

          {/* Card Information and Form */}
          <div className="space-y-6">
            {/* Card Info */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold golden-glow">{translateCardName(card.name || "Team Rocket's Mewtwo ex")}</h1>
              <p className="text-muted-foreground">
                {card.set?.name || card.series || "Extension inconnue"} {card.number ? `• #${card.number}` : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                {card.set?.series ? `Bloc: ${card.set.series}` : (card.block || '')}
              </p>

              {/* Card Details */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{card.rarity || "Hyper Rare"}</Badge>
                <Badge variant="outline">{card.type || "Pokémon"}</Badge>
                <Badge variant="outline">{card.pokemonType || "Type Psychic"}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">HP:</span> {card.hp || "280"}
                </div>
                <div>
                  <span className="font-medium">Artiste:</span> {card.artist || "aky CG Works"}
                </div>
              </div>

              <div className="text-sm">
                <span className="font-medium">Prix marché (Near Mint):</span>
                <span className="ml-2 font-bold text-green-500">{formatCardPriceWithCondition(card, 'near_mint')}</span>
              </div>

              {card.rarity && (
                <div className="text-sm">
                  <span className="font-medium">Rareté:</span>
                  <span className="ml-2 text-yellow-500">{card.rarity}</span>
                </div>
              )}

              {/* Liens vers les marketplaces */}
              <div className="flex flex-wrap gap-3 text-sm">
                {/* CardMarket - Composant optimisé avec copie et fallback */}
                <CardMarketLink card={card} />
              </div>
            </div>

            {/* Vos exemplaires (avec modification rapide de quantité) */}
            {existingCopies.length > 0 && (
              <div className="space-y-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="text-lg font-semibold golden-glow">Vos exemplaires ({totalCopies})</h3>

                <div className="space-y-2">
                  {existingCopies.map((copy, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-primary/10 border-primary/30"
                    >
                      {/* Drapeau et informations */}
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">🇫🇷</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{copy.version}</span>
                          <span className="text-xs text-muted-foreground">{translateCondition(copy.condition)}</span>
                          {/* Prix selon version et condition */}
                          <span className="text-xs text-green-500 font-semibold mt-0.5">
                            {formatCardPriceWithCondition(card, copy.condition, 2, copy.version)}
                          </span>
                        </div>
                      </div>

                      {/* Boutons d'action (modification rapide) */}
                      <div className="flex items-center gap-2">
                        {/* Bouton diminuer ou supprimer */}
                        {copy.quantity === 1 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGroup(copy.version, copy.condition)}
                            className="h-9 w-9 p-0 hover:bg-red-500/10"
                            title="Supprimer cet exemplaire"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDecreaseQuantity(copy.version, copy.condition)}
                            className="h-9 w-9 p-0 hover:bg-accent"
                            title="Diminuer la quantité"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Quantité */}
                        <span className="text-lg font-bold min-w-[2rem] text-center">
                          {copy.quantity}
                        </span>

                        {/* Bouton augmenter */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleIncreaseQuantity(copy.version, copy.condition)}
                          className="h-9 w-9 p-0 hover:bg-accent"
                          title="Augmenter la quantité"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Collection Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold golden-glow">Ajouter à ma collection</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                    className="golden-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">État</Label>
                  <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                    <SelectTrigger className="golden-border">
                      <SelectValue placeholder="Quasi-neuf (NM)" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_CONDITIONS.map((condition) => (
                        <SelectItem key={condition.value} value={condition.value}>
                          {condition.label} ({(condition.multiplier * 100).toFixed(0)}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {card?.marketPrice && (
                    <p className="text-xs text-muted-foreground">
                      Prix selon état: <span className="font-semibold text-green-500">
                        {formatCardPriceWithCondition(card, formData.condition)}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Select value={formData.version} onValueChange={(value) => handleInputChange('version', value)}>
                    <SelectTrigger className="golden-border">
                      <SelectValue placeholder="Normale" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVersions.map(version => (
                        <SelectItem key={version.value} value={version.value}>
                          {version.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                    <SelectTrigger className="golden-border">
                      <SelectValue placeholder="Français" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Français">🇫🇷 Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Prix d'achat (€)</Label>
                <Input
                  id="purchasePrice"
                  placeholder="70.86"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                  className="golden-border"
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour prix par défaut (0.60€)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isGraded"
                  checked={formData.isGraded}
                  onCheckedChange={(checked) => handleInputChange('isGraded', checked)}
                />
                <Label htmlFor="isGraded">Carte gradée</Label>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-900 text-white"
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}