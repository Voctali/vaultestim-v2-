/**
 * Composant d'upload d'images avec stockage IndexedDB
 */
import React, { useState, useRef } from 'react'
import { Upload, Image, X, Check, AlertCircle, Trash2, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { ImageUploadService } from '@/services/ImageUploadService'

export function ImageUpload({
  entityType, // 'card', 'extension', 'block'
  entityId,
  entityName = '',
  currentImageUrl = '',
  onImageUploaded,
  onImageSelected,
  className = ''
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewImage, setPreviewImage] = useState(null)
  const [previewDialog, setPreviewDialog] = useState(false)
  const fileInputRef = useRef(null)

  // Charger les images existantes au montage
  React.useEffect(() => {
    loadExistingImages()
  }, [entityType, entityId])

  const loadExistingImages = async () => {
    try {
      const images = await ImageUploadService.getImagesForEntity(entityType, entityId)
      setUploadedImages(images)
      console.log(`📷 ${images.length} images trouvées pour ${entityType} ${entityId}`)
    } catch (error) {
      console.error('❌ Erreur chargement images:', error)
    }
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')
    setUploading(true)

    try {
      // Valider et uploader
      const result = await ImageUploadService.uploadImage(file, entityType, entityId, entityName)

      // Ajouter à la liste
      const newImages = [...uploadedImages, result]
      setUploadedImages(newImages)

      setSuccess(`Image "${file.name}" uploadée avec succès`)

      // Notifier le parent
      if (onImageUploaded) {
        onImageUploaded(result)
      }

      // Auto-sélectionner la nouvelle image si c'est la première
      if (newImages.length === 1 && onImageSelected) {
        onImageSelected(result.url)
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleImageSelect = (imageUrl) => {
    if (onImageSelected) {
      onImageSelected(imageUrl)
    }
    setSuccess('Image sélectionnée')
  }

  const handleImageDelete = async (imageId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return

    try {
      await ImageUploadService.deleteImage(imageId)
      const newImages = uploadedImages.filter(img => img.id !== imageId)
      setUploadedImages(newImages)
      setSuccess('Image supprimée')
    } catch (error) {
      setError('Erreur lors de la suppression')
    }
  }

  const handleImagePreview = (image) => {
    setPreviewImage(image)
    setPreviewDialog(true)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section URL classique */}
      <div>
        <label className="text-sm font-medium">URL de l'image</label>
        <Input
          value={currentImageUrl}
          onChange={(e) => onImageSelected && onImageSelected(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        {currentImageUrl && (
          <div className="mt-2">
            <img
              src={currentImageUrl}
              alt="Aperçu"
              className="w-24 h-32 object-cover rounded border cursor-pointer hover:opacity-80"
              onClick={() => handleImagePreview({ url: currentImageUrl, fileName: 'Image externe' })}
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Séparateur */}
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t"></div>
        <span className="text-sm text-muted-foreground">ou</span>
        <div className="flex-1 border-t"></div>
      </div>

      {/* Section Upload */}
      <div>
        <label className="text-sm font-medium">Uploader une image</label>
        <div className="mt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choisir une image
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG, GIF, WebP • Maximum 5MB
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Images uploadées */}
      {uploadedImages.length > 0 && (
        <div>
          <label className="text-sm font-medium">Images uploadées ({uploadedImages.length})</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {uploadedImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.fileName}
                  className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleImagePreview(image)}
                />

                {/* Overlay avec actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleImageSelect(image.url)}
                    className="h-6 w-6 p-0"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleImagePreview(image)}
                    className="h-6 w-6 p-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleImageDelete(image.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Badge nom fichier */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b truncate">
                  {image.fileName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog de prévisualisation */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewImage?.fileName || 'Aperçu de l\'image'}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={previewImage.url}
                  alt={previewImage.fileName}
                  className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                />
              </div>

              {previewImage.uploadDate && (
                <div className="text-sm text-muted-foreground text-center">
                  Uploadée le {new Date(previewImage.uploadDate).toLocaleDateString('fr-FR')}
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setPreviewDialog(false)}>
                  Fermer
                </Button>
                {onImageSelected && (
                  <Button onClick={() => {
                    handleImageSelect(previewImage.url)
                    setPreviewDialog(false)
                  }}>
                    <Check className="h-4 w-4 mr-2" />
                    Utiliser cette image
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant simple pour afficher juste le sélecteur d'images uploadées
export function ImageSelector({
  entityType,
  entityId,
  onImageSelected,
  selectedImageUrl = '',
  className = ''
}) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    const loadImages = async () => {
      try {
        const uploadedImages = await ImageUploadService.getImagesForEntity(entityType, entityId)
        setImages(uploadedImages)
      } catch (error) {
        console.error('❌ Erreur chargement images:', error)
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [entityType, entityId])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement des images...</div>
  }

  if (images.length === 0) {
    return <div className="text-sm text-muted-foreground">Aucune image uploadée</div>
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium">Images disponibles ({images.length})</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((image) => (
          <div
            key={image.id}
            className={`relative cursor-pointer rounded border-2 transition-all ${
              selectedImageUrl === image.url
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onImageSelected(image.url)}
          >
            <img
              src={image.url}
              alt={image.fileName}
              className="w-full h-16 object-cover rounded"
            />
            {selectedImageUrl === image.url && (
              <div className="absolute inset-0 bg-primary/10 rounded flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}