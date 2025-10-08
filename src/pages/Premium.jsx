import { Card, CardContent } from '@/components/ui/card'
import { Crown } from 'lucide-react'

export function Premium() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold golden-glow mb-2">
          Premium
        </h1>
        <p className="text-muted-foreground text-lg">
          Fonctionnalités avancées pour les collectionneurs
        </p>
      </div>

      <Card className="golden-border card-hover text-center py-12">
        <CardContent>
          <Crown className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold golden-glow mb-2">
            Fonctionnalités Premium
          </h3>
          <p className="text-muted-foreground">
            Débloquez des outils avancés pour votre collection
          </p>
        </CardContent>
      </Card>
    </div>
  )
}