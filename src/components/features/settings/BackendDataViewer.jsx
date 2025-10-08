import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Cloud, Info } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://192.168.50.137:3000/api'

export function BackendDataViewer() {
  const [backendData, setBackendData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchBackendData = async () => {
    setLoading(true)
    setError(null)
    const result = {
      discoveredCards: 0,
      series: 0,
      customBlocks: 0,
      customExtensions: 0,
      collection: 0,
      favorites: 0,
      wishlist: 0
    }

    try {
      const token = localStorage.getItem('vaultestim_token')
      if (!token) {
        setError('Non authentifié')
        return
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      // Récupérer les cartes découvertes
      try {
        const response = await fetch(`${API_URL}/collection/discovered`, { headers })
        if (response.ok) {
          const data = await response.json()
          result.discoveredCards = data.cards?.length || 0
        }
      } catch (err) {
        console.error('Erreur cartes découvertes:', err)
      }

      // Récupérer les séries
      try {
        const response = await fetch(`${API_URL}/collection/series`, { headers })
        if (response.ok) {
          const data = await response.json()
          result.series = data.series?.length || 0
        }
      } catch (err) {
        console.error('Erreur séries:', err)
      }

      // Récupérer les blocs personnalisés
      try {
        const response = await fetch(`${API_URL}/collection/blocks`, { headers })
        if (response.ok) {
          const data = await response.json()
          result.customBlocks = data.blocks?.length || 0
        }
      } catch (err) {
        console.error('Erreur blocs:', err)
      }

      // Récupérer les extensions personnalisées
      try {
        const response = await fetch(`${API_URL}/collection/custom-extensions`, { headers })
        if (response.ok) {
          const data = await response.json()
          result.customExtensions = data.extensions?.length || 0
        }
      } catch (err) {
        console.error('Erreur extensions:', err)
      }

      setBackendData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalItems = backendData
    ? Object.values(backendData).reduce((sum, val) => sum + val, 0)
    : 0

  return (
    <Card className="golden-border">
      <CardHeader>
        <CardTitle className="flex items-center golden-glow">
          <Cloud className="w-5 h-5 mr-2" />
          Données sur le serveur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Cet outil affiche les données actuellement stockées sur le serveur backend pour votre compte.
          </AlertDescription>
        </Alert>

        <Button onClick={fetchBackendData} disabled={loading}>
          {loading ? 'Chargement...' : 'Afficher mes données serveur'}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>Erreur : {error}</AlertDescription>
          </Alert>
        )}

        {backendData && (
          <div className="space-y-3 text-sm">
            <div className="bg-muted/50 rounded-lg p-3">
              <h4 className="font-semibold mb-3">
                Résumé ({totalItems} éléments au total)
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cartes découvertes :</span>
                  <span className="font-medium">{backendData.discoveredCards}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base de séries :</span>
                  <span className="font-medium">{backendData.series}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blocs personnalisés :</span>
                  <span className="font-medium">{backendData.customBlocks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Extensions personnalisées :</span>
                  <span className="font-medium">{backendData.customExtensions}</span>
                </div>
              </div>
            </div>

            {totalItems === 0 && (
              <Alert>
                <AlertDescription>
                  Aucune donnée trouvée sur le serveur. Cela signifie soit que vous n'avez pas encore exploré de cartes, soit que la migration n'a pas encore eu lieu.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
