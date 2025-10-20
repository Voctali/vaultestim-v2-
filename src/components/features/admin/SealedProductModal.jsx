import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/features/ImageUpload'
import { Package, Euro, Link, Tag, FileText, RefreshCw } from 'lucide-react'
import { CardMarketSupabaseService } from '@/services/CardMarketSupabaseService'

const PRODUCT_CATEGORIES = [
  'Booster Pack',
  'Booster Box',
  'Elite Trainer Box (ETB)',
  'Theme Deck',
  'Starter Deck',
  'Collection Box',
  'Premium Collection',
  'Special Collection',
  'Battle Deck',
  'Other'
]

export function SealedProductModal({ isOpen, onClose, onSave, product = null }) {
  const [formData, setFormData] = useState({
    name: '',
    marketPrice: '',
    imageUrl: '',
    imageFile: null,
    cardmarketIdProduct: '',
    category: '',
    notes: ''
  })

  const [useFileUpload, setUseFileUpload] = useState(false)
  const [loadingPrice, setLoadingPrice] = useState(false)

  // Charger les données si on édite un produit existant
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        marketPrice: product.market_price || '',
        imageUrl: product.image_url || '',
        imageFile: product.image_file || null,
        cardmarketIdProduct: product.cardmarket_id_product || '',
        category: product.category || '',
        notes: product.notes || ''
      })
      setUseFileUpload(!!product.image_file)
    } else {
      // Reset form
      setFormData({
        name: '',
        marketPrice: '',
        imageUrl: '',
        imageFile: null,
        cardmarketIdProduct: '',
        category: '',
        notes: ''
      })
      setUseFileUpload(false)
    }
  }, [product, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      alert('Le nom du produit est requis')
      return
    }

    // Préparer les données
    const productData = {
      name: formData.name.trim(),
      marketPrice: formData.marketPrice ? parseFloat(formData.marketPrice) : null,
      imageUrl: useFileUpload ? null : (formData.imageUrl || null),
      imageFile: useFileUpload ? formData.imageFile : null,
      cardmarketIdProduct: formData.cardmarketIdProduct ? parseInt(formData.cardmarketIdProduct) : null,
      category: formData.category || null,
      notes: formData.notes.trim() || null
    }

    onSave(productData)
  }

  const handleImageUpload = (file, dataUrl) => {
    setFormData(prev => ({ ...prev, imageFile: dataUrl }))
  }

  const fetchPriceFromCardMarket = async () => {
    if (!formData.cardmarketIdProduct) {
      alert('Veuillez saisir un ID CardMarket d\'abord')
      return
    }

    try {
      setLoadingPrice(true)
      const priceData = await CardMarketSupabaseService.getPriceForProduct(
        parseInt(formData.cardmarketIdProduct)
      )

      if (priceData?.avg) {
        setFormData(prev => ({
          ...prev,
          marketPrice: parseFloat(priceData.avg).toFixed(2)
        }))
        console.log(`✅ Prix récupéré: ${priceData.avg}€`)
      } else {
        alert('Aucun prix trouvé pour cet ID CardMarket')
      }
    } catch (error) {
      console.error('❌ Erreur récupération prix:', error)
      alert('Erreur lors de la récupération du prix')
    } finally {
      setLoadingPrice(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {product ? 'Modifier le produit scellé' : 'Ajouter un produit scellé'}
          </DialogTitle>
          <DialogDescription>
            Ajoutez un produit scellé à votre base de données (booster, deck, ETB, etc.)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du produit */}
          <div>
            <Label htmlFor="name" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Nom du produit *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Scarlet & Violet Booster Box"
              required
              className="mt-1"
            />
          </div>

          {/* Catégorie */}
          <div>
            <Label htmlFor="category" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Catégorie
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prix du marché */}
          <div>
            <Label htmlFor="marketPrice" className="flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Prix du marché (EUR)
            </Label>
            <Input
              id="marketPrice"
              type="number"
              step="0.01"
              value={formData.marketPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, marketPrice: e.target.value }))}
              placeholder="Ex: 99.99"
              className="mt-1"
            />
          </div>

          {/* Image - Choix entre URL et Upload */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              Image
            </Label>

            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={!useFileUpload ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUseFileUpload(false)}
              >
                URL
              </Button>
              <Button
                type="button"
                variant={useFileUpload ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUseFileUpload(true)}
              >
                Upload
              </Button>
            </div>

            {useFileUpload ? (
              <ImageUpload
                onImageSelect={handleImageUpload}
                maxSizeMB={5}
                acceptedFormats={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
              />
            ) : (
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            )}

            {/* Prévisualisation */}
            {((useFileUpload && formData.imageFile) || (!useFileUpload && formData.imageUrl)) && (
              <div className="mt-2">
                <img
                  src={useFileUpload ? formData.imageFile : formData.imageUrl}
                  alt="Prévisualisation"
                  className="w-32 h-32 object-contain border rounded"
                />
              </div>
            )}
          </div>

          {/* ID CardMarket */}
          <div>
            <Label htmlFor="cardmarketId" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              ID CardMarket (optionnel)
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="cardmarketId"
                type="number"
                value={formData.cardmarketIdProduct}
                onChange={(e) => setFormData(prev => ({ ...prev, cardmarketIdProduct: e.target.value }))}
                placeholder="Ex: 123456"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={fetchPriceFromCardMarket}
                disabled={!formData.cardmarketIdProduct || loadingPrice}
                className="whitespace-nowrap"
              >
                {loadingPrice ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Récupérer prix
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saisissez l'ID CardMarket puis cliquez sur "Récupérer prix" pour obtenir le prix actuel
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes personnelles..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {product ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
