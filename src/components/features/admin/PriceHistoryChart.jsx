import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function PriceHistoryChart({ history, productName }) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) {
      return null
    }

    // Préparer les données
    const prices = history.map(h => parseFloat(h.price))
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice

    // Dimensions du graphique
    const width = 600
    const height = 200
    const padding = 40

    // Calculer les points du graphique
    const points = history.map((h, i) => {
      const x = padding + (i / (history.length - 1)) * (width - 2 * padding)
      const y = padding + ((maxPrice - parseFloat(h.price)) / priceRange) * (height - 2 * padding)
      return { x, y, price: parseFloat(h.price), date: h.recorded_at }
    })

    // Créer le path SVG
    const pathData = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ')

    // Calcul de la tendance
    const firstPrice = prices[0]
    const lastPrice = prices[prices.length - 1]
    const priceChange = lastPrice - firstPrice
    const priceChangePercent = (priceChange / firstPrice) * 100

    return {
      points,
      pathData,
      minPrice,
      maxPrice,
      priceRange,
      width,
      height,
      padding,
      firstPrice,
      lastPrice,
      priceChange,
      priceChangePercent
    }
  }, [history])

  if (!chartData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des Prix</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aucun historique de prix disponible
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Historique des Prix - {productName}</span>
          <div className="flex items-center gap-2">
            {chartData.priceChange > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : chartData.priceChange < 0 ? (
              <TrendingDown className="h-5 w-5 text-red-500" />
            ) : (
              <Minus className="h-5 w-5 text-gray-500" />
            )}
            <span className={`text-lg font-bold ${
              chartData.priceChange > 0 ? 'text-green-500' :
              chartData.priceChange < 0 ? 'text-red-500' :
              'text-gray-500'
            }`}>
              {chartData.priceChange > 0 ? '+' : ''}
              {chartData.priceChangePercent.toFixed(1)}%
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-xs text-muted-foreground">Prix initial</div>
            <div className="text-xl font-bold">{chartData.firstPrice.toFixed(2)} €</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(history[0].recorded_at)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Prix actuel</div>
            <div className="text-xl font-bold">{chartData.lastPrice.toFixed(2)} €</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(history[history.length - 1].recorded_at)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Variation</div>
            <div className={`text-xl font-bold ${
              chartData.priceChange > 0 ? 'text-green-500' :
              chartData.priceChange < 0 ? 'text-red-500' :
              'text-gray-500'
            }`}>
              {chartData.priceChange > 0 ? '+' : ''}
              {chartData.priceChange.toFixed(2)} €
            </div>
            <div className="text-xs text-muted-foreground">
              {history.length} enregistrements
            </div>
          </div>
        </div>

        {/* Graphique SVG */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartData.width} ${chartData.height}`}
            className="w-full h-auto"
            style={{ minHeight: '200px' }}
          >
            {/* Grille horizontale */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = chartData.padding + ratio * (chartData.height - 2 * chartData.padding)
              const price = chartData.maxPrice - ratio * chartData.priceRange
              return (
                <g key={i}>
                  <line
                    x1={chartData.padding}
                    y1={y}
                    x2={chartData.width - chartData.padding}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="0.5"
                    opacity="0.2"
                  />
                  <text
                    x={chartData.padding - 5}
                    y={y + 5}
                    textAnchor="end"
                    fontSize="12"
                    fill="currentColor"
                    opacity="0.6"
                  >
                    {price.toFixed(2)}€
                  </text>
                </g>
              )
            })}

            {/* Ligne du graphique */}
            <path
              d={chartData.pathData}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Zone sous la courbe */}
            <path
              d={`${chartData.pathData} L ${chartData.points[chartData.points.length - 1].x} ${chartData.height - chartData.padding} L ${chartData.padding} ${chartData.height - chartData.padding} Z`}
              fill="hsl(var(--primary))"
              opacity="0.1"
            />

            {/* Points de données */}
            {chartData.points.map((point, i) => (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="hsl(var(--primary))"
                  stroke="white"
                  strokeWidth="2"
                >
                  <title>{`${point.price.toFixed(2)}€ - ${formatDate(point.date)}`}</title>
                </circle>
              </g>
            ))}

            {/* Dates sur l'axe X (seulement premier et dernier) */}
            <text
              x={chartData.padding}
              y={chartData.height - chartData.padding + 20}
              textAnchor="start"
              fontSize="12"
              fill="currentColor"
              opacity="0.6"
            >
              {formatDate(history[0].recorded_at)}
            </text>
            <text
              x={chartData.width - chartData.padding}
              y={chartData.height - chartData.padding + 20}
              textAnchor="end"
              fontSize="12"
              fill="currentColor"
              opacity="0.6"
            >
              {formatDate(history[history.length - 1].recorded_at)}
            </text>
          </svg>
        </div>

        {/* Légende */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Les prix sont récupérés automatiquement depuis CardMarket.
            Survolez les points pour voir les détails.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
