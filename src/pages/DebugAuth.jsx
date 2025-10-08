import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserAuthService } from '@/services/UserAuthService'
import { CheckCircle, AlertCircle, RefreshCw, Trash2, Key } from 'lucide-react'

export function DebugAuth() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [resetEmail, setResetEmail] = useState('')
  const [resetPassword, setResetPassword] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const allUsers = await UserAuthService.getAllUsers()

      // Ajouter les mots de passe pour debug
      await UserAuthService.initDB()
      const transaction = UserAuthService.db.transaction([UserAuthService.STORE_NAME], 'readonly')
      const store = transaction.objectStore(UserAuthService.STORE_NAME)

      const usersWithPasswords = await Promise.all(
        allUsers.map(async (user) => {
          return new Promise((resolve) => {
            const request = store.get(user.id)
            request.onsuccess = () => {
              const fullUser = request.result
              resolve({
                ...user,
                passwordHash: fullUser.password?.substring(0, 20) + '...',
                passwordLength: fullUser.password?.length
              })
            }
            request.onerror = () => resolve(user)
          })
        })
      )

      setUsers(usersWithPasswords)
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async (email, password) => {
    try {
      const user = await UserAuthService.getUserByEmail(email)
      if (!user) {
        setMessage({ type: 'error', text: `Email non trouvé: ${email}` })
        return
      }

      const hashedInput = await UserAuthService.hashPassword(password)

      console.log('=== TEST DE CONNEXION ===')
      console.log('Email:', email)
      console.log('Hash fourni:', hashedInput.substring(0, 30) + '...')
      console.log('Hash stocké:', user.password.substring(0, 30) + '...')
      console.log('Correspondent:', hashedInput === user.password)

      if (hashedInput === user.password) {
        setMessage({ type: 'success', text: '✅ Les identifiants sont corrects!' })
      } else {
        setMessage({ type: 'error', text: '❌ Le mot de passe ne correspond pas' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const forceResetPassword = async (email, newPassword) => {
    try {
      const user = await UserAuthService.getUserByEmail(email)
      if (!user) {
        setMessage({ type: 'error', text: 'Utilisateur non trouvé' })
        return
      }

      const hashedPassword = await UserAuthService.hashPassword(newPassword)

      await UserAuthService.initDB()

      await new Promise((resolve, reject) => {
        const transaction = UserAuthService.db.transaction([UserAuthService.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(UserAuthService.STORE_NAME)

        user.password = hashedPassword
        const request = store.put(user)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      setMessage({ type: 'success', text: `✅ Mot de passe réinitialisé pour ${email}` })
      loadUsers()
      setResetEmail('')
      setResetPassword('')
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const deleteUser = async (userId, email) => {
    if (!confirm(`Supprimer définitivement ${email} ?`)) return

    try {
      await UserAuthService.deleteUser(userId)
      setMessage({ type: 'success', text: `✅ Utilisateur ${email} supprimé` })
      loadUsers()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const clearAllUsers = async () => {
    if (!confirm('⚠️ SUPPRIMER TOUS LES UTILISATEURS ? Cette action est irréversible !')) return
    if (!confirm('Êtes-vous vraiment sûr ?')) return

    try {
      await UserAuthService.initDB()

      await new Promise((resolve, reject) => {
        const transaction = UserAuthService.db.transaction([UserAuthService.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(UserAuthService.STORE_NAME)
        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      setMessage({ type: 'success', text: '✅ Tous les utilisateurs ont été supprimés' })
      loadUsers()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4">
      <div className="w-full max-w-4xl space-y-6">
        <Card className="golden-border">
          <CardHeader>
            <CardTitle className="text-center golden-glow text-3xl">
              🔧 Debug Authentification
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Outils de diagnostic et réparation des comptes utilisateurs
            </p>
          </CardHeader>
        </Card>

        {message.text && (
          <Alert className={message.type === 'success' ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-500' : ''}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Réinitialisation rapide */}
        <Card className="golden-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Réinitialisation forcée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="golden-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nouveau mot de passe</label>
              <Input
                type="text"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="nouveau mot de passe"
                className="golden-border"
              />
            </div>
            <Button
              onClick={() => forceResetPassword(resetEmail, resetPassword)}
              disabled={!resetEmail || !resetPassword}
              className="w-full"
            >
              Réinitialiser le mot de passe
            </Button>
          </CardContent>
        </Card>

        {/* Liste des utilisateurs */}
        <Card className="golden-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Utilisateurs ({users.length})</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={loadUsers}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Recharger
                </Button>
                <Button size="sm" variant="destructive" onClick={clearAllUsers}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Tout supprimer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Chargement...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Aucun utilisateur
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user.id} className="golden-border bg-accent/5">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">{user.name}</span>
                              {user.role === 'admin' && (
                                <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {user.id} | Hash: {user.passwordHash} | Longueur: {user.passwordLength}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Créé: {new Date(user.createdAt).toLocaleString('fr-FR')}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(user.id, user.email)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Input
                            type="password"
                            placeholder="Tester avec ce mot de passe..."
                            className="golden-border"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                testLogin(user.email, e.target.value)
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={(e) => {
                              const input = e.target.closest('.flex').querySelector('input')
                              testLogin(user.email, input.value)
                            }}
                          >
                            Tester
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

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/login'}
            className="golden-border"
          >
            Retour à la connexion
          </Button>
        </div>
      </div>
    </div>
  )
}
