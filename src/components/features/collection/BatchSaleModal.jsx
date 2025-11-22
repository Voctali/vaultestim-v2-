import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Euro, Package, TrendingUp, AlertCircle } from 'lucide-react'
import { DEFAULT_CARD_PURCHASE_PRICE } from '@/constants/cardPricing'

export function BatchSaleModal({ isOpen, onClose, onSubmit, batch }) {
  const [salePrice, setSalePrice] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [buyer, setBuyer] = useState('')
  const [notes, setNotes] = useState('')

  if (!batch) return null

  // Calculer le prix d'achat total du lot
  const totalPurchasePrice = (batch.cards || []).reduce((sum, card) => {
    return sum + parseFloat(card.purchasePrice || DEFAULT_CARD_PURCHASE_PRICE)
  }, 0)

  const calculatedProfit = salePrice ? (parseFloat(salePrice) - totalPurchasePrice).toFixed(2) : '0.00'
  const profitPercentage = totalPurchasePrice > 0 && salePrice
    ? ((parseFloat(calculatedProfit) / totalPurchasePrice) * 100).toFixed(1)
    : '0.0'

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!salePrice || parseFloat(salePrice) <= 0) {
      alert('Veuillez entrer un prix de vente valide')
      return
    }

    const saleData = {
      type: 'batch',
      batchId: batch.id,
      batchName: batch.name,
      batchDescription: batch.description || '',
      cards: batch.cards || [],
      quantity: (batch.cards || []).length,
      salePrice: parseFloat(salePrice).toFixed(2),
      purchasePrice: totalPurchasePrice.toFixed(2),
      profit: calculatedProfit,
      profitPercentage: profitPercentage,
      saleDate: new Date(saleDate).toISOString(),
      buyer: buyer.trim() || 'Non spécifié',
      notes: notes.trim() || ''
    }

    onSubmit(saleData)

    // Réinitialiser le formulaire
    setSalePrice('')
    setSaleDate(new Date().toISOString().split('T')[0])
    setBuyer('')
    setNotes('')
  }

  const handleClose = () => {
    setSalePrice('')
    setSaleDate(new Date().toISOString().split('T')[0])
    setBuyer('')
    setNotes('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center golden-glow">
            <Package className="w-5 h-5 mr-2" />
            Vendre un lot de doublons
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Aperçu du lot */}
          <div className="p-4 border border-border rounded-lg bg-accent/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg golden-glow">{batch.name}</h3>
                {batch.description && (
                  <p className="text-sm text-muted-foreground">{batch.description}</p>
                )}
              </div>
              <Badge variant="secondary" className="text-lg">
                {(batch.cards || []).length} cartes
              </Badge>
            </div>

            {/* Liste des cartes du lot */}
            <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Cartes incluses:</p>
              {(batch.cards || []).map((card, index) => (
                <div key={`batch-card-${index}`} className="flex items-center justify-between p-2 bg-background/50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded overflow-hidden flex-shrink-0">
                      {card.image || card.images?.small ? (
                        <img
                          src={card.image || card.images?.small}
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          ?
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{card.name}</p>
                      <p className="text-xs text-muted-foreground">{card.rarity || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{parseFloat(card.purchasePrice || 0).toFixed(2)}€</p>
                    <p className="text-xs text-muted-foreground">Prix d'achat</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total prix d'achat:</span>
                <span className="text-lg font-bold golden-glow">{totalPurchasePrice.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {/* Formulaire de vente */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salePrice">Prix de vente du lot (€) *</Label>
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
                  <span className="font-medium">Profit estimé du lot:</span>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${parseFloat(calculatedProfit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(calculatedProfit) >= 0 ? '+' : ''}{calculatedProfit}€
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {parseFloat(profitPercentage) >= 0 ? '+' : ''}{profitPercentage}% par rapport à l'achat
                  </p>
                  {salePrice && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Soit ~{(parseFloat(salePrice) / (batch.cards || []).length).toFixed(2)}€/carte
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Avertissement */}
          <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Toutes les cartes de ce lot seront retirées de votre collection après la vente. Cette action est irréversible.
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
              Confirmer la vente du lot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
