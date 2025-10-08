import { Card, CardContent } from '@/components/ui/card'
import { Package } from 'lucide-react'

export function SealedProducts() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold golden-glow mb-2">
          Produits Scellés
        </h1>
        <p className="text-muted-foreground text-lg">
          Boosters, decks et autres produits scellés
        </p>
      </div>

      <Card className="golden-border card-hover text-center py-12">
        <CardContent>
          <Package className="h-16 w-16 mx-auto mb-4 text-green-400" />
          <h3 className="text-xl font-semibold golden-glow mb-2">
            Aucun produit scellé
          </h3>
          <p className="text-muted-foreground">
            Ajoutez vos boosters et decks à votre collection
          </p>
        </CardContent>
      </Card>
    </div>
  )
}