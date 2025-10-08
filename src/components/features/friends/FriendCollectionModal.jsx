import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Package, Search } from 'lucide-react'
import { useFriends } from '@/hooks/useFriends'
import { CardImage } from '@/components/features/explore/CardImage'

export function FriendCollectionModal({ isOpen, onClose, friend }) {
  const { getFriendCollection } = useFriends()
  const [searchTerm, setSearchTerm] = useState('')

  if (!friend) return null

  const collection = getFriendCollection(friend.id)

  if (!collection) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center golden-glow text-2xl">
              <Package className="w-6 h-6 mr-2" />
              Collection de {friend.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Collection non partagée</p>
            <p className="text-sm">Cet utilisateur n'a pas activé le partage de sa collection</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const filteredCollection = collection.filter(card =>
    card.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.series?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.extension?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center golden-glow text-2xl">
            <Package className="w-6 h-6 mr-2" />
            Collection de {friend.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une carte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 golden-border"
            />
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="text-xl font-bold golden-glow">{collection.length}</p>
            </div>
            <div className="p-3 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Affichées</p>
              <p className="text-xl font-bold text-blue-500">{filteredCollection.length}</p>
            </div>
            <div className="p-3 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Valeur Totale</p>
              <p className="text-xl font-bold text-green-500">
                {collection.reduce((sum, card) => {
                  const price = parseFloat(card.marketPrice || card.value || 0)
                  const qty = parseInt(card.quantity || 1)
                  return sum + (price * qty)
                }, 0).toFixed(2)}€
              </p>
            </div>
            <div className="p-3 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Rares</p>
              <p className="text-xl font-bold text-purple-500">
                {collection.filter(c => c.rarity?.includes('Rare') || c.rarity?.includes('Ultra') || c.rarity?.includes('Secret')).length}
              </p>
            </div>
          </div>

          {/* Grille de cartes */}
          <div className="flex-1 overflow-y-auto">
            {filteredCollection.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucune carte trouvée</p>
                <p className="text-sm">Essayez de modifier votre recherche</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pb-4">
                {filteredCollection.map((card) => (
                  <div key={card.id} className="group relative">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-accent/50">
                      <CardImage
                        card={card}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium truncate">{card.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {card.series || card.extension}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {card.rarity || 'Common'}
                        </Badge>
                        {card.quantity > 1 && (
                          <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-400">
                            x{card.quantity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-green-500 mt-1">
                        {parseFloat(card.marketPrice || card.value || 0).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
