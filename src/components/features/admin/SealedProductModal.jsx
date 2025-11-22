import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/features/ImageUpload'
import { Package, Euro, Link, Tag, FileText, RefreshCw, Plus, Minus, Image as ImageIcon } from 'lucide-react'
import { CardMarketSupabaseService, LANGUAGE_LABELS } from '@/services/CardMarketSupabaseService'
import { RapidAPIService } from '@/services/RapidAPIService'

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

const CONDITION_OPTIONS = [
  'Impeccable',
  'Défaut léger',
  'Abîmé'
]

export function SealedProductModal({ isOpen, onClose, onSave, product = null }) {
  // Mémoïser les options de langue pour éviter recalcul à chaque render
  const languageOptions = useMemo(() => Object.entries(LANGUAGE_LABELS), [])

  const [formData, setFormData] = useState({
    name: '',
    marketPrice: '',
    imageUrl: '',
    imageFile: null,
    cardmarketIdProduct: '',
    category: '',
    notes: '',
    quantity: 1,
    condition: 'Impeccable',
    purchasePrice: '',
    language: 'fr' // Par défaut français
  })

  const [useFileUpload, setUseFileUpload] = useState(false)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)

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
        notes: product.notes || '',
        quantity: product.quantity || 1,
        condition: product.condition || 'Impeccable',
        purchasePrice: product.purchase_price || '',
        language: product.language || 'fr'
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
        notes: '',
        quantity: 1,
        condition: 'Impeccable',
        purchasePrice: '',
        language: 'fr'
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

    // Préparer les données avec les bons noms de colonnes (snake_case pour Supabase)
    const productData = {
      name: formData.name.trim(),
      market_price: formData.marketPrice ? parseFloat(formData.marketPrice) : null,
      image_url: useFileUpload ? null : (formData.imageUrl || null),
      image_file: useFileUpload ? formData.imageFile : null,
      cardmarket_id_product: formData.cardmarketIdProduct ? parseInt(formData.cardmarketIdProduct) : null,
      category: formData.category || null,
      notes: formData.notes.trim() || null,
      quantity: parseInt(formData.quantity) || 1,
      condition: formData.condition || 'Impeccable',
      purchase_price: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
      language: formData.language || 'fr'
    }

    onSave(productData)
  }

  const handleQuantityChange = (delta) => {
    setFormData(prev => ({
      ...prev,
      quantity: Math.max(1, (parseInt(prev.quantity) || 1) + delta)
    }))
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

      console.log(`🌐 Récupération du prix via RapidAPI (ID: ${formData.cardmarketIdProduct})`)

      // Utiliser RapidAPI pour récupérer les informations du produit
      const productData = await RapidAPIService.getSealedProductById(
        parseInt(formData.cardmarketIdProduct)
      )

      // Le prix est dans prices.cardmarket.lowest pour les produits scellés
      const price = productData?.prices?.cardmarket?.lowest

      if (price) {
        setFormData(prev => ({
          ...prev,
          marketPrice: parseFloat(price).toFixed(2)
        }))
        console.log(`✅ Prix récupéré via RapidAPI: ${price}€`)
        alert(`Prix récupéré avec succès : ${price}€`)
      } else {
        console.warn('⚠️ Aucun prix trouvé dans la réponse RapidAPI:', productData)
        alert(`Aucun prix trouvé pour cet ID CardMarket`)
      }
    } catch (error) {
      console.error('❌ Erreur récupération prix RapidAPI:', error)
      alert('Erreur lors de la récupération du prix via RapidAPI')
    } finally {
      setLoadingPrice(false)
    }
  }

  const fetchImageFromCardMarket = async () => {
    if (!formData.cardmarketIdProduct) {
      alert('Veuillez saisir un ID CardMarket d\'abord')
      return
    }

    try {
      setLoadingImage(true)
      const imageUrl = await CardMarketSupabaseService.getSealedProductImageUrl(
        parseInt(formData.cardmarketIdProduct)
      )

      if (imageUrl) {
        setFormData(prev => ({
          ...prev,
          imageUrl: imageUrl
        }))
        setUseFileUpload(false) // Passer en mode URL
        console.log(`✅ Image récupérée: ${imageUrl}`)
      } else {
        alert('Aucune image trouvée pour cet ID CardMarket')
      }
    } catch (error) {
      console.error('❌ Erreur récupération image:', error)
      alert('Erreur lors de la récupération de l\'image')
    } finally {
      setLoadingImage(false)
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

          {/* Langue du produit */}
          <div>
            <Label htmlFor="language" className="flex items-center gap-2">
              🌐 Langue du produit
            </Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner une langue" />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map(([code, label]) => (
                  <SelectItem key={code} value={code}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              💡 Les prix CardMarket seront récupérés pour la langue sélectionnée
            </p>
          </div>

          {/* Nombre d'exemplaires */}
          <div>
            <Label className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Nombre d'exemplaires
            </Label>
            <div className="flex items-center gap-2 mt-1">
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

          {/* État du produit */}
          <div>
            <Label htmlFor="condition" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              État du produit
            </Label>
            <Select
              value={formData.condition}
              onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map(cond => (
                  <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              L'état du scellé et de l'emballage
            </p>
          </div>

          {/* Prix d'achat */}
          <div>
            <Label htmlFor="purchasePrice" className="flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Prix d'achat (optionnel)
            </Label>
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              value={formData.purchasePrice}
              onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
              placeholder="Ex: 89.99"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Le prix que vous avez payé pour ce produit
            </p>
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

            <div className="flex gap-2 mb-2 flex-wrap">
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

              {/* Bouton pour récupérer l'image depuis CardMarket */}
              {formData.cardmarketIdProduct && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchImageFromCardMarket}
                  disabled={loadingImage}
                  className="ml-auto"
                >
                  {loadingImage ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Récupérer image CardMarket
                    </>
                  )}
                </Button>
              )}
            </div>

            {formData.cardmarketIdProduct && (
              <p className="text-xs text-muted-foreground mb-2">
                💡 Astuce : Cliquez sur "Récupérer image CardMarket" pour obtenir automatiquement l'image du produit
              </p>
            )}

            {useFileUpload ? (
              <ImageUpload
                onImageSelect={handleImageUpload}
                maxSizeMB={5}
                acceptedFormats={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
              />
            ) : (
              <Input
                id="imageUrl"
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg (optionnel)"
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
