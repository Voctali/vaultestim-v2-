import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection.jsx'
import { getUserLevel } from '@/constants/userLevels'
import { Plus, Settings, Clock, Target, TrendingUp, Package } from 'lucide-react'

export function Dashboard() {
  const { user } = useAuth()
  const { getStats, recentAdditions, getMostValuedCards } = useCollection()

  if (!user) return null

  const collectionStats = getStats()
  const userLevel = getUserLevel(collectionStats.totalCards || 0)
  const mostValuedCards = getMostValuedCards(1)

  const stats = [
    {
      title: 'CARTES TOTAL',
      value: collectionStats.totalCards.toString(),
      icon: '📚',
      color: '#3B82F6',
      change: null
    },
    {
      title: 'VALEUR ACHAT',
      value: `${collectionStats.totalPurchaseValue}€`,
      icon: '⭐',
      color: '#8B5CF6',
      change: `+${collectionStats.totalPurchaseValue}€ ce mois`
    },
    {
      title: 'VALEUR MARCHÉ',
      value: `${collectionStats.totalValue}€`,
      icon: '💹',
      color: '#10B981',
      change: `+* Total ${collectionStats.totalValue}€`
    },
    {
      title: 'PRODUITS SCELLÉS',
      value: '0',
      icon: '📦',
      color: '#10B981',
      change: null
    }
  ]

  // Utiliser les vrais ajouts récents ou des données par défaut
  const displayedRecentAdditions = recentAdditions.length > 0 ? recentAdditions.slice(0, 2) : [
    {
      id: 'demo-1',
      name: 'Aucune carte ajoutée',
      displayDate: 'N/A',
      rarity: 'Commencez votre collection !',
      condition: 'Ajoutez vos premières cartes',
      image: '/api/placeholder/120/168'
    }
  ]

  const objectives = [
    {
      title: '100 Cartes',
      progress: `${Math.min(Math.round((collectionStats.totalCards / 100) * 100), 100)}%`,
      current: collectionStats.totalCards,
      target: 100,
      icon: Target
    },
    {
      title: '1000€ de Collection',
      progress: `${Math.min(Math.round((parseFloat(collectionStats.totalValue) / 1000) * 100), 100)}%`,
      current: parseFloat(collectionStats.totalValue),
      target: 1000,
      icon: TrendingUp
    }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold golden-glow mb-2">
            Tableau de Bord
          </h1>
          <p className="text-muted-foreground">
            Gérez votre collection Pokémon avec VaultEstim
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une Carte
          </Button>
          <Button variant="outline" className="border-gray-300">
            <Settings className="w-4 h-4 mr-2" />
            Produits Scellés
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="golden-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: stat.color + '20', color: stat.color }}
                >
                  {stat.icon}
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold golden-glow">
                    {stat.value}
                  </p>
                </div>
              </div>
              {stat.change && (
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Additions */}
        <div className="lg:col-span-2">
          <Card className="golden-border card-hover">
            <CardHeader>
              <CardTitle className="flex items-center golden-glow">
                <Clock className="w-5 h-5 mr-2" />
                Ajouts Récents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayedRecentAdditions.map((card) => (
                  <div key={card.id} className="flex items-center space-x-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <div className="w-16 h-22 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg overflow-hidden flex-shrink-0">
                      {card.image || card.images?.small ? (
                        <img
                          src={card.image || card.images?.small}
                          alt={card.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground" style={{ display: card.image || card.images?.small ? 'none' : 'flex' }}>
                        Carte
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{card.name}</h4>
                      <p className="text-sm text-muted-foreground">{card.displayDate || card.date}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        {card.rarity}
                      </Badge>
                      <p className="text-sm text-blue-500">{card.condition}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Most Valuable Cards */}
          <Card className="golden-border card-hover">
            <CardHeader>
              <CardTitle className="flex items-center justify-between golden-glow">
                <span className="flex items-center">
                  ⭐ Cartes les plus valorisées
                </span>
                <span className="text-xs text-muted-foreground">Limite</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mostValuedCards.length > 0 ? (
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/30">
                    <div className="w-12 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded overflow-hidden flex-shrink-0">
                      {mostValuedCards[0].image || mostValuedCards[0].images?.small ? (
                        <img
                          src={mostValuedCards[0].image || mostValuedCards[0].images?.small}
                          alt={mostValuedCards[0].name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground" style={{ display: mostValuedCards[0].image || mostValuedCards[0].images?.small ? 'none' : 'flex' }}>
                        🔥
                      </div>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-foreground">{mostValuedCards[0].name}</h5>
                      <p className="text-xs text-muted-foreground">{mostValuedCards[0].rarity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-500">{mostValuedCards[0].marketPrice || mostValuedCards[0].value}€</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/30">
                    <div className="w-12 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded overflow-hidden flex-shrink-0">
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        📦
                      </div>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-foreground">Aucune carte</h5>
                      <p className="text-xs text-muted-foreground">Ajoutez des cartes à votre collection</p>
                    </div>
                  </div>
                )}

                <div className="p-4 border border-dashed border-border rounded-lg text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-semibold golden-glow">Voir toutes vos cartes valorisées</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vous avez {collectionStats.totalCards} cartes valorisées au total.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Passez à Premium pour les voir toutes !
                  </p>
                  <Button size="sm" className="mt-3 bg-yellow-500 hover:bg-yellow-600">
                    <span className="mr-1">👑</span>
                    Passer à Premium
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    À partir de 6.99€/mois • Annulable à tout moment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Objectives */}
          <Card className="golden-border card-hover">
            <CardHeader>
              <CardTitle className="flex items-center golden-glow">
                🎯 Objectifs Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {objectives.map((objective, index) => {
                  const Icon = objective.icon
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium">{objective.title}</span>
                        </div>
                        <span className="text-sm font-medium text-primary">{objective.progress}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-primary to-yellow-400 h-2 rounded-full"
                          style={{ width: objective.progress }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {objective.current} / {objective.target} {index === 0 ? 'cartes' : '€'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tip */}
          <Card className="golden-border bg-accent/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  💡
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Conseil</h4>
                  <p className="text-xs text-muted-foreground">
                    Concentrez-vous sur les cartes rares pour augmenter rapidement la valeur !
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}