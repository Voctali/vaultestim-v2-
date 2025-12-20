import { useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validations
    if (!name.trim()) {
      setError('Le nom est requis')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)
    try {
      await register(email, password, name)
      // Afficher le message de confirmation au lieu de rediriger
      setRegistrationSuccess(true)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription')
    } finally {
      setIsLoading(false)
    }
  }

  // Afficher l'écran de succès avec instructions
  if (registrationSuccess) {
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
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <AlertDescription className="text-green-500">
                <strong>Inscription réussie !</strong>
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Vérifiez votre boîte mail
                </h3>
                <p className="text-sm text-muted-foreground">
                  Un email de confirmation a été envoyé à <strong className="text-foreground">{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Cliquez sur le lien dans l'email pour activer votre compte.
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Vous n'avez pas reçu l'email ? Vérifiez vos spams.
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Aller à la connexion
                </Button>
              </div>
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
          <p className="text-muted-foreground">
            Créez votre compte pour gérer votre collection
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-foreground">
                Nom
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                required
                className="golden-border"
              />
            </div>

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
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? 'Inscription...' : 'Créer mon compte'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Déjà un compte ?
              </p>
              <Link to="/login">
                <Button
                  type="button"
                  variant="link"
                  className="text-primary hover:text-primary/80"
                >
                  Se connecter
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
