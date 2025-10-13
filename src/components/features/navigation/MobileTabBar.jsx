import { Link, useLocation } from 'react-router-dom'
import { NAVIGATION_ITEMS } from '@/constants/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'

export function MobileTabBar() {
  const [selectedCollectionTab, setSelectedCollectionTab] = useState('all-cards')
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()

  // Items pour la tab bar : Dashboard, Collection, Explorer, Scanner, Statistiques
  const tabBarItemIds = ['dashboard', 'collection', 'explore', 'scanner', 'statistics']

  // Utiliser useMemo pour éviter les re-calculs excessifs
  const mainItems = useMemo(() => {
    // Debug: Logger l'état d'authentification
    console.log('🔍 [MobileTabBar] État auth:', { isAuthenticated, isAdmin, loading })

    // Pendant le chargement, afficher tous les items possibles pour éviter le flash
    if (loading) {
      console.log('⏳ [MobileTabBar] Chargement en cours, affichage de tous les items')
      return NAVIGATION_ITEMS.filter(item => tabBarItemIds.includes(item.id))
    }

    // Récupérer d'abord tous les items de la tab bar
    const allTabBarItems = NAVIGATION_ITEMS.filter(item => tabBarItemIds.includes(item.id))

    // Filtrer selon les permissions avec des vérifications plus robustes
    const filtered = allTabBarItems.filter(item => {
      // Explorer est toujours visible (pas de requiresAuth)
      if (!item.requiresAuth && !item.requiresAdmin && !item.isAdminOnly) return true

      // Si l'item nécessite l'authentification
      if (item.requiresAuth && !isAuthenticated) return false

      // Si l'item nécessite d'être admin
      if (item.requiresAdmin && !isAdmin) return false
      if (item.isAdminOnly && !isAdmin) return false

      return true
    })

    // Debug: Logger les items filtrés
    console.log('🔍 [MobileTabBar] Items visibles:', filtered.map(i => i.id))

    // S'assurer qu'on a toujours au moins Explorer visible
    if (filtered.length === 0) {
      console.warn('⚠️ [MobileTabBar] Aucun item filtré, fallback sur Explorer')
      const exploreItem = NAVIGATION_ITEMS.find(item => item.id === 'explore')
      return exploreItem ? [exploreItem] : []
    }

    return filtered
  }, [isAuthenticated, isAdmin, loading])

  const isItemActive = (item) => {
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.path)
    }
    return location.pathname === item.path
  }

  // Ne rien rendre si aucun item n'est disponible
  if (!mainItems || mainItems.length === 0) {
    console.error('❌ [MobileTabBar] Aucun item à afficher!')
    return null
  }

  return (
    <>
      {/* Tab Bar principale */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {/* Items principaux */}
          {mainItems.map((item) => {
            const Icon = item.icon
            const isActive = isItemActive(item)
            const label = item.id === 'collection' ? 'Collection' :
                         item.id === 'explore' ? 'Explorer' :
                         item.id === 'statistics' ? 'Stats' :
                         item.label

            return (
              <Link
                key={item.id}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-lg transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                    isActive ? "scale-110 mb-1" : ""
                  )}
                  style={{
                    backgroundColor: isActive ? item.color + '20' : 'transparent',
                    color: isActive ? item.color : 'currentColor'
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isActive && (
                  <span className="text-[10px] font-medium text-primary">
                    {label}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
