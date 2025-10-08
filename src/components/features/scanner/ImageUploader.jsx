import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Image, Folder, X, Scan } from 'lucide-react'
import { CardScanner } from '@/services/CardScannerService'

export function ImageUploader({ onScanStart, onScanComplete, isScanning }) {
  const [selectedImages, setSelectedImages] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // Gestion du drag & drop
  const handleDragEnter = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  // Gestion de la sélection de fichiers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    handleFiles(files)
  }

  const handleFiles = (files) => {
    const imageFiles = files.filter(file =>
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // Max 10MB
    )

    if (imageFiles.length === 0) {
      alert('Veuillez sélectionner des fichiers image valides (max 10MB par image)')
      return
    }

    // Créer des prévisualisations
    const newImages = imageFiles.map((file, index) => {
      const url = URL.createObjectURL(file)
      return {
        id: Date.now() + index,
        file,
        url,
        name: file.name,
        size: file.size,
        status: 'ready' // ready, scanning, scanned, error
      }
    })

    setSelectedImages(prev => [...prev, ...newImages])
  }

  const removeImage = (imageId) => {
    setSelectedImages(prev => {
      const image = prev.find(img => img.id === imageId)
      if (image) {
        URL.revokeObjectURL(image.url)
      }
      return prev.filter(img => img.id !== imageId)
    })
  }

  const clearAllImages = () => {
    selectedImages.forEach(image => {
      URL.revokeObjectURL(image.url)
    })
    setSelectedImages([])
  }

  const scanImages = async () => {
    if (selectedImages.length === 0) return

    onScanStart()

    const allResults = []

    // Scanner chaque image séquentiellement
    for (const image of selectedImages) {
      try {
        // Mettre à jour le statut
        setSelectedImages(prev =>
          prev.map(img =>
            img.id === image.id ? { ...img, status: 'scanning' } : img
          )
        )

        const results = await CardScanner.scanImage(image.file)
        allResults.push(...results)

        // Marquer comme scanné
        setSelectedImages(prev =>
          prev.map(img =>
            img.id === image.id ? { ...img, status: 'scanned' } : img
          )
        )
      } catch (error) {
        console.error('Erreur lors du scan de', image.name, error)

        // Marquer comme erreur
        setSelectedImages(prev =>
          prev.map(img =>
            img.id === image.id ? { ...img, status: 'error' } : img
          )
        )
      }
    }

    onScanComplete(allResults)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'ready':
        return { color: 'text-muted-foreground', text: 'Prêt' }
      case 'scanning':
        return { color: 'text-yellow-500', text: 'Scan...' }
      case 'scanned':
        return { color: 'text-green-500', text: 'Scanné' }
      case 'error':
        return { color: 'text-red-500', text: 'Erreur' }
      default:
        return { color: 'text-muted-foreground', text: 'Inconnu' }
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-all duration-200 ${
          dragOver
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold golden-glow mb-2">
                Importer des images
              </h3>
              <p className="text-muted-foreground mb-4">
                Glissez-déposez vos images ici ou cliquez pour les sélectionner
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={openFileDialog}
                className="bg-primary hover:bg-primary/80"
              >
                <Folder className="w-4 h-4 mr-2" />
                Parcourir les fichiers
              </Button>
              <Button
                variant="outline"
                onClick={openFileDialog}
                className="border-primary/20"
              >
                <Image className="w-4 h-4 mr-2" />
                Galerie photo
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Formats supportés : JPG, PNG, WEBP • Max 10MB par image
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Selected Images */}
      {selectedImages.length > 0 && (
        <Card className="golden-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold golden-glow">
                Images sélectionnées ({selectedImages.length})
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={scanImages}
                  disabled={isScanning || selectedImages.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Scan className="w-4 h-4 mr-2" />
                  {isScanning ? 'Scan en cours...' : 'Scanner toutes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearAllImages}
                  disabled={isScanning}
                  className="border-red-500/20 text-red-500"
                >
                  <X className="w-4 h-4 mr-2" />
                  Tout effacer
                </Button>
              </div>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedImages.map((image) => {
                const statusInfo = getStatusInfo(image.status)
                return (
                  <div
                    key={image.id}
                    className="relative bg-muted/20 rounded-lg overflow-hidden"
                  >
                    <div className="aspect-[3/4]">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Overlay d'informations */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <div className="text-white text-xs space-y-1">
                          <div className="font-medium truncate" title={image.name}>
                            {image.name}
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{formatFileSize(image.size)}</span>
                            <span className={statusInfo.color}>
                              {statusInfo.text}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bouton de suppression */}
                      <button
                        onClick={() => removeImage(image.id)}
                        disabled={isScanning}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full p-1 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* Indicateur de scan */}
                      {image.status === 'scanning' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions spécifiques à l'upload */}
      <Card className="border-muted">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 golden-glow">Conseils pour de meilleurs résultats :</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div>• Images nettes et bien éclairées</div>
            <div>• Carte entière visible dans l'image</div>
            <div>• Évitez les angles trop prononcés</div>
            <div>• Résolution minimum recommandée : 800x600</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}