import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, Square, RotateCw, Flashlight, FlashlightOff } from 'lucide-react'
import { CardScanner } from '@/services/CardScannerService'

export function CameraScanner({ onScanStart, onScanComplete, isScanning }) {
  const [isStreamActive, setIsStreamActive] = useState(false)
  const [hasFlash, setHasFlash] = useState(false)
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [facingMode, setFacingMode] = useState('environment') // 'user' pour caméra frontale
  const [error, setError] = useState('')
  const [capturedImage, setCapturedImage] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  // Initialiser la caméra
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setError('')

      // Vérifier si l'API est supportée
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Votre navigateur ne supporte pas l\'accès à la caméra. Utilisez l\'option "Importer" pour uploader une photo.')
        return
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Attendre que la vidéo soit chargée
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
            resolve()
          }
        })

        setIsStreamActive(true)

        // Vérifier si la caméra a un flash
        const track = stream.getVideoTracks()[0]
        const capabilities = track.getCapabilities()
        setHasFlash(capabilities.torch === true)
      }
    } catch (err) {
      console.error('Erreur caméra:', err)

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permission refusée. Autorisez l\'accès à la caméra dans les paramètres de votre navigateur.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Aucune caméra détectée sur cet appareil.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('La caméra est déjà utilisée par une autre application.')
      } else {
        setError('Impossible d\'accéder à la caméra. Essayez l\'option "Importer" pour uploader une photo.')
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsStreamActive(false)
    setIsFlashOn(false)
  }

  const toggleFlash = async () => {
    if (!streamRef.current || !hasFlash) return

    try {
      const track = streamRef.current.getVideoTracks()[0]
      await track.applyConstraints({
        advanced: [{ torch: !isFlashOn }]
      })
      setIsFlashOn(!isFlashOn)
    } catch (err) {
      console.error('Erreur flash:', err)
    }
  }

  const switchCamera = () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newFacingMode)

    if (isStreamActive) {
      stopCamera()
      // Redémarrer avec la nouvelle caméra
      setTimeout(() => {
        startCamera()
      }, 100)
    }
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    // Définir la taille du canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Dessiner l'image de la vidéo sur le canvas
    context.drawImage(video, 0, 0)

    // Convertir en blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob)
        setCapturedImage(imageUrl)

        onScanStart()

        try {
          // Scanner l'image
          const results = await CardScanner.scanImage(blob)
          onScanComplete(results)
        } catch (error) {
          console.error('Erreur lors du scan:', error)
          onScanComplete([])
        }
      }
    }, 'image/jpeg', 0.8)
  }

  const resetCapture = () => {
    setCapturedImage(null)
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
  }

  const handleFileCapture = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const imageUrl = URL.createObjectURL(file)
    setCapturedImage(imageUrl)

    onScanStart()

    try {
      const results = await CardScanner.scanImage(file)
      onScanComplete(results)
    } catch (error) {
      console.error('Erreur lors du scan:', error)
      onScanComplete([])
    }
  }

  return (
    <div className="space-y-4">
      {/* Camera Controls */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {!isStreamActive ? (
          <>
            <Button
              onClick={startCamera}
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Activer la caméra
            </Button>

            {/* Bouton alternatif pour mobile */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="lg:hidden bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Prendre une photo
            </Button>
          </>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={switchCamera}
              className="border-primary/20"
            >
              <RotateCw className="w-4 h-4" />
            </Button>

            {hasFlash && (
              <Button
                variant="outline"
                onClick={toggleFlash}
                className={`border-primary/20 ${isFlashOn ? 'bg-yellow-500/20' : ''}`}
              >
                {isFlashOn ? (
                  <Flashlight className="w-4 h-4" />
                ) : (
                  <FlashlightOff className="w-4 h-4" />
                )}
              </Button>
            )}

            <Button
              onClick={capturePhoto}
              disabled={isScanning}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Square className="w-5 h-5 mr-2" />
              {isScanning ? 'Scan en cours...' : 'Scanner'}
            </Button>

            <Button
              variant="outline"
              onClick={stopCamera}
              className="border-red-500/20 text-red-500"
            >
              Arrêter
            </Button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="text-sm text-red-500">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Camera View */}
      <Card className="golden-border">
        <CardContent className="p-4">
          <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
            {capturedImage ? (
              /* Image capturée */
              <div className="relative w-full h-full">
                <img
                  src={capturedImage}
                  alt="Image capturée"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 right-4">
                  <Button
                    onClick={resetCapture}
                    variant="secondary"
                    size="sm"
                  >
                    Nouvelle photo
                  </Button>
                </div>
              </div>
            ) : (
              /* Flux vidéo */
              <div className="relative w-full h-full">
                {isStreamActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay de guidage */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-primary border-dashed rounded-lg w-3/4 h-3/4 flex items-center justify-center">
                        <div className="text-white bg-black/50 px-3 py-1 rounded text-sm">
                          Centrez la carte dans ce cadre
                        </div>
                      </div>
                    </div>

                    {/* Indicateurs */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                        {facingMode === 'environment' ? 'Arrière' : 'Avant'}
                      </div>
                      {isFlashOn && (
                        <div className="bg-yellow-500/80 text-black px-2 py-1 rounded text-xs">
                          Flash
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* État inactif */
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Camera className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium mb-2">Caméra inactive</p>
                    <p className="text-sm text-center max-w-md">
                      Activez la caméra pour commencer à scanner vos cartes Pokémon
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Canvas caché pour la capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Input caché pour la capture directe (mobile) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileCapture}
        style={{ display: 'none' }}
      />

      {/* Instructions spécifiques à la caméra */}
      <Card className="border-muted">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 golden-glow">Conseils pour un scan optimal :</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div>• Maintenez la carte bien droite</div>
            <div>• Évitez les reflets et ombres</div>
            <div>• Assurez-vous que la carte remplisse le cadre</div>
            <div>• Utilisez un bon éclairage</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}