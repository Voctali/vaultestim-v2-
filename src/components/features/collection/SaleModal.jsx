import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Euro, Calendar, TrendingUp, AlertCircle } from 'lucide-react'

export function SaleModal({ isOpen, onClose, onSubmit, card }) {
  const [salePrice, setSalePrice] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [buyer, setBuyer] = useState('')
  const [notes, setNotes] = useState('')
  const [quantity, setQuantity] = useState(1)

  if (!card) return null

  const maxQuantity = card.quantity || 1
  const purchasePrice = parseFloat(card.purchasePrice || 0) * quantity
  const calculatedProfit = salePrice ? (parseFloat(salePrice) - purchasePrice).toFixed(2) : '0.00'
  const profitPercentage = purchasePrice > 0 && salePrice
    ? ((parseFloat(calculatedProfit) / purchasePrice) * 100).toFixed(1)
    : '0.0'

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!salePrice || parseFloat(salePrice) <= 0) {
      alert('Veuillez entrer un prix de vente valide')
      return
    }

    const saleData = {
      type: 'card',
      cardId: card.id,
      cardName: card.name,
      cardSeries: card.series || card.extension || 'N/A',
      cardRarity: card.rarity || 'N/A',
      cardImage: card.image || card.images?.small || null,
      salePrice: parseFloat(salePrice).toFixed(2),
      purchasePrice: purchasePrice.toFixed(2),
      profit: calculatedProfit,
      profitPercentage: profitPercentage,
      saleDate: new Date(saleDate).toISOString(),
      buyer: buyer.trim() || 'Non spécifié',
      notes: notes.trim() || '',
      quantity: quantity
    }

    onSubmit(saleData)

    // Réinitialiser le formulaire
    setSalePrice('')
    setSaleDate(new Date().toISOString().split('T')[0])
    setBuyer('')
    setNotes('')
    setQuantity(1)
  }

  const handleClose = () => {
    setSalePrice('')
    setSaleDate(new Date().toISOString().split('T')[0])
    setBuyer('')
    setNotes('')
    setQuantity(1)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center golden-glow">
            <Euro className="w-5 h-5 mr-2" />
            Vendre une carte
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Aperçu de la carte */}
          <div className="flex items-start space-x-4 p-4 border border-border rounded-lg bg-accent/30">
            <div className="w-20 h-28 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg overflow-hidden flex-shrink-0">
              {card.image || card.images?.small ? (
                <img
                  src={card.image || card.images?.small}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Carte
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg golden-glow">{card.name}</h3>
              <p className="text-sm text-muted-foreground">{card.series || card.extension || 'N/A'}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{card.rarity || 'N/A'}</Badge>
                <Badge variant="outline">{card.condition || 'N/A'}</Badge>
                {maxQuantity > 1 && (
                  <Badge variant="outline" className="bg-orange-500/20 text-orange-400">
                    x{maxQuantity} disponible{maxQuantity > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="mt-2 text-sm">
                <p className="text-muted-foreground">
                  Prix d'achat unitaire: <span className="font-semibold text-foreground">{parseFloat(card.purchasePrice || 0).toFixed(2)}€</span>
                </p>
                {quantity > 1 && (
                  <p className="text-muted-foreground">
                    Prix d'achat total: <span className="font-semibold text-foreground">{purchasePrice.toFixed(2)}€</span>
                  </p>
                )}
                {card.marketPrice && (
                  <p className="text-muted-foreground">
                    Prix marché unitaire: <span className="font-semibold text-foreground">{parseFloat(card.marketPrice).toFixed(2)}€</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Formulaire de vente */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité à vendre *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  setQuantity(Math.min(Math.max(1, value), maxQuantity))
                }}
                className="golden-border"
              />
              <p className="text-xs text-muted-foreground">Max: {maxQuantity}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice">Prix de vente total (€) *</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                required
                className="golden-border"
              />
              {salePrice && quantity > 1 && (
                <p className="text-xs text-muted-foreground">
                  Soit {(parseFloat(salePrice) / quantity).toFixed(2)}€/carte
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleDate">Date de vente</Label>
              <Input
                id="saleDate"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="golden-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyer">Acheteur (optionnel)</Label>
            <Input
              id="buyer"
              type="text"
              placeholder="Nom de l'acheteur ou plateforme (ex: eBay, Cardmarket...)"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              className="golden-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Input
              id="notes"
              type="text"
              placeholder="Informations complémentaires sur la vente"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="golden-border"
            />
          </div>

          {/* Calcul du profit */}
          {salePrice && (
            <div className={`p-4 rounded-lg ${parseFloat(calculatedProfit) >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className={`w-5 h-5 mr-2 ${parseFloat(calculatedProfit) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="font-medium">Profit estimé:</span>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${parseFloat(calculatedProfit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(calculatedProfit) >= 0 ? '+' : ''}{calculatedProfit}€
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {parseFloat(profitPercentage) >= 0 ? '+' : ''}{profitPercentage}% par rapport à l'achat
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Avertissement */}
          <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {quantity === maxQuantity ? (
                <>Cette carte sera retirée de votre collection après la vente. Cette action est irréversible.</>
              ) : (
                <>{quantity} exemplaire{quantity > 1 ? 's' : ''} ser{quantity > 1 ? 'ont' : 'a'} retiré{quantity > 1 ? 's' : ''} de votre collection. Il restera {maxQuantity - quantity} exemplaire{maxQuantity - quantity > 1 ? 's' : ''}.</>
              )}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white"
              disabled={!salePrice || parseFloat(salePrice) <= 0}
            >
              <Euro className="w-4 h-4 mr-2" />
              Confirmer la vente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
