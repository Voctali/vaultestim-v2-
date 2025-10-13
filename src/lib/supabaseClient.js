/**
 * Client Supabase configuré pour VaultEstim
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Variables Supabase manquantes ! Vérifiez votre fichier .env')
}

// IMPORTANT: Nettoyer localStorage UNE SEULE FOIS (migration vers Supabase)
// La storageKey doit être protégée du nettoyage !
const STORAGE_KEY = 'sb-ubphwlmnfjdaiarbihcx-auth-token' // Clé par défaut Supabase
const CLEANUP_DONE_KEY = 'vaultestim_cleanup_done_v2'

if (!localStorage.getItem(CLEANUP_DONE_KEY)) {
  console.log('🧹 Nettoyage localStorage (première fois)...')
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    // Supprimer tout SAUF les clés Supabase (sb-*) et le marqueur de nettoyage
    if (key &&
        !key.startsWith('sb-') &&
        !key.includes('supabase') &&
        key !== CLEANUP_DONE_KEY &&
        key !== STORAGE_KEY) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.warn('⚠️ Erreur suppression:', key)
    }
  })
  // Marquer le nettoyage comme fait
  localStorage.setItem(CLEANUP_DONE_KEY, 'true')
  console.log(`✅ ${keysToRemove.length} clés supprimées de localStorage`)
} else {
  console.log('✅ localStorage déjà nettoyé')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Utiliser la clé par défaut Supabase pour éviter les conflits
    // Format: sb-{project-ref}-auth-token
    storage: localStorage
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
