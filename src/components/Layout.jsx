import { useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/features/navigation/Sidebar'
import { MobileTabBar } from '@/components/features/navigation/MobileTabBar'
import { MobileTopBar } from '@/components/features/navigation/MobileTopBar'
import { useAuth } from '@/hooks/useAuth'
import { PUBLIC_ROUTES } from '@/constants/navigation'

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold golden-glow">Chargement de VaultEstim...</h2>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && !PUBLIC_ROUTES.includes(location.pathname)) {
    return <Navigate to="/login" replace />
  }

  // Protection des routes admin
  if (location.pathname.startsWith('/admin') && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar - Desktop uniquement */}
      <div className="hidden lg:block">
        <Sidebar isOpen={true} onToggle={() => {}} />
      </div>

      {/* Sidebar - Mobile (overlay) */}
      <div className="lg:hidden">
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      </div>

      {/* Top Bar - Mobile uniquement */}
      <MobileTopBar onMenuOpen={() => setIsSidebarOpen(true)} />

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 pt-20 pb-24 lg:pt-6 lg:pb-6 max-w-7xl">
          <Outlet />
        </div>
      </main>

      {/* Tab Bar - Mobile uniquement */}
      <MobileTabBar />
    </div>
  )
}