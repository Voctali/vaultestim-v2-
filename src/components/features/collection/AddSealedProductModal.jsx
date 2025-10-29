import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, Plus, Minus, Euro } from 'lucide-react'
import { CardMarketSupabaseService } from '@/services/CardMarketSupabaseService'

/**
 * Modale d'ajout d'un produit scellé à la collection
 * Depuis le catalogue CardMarket
 */
export function AddSealedProductModal({ product, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    quantity: 1,
    condition: 'Impeccable',
    notes: '',
    purchase_price: '',
    market_price: product?.price || ''
  })

  // Réinitialiser le formulaire quand le produit change
  useEffect(() => {
    if (product) {
      setFormData({
        quantity: 1,
        condition: 'Impeccable',
        notes: '',
        purchase_price: '',
        market_price: product.price || ''
      })
    }
  }, [product])

  const handleSubmit = (e) => {
    e.preventDefault()

    // Créer l'objet produit à sauvegarder
    const productToSave = {
      name: product.name,
      category: product.category_name,
      quantity: parseInt(formData.quantity) || 1,
      condition: formData.condition,
      notes: formData.notes,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      market_price: formData.market_price ? parseFloat(formData.market_price) : null,
      cardmarket_id_product: product.id_product,
      cardmarket_id_category: product.id_category,
      // Utiliser l'URL d'image du catalogue, ou générer si indisponible
      image_url: product.image_url || CardMarketSupabaseService.getCardMarketImageUrl(product.id_product, product.id_category)
    }

    onSave(productToSave)
  }

  const handleQuantityChange = (delta) => {
    setFormData(prev => ({
      ...prev,
      quantity: Math.max(1, (prev.quantity || 1) + delta)
    }))
  }

  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajouter à ma collection
          </DialogTitle>
          <DialogDescription>
            Ajoutez ce produit scellé à votre collection
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Aperçu du produit */}
          <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
            {product.id_product && (
              <img
                src={product.image_url || CardMarketSupabaseService.getCardMarketImageUrl(product.id_product, product.id_category)}
                alt={product.name}
                className="w-24 h-24 object-contain bg-white rounded"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              {product.category_name && (
                <p className="text-sm text-muted-foreground">{product.category_name}</p>
              )}
              {product.price && (
                <p className="text-yellow-500 font-medium mt-1">
                  Prix du marché : {parseFloat(product.price).toFixed(2)} €
                </p>
              )}
            </div>
          </div>

          {/* Quantité */}
          <div className="space-y-2">
            <Label>Nombre d'exemplaires</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={formData.quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="text-center w-20"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* État */}
          <div className="space-y-2">
            <Label>État du produit</Label>
            <Select
              value={formData.condition}
              onValueChange={(value) => setFormData({ ...formData, condition: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Impeccable">Impeccable</SelectItem>
                <SelectItem value="Défaut léger">Défaut léger</SelectItem>
                <SelectItem value="Abîmé">Abîmé</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              L'état du scellé et de l'emballage
            </p>
          </div>

          {/* Prix d'achat */}
          <div className="space-y-2">
            <Label>Prix d'achat (optionnel)</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Le prix que vous avez payé pour ce produit
            </p>
          </div>

          {/* Prix du marché */}
          <div className="space-y-2">
            <Label>Prix du marché</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.market_price}
                onChange={(e) => setFormData({ ...formData, market_price: e.target.value })}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Prix actuel sur CardMarket (peut être modifié manuellement)
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              placeholder="Ex: Acheté lors du salon de Paris 2024, booster du milieu abîmé..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              <Package className="h-4 w-4 mr-2" />
              Ajouter à ma collection
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
