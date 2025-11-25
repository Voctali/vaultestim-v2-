import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Users, Crown, Calendar, Clock, Database, Shield, UserCog, Palette } from 'lucide-react'

export function Admin() {
  const navigate = useNavigate()

  const premiumPlans = [
    { duration: '1 jour', price: '2.99€', badge: '1j' },
    { duration: '1 semaine', price: '9.99€', badge: '1sem' },
    { duration: '1 mois', price: '29.99€', badge: '1m' },
    { duration: 'Personnalisé', price: 'Variable', badge: 'Custom' }
  ]

  const adminModules = [
    {
      id: 'database',
      title: 'Base de Données',
      description: 'Gérez les blocs, extensions et cartes découvertes',
      icon: Database,
      path: '/admin/base-donnees',
      color: 'border-purple-500/20 hover:bg-purple-500/5',
      iconColor: 'text-purple-500'
    },
    {
      id: 'interface',
      title: 'Gestion de l\'Interface',
      description: 'Personnalisez l\'affichage et les options visuelles',
      icon: Palette,
      path: '/admin/interface',
      color: 'border-amber-500/20 hover:bg-amber-500/5',
      iconColor: 'text-amber-500'
    },
    {
      id: 'users',
      title: 'Gestion Utilisateurs',
      description: 'Administrez les comptes utilisateurs et permissions',
      icon: UserCog,
      path: '/admin/utilisateurs',
      color: 'border-blue-500/20 hover:bg-blue-500/5',
      iconColor: 'text-blue-500'
    },
    {
      id: 'system',
      title: 'Paramètres Système',
      description: 'Configuration et maintenance du système',
      icon: Settings,
      path: '/admin/systeme',
      color: 'border-gray-500/20 hover:bg-gray-500/5',
      iconColor: 'text-gray-500'
    }
  ]

  console.log('🔍 Admin Modules:', adminModules.length, adminModules.map(m => m.title))

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold golden-glow mb-2">
          Administration
        </h1>
        <p className="text-muted-foreground text-lg">
          Gestion de l'application et des utilisateurs
        </p>
      </div>

      {/* Modules Admin */}
      <Card className="golden-border card-hover">
        <CardHeader>
          <CardTitle className="flex items-center golden-glow">
            <Shield className="mr-2 h-5 w-5" />
            Modules d'Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminModules.map((module) => (
              <Card
                key={module.id}
                className={`golden-border cursor-pointer transition-all duration-200 hover:scale-105 ${module.color}`}
                onClick={() => navigate(module.path)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-accent/50">
                        <module.icon className={`w-6 h-6 ${module.iconColor}`} />
                      </div>
                      <h3 className="text-lg font-semibold golden-glow">
                        {module.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                    <div className="flex justify-end">
                      <Badge variant="secondary" className="text-xs">
                        Accéder →
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gestion Premium */}
      <Card className="golden-border card-hover">
        <CardHeader>
          <CardTitle className="flex items-center golden-glow">
            <Crown className="mr-2 h-5 w-5" />
            Gestion Premium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {premiumPlans.map((plan, index) => (
              <Card key={index} className="golden-border">
                <CardContent className="p-4 text-center">
                  <Badge className="mb-2 golden-glow">{plan.badge}</Badge>
                  <h3 className="font-semibold text-foreground">{plan.duration}</h3>
                  <p className="text-2xl font-bold golden-glow">{plan.price}</p>
                  <Button size="sm" className="mt-2 w-full">
                    Attribuer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="golden-border card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilisateurs Total
            </CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold golden-glow">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card className="golden-border card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilisateurs Premium
            </CardTitle>
            <Crown className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold golden-glow">89</div>
            <p className="text-xs text-muted-foreground">
              7.2% du total
            </p>
          </CardContent>
        </Card>

        <Card className="golden-border card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenus Mensuel
            </CardTitle>
            <Calendar className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold golden-glow">2,847€</div>
            <p className="text-xs text-muted-foreground">
              +23% vs mois dernier
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}