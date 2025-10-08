import { Link, useLocation } from 'react-router-dom'
import { NAVIGATION_ITEMS } from '@/constants/navigation'
import { cn } from '@/lib/utils'

export function CollectionTabs() {
  const location = useLocation()

  // Récupérer les sous-items de Collection
  const collectionItem = NAVIGATION_ITEMS.find(item => item.id === 'collection')
  const subItems = collectionItem?.subItems || []

  return (
    <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {subItems.map((subItem) => {
        const SubIcon = subItem.icon
        const isActive = location.pathname === subItem.path

        return (
          <Link
            key={subItem.id}
            to={subItem.path}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap border",
              isActive
                ? "bg-primary/10 text-primary border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-border"
            )}
          >
            <SubIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{subItem.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
