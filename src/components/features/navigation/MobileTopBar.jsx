import { Button } from '@/components/ui/button'
import { Menu, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NAVIGATION_ITEMS } from '@/constants/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function MobileTopBar({ onMenuOpen }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  // Filtrer les items selon les permissions
  const filteredNavItems = NAVIGATION_ITEMS.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false
    if (item.requiresAdmin && !isAdmin) return false
    if (item.isAdminOnly && !isAdmin) return false
    return true
  })

  // Items qui ne sont PAS dans la tab bar
  const tabBarItemIds = ['dashboard', 'collection', 'explore', 'scanner', 'statistics']
  const moreItems = filteredNavItems.filter(item => !tabBarItemIds.includes(item.id))

  const isItemActive = (item) => {
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.path)
    }
    return location.pathname === item.path
  }

  return (
    <>
      {/* Top Bar Mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Bouton Menu à gauche */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuOpen}
            className="h-10 w-10 p-0 hover:bg-primary/10"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo / Titre au centre */}
          <h1 className="text-lg font-semibold golden-glow">VaultEstim</h1>

          {/* Bouton Plus à droite */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMoreOpen(true)}
            className="h-10 w-10 p-0 hover:bg-primary/10"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Dialog "Plus" */}
      <Dialog open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <DialogContent className="golden-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="golden-glow">Plus d'options</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {moreItems.map((item) => {
              const Icon = item.icon
              const isActive = isItemActive(item)

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsMoreOpen(false)}
                  className={cn(
                    "flex items-center w-full px-4 py-3 text-sm rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                    style={{ backgroundColor: item.color + '20', color: item.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
