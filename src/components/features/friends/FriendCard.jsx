import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Package, BarChart, Trash2, Lock } from 'lucide-react'
import { useFriends } from '@/hooks/useFriends'

export function FriendCard({ friend, onViewCollection, onViewStats }) {
  const { removeFriend, getFriendSettings } = useFriends()
  const settings = getFriendSettings(friend.id)

  const handleRemoveFriend = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir retirer ${friend.name} de vos amis ?`)) {
      removeFriend(friend.id)
    }
  }

  return (
    <Card className="golden-border hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
            {friend.avatar ? (
              <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-yellow-500" />
            )}
          </div>

          {/* Informations */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{friend.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{friend.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ajouté le {friend.displayDate}
            </p>

            {/* Badges de partage */}
            <div className="flex flex-wrap gap-2 mt-3">
              {settings.shareCollection ? (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  <Package className="w-3 h-3 mr-1" />
                  Collection
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">
                  <Lock className="w-3 h-3 mr-1" />
                  Collection
                </Badge>
              )}

              {settings.shareStats ? (
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  <BarChart className="w-3 h-3 mr-1" />
                  Statistiques
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">
                  <Lock className="w-3 h-3 mr-1" />
                  Statistiques
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewCollection(friend)}
                disabled={!settings.shareCollection}
                className="flex-1"
              >
                <Package className="w-4 h-4 mr-1" />
                Collection
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewStats(friend)}
                disabled={!settings.shareStats}
                className="flex-1"
              >
                <BarChart className="w-4 h-4 mr-1" />
                Stats
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemoveFriend}
                className="border-red-500/20 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
