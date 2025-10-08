import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordResetService } from '@/services/PasswordResetService'
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [email, setEmail] = useState('')

  useEffect(() => {
    verifyToken()
  }, [token])

  const verifyToken = async () => {
    if (!token) {
      setTokenError('Token manquant')
      setIsVerifying(false)
      return
    }

    try {
      const result = await PasswordResetService.verifyResetToken(token)
      setTokenValid(true)
      setEmail(result.email)
    } catch (error) {
      setTokenError(error.message || 'Token invalide')
    } finally {
      setIsVerifying(false)
    }
  }

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
      await PasswordResetService.resetPassword(token, newPassword)
      setMessage({
        type: 'success',
        text: 'Mot de passe réinitialisé avec succès ! Redirection...'
      })

      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error) {
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

  if (!tokenValid) {
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
                {tokenError}
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
