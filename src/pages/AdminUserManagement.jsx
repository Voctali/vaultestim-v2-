import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminApiService } from '@/services/AdminApiService'
import { UserInventoryModal } from '@/components/features/admin/UserInventoryModal'
import { Users, Crown, Shield, Search, Calendar, Trash2, Edit, CheckCircle, XCircle, Package } from 'lucide-react'

export function AdminUserManagement() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false)
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false)
  const [premiumDays, setPremiumDays] = useState(30)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user' })
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, users])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const allUsers = await AdminApiService.getAllUsers()
      setUsers(allUsers)
      setFilteredUsers(allUsers)
    } catch (error) {
      showError('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const showError = (message) => {
    setErrorMessage(message)
    setTimeout(() => setErrorMessage(''), 3000)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role || 'user'
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    try {
      await AdminApiService.updateUser(selectedUser.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role
      })
      showSuccess('Utilisateur modifié avec succès')
      setIsEditDialogOpen(false)
      loadUsers()
    } catch (error) {
      showError(error.message || 'Erreur lors de la modification')
    }
  }

  const handleDeleteUser = (user) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    try {
      await AdminApiService.deleteUser(selectedUser.id)
      showSuccess('Utilisateur supprimé avec succès')
      setIsDeleteDialogOpen(false)
      loadUsers()
    } catch (error) {
      showError(error.message || 'Erreur lors de la suppression')
    }
  }

  const handleManagePremium = (user) => {
    setSelectedUser(user)
    setPremiumDays(30)
    setIsPremiumDialogOpen(true)
  }

  const handleGrantPremium = async () => {
    try {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + premiumDays)

      await AdminApiService.updateUser(selectedUser.id, {
        isPremium: 1,
        premiumExpiry: expiryDate.toISOString()
      })
      showSuccess(`Premium accordé pour ${premiumDays} jours`)
      setIsPremiumDialogOpen(false)
      loadUsers()
    } catch (error) {
      showError(error.message || 'Erreur lors de l\'attribution')
    }
  }

  const handleRevokePremium = async () => {
    try {
      await AdminApiService.updateUser(selectedUser.id, {
        isPremium: 0,
        premiumExpiry: null
      })
      showSuccess('Premium révoqué avec succès')
      setIsPremiumDialogOpen(false)
      loadUsers()
    } catch (error) {
      showError(error.message || 'Erreur lors de la révocation')
    }
  }

  const handleViewInventory = (user) => {
    setSelectedUser(user)
    setIsInventoryModalOpen(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const isPremiumExpired = (user) => {
    if (!user.isPremium || !user.premiumExpiry) return false
    return new Date(user.premiumExpiry) < new Date()
  }

  const stats = {
    total: users.length,
    premium: users.filter(u => u.isPremium && !isPremiumExpired(u)).length,
    admins: users.filter(u => u.role === 'admin').length
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold golden-glow mb-2">
          Gestion des Utilisateurs
        </h1>
        <p className="text-muted-foreground text-lg">
          Administration des comptes et permissions
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="golden-border card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Utilisateurs
            </CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold golden-glow">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="golden-border card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Premium Actifs
            </CardTitle>
            <Crown className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold golden-glow">{stats.premium}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.premium / stats.total) * 100).toFixed(1) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card className="golden-border card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administrateurs
            </CardTitle>
            <Shield className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold golden-glow">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card className="golden-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 golden-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="flex items-center golden-glow">
            <Users className="mr-2 h-5 w-5" />
            Utilisateurs ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des utilisateurs...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="golden-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{user.name}</h3>
                          {user.role === 'admin' && (
                            <Badge variant="destructive" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {user.isPremium && !isPremiumExpired(user) && (
                            <Badge className="text-xs golden-glow bg-yellow-500/20 hover:bg-yellow-500/30">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                          {isPremiumExpired(user) && (
                            <Badge variant="secondary" className="text-xs">
                              Premium expiré
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{user.email}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Inscrit le {formatDate(user.createdAt)}
                          </span>
                          {user.isPremium && user.premiumExpiry && (
                            <span className="text-yellow-500">
                              Premium jusqu'au {formatDate(user.premiumExpiry)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewInventory(user)}
                          className="golden-border"
                          title="Voir l'inventaire et les statistiques"
                        >
                          <Package className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleManagePremium(user)}
                          className="golden-border"
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Premium
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                          className="golden-border"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user)}
                          className="border-red-500/50 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nom</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="golden-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="golden-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Rôle</label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger className="golden-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'utilisateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedUser?.name} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Premium */}
      <Dialog open={isPremiumDialogOpen} onOpenChange={setIsPremiumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer Premium - {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              {selectedUser?.isPremium && !isPremiumExpired(selectedUser)
                ? 'Cet utilisateur possède déjà le statut Premium'
                : 'Accordez le statut Premium à cet utilisateur'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser?.isPremium && selectedUser?.premiumExpiry && (
              <Alert className={isPremiumExpired(selectedUser) ? 'border-red-500/50' : 'border-yellow-500/50'}>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  Premium {isPremiumExpired(selectedUser) ? 'expiré' : 'actif jusqu\'au'}: {formatDate(selectedUser.premiumExpiry)}
                </AlertDescription>
              </Alert>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Durée (jours)</label>
              <Select value={premiumDays.toString()} onValueChange={(value) => setPremiumDays(parseInt(value))}>
                <SelectTrigger className="golden-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 jour (Test)</SelectItem>
                  <SelectItem value="7">7 jours (1 semaine)</SelectItem>
                  <SelectItem value="30">30 jours (1 mois)</SelectItem>
                  <SelectItem value="90">90 jours (3 mois)</SelectItem>
                  <SelectItem value="365">365 jours (1 an)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPremiumDialogOpen(false)}>
              Annuler
            </Button>
            {selectedUser?.isPremium && !isPremiumExpired(selectedUser) && (
              <Button variant="destructive" onClick={handleRevokePremium}>
                Révoquer Premium
              </Button>
            )}
            <Button onClick={handleGrantPremium} className="bg-yellow-500 hover:bg-yellow-600">
              <Crown className="w-4 h-4 mr-1" />
              {selectedUser?.isPremium ? 'Prolonger' : 'Accorder'} Premium
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Inventaire & Statistiques */}
      <UserInventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => {
          setIsInventoryModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
      />
    </div>
  )
}
