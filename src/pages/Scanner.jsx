import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Camera, Upload, Scan, X } from 'lucide-react'
import { CameraScanner } from '@/components/features/scanner/CameraScanner'
import { ImageUploader } from '@/components/features/scanner/ImageUploader'
import { ScanResults } from '@/components/features/scanner/ScanResults'

export function Scanner() {
  const [activeTab, setActiveTab] = useState('camera')
  const [scanResults, setScanResults] = useState([])
  const [isScanning, setIsScanning] = useState(false)

  const tabs = [
    {
      id: 'camera',
      label: 'Caméra',
      icon: Camera,
      description: 'Scanner avec l\'appareil photo'
    },
    {
      id: 'upload',
      label: 'Importer',
      icon: Upload,
      description: 'Uploader une image depuis la galerie'
    }
  ]

  const handleScanComplete = (results) => {
    setScanResults(results)
    setIsScanning(false)
  }

  const clearResults = () => {
    setScanResults([])
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold golden-glow mb-2 flex items-center">
            <Scan className="w-8 h-8 mr-3" />
            Scanner de Cartes
          </h1>
          <p className="text-muted-foreground">
            Scannez vos cartes Pokémon pour les identifier automatiquement
          </p>
        </div>
        {scanResults.length > 0 && (
          <Button
            variant="outline"
            onClick={clearResults}
            className="border-primary/20"
          >
            <X className="w-4 h-4 mr-2" />
            Effacer les résultats
          </Button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="grid grid-cols-2 gap-4">
        {tabs.map((tab) => {
          const IconComponent = tab.icon
          return (
            <Card
              key={tab.id}
              className={`cursor-pointer transition-all duration-200 ${
                activeTab === tab.id
                  ? 'golden-border bg-primary/5 ring-2 ring-primary/20'
                  : 'border-muted hover:border-primary/30'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <div className={`p-3 rounded-full ${
                    activeTab === tab.id ? 'bg-primary/20' : 'bg-muted/50'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      activeTab === tab.id ? 'golden-glow' : ''
                    }`}>
                      {tab.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tab.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Scanner Content */}
      <div className="space-y-6">
        {activeTab === 'camera' && (
          <CameraScanner
            onScanStart={() => setIsScanning(true)}
            onScanComplete={handleScanComplete}
            isScanning={isScanning}
          />
        )}

        {activeTab === 'upload' && (
          <ImageUploader
            onScanStart={() => setIsScanning(true)}
            onScanComplete={handleScanComplete}
            isScanning={isScanning}
          />
        )}

        {/* Scan Results */}
        {scanResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold golden-glow">
                Résultats du scan
              </h2>
              <Badge variant="secondary">
                {scanResults.length} carte{scanResults.length > 1 ? 's' : ''} trouvée{scanResults.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <ScanResults results={scanResults} />
          </div>
        )}

        {/* Instructions */}
        <Card className="border-muted">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold golden-glow mb-4">
              Comment fonctionne le scanner ?
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Reconnaissance du nom :</strong> Détecte le nom du Pokémon sur la carte
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Numéro de carte :</strong> Identifie le numéro de collection et série
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Acronymes de série :</strong> Reconnaît les acronymes (ex: "mew" = 151)
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Logos de série :</strong> Détecte les logos Sword & Shield, Sun & Moon, etc.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Illustration :</strong> Analyse l'artwork pour une identification précise
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}