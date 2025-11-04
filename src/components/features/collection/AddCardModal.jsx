import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, Plus } from 'lucide-react'

export function AddCardModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    rarity: '',
    cardType: 'Pokemon',
    pokemonType: '',
    hp: '',
    artist: '',
    marketPrice: '',
    extension: '',
    imageUrl: '',
    quantity: 1,
    condition: 'Proche du neuf',
    variant: 'Normale',
    purchasePrice: '',
    isGraded: false,
    gradeCompany: '',
    grade: '',
    personalNotes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
    // Reset form
    setFormData({
      name: '',
      number: '',
      rarity: '',
      cardType: 'Pokemon',
      pokemonType: '',
      hp: '',
      artist: '',
      marketPrice: '',
      extension: '',
      imageUrl: '',
      quantity: 1,
      condition: 'Proche du neuf',
      variant: 'Normale',
      purchasePrice: '',
      isGraded: false,
      gradeCompany: '',
      grade: '',
      personalNotes: ''
    })
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto golden-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl golden-glow">
            Ajouter une carte manuellement
          </DialogTitle>
          <DialogDescription>
            Saisissez les détails de votre carte pour l'ajouter à votre collection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold golden-glow">Informations de la carte</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la carte *</Label>
                <Input
                  id="name"
                  placeholder="ex: Jirachi V"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="golden-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Numéro</Label>
                <Input
                  id="number"
                  placeholder="ex: SWSH299"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  className="golden-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rarity">Rareté</Label>
                <Select value={formData.rarity} onValueChange={(value) => handleInputChange('rarity', value)}>
                  <SelectTrigger className="golden-border">
                    <SelectValue placeholder="Rare" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Common">Common</SelectItem>
                    <SelectItem value="Uncommon">Uncommon</SelectItem>
                    <SelectItem value="Rare">Rare</SelectItem>
                    <SelectItem value="Rare Holo">Rare Holo</SelectItem>
                    <SelectItem value="Rare Holo EX">Rare Holo EX</SelectItem>
                    <SelectItem value="Rare Holo GX">Rare Holo GX</SelectItem>
                    <SelectItem value="Rare Holo V">Rare Holo V</SelectItem>
                    <SelectItem value="Rare Holo VMAX">Rare Holo VMAX</SelectItem>
                    <SelectItem value="Ultra Rare">Ultra Rare</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardType">Type de carte</Label>
                <Select value={formData.cardType} onValueChange={(value) => handleInputChange('cardType', value)}>
                  <SelectTrigger className="golden-border">
                    <SelectValue placeholder="Pokemon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pokemon">Pokemon</SelectItem>
                    <SelectItem value="Trainer">Trainer</SelectItem>
                    <SelectItem value="Energy">Energy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pokemonType">Type Pokémon (si applicable)</Label>
                <Input
                  id="pokemonType"
                  placeholder="ex: Psychic"
                  value={formData.pokemonType}
                  onChange={(e) => handleInputChange('pokemonType', e.target.value)}
                  className="golden-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hp">HP</Label>
                <Input
                  id="hp"
                  placeholder="ex: 180"
                  value={formData.hp}
                  onChange={(e) => handleInputChange('hp', e.target.value)}
                  className="golden-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="artist">Artiste</Label>
                <Input
                  id="artist"
                  placeholder="ex: 5ban Graphics"
                  value={formData.artist}
                  onChange={(e) => handleInputChange('artist', e.target.value)}
                  className="golden-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketPrice">Prix de marché (€)</Label>
                <Input
                  id="marketPrice"
                  placeholder="ex: 15.50"
                  type="number"
                  step="0.01"
                  value={formData.marketPrice}
                  onChange={(e) => handleInputChange('marketPrice', e.target.value)}
                  className="golden-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="extension">Extension</Label>
              <Select value={formData.extension} onValueChange={(value) => handleInputChange('extension', value)}>
                <SelectTrigger className="golden-border">
                  <SelectValue placeholder="Choisir une extension (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune extension</SelectItem>
                  <SelectItem value="journey-together">Journey Together</SelectItem>
                  <SelectItem value="cosmic-eclipse">Cosmic Eclipse</SelectItem>
                  <SelectItem value="sword-shield-base">Sword & Shield Base</SelectItem>
                  <SelectItem value="brilliant-stars">Brilliant Stars</SelectItem>
                  <SelectItem value="astral-radiance">Astral Radiance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Card Image Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold golden-glow">Image de la carte</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL de l'image</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  className="golden-border"
                />
              </div>

              <div className="space-y-2">
                <Label>Ou uploader une image</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-2 border-primary/20 h-12"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choisir un fichier
                </Button>
              </div>
            </div>
          </div>

          {/* Collection Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold golden-glow">Ma collection</h3>

            <div className="grid grid-cols-3 gap-4">
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
                    <SelectValue placeholder="Proche du neuf" />
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

              <div className="space-y-2">
                <Label htmlFor="variant">Variant</Label>
                <Select value={formData.variant} onValueChange={(value) => handleInputChange('variant', value)}>
                  <SelectTrigger className="golden-border">
                    <SelectValue placeholder="Normale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normale">Normale</SelectItem>
                    <SelectItem value="Reverse Holo">Reverse Holo</SelectItem>
                    <SelectItem value="Holo">Holo</SelectItem>
                    <SelectItem value="Tampon (logo extension)">Tampon (logo extension)</SelectItem>
                    <SelectItem value="Full Art">Full Art</SelectItem>
                    <SelectItem value="Alternate Art">Alternate Art</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Prix d'achat (€)</Label>
              <Input
                id="purchasePrice"
                placeholder="Prix d'achat"
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                className="golden-border"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isGraded"
                checked={formData.isGraded}
                onCheckedChange={(checked) => handleInputChange('isGraded', checked)}
              />
              <Label htmlFor="isGraded">Carte gradée</Label>
            </div>

            {formData.isGraded && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="gradeCompany">Société de gradation</Label>
                  <Select value={formData.gradeCompany} onValueChange={(value) => handleInputChange('gradeCompany', value)}>
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
                  <Label htmlFor="grade">Note</Label>
                  <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                    <SelectTrigger className="golden-border">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.gradeCompany === 'PCA' && (
                        <SelectItem value="10+">10+ (Pristine Plus)</SelectItem>
                      )}
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Personal Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="personalNotes">Notes personnelles</Label>
            <Textarea
              id="personalNotes"
              placeholder="Ajoutez des notes sur cette carte..."
              value={formData.personalNotes}
              onChange={(e) => handleInputChange('personalNotes', e.target.value)}
              className="golden-border min-h-[80px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Créer la Carte
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}