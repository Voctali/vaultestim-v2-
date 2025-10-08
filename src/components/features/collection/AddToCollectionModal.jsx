import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CardImage } from '@/components/features/explore/CardImage'
import { AVAILABLE_CONDITIONS } from '@/utils/cardConditions'
import { formatCardPriceWithCondition } from '@/utils/priceFormatter'
import { ArrowLeft, Plus, ExternalLink } from 'lucide-react'

export function AddToCollectionModal({ isOpen, onClose, onSubmit, card }) {
  const [formData, setFormData] = useState({
    quantity: 1,
    condition: 'near_mint', // État par défaut (Quasi-neuf)
    version: 'Normale',
    purchasePrice: '',
    isGraded: false
  })

  // Debug: Afficher les informations de la carte dans la console
  if (card && isOpen) {
    console.log('📋 Carte sélectionnée pour ajout à la collection:', {
      name: card.name,
      setName: card.set?.name,
      setSeries: card.set?.series,
      series: card.series,
      number: card.number,
      cardMarketPrice: card.cardMarketPrice,
      cardMarketURL: card.cardMarketPrice?.url,
      tcgPlayerPrice: card.tcgPlayerPrice,
      tcgPlayerURL: card.tcgPlayerPrice?.url
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...card, ...formData })
    onClose()
    // Reset form
    setFormData({
      quantity: 1,
      condition: 'near_mint',
      version: 'Normale',
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
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                <CardImage
                  card={card}
                  className="w-full h-full object-cover"
                />
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
              <h1 className="text-2xl font-bold golden-glow">{card.name || "Team Rocket's Mewtwo ex"}</h1>
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
                {/* CardMarket - Utiliser URL directe ou générer lien de recherche */}
                {(card.cardMarketPrice?.url || card.name) && (
                  <a
                    href={
                      card.cardMarketPrice?.url ||
                      `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name + ' ' + (card.set?.name || ''))}`
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
                    href={`https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodeURIComponent(card.name + ' ' + (card.set?.name || ''))}&page=1`}
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
            </div>

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
                      <SelectItem value="Normale">Normale</SelectItem>
                      <SelectItem value="Reverse Holo">Reverse Holo</SelectItem>
                      <SelectItem value="Holo">Holo</SelectItem>
                      <SelectItem value="Full Art">Full Art</SelectItem>
                      <SelectItem value="Alternate Art">Alternate Art</SelectItem>
                    </SelectContent>
                  </Select>
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
                </div>
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