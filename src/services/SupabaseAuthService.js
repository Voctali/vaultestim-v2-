/**
 * Service d'authentification Supabase
 * Remplace ApiAuthService avec authentification multi-appareils
 */
import { supabase } from '@/lib/supabaseClient'
import { setCurrentSession } from '@/lib/sessionStore'

export class SupabaseAuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async register(email, password, name) {
    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      })

      if (authError) throw authError

      // 2. Créer le profil utilisateur étendu
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email,
          name: name || email.split('@')[0],
          role: 'user',
          is_premium: false
        })
        .select()
        .single()

      if (profileError) {
        console.warn('⚠️ Erreur création profil:', profileError)
        // Continuer même si le profil échoue (peut être créé via trigger)
      }

      console.log('✅ Utilisateur créé:', email)

      // Stocker la session dans le sessionStore
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentSession(session)

      return {
        id: authData.user.id,
        email: authData.user.email,
        name: name || email.split('@')[0],
        role: 'user',
        isPremium: false
      }
    } catch (error) {
      console.error('❌ Erreur registration:', error)
      throw new Error(error.message || 'Erreur lors de l\'inscription')
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  static async login(email, password) {
    try {
      console.log('🔐 [Login] Tentative de connexion pour:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ [Login] Erreur Supabase Auth:', error)
        throw error
      }

      console.log('✅ [Login] Authentification Supabase réussie')

      // Stocker la session dans le sessionStore
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentSession(session)

      // Récupérer le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.warn('⚠️ [Login] Profil non trouvé, création...', profileError.message)
        // Si pas de profil, en créer un
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || email.split('@')[0],
            role: 'user',
            is_premium: false
          })
          .select()
          .single()

        console.log('✅ [Login] Nouveau profil créé')
        return {
          id: data.user.id,
          email: data.user.email,
          name: newProfile?.name || email.split('@')[0],
          role: 'user',
          isPremium: false
        }
      }

      console.log('✅ [Login] Connexion réussie:', email)

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        isPremium: profile.is_premium
      }
    } catch (error) {
      // Log détaillé de l'erreur
      console.error('❌ [Login] Erreur complète:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        details: error
      })
      throw new Error(error.message || 'Erreur lors de la connexion')
    }
  }

  /**
   * Récupérer l'utilisateur connecté
   */
  static async getCurrentUser() {
    try {
      console.log('🔐 [SupabaseAuth] Récupération session depuis sessionStore...')

      // Utiliser la session stockée localement (plus rapide, pas de requête Supabase)
      const { getCurrentSession } = await import('@/lib/sessionStore')
      const session = getCurrentSession()

      if (!session?.user) {
        console.log('⚠️ [SupabaseAuth] Pas de session stockée')
        return null
      }

      const user = session.user
      console.log('✅ [SupabaseAuth] Session OK:', user.email)

      // Retourner un profil depuis la session (SANS requête Supabase)
      console.log('📦 [SupabaseAuth] Profil retourné depuis session')
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        role: 'admin', // Par défaut admin
        isPremium: true,
        avatarUrl: null,
        premiumExpiresAt: null
      }
    } catch (error) {
      console.error('❌ Erreur getCurrentUser:', error)
      return null
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  static async updateUser(updates) {
    try {
      // Utiliser getSession() au lieu de getUser() pour éviter localStorage
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Utilisateur non connecté')
      const user = session.user

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          name: updates.name,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Profil mis à jour')

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        isPremium: data.is_premium,
        avatarUrl: data.avatar_url
      }
    } catch (error) {
      console.error('❌ Erreur updateUser:', error)
      throw error
    }
  }

  /**
   * Changer le mot de passe
   */
  static async changePassword(oldPassword, newPassword) {
    try {
      // Supabase ne vérifie pas l'ancien mot de passe par défaut
      // On doit d'abord vérifier la connexion
      // Utiliser getSession() au lieu de getUser() pour éviter localStorage
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Utilisateur non connecté')

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      console.log('✅ Mot de passe changé')
      return { success: true }
    } catch (error) {
      console.error('❌ Erreur changePassword:', error)
      throw error
    }
  }

  /**
   * Déconnexion
   */
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      console.log('✅ Déconnexion réussie')
    } catch (error) {
      console.error('❌ Erreur logout:', error)
      throw error
    }
  }

  /**
   * Réinitialiser le mot de passe (envoi email)
   */
  static async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      console.log('✅ Email de réinitialisation envoyé')
      return { success: true }
    } catch (error) {
      console.error('❌ Erreur resetPassword:', error)
      throw error
    }
  }

  /**
   * Écouter les changements d'authentification
   */
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth event:', event)

      if (session?.user) {
        // Récupérer le profil complet
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }
}
