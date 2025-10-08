/**
 * Composant d'affichage des statistiques de la base de données
 */
import React from 'react'
import { Database, TrendingUp, Activity, HardDrive } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function DatabaseStats({ stats }) {
  if (!stats) return null

  const statCards = [
    {
      title: 'Extensions',
      value: stats.total_sets || 0,
      icon: HardDrive,
      color: 'text-blue-500'
    },
    {
      title: 'Total Cartes',
      value: (stats.total_cards || 0).toLocaleString(),
      icon: Database,
      color: 'text-green-500'
    },
    {
      title: 'Avec Prix',
      value: (stats.cards_with_prices || 0).toLocaleString(),
      subtitle: `${Math.round(((stats.cards_with_prices || 0) / (stats.total_cards || 1)) * 100)}% de couverture`,
      icon: TrendingUp,
      color: 'text-yellow-500'
    },
    {
      title: 'Prix Récents',
      value: stats.recent_prices || 0,
      subtitle: 'Dernières 24h',
      icon: Activity,
      color: 'text-red-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}