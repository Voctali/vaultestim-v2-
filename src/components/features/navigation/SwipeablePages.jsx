import { useSwipeable } from 'react-swipeable'
import { useNavigate, useLocation } from 'react-router-dom'
import { NAVIGATION_ITEMS } from '@/constants/navigation'
import { useAuth } from '@/hooks/useAuth'

export function SwipeablePages({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAdmin } = useAuth()

  // Filtrer les items selon les permissions
  const filteredNavItems = NAVIGATION_ITEMS.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false
    if (item.requiresAdmin && !isAdmin) return false
    if (item.isAdminOnly && !isAdmin) return false
    return true
  })

  // Trouver l'index de la page actuelle
  const currentIndex = filteredNavItems.findIndex(item => {
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.path)
    }
    return location.pathname === item.path
  })

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // Swipe gauche = page suivante
      if (currentIndex >= 0 && currentIndex < filteredNavItems.length - 1) {
        const nextItem = filteredNavItems[currentIndex + 1]
        navigate(nextItem.path)
      }
    },
    onSwipedRight: () => {
      // Swipe droite = page précédente
      if (currentIndex > 0) {
        const prevItem = filteredNavItems[currentIndex - 1]
        navigate(prevItem.path)
      }
    },
    trackMouse: false, // Désactiver sur desktop
    trackTouch: true,
    delta: 50, // Distance minimale pour déclencher le swipe
    preventScrollOnSwipe: false,
  })

  return (
    <div {...handlers} className="h-full">
      {children}
    </div>
  )
}
