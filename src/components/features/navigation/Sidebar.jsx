import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NAVIGATION_ITEMS, COLLECTION_QUICK_ITEMS } from '@/constants/navigation'
import { getUserLevel } from '@/constants/userLevels'
import { useAuth } from '@/hooks/useAuth'
import { ChevronDown, ChevronRight, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar({ isOpen, onToggle }) {
  const [expandedItems, setExpandedItems] = useState({ collection: true })
  const { user, isAuthenticated, isAdmin, isPremium, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const userLevel = user ? getUserLevel(user.cardCount || 0) : null

  const filteredNavItems = NAVIGATION_ITEMS.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false
    if (item.requiresAdmin && !isAdmin) return false
    if (item.isAdminOnly && !isAdmin) return false
    return true
  })

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const isItemActive = (item, subItem = null) => {
    if (subItem) {
      return location.pathname === subItem.path
    }
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.path)
    }
    return location.pathname === item.path
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-background border-r border-border h-full flex flex-col transition-transform duration-300 font-inter",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      {/* Header avec bouton fermer (mobile uniquement) */}
      <div className="lg:hidden p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold golden-glow">Menu</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* User Profile */}
      {isAuthenticated && user && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-yellow-400 flex items-center justify-center text-primary-foreground font-semibold">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="mb-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              NAVIGATION
            </h3>
            <ul className="space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = isItemActive(item)
                const isExpanded = expandedItems[item.id]

                return (
                  <li key={item.id}>
                    <div className="flex items-center">
                      {item.subItems ? (
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className={cn(
                            "flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <div className="flex items-center">
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center mr-3"
                              style={{ backgroundColor: item.color + '20', color: item.color }}
                            >
                              <Icon className="w-3 h-3" />
                            </div>
                            <span className="font-medium">{item.label}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </button>
                      ) : (
                        <Link
                          to={item.path}
                          className={cn(
                            "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center mr-3"
                            style={{ backgroundColor: item.color + '20', color: item.color }}
                          >
                            <Icon className="w-3 h-3" />
                          </div>
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      )}
                    </div>

                    {/* Sub Items */}
                    {item.subItems && isExpanded && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = isItemActive(item, subItem)

                          return (
                            <li key={subItem.id}>
                              <Link
                                to={subItem.path}
                                className={cn(
                                  "flex items-center px-3 py-1.5 text-sm rounded-md transition-colors",
                                  isSubActive
                                    ? "bg-accent text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                )}
                              >
                                <SubIcon className="w-3 h-3 mr-2" />
                                <span>{subItem.label}</span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Collection rapide */}
          {isAuthenticated && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                COLLECTION RAPIDE
              </h3>
              <div className="space-y-2">
                {COLLECTION_QUICK_ITEMS.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center mr-2 text-xs"
                        style={{ backgroundColor: item.color + '20', color: item.color }}
                      >
                        {item.icon}
                      </div>
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    {item.isPremium ? (
                      <Button size="sm" className="h-6 text-xs bg-yellow-500 hover:bg-yellow-600">
                        <span className="mr-1">👑</span>
                        Premium
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-foreground">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      {isAuthenticated && (
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center mr-3"
              style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
            >
              <LogOut className="w-3 h-3" />
            </div>
            <span className="font-medium">Déconnexion</span>
          </Button>
        </div>
      )}
    </div>
    </>
  )
}