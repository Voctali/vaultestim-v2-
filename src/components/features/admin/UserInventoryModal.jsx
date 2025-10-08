import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Package,
  TrendingUp,
  Euro,
  ShoppingCart,
  Star,
  Heart,
  Copy,
  Edit,
  Trash2,
  Save,
  X,
  BarChart,
  RotateCcw
} from 'lucide-react'

export function UserInventoryModal({ isOpen, onClose, user }) {
  const [userData, setUserData] = useState(null)
  const [stats, setStats] = useState(null)
  const [editingStats, setEditingStats] = useState(false)
  const [editedStats, setEditedStats] = useState({})
  const [selectedTab, setSelectedTab] = useState('stats')

  useEffect(() => {
    if (isOpen && user) {
      loadUserData()
    }
  }, [isOpen, user])

  const loadUserData = () => {
    // Charger les données depuis localStorage
    // Note: En production, cela devrait être chargé depuis une vraie base de données
    const collection = JSON.parse(localStorage.getItem(`vaultestim_collection_${user.id}`) || '[]')
    const favorites = JSON.parse(localStorage.getItem(`vaultestim_favorites_${user.id}`) || '[]')
    const wishlist = JSON.parse(localStorage.getItem(`vaultestim_wishlist_${user.id}`) || '[]')
    const duplicateBatches = JSON.parse(localStorage.getItem(`vaultestim_duplicate_batches_${user.id}`) || '[]')
    const sales = JSON.parse(localStorage.getItem(`vaultestim_sales_${user.id}`) || '[]')

    // Calculer les statistiques
    const totalCards = collection.length
    const totalValue = collection.reduce((sum, card) => {
      const marketPrice = parseFloat(card.marketPrice || card.value || '0')
      const quantity = parseInt(card.quantity || 1)
      return sum + (marketPrice * quantity)
    }, 0)

    const totalPurchaseValue = collection.reduce((sum, card) => {
      const purchasePrice = parseFloat(card.purchasePrice || '0')
      const quantity = parseInt(card.quantity || 1)
      return sum + (purchasePrice * quantity)
    }, 0)

    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.salePrice || 0), 0)
    const totalProfit = sales.reduce((sum, sale) => sum + parseFloat(sale.profit || 0), 0)

    const calculatedStats = {
      totalCards,
      totalValue: totalValue.toFixed(2),
      totalPurchaseValue: totalPurchaseValue.toFixed(2),
      favoriteCards: favorites.length,
      wishlistCards: wishlist.length,
      duplicateBatches: duplicateBatches.length,
      totalSales,
      totalRevenue: totalRevenue.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      plusValue: (totalValue - totalPurchaseValue).toFixed(2)
    }

    setUserData({
      collection,
      favorites,
      wishlist,
      duplicateBatches,
      sales
    })

    setStats(calculatedStats)
    setEditedStats(calculatedStats)
  }

  const handleSaveStats = () => {
    // Sauvegarder les statistiques modifiées
    // En production, cela devrait mettre à jour une vraie base de données

    // Pour l'instant, on peut mettre à jour les cartes pour refléter les nouvelles valeurs
    if (userData && userData.collection) {
      const updatedCollection = userData.collection.map(card => ({
        ...card,
        // Ajuster proportionnellement si nécessaire
      }))

      localStorage.setItem(`vaultestim_collection_${user.id}`, JSON.stringify(updatedCollection))
    }

    setStats(editedStats)
    setEditingStats(false)
    alert('Statistiques mises à jour avec succès')
  }

  const handleDeleteCard = (cardId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) {
      const updatedCollection = userData.collection.filter(card => card.id !== cardId)
      localStorage.setItem(`vaultestim_collection_${user.id}`, JSON.stringify(updatedCollection))
      loadUserData()
    }
  }

  const handleDeleteSale = (saleId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
      const updatedSales = userData.sales.filter(sale => sale.id !== saleId)
      localStorage.setItem(`vaultestim_sales_${user.id}`, JSON.stringify(updatedSales))
      loadUserData()
    }
  }

  const handleResetStats = () => {
    if (window.confirm('⚠️ ATTENTION ⚠️\n\nCette action va SUPPRIMER DÉFINITIVEMENT :\n\n• Toutes les cartes de la collection\n• Tous les favoris\n• Toute la liste de souhaits\n• Tous les lots de doublons\n• Toutes les ventes\n\nCette action est IRRÉVERSIBLE !\n\nÊtes-vous absolument sûr de vouloir continuer ?')) {
      // Double confirmation
      if (window.confirm('DERNIÈRE CONFIRMATION\n\nToutes les données de cet utilisateur seront perdues à jamais.\n\nConfirmez-vous la réinitialisation complète ?')) {
        // Vider toutes les données de l'utilisateur
        localStorage.setItem(`vaultestim_collection_${user.id}`, JSON.stringify([]))
        localStorage.setItem(`vaultestim_favorites_${user.id}`, JSON.stringify([]))
        localStorage.setItem(`vaultestim_wishlist_${user.id}`, JSON.stringify([]))
        localStorage.setItem(`vaultestim_duplicate_batches_${user.id}`, JSON.stringify([]))
        localStorage.setItem(`vaultestim_sales_${user.id}`, JSON.stringify([]))
        localStorage.setItem(`vaultestim_recent_${user.id}`, JSON.stringify([]))

        // Recharger les données
        loadUserData()
        alert('✅ Statistiques réinitialisées avec succès !')
      }
    }
  }

  if (!user || !userData || !stats) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center golden-glow text-2xl">
            <Package className="w-6 h-6 mr-2" />
            Inventaire & Statistiques - {user.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats">
              <BarChart className="w-4 h-4 mr-2" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="collection">
              <Package className="w-4 h-4 mr-2" />
              Collection ({userData.collection.length})
            </TabsTrigger>
            <TabsTrigger value="sales">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Ventes ({userData.sales.length})
            </TabsTrigger>
          </TabsList>

          {/* Onglet Statistiques */}
          <TabsContent value="stats" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold golden-glow">Statistiques de Collection</h3>
              <div className="flex gap-2">
                {!editingStats ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingStats(true)}
                      className="golden-border"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResetStats}
                      className="border-red-500/20 hover:bg-red-500/10 text-red-500"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Réinitialiser
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingStats(false)
                        setEditedStats(stats)
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveStats}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Total Cartes */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Cartes</span>
                    <Package className="w-4 h-4 text-blue-500" />
                  </div>
                  {editingStats ? (
                    <Input
                      type="number"
                      value={editedStats.totalCards}
                      onChange={(e) => setEditedStats({ ...editedStats, totalCards: parseInt(e.target.value) || 0 })}
                      className="h-8 text-lg font-bold"
                    />
                  ) : (
                    <p className="text-2xl font-bold golden-glow">{stats.totalCards}</p>
                  )}
                </CardContent>
              </Card>

              {/* Valeur Marché */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Valeur Marché</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  {editingStats ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editedStats.totalValue}
                      onChange={(e) => setEditedStats({ ...editedStats, totalValue: e.target.value })}
                      className="h-8 text-lg font-bold"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-green-500">{stats.totalValue}€</p>
                  )}
                </CardContent>
              </Card>

              {/* Valeur Achat */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Valeur Achat</span>
                    <Euro className="w-4 h-4 text-blue-500" />
                  </div>
                  {editingStats ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editedStats.totalPurchaseValue}
                      onChange={(e) => setEditedStats({ ...editedStats, totalPurchaseValue: e.target.value })}
                      className="h-8 text-lg font-bold"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-blue-500">{stats.totalPurchaseValue}€</p>
                  )}
                </CardContent>
              </Card>

              {/* Plus-Value */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Plus-Value</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className={`text-2xl font-bold ${parseFloat(stats.plusValue) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(stats.plusValue) >= 0 ? '+' : ''}{stats.plusValue}€
                  </p>
                </CardContent>
              </Card>

              {/* Favoris */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Favoris</span>
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold golden-glow">{stats.favoriteCards}</p>
                </CardContent>
              </Card>

              {/* Liste de souhaits */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Liste de souhaits</span>
                    <Star className="w-4 h-4 text-yellow-500" />
                  </div>
                  <p className="text-2xl font-bold golden-glow">{stats.wishlistCards}</p>
                </CardContent>
              </Card>

              {/* Total Ventes */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Ventes</span>
                    <ShoppingCart className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold golden-glow">{stats.totalSales}</p>
                </CardContent>
              </Card>

              {/* Chiffre d'Affaires */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Chiffre d'Affaires</span>
                    <Euro className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-blue-500">{stats.totalRevenue}€</p>
                </CardContent>
              </Card>

              {/* Profit Ventes */}
              <Card className="golden-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Profit Ventes</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-500">
                    {parseFloat(stats.totalProfit) >= 0 ? '+' : ''}{stats.totalProfit}€
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Collection */}
          <TabsContent value="collection" className="space-y-4">
            <div className="max-h-[500px] overflow-y-auto space-y-2">
              {userData.collection.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Aucune carte dans la collection</p>
                </div>
              ) : (
                userData.collection.map((card) => (
                  <Card key={card.id} className="golden-border">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded overflow-hidden flex-shrink-0">
                            {card.image || card.images?.small ? (
                              <img
                                src={card.image || card.images?.small}
                                alt={card.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                ?
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{card.name}</h4>
                            <p className="text-xs text-muted-foreground">{card.series || card.extension}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{card.rarity}</Badge>
                              {card.quantity > 1 && (
                                <Badge variant="outline" className="text-xs">x{card.quantity}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-500">
                              {parseFloat(card.marketPrice || card.value || 0).toFixed(2)}€
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Achat: {parseFloat(card.purchasePrice || 0).toFixed(2)}€
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCard(card.id)}
                            className="border-red-500/20 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Onglet Ventes */}
          <TabsContent value="sales" className="space-y-4">
            <div className="max-h-[500px] overflow-y-auto space-y-2">
              {userData.sales.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Aucune vente enregistrée</p>
                </div>
              ) : (
                userData.sales.map((sale) => (
                  <Card key={sale.id} className="golden-border">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">
                              {sale.type === 'card' ? sale.cardName : sale.batchName}
                            </h4>
                            {sale.type === 'batch' && (
                              <Badge variant="secondary" className="text-xs">
                                Lot ({sale.quantity} cartes)
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{sale.displayDate}</span>
                            {sale.buyer && sale.buyer !== 'Non spécifié' && (
                              <span>Acheteur: {sale.buyer}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold">{sale.salePrice}€</p>
                            <p className={`text-xs font-semibold ${parseFloat(sale.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {parseFloat(sale.profit) >= 0 ? '+' : ''}{sale.profit}€
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSale(sale.id)}
                            className="border-red-500/20 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
