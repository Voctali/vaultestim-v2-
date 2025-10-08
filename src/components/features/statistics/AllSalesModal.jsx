import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Search, RotateCcw, Calendar, Euro } from 'lucide-react'

export function AllSalesModal({ isOpen, onClose, sales, onCancelSale }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'card', 'batch'

  if (!sales) return null

  // Filtrer les ventes
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.cardName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.batchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.buyer?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || sale.type === filterType

    return matchesSearch && matchesType
  })

  // Calculer les totaux
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.salePrice || 0), 0)
  const totalProfit = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.profit || 0), 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center golden-glow text-2xl">
            <ShoppingCart className="w-6 h-6 mr-2" />
            Toutes les Ventes ({sales.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtres et Recherche */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, acheteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 golden-border"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                size="sm"
              >
                Toutes
              </Button>
              <Button
                variant={filterType === 'card' ? 'default' : 'outline'}
                onClick={() => setFilterType('card')}
                size="sm"
              >
                Cartes
              </Button>
              <Button
                variant={filterType === 'batch' ? 'default' : 'outline'}
                onClick={() => setFilterType('batch')}
                size="sm"
              >
                Lots
              </Button>
            </div>
          </div>

          {/* Statistiques résumées */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Ventes affichées</p>
              <p className="text-2xl font-bold golden-glow">{filteredSales.length}</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-blue-500">{totalRevenue.toFixed(2)}€</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Profit Total</p>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}€
              </p>
            </div>
          </div>

          {/* Tableau des ventes */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-accent/50 sticky top-0 z-10">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Objet</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Acheteur</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Montant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Profit</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                          <p className="text-lg font-medium">Aucune vente trouvée</p>
                          <p className="text-sm">Essayez de modifier vos filtres</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => (
                      <tr key={sale.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{sale.displayDate}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium">
                              {sale.type === 'card' ? sale.cardName : sale.batchName}
                            </p>
                            {sale.type === 'card' && sale.cardSeries && (
                              <p className="text-xs text-muted-foreground">{sale.cardSeries}</p>
                            )}
                            {sale.notes && (
                              <p className="text-xs text-muted-foreground italic">{sale.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {sale.type === 'card' ? (
                            <Badge variant="secondary">
                              Carte{sale.quantity > 1 ? ` x${sale.quantity}` : ''}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                              Lot ({sale.quantity} cartes)
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {sale.buyer && sale.buyer !== 'Non spécifié' ? sale.buyer : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Euro className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm font-semibold">{sale.salePrice}€</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className={`text-sm font-semibold ${parseFloat(sale.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {parseFloat(sale.profit) >= 0 ? '+' : ''}{sale.profit}€
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {parseFloat(sale.profitPercentage) >= 0 ? '+' : ''}{sale.profitPercentage}%
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (window.confirm(`Annuler cette vente ?\n${sale.type === 'card' ? 'La carte' : 'Le lot'} sera restauré dans votre collection.`)) {
                                onCancelSale(sale)
                              }
                            }}
                            className="border-orange-500/20 hover:bg-orange-500/10"
                            title="Annuler cette vente"
                          >
                            <RotateCcw className="w-4 h-4 text-orange-500" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
