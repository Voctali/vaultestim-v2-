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
