import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Lightbulb, CheckCircle } from 'lucide-react'

/**
 * Outil pratique pour contourner la lenteur de CardMarket
 * Explique comment ouvrir CardMarket une fois pour passer le CAPTCHA
 */
export function CardMarketBulkHelper() {
  const [step, setStep] = useState(0)

  const steps = [
    {
      title: "Étape 1 : Ouvrir CardMarket",
      description: "Cliquez sur le bouton ci-dessous pour ouvrir CardMarket.com dans un nouvel onglet",
      action: (
        <Button
          onClick={() => {
            window.open('https://www.cardmarket.com/en/Pokemon', '_blank')
            setStep(1)
          }}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Ouvrir CardMarket.com
        </Button>
      ),
      tip: "Cela permet de passer le CAPTCHA une seule fois"
    },
    {
      title: "Étape 2 : Attendre le chargement",
      description: "Attendez que CardMarket.com soit complètement chargé (environ 5-10 secondes)",
      action: (
        <Button
          onClick={() => setStep(2)}
          variant="outline"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Page chargée
        </Button>
      ),
      tip: "Une fois la page chargée, les liens suivants seront plus rapides"
    },
    {
      title: "Étape 3 : Utiliser les liens dans votre collection",
      description: "Maintenant, cliquez sur les liens CardMarket de vos cartes. Ils devraient charger plus rapidement (5-10s au lieu de 15-20s)",
      action: (
        <Button
          onClick={() => setStep(0)}
          variant="outline"
        >
          Recommencer
        </Button>
      ),
      tip: "Si CardMarket redevient lent, répétez ce processus"
    }
  ]

  const currentStep = steps[step]

  return (
    <Card className="golden-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Accélérateur CardMarket
        </CardTitle>
        <CardDescription>
          Contournez le système anti-bot de CardMarket pour des liens plus rapides
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Explication du problème */}
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg space-y-2 text-sm">
          <div className="font-semibold text-orange-400">Pourquoi CardMarket est-il si lent ?</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>• <strong>Système anti-bot</strong> : CardMarket détecte les requêtes automatisées</li>
            <li>• <strong>CAPTCHA invisible</strong> : Google reCAPTCHA vérifie chaque clic</li>
            <li>• <strong>JavaScript lourd</strong> : La page charge beaucoup de ressources</li>
            <li>• <strong>Résultat</strong> : 10-20 secondes par lien, même optimisé</li>
          </ul>
        </div>

        {/* Progression */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <Badge
                variant={i === step ? 'default' : i < step ? 'secondary' : 'outline'}
                className={i === step ? 'bg-blue-500' : ''}
              >
                {i + 1}
              </Badge>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-12 ${i < step ? 'bg-blue-500' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Étape actuelle */}
        <div className="space-y-4">
          <div>
            <div className="text-lg font-semibold mb-2">{currentStep.title}</div>
            <div className="text-sm text-muted-foreground">{currentStep.description}</div>
          </div>

          {currentStep.action}

          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400 flex items-start gap-2">
            <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Astuce :</strong> {currentStep.tip}
            </div>
          </div>
        </div>

        {/* Alternatives */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="text-sm font-semibold">Alternatives recommandées</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
              <div className="font-semibold text-green-400 mb-1">✅ TCGPlayer (USD)</div>
              <div className="text-muted-foreground">Chargement instantané, très fiable</div>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
              <div className="font-semibold text-purple-400 mb-1">📋 Bouton "Copier"</div>
              <div className="text-muted-foreground">Copiez le nom et cherchez manuellement</div>
            </div>
          </div>
        </div>

        {/* Statistiques de vitesse */}
        <div className="border-t border-border pt-4">
          <div className="text-sm font-semibold mb-3">Temps de chargement comparés</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-green-500/10 rounded">
              <span className="font-medium">TCGPlayer</span>
              <Badge className="bg-green-500">~1-2s (instantané)</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded">
              <span className="font-medium">CardMarket (après cette astuce)</span>
              <Badge className="bg-yellow-500">~5-10s (acceptable)</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-500/10 rounded">
              <span className="font-medium">CardMarket (sans astuce)</span>
              <Badge className="bg-red-500">~15-20s (très lent)</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
