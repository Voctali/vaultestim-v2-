import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { PasswordResetService } from '@/services/PasswordResetService'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' })
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (error) {
      console.error('Erreur de connexion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMessage({ type: '', text: '' })

    try {
      const result = await PasswordResetService.requestPasswordReset(resetEmail)
      setResetMessage({
        type: 'success',
        text: `Un email de réinitialisation a été envoyé à ${resetEmail}. Veuillez vérifier votre boîte de réception.`
      })
      setTimeout(() => {
        setIsForgotPasswordOpen(false)
        setResetEmail('')
        setResetMessage({ type: '', text: '' })
      }, 3000)
    } catch (error) {
      setResetMessage({
        type: 'error',
        text: error.message || 'Erreur lors de l\'envoi de l\'email'
      })
    } finally {
      setResetLoading(false)
    }
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
          <p className="text-muted-foreground">
            Connectez-vous à votre collection Pokémon
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="golden-border"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="golden-border"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Mot de passe oublié ?
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Pas de compte ?
              </p>
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/register')}
                className="text-primary hover:text-primary/80"
              >
                Créer un compte
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dialog Mot de passe oublié */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="golden-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 golden-glow">
              <Mail className="w-5 h-5" />
              Mot de passe oublié
            </DialogTitle>
            <DialogDescription>
              Entrez votre adresse email pour recevoir un lien de réinitialisation de mot de passe
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword}>
            <div className="space-y-4 py-4">
              {resetMessage.text && (
                <Alert className={resetMessage.type === 'success' ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}>
                  {resetMessage.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription className={resetMessage.type === 'success' ? 'text-green-500' : ''}>
                    {resetMessage.text}
                  </AlertDescription>
                </Alert>
              )}
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium mb-2">
                  Adresse email
                </label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="golden-border"
                  disabled={resetLoading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsForgotPasswordOpen(false)
                  setResetEmail('')
                  setResetMessage({ type: '', text: '' })
                }}
                disabled={resetLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={resetLoading}>
                {resetLoading ? 'Envoi...' : 'Envoyer le lien'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}