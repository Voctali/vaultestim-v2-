import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart, ShoppingCart, Euro, TrendingUp, Target, Package, TrendingDown, RotateCcw } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection.jsx'
import { AllSalesModal } from '@/components/features/statistics/AllSalesModal'

export function Statistics() {
  const { collection, getStats, getSalesStats, getRecentSales, cancelSale, sales } = useCollection()
  const [showAllSalesModal, setShowAllSalesModal] = useState(false)
  const stats = getStats()
  const salesStats = getSalesStats()
  const recentSales = getRecentSales(8)

  const handleCancelSale = (sale) => {
    if (window.confirm(`Êtes-vous sûr de vouloir annuler cette vente ? ${sale.type === 'card' ? 'La carte' : 'Le lot'} sera restauré${sale.type === 'batch' ? '' : ''} dans votre collection.`)) {
      cancelSale(sale)
      alert('Vente annulée avec succès !')
    }
  }

  // Calculer la plus-value totale (valeur marché - valeur achat)
  const plusValue = (parseFloat(stats.totalValue) - parseFloat(stats.totalPurchaseValue)).toFixed(2)
  const plusValuePercentage = stats.totalPurchaseValue > 0
    ? ((plusValue / parseFloat(stats.totalPurchaseValue)) * 100).toFixed(1)
    : 0

  // Calculer le prix moyen d'une carte
  const averagePrice = stats.totalCards > 0
    ? (parseFloat(stats.totalValue) / stats.totalCards).toFixed(2)
    : '0.00'

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold golden-glow flex items-center">
            <BarChart className="w-8 h-8 mr-3" />
            Statistiques
          </h1>
          <p className="text-muted-foreground">
            Analysez votre collection et vos performances
          </p>
        </div>
      </div>

      {/* Statistiques de Vente */}
      <div>
        <h2 className="text-xl font-semibold mb-4 golden-glow">Statistiques de Vente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total des Ventes */}
          <Card
            className="golden-border card-hover cursor-pointer"
            onClick={() => setShowAllSalesModal(true)}
            title="Cliquez pour voir toutes les ventes"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Total des Ventes</p>
                  <p className="text-3xl font-bold golden-glow">
                    {salesStats.totalSales} <span className="text-sm text-muted-foreground">({salesStats.cardSales}x + {salesStats.batchSales}📦)</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Cartes + Lots de</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chiffre d'Affaires */}
          <Card className="golden-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Chiffre d'Affaires</p>
                  <p className="text-3xl font-bold text-blue-500">
                    {salesStats.totalRevenue}€
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Cartes + Lots de</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Euro className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profit Total */}
          <Card className="golden-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Profit Total</p>
                  <p className="text-3xl font-bold text-green-500">
                    {salesStats.totalProfit}€
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Bénéfice Net</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prix Moyen */}
          <Card className="golden-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Prix Moyen</p>
                  <p className="text-3xl font-bold text-purple-500">
                    {salesStats.averageSalePrice}€
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Par vente</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Statistiques de Collection */}
      <div>
        <h2 className="text-xl font-semibold mb-4 golden-glow">Statistiques de Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Cartes en Collection */}
          <Card className="golden-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Cartes en Collection</p>
                  <p className="text-3xl font-bold text-blue-500">
                    {stats.totalCards}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total d'exemplaires</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valeur d'Achat */}
          <Card className="golden-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Valeur d'Achat</p>
                  <p className="text-3xl font-bold text-green-500">
                    {stats.totalPurchaseValue}€
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Prix net prix d'achat</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Euro className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valeur de Marché */}
          <Card className="golden-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Valeur de Marché</p>
                  <p className="text-3xl font-bold text-blue-500">
                    {stats.totalValue}€
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Base sur prix d'achat</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plus-Value Totale */}
          <Card className="golden-border card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Plus-Value Totale</p>
                  <p className={`text-3xl font-bold ${parseFloat(plusValue) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(plusValue) >= 0 ? '+' : ''}{plusValue}€
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Marché - Achat {parseFloat(plusValuePercentage) >= 0 ? '+' : ''}{plusValuePercentage}%
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full ${parseFloat(plusValue) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center flex-shrink-0`}>
                  {parseFloat(plusValue) >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 8 Dernières Ventes */}
      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="golden-glow">8 Dernières Ventes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Objet</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Montant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Profit</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length > 0 ? (
                  recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-4 text-sm">{sale.displayDate}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium">
                            {sale.type === 'card' ? sale.cardName : sale.batchName}
                          </p>
                          {sale.type === 'card' && sale.cardSeries && (
                            <p className="text-xs text-muted-foreground">{sale.cardSeries}</p>
                          )}
                          {sale.buyer && sale.buyer !== 'Non spécifié' && (
                            <p className="text-xs text-muted-foreground">Acheteur: {sale.buyer}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {sale.type === 'card' ? (
                          <Badge variant="secondary">Carte individuelle</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                            Lot ({sale.quantity} cartes)
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold">{sale.salePrice}€</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${parseFloat(sale.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {parseFloat(sale.profit) >= 0 ? '+' : ''}{sale.profit}€
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {parseFloat(sale.profitPercentage) >= 0 ? '+' : ''}{sale.profitPercentage}%
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelSale(sale)}
                            className="border-orange-500/20 hover:bg-orange-500/10"
                            title="Annuler cette vente"
                          >
                            <RotateCcw className="w-4 h-4 text-orange-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Aucune vente enregistrée</p>
                        <p className="text-sm">Vendez vos doublons depuis la page "Doublons" pour voir vos statistiques</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Toutes les Ventes */}
      <AllSalesModal
        isOpen={showAllSalesModal}
        onClose={() => setShowAllSalesModal(false)}
        sales={sales}
        onCancelSale={handleCancelSale}
      />
    </div>
  )
}