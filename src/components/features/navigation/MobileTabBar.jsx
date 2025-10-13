import { Link, useLocation } from 'react-router-dom'
import { NAVIGATION_ITEMS } from '@/constants/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function MobileTabBar() {
  const [selectedCollectionTab, setSelectedCollectionTab] = useState('all-cards')
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  // Filtrer les items selon les permissions
  const filteredNavItems = NAVIGATION_ITEMS.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false
    if (item.requiresAdmin && !isAdmin) return false
    if (item.isAdminOnly && !isAdmin) return false
    return true
  })

  // Items pour la tab bar : Dashboard, Collection, Explorer, Scanner, Statistiques
  const tabBarItemIds = ['dashboard', 'collection', 'explore', 'scanner', 'statistics']
  const mainItems = filteredNavItems.filter(item => tabBarItemIds.includes(item.id))

  const isItemActive = (item) => {
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.path)
    }
    return location.pathname === item.path
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
