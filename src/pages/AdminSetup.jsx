import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserAuthService } from '@/services/UserAuthService'
import { Shield, CheckCircle, Users } from 'lucide-react'

export function AdminSetup() {
  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const allUsers = await UserAuthService.getAllUsers()
      setUsers(allUsers)
    } catch (error) {
      setMessage('❌ Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  const promoteToAdmin = async (email) => {
    try {
      const user = await UserAuthService.getUserByEmail(email)
      if (!user) {
        setMessage(`❌ Utilisateur non trouvé: ${email}`)
        return
      }

      await UserAuthService.updateUser(user.id, { role: 'admin' })
      setMessage(`✅ ${user.name} a été promu administrateur!`)
      loadUsers()
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`)
    }
  }

  const demoteToUser = async (email) => {
    try {
      const user = await UserAuthService.getUserByEmail(email)
      if (!user) {
        setMessage(`❌ Utilisateur non trouvé: ${email}`)
        return
      }

      await UserAuthService.updateUser(user.id, { role: 'user' })
      setMessage(`✅ ${user.name} a été rétrogradé en utilisateur`)
      loadUsers()
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`)
    }
  }

  const promoteVoctali = async () => {
    const voctaliUser = users.find(u =>
      u.name.toLowerCase().includes('voctali') ||
      u.email.toLowerCase().includes('voctali')
    )

    if (voctaliUser) {
      await promoteToAdmin(voctaliUser.email)
    } else {
      setMessage('❌ Aucun utilisateur "voctali" trouvé')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold golden-glow mb-2">
          Configuration des Rôles
        </h1>
        <p className="text-muted-foreground text-lg">
          Gestion des rôles administrateurs
        </p>
      </div>

      {message && (
        <Alert className={message.includes('✅') ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="flex items-center golden-glow">
            <Shield className="mr-2 h-5 w-5" />
            Action Rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={promoteVoctali}
            size="lg"
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            <Shield className="mr-2 h-5 w-5" />
            Promouvoir Voctali en Administrateur
          </Button>
        </CardContent>
      </Card>

      <Card className="golden-border">
        <CardHeader>
          <CardTitle className="flex items-center golden-glow">
            <Users className="mr-2 h-5 w-5" />
            Tous les Utilisateurs ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Chargement...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Aucun utilisateur</div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <Card key={user.id} className="golden-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{user.name}</span>
                          {user.role === 'admin' && (
                            <Badge variant="destructive" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="flex gap-2">
                        {user.role === 'admin' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => demoteToUser(user.email)}
                            className="border-red-500/50"
                          >
                            Rétrograder
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => promoteToAdmin(user.email)}
                            className="border-green-500/50"
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            Promouvoir Admin
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
