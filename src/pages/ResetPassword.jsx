import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabaseClient'
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export function ResetPassword() {
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Supabase gère automatiquement le token via le hash de l'URL
    // On vérifie si une session de récupération est active
    const checkSession = async () => {
      try {
        // Attendre un peu pour que Supabase traite le hash
        await new Promise(resolve => setTimeout(resolve, 500))

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Erreur session:', error)
          setSessionError('Erreur lors de la vérification du lien')
          setIsVerifying(false)
          return
        }

        if (session?.user) {
          setSessionValid(true)
          setEmail(session.user.email)
          console.log('✅ Session de récupération valide pour:', session.user.email)
        } else {
          setSessionError('Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.')
        }
      } catch (error) {
        console.error('Erreur vérification session:', error)
        setSessionError('Erreur lors de la vérification du lien')
      } finally {
        setIsVerifying(false)
      }
    }

    // Écouter les événements de récupération de mot de passe
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)

      if (event === 'PASSWORD_RECOVERY') {
        setSessionValid(true)
        setEmail(session?.user?.email || '')
        setIsVerifying(false)
        console.log('✅ Mode récupération de mot de passe activé')
      }
    })

    checkSession()

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    // Validation
    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'Le mot de passe doit contenir au moins 6 caractères'
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Les mots de passe ne correspondent pas'
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Mot de passe réinitialisé avec succès ! Redirection...'
      })

      // Déconnecter et rediriger vers login
      setTimeout(async () => {
        await supabase.auth.signOut()
        navigate('/login')
      }, 2000)
    } catch (error) {
      console.error('Erreur réinitialisation:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Erreur lors de la réinitialisation'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4">
        <Card className="w-full max-w-md golden-border">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Vérification du lien...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sessionValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4">
        <Card className="w-full max-w-md golden-border">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.png"
                alt="VaultEstim"
                className="h-24 w-auto object-contain"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500">
                <strong>Lien invalide ou expiré</strong>
                <br />
                {sessionError}
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Ce lien de réinitialisation n'est plus valide. Il a peut-être expiré ou déjà été utilisé.
              </p>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full golden-border"
              >
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4">
      <Card className="w-full max-w-md golden-border card-hover">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="VaultEstim"
              className="h-24 w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-foreground">
            <Lock className="w-5 h-5" />
            <h2 className="text-2xl font-bold golden-glow">Nouveau mot de passe</h2>
          </div>
          <p className="text-muted-foreground mt-2">
            Compte : {email}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-2 text-foreground">
                Nouveau mot de passe
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="golden-border"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 6 caractères
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-foreground">
                Confirmer le mot de passe
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="golden-border"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/login')}
                className="text-sm text-muted-foreground hover:text-primary"
                disabled={isLoading}
              >
                Retour à la connexion
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
