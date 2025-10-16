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
      const localItem = localStorage.getItem(key)
      const sessionItem = sessionStorage.getItem(key)
      const item = localItem || sessionItem

      console.log(`🔑 [Storage] getItem(${key}):`, item ? 'trouvé ✅' : 'non trouvé ❌')
      if (item && localItem !== sessionItem) {
        console.log(`⚠️ [Storage] Désynchronisation détectée pour ${key}`)
      }

      return item
    } catch (error) {
      console.error('❌ [Storage] Erreur getItem:', key, error)
      return null
    }
  },

  setItem: (key, value) => {
    console.log(`📝 [Storage] setItem appelé pour ${key}`, value ? `(${value.length} chars)` : '(null)')
    try {
      // Écrire dans localStorage
      localStorage.setItem(key, value)
      console.log(`✅ [Storage] localStorage.setItem(${key}): OK`)

      // Écrire dans sessionStorage pour redondance
      sessionStorage.setItem(key, value)
      console.log(`✅ [Storage] sessionStorage.setItem(${key}): OK`)

      console.log(`✅ [Storage] setItem(${key}): sauvegardé avec succès`)
    } catch (error) {
      console.error('❌ [Storage] Erreur setItem complète:', key, error)

      // Fallback: essayer seulement sessionStorage
      try {
        sessionStorage.setItem(key, value)
        console.log(`⚠️ [Storage] Fallback sessionStorage OK pour ${key}`)
      } catch (e) {
        console.error('❌ [Storage] Erreur sessionStorage fallback:', e)
        throw e // Remonter l'erreur pour que Supabase sache que ça a échoué
      }
    }
  },

  removeItem: (key) => {
    console.log(`🗑️ [Storage] removeItem appelé pour ${key}`)
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
      console.log(`✅ [Storage] removeItem(${key}): supprimé`)
    } catch (error) {
      console.error('❌ [Storage] Erreur removeItem:', key, error)
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
