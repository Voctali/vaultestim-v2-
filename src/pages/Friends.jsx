import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Search, UserPlus, User } from 'lucide-react'
import { useFriends } from '@/hooks/useFriends'
import { FriendCard } from '@/components/features/friends/FriendCard'
import { FriendCollectionModal } from '@/components/features/friends/FriendCollectionModal'
import { FriendStatsModal } from '@/components/features/friends/FriendStatsModal'

export function Friends() {
  const { friends, searchUsers, addFriend } = useFriends()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)

  const handleSearch = () => {
    const results = searchUsers(searchQuery)
    setSearchResults(results)
  }

  const handleAddFriend = (user) => {
    addFriend(user)
    // Retirer l'utilisateur des résultats de recherche
    setSearchResults(prev => prev.filter(u => u.id !== user.id))
  }

  const handleViewCollection = (friend) => {
    setSelectedFriend(friend)
    setShowCollectionModal(true)
  }

  const handleViewStats = (friend) => {
    setSelectedFriend(friend)
    setShowStatsModal(true)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold golden-glow flex items-center">
            <Users className="w-8 h-8 mr-3" />
            Amis
          </h1>
          <p className="text-muted-foreground">
            Connectez-vous avec d'autres collectionneurs
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {friends.length} {friends.length > 1 ? 'amis' : 'ami'}
        </Badge>
      </div>

      {/* Recherche d'amis */}
      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="golden-glow flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Rechercher des amis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 golden-border"
              />
            </div>
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </div>

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm text-muted-foreground">
                {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddFriend(user)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && searchResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mb-2 mx-auto opacity-50" />
              <p>Aucun utilisateur trouvé</p>
              <p className="text-sm">Essayez une autre recherche</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des amis */}
      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="golden-glow">Mes Amis ({friends.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun ami pour le moment</p>
              <p className="text-sm">Utilisez la recherche ci-dessus pour ajouter des amis</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onViewCollection={handleViewCollection}
                  onViewStats={handleViewStats}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <FriendCollectionModal
        isOpen={showCollectionModal}
        onClose={() => {
          setShowCollectionModal(false)
          setSelectedFriend(null)
        }}
        friend={selectedFriend}
      />

      <FriendStatsModal
        isOpen={showStatsModal}
        onClose={() => {
          setShowStatsModal(false)
          setSelectedFriend(null)
        }}
        friend={selectedFriend}
      />
    </div>
  )
}