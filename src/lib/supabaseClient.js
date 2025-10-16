/**
 * Client Supabase configuré pour VaultEstim
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Variables Supabase manquantes ! Vérifiez votre fichier .env')
}

// IMPORTANT: Ne PAS nettoyer localStorage automatiquement
// Cela peut causer des DOMException et empêcher la connexion
// Le nettoyage doit être fait manuellement par l'utilisateur si nécessaire
console.log('✅ Pas de nettoyage automatique localStorage - Configuration stable')

// Custom storage adapter pour plus de fiabilité
const customStorage = {
  getItem: (key) => {
    try {
      // Essayer d'abord localStorage, puis sessionStorage en fallback
      const item = localStorage.getItem(key) || sessionStorage.getItem(key)
      console.log(`🔑 [Storage] getItem(${key}):`, item ? 'trouvé' : 'non trouvé')
      return item
    } catch (error) {
      console.error('❌ [Storage] Erreur getItem:', error)
      return null
    }
  },
  setItem: (key, value) => {
    try {
      // Écrire dans les deux pour redondance
      localStorage.setItem(key, value)
      sessionStorage.setItem(key, value)
      console.log(`✅ [Storage] setItem(${key}): sauvegardé`)
    } catch (error) {
      console.error('❌ [Storage] Erreur setItem:', error)
      // Si localStorage échoue, au moins sauvegarder dans sessionStorage
      try {
        sessionStorage.setItem(key, value)
      } catch (e) {
        console.error('❌ [Storage] Erreur sessionStorage:', e)
      }
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
      console.log(`🗑️ [Storage] removeItem(${key}): supprimé`)
    } catch (error) {
      console.error('❌ [Storage] Erreur removeItem:', error)
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Utiliser notre custom storage adapter pour plus de fiabilité
    // Écrit dans localStorage ET sessionStorage pour redondance
    storage: customStorage
    // Note: On laisse Supabase utiliser sa clé par défaut (sb-{project-ref}-auth-token)
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application': 'VaultEstim-v2'
    }
  }
})

// Helper pour récupérer l'utilisateur courant
export const getCurrentUser = async () => {
  // Utiliser getSession() au lieu de getUser() pour éviter localStorage
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session?.user || null
}

// Helper pour récupérer la session courante
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

console.log('✅ Supabase client initialisé:', supabaseUrl)
