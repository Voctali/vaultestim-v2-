import { Home, BookOpen, Heart, List, Copy, Search, Camera, BarChart3, Users, Settings, Crown, LogOut, Database, Shield, UserCog } from "lucide-react"

export const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'Tableau de Bord',
    path: '/',
    icon: Home,
    requiresAuth: true,
    color: '#3B82F6'
  },
  {
    id: 'collection',
    label: 'Ma Collection',
    path: '/collection',
    icon: BookOpen,
    requiresAuth: true,
    color: '#8B5CF6',
    subItems: [
      { id: 'all-cards', label: 'Toutes mes cartes', path: '/collection', icon: BookOpen },
      { id: 'favorites', label: 'Cartes Favorites', path: '/collection/favorites', icon: Heart },
      { id: 'wishlist', label: 'Liste de Souhaits', path: '/collection/wishlist', icon: List },
      { id: 'duplicates', label: 'Doublons', path: '/collection/duplicates', icon: Copy }
    ]
  },
  {
    id: 'explore',
    label: 'Explorer les Séries',
    path: '/explorer',
    icon: Search,
    requiresAuth: false,
    color: '#F97316'
  },
  {
    id: 'scanner',
    label: 'Scanner',
    path: '/scanner',
    icon: Camera,
    requiresAuth: true,
    color: '#EC4899'
  },
  {
    id: 'statistics',
    label: 'Statistiques',
    path: '/statistiques',
    icon: BarChart3,
    requiresAuth: true,
    color: '#EF4444'
  },
  {
    id: 'friends',
    label: 'Mes Amis',
    path: '/amis',
    icon: Users,
    requiresAuth: true,
    color: '#06B6D4'
  },
  {
    id: 'settings',
    label: 'Paramètres',
    path: '/parametres',
    icon: Settings,
    requiresAuth: true,
    color: '#6B7280'
  },
  {
    id: 'admin',
    label: 'Administration',
    path: '/admin',
    icon: Shield,
    requiresAuth: true,
    requiresAdmin: true,
    color: '#8B5CF6',
    subItems: [
      { id: 'database', label: 'Éditeur de Base de Données', path: '/admin/editeur-base-donnees', icon: Database },
      { id: 'users', label: 'Gestion Utilisateurs', path: '/admin/utilisateurs', icon: UserCog },
      { id: 'roles', label: 'Gestion des Rôles', path: '/admin/roles', icon: Shield },
      { id: 'system', label: 'Système', path: '/admin/systeme', icon: Settings }
    ]
  }
]

export const COLLECTION_QUICK_ITEMS = [
  {
    id: 'rare-cards',
    label: 'Cartes Rares',
    value: '4 cartes',
    color: '#F59E0B',
    icon: '⭐'
  },
  {
    id: 'total-value',
    label: 'Valeur totale',
    value: '70€',
    color: '#10B981',
    icon: '💎'
  },
  {
    id: 'total-cards',
    label: 'Total Cartes',
    value: '2 cartes',
    color: '#3B82F6',
    icon: '📚'
  },
  {
    id: 'premium',
    label: 'Premium',
    color: '#F59E0B',
    icon: '👑',
    isPremium: true
  }
]

export const PUBLIC_ROUTES = ['/login', '/register', '/reset-password', '/explorer']