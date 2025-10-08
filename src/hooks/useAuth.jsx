import { createContext, useContext, useState, useEffect } from 'react'
import { SupabaseAuthService } from '@/services/SupabaseAuthService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔐 [useAuth] Initialisation...')
    const checkAuth = async () => {
      try {
        console.log('🔐 [useAuth] Vérification user...')
        const currentUser = await SupabaseAuthService.getCurrentUser()
        if (currentUser) {
          console.log('✅ [useAuth] User trouvé:', currentUser.email)
          setUser(currentUser)
        } else {
          console.log('⚠️ [useAuth] Pas de user')
        }
      } catch (error) {
        console.error('❌ [useAuth] Erreur vérification auth:', error)
      } finally {
        console.log('✅ [useAuth] setLoading(false) appelé')
        setLoading(false)
      }
    }
    checkAuth()

    // Écouter les changements d'authentification (multi-appareils)
    const { data: authListener } = SupabaseAuthService.onAuthStateChange((newUser) => {
      console.log('🔐 [useAuth] Auth change:', newUser?.email || 'null')
      setUser(newUser)
      setLoading(false)
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const register = async (email, password, name) => {
    try {
      const newUser = await SupabaseAuthService.register(email, password, name)
      setUser(newUser)
      return newUser
    } catch (error) {
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      const authenticatedUser = await SupabaseAuthService.login(email, password)
      setUser(authenticatedUser)
      return authenticatedUser
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    await SupabaseAuthService.logout()
    setUser(null)
  }

  const updateUserProfile = async (updates) => {
    try {
      if (!user?.id) throw new Error('Utilisateur non connecté')
      const updatedUser = await SupabaseAuthService.updateUser(updates)
      setUser(updatedUser)
      return updatedUser
    } catch (error) {
      throw error
    }
  }

  const changePassword = async (oldPassword, newPassword) => {
    try {
      if (!user?.id) throw new Error('Utilisateur non connecté')
      await SupabaseAuthService.changePassword(oldPassword, newPassword)
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateUserProfile,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isPremium: user?.isPremium || false
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}
