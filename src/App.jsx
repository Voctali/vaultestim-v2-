import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Explore } from '@/pages/Explore'
import { Collection } from '@/pages/Collection'
import { Favorites } from '@/pages/Favorites'
import { Duplicates } from '@/pages/Duplicates'
import { SealedProducts } from '@/pages/SealedProducts'
import { SealedProductsCatalog } from '@/pages/SealedProductsCatalog'
import { Premium } from '@/pages/Premium'
import { Scanner } from '@/pages/Scanner'
import { Admin } from '@/pages/Admin'
import { AdminDatabaseEditor } from '@/pages/AdminDatabaseEditor'
import { AdminUserManagement } from '@/pages/AdminUserManagement'
import { AdminSetup } from '@/pages/AdminSetup'
import { AdminSystem } from '@/pages/AdminSystem'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { ResetPassword } from '@/pages/ResetPassword'
import { DebugAuth } from '@/pages/DebugAuth'
import { Statistics } from '@/pages/Statistics'
import { Friends } from '@/pages/Friends'
import { Settings } from '@/pages/Settings'
import { MigrateToSupabase } from '@/pages/MigrateToSupabase'
import { ImportBackup } from '@/pages/ImportBackup'
import { TestRapidAPIProducts } from '@/pages/TestRapidAPIProducts'
import { AuthProvider } from '@/hooks/useAuth'
import { CollectionProvider } from '@/hooks/useCollection.jsx'
import { SealedProductsProvider } from '@/hooks/useSealedProducts.jsx'
import { CardDatabaseProvider } from '@/hooks/useCardDatabase.jsx'
import { SettingsProvider } from '@/hooks/useSettings'
import { FriendsProvider } from '@/hooks/useFriends'
import { ToastProvider } from '@/hooks/useToast'

function AppContent() {
  const location = useLocation()

  // Page d'import sans providers (évite localStorage plein)
  if (location.pathname === '/import-backup') {
    return <ImportBackup />
  }

  // Toutes les autres pages avec providers
  return (
    <ToastProvider>
      <AuthProvider>
        <CollectionProvider>
          <SealedProductsProvider>
            <CardDatabaseProvider>
              <SettingsProvider>
                <FriendsProvider>
                  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
                <Routes>
				  <Route path="/test-rapidapi-products" element={<TestRapidAPIProducts />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/debug-auth" element={<DebugAuth />} />
                  <Route path="/migrate-supabase" element={<MigrateToSupabase />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="explorer" element={<Explore />} />
                    <Route path="explorer/catalogue-produits-scelles" element={<SealedProductsCatalog />} />
                    <Route path="collection" element={<Collection />} />
                    <Route path="collection/favorites" element={<Favorites />} />
                    <Route path="collection/wishlist" element={<Favorites />} />
                    <Route path="collection/duplicates" element={<Duplicates />} />
                    <Route path="collection/produits-scelles" element={<SealedProducts />} />
                    <Route path="favoris" element={<Favorites />} />
                    <Route path="produits-scelles" element={<SealedProducts />} />
                    <Route path="premium" element={<Premium />} />
                    <Route path="scanner" element={<Scanner />} />
                    <Route path="statistiques" element={<Statistics />} />
                    <Route path="amis" element={<Friends />} />
                    <Route path="parametres" element={<Settings />} />
                    <Route path="admin" element={<Admin />} />
                    <Route path="admin/editeur-base-donnees" element={<AdminDatabaseEditor />} />
                    <Route path="admin/utilisateurs" element={<AdminUserManagement />} />
                    <Route path="admin/roles" element={<AdminSetup />} />
                    <Route path="admin/systeme" element={<AdminSystem />} />
                  </Route>
                </Routes>
                </div>
                </FriendsProvider>
              </SettingsProvider>
            </CardDatabaseProvider>
          </SealedProductsProvider>
        </CollectionProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<AppContent />} />
      </Routes>
    </Router>
  )
}

export default App
