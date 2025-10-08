import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart, Package, Euro, TrendingUp, Star } from 'lucide-react'
import { useFriends } from '@/hooks/useFriends'

export function FriendStatsModal({ isOpen, onClose, friend }) {
  const { getFriendStats } = useFriends()

  if (!friend) return null

  const stats = getFriendStats(friend.id)

  if (!stats) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center golden-glow text-2xl">
              <BarChart className="w-6 h-6 mr-2" />
              Statistiques de {friend.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Statistiques non partagées</p>
            <p className="text-sm">Cet utilisateur n'a pas activé le partage de ses statistiques</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const plusValue = (parseFloat(stats.totalValue) - parseFloat(stats.totalPurchaseValue)).toFixed(2)
  const plusValuePercentage = stats.totalPurchaseValue > 0
    ? ((plusValue / parseFloat(stats.totalPurchaseValue)) * 100).toFixed(1)
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center golden-glow text-2xl">
            <BarChart className="w-6 h-6 mr-2" />
            Statistiques de {friend.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistiques de Collection */}
          <div>
            <h3 className="text-lg font-semibold mb-4 golden-glow">Collection</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Cartes */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Total Cartes</p>
                      <p className="text-2xl font-bold text-blue-500">{stats.totalCards}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Valeur d'Achat */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Valeur Achat</p>
                      <p className="text-2xl font-bold text-green-500">{stats.totalPurchaseValue}€</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Euro className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Valeur Marché */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Valeur Marché</p>
                      <p className="text-2xl font-bold text-blue-500">{stats.totalValue}€</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cartes Rares */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Cartes Rares</p>
                      <p className="text-2xl font-bold text-purple-500">{stats.rareCards}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Plus-Value */}
          <div>
            <h3 className="text-lg font-semibold mb-4 golden-glow">Plus-Value</h3>
            <Card className="golden-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Plus-Value Totale</p>
                    <p className={`text-4xl font-bold ${parseFloat(plusValue) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {parseFloat(plusValue) >= 0 ? '+' : ''}{plusValue}€
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {parseFloat(plusValuePercentage) >= 0 ? '+' : ''}{plusValuePercentage}% par rapport à la valeur d'achat
                    </p>
                  </div>
                  <div className={`w-16 h-16 rounded-full ${parseFloat(plusValue) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                    <TrendingUp className={`w-8 h-8 ${parseFloat(plusValue) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informations */}
          <div className="text-sm text-muted-foreground text-center">
            <p>Les statistiques sont calculées en temps réel à partir de la collection partagée</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
