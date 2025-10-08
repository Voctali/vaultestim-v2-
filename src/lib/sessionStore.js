/**
 * Store global pour la session Supabase
 * Évite les appels à getSession() qui peuvent bloquer
 */

let currentSession = null

export const setCurrentSession = (session) => {
  currentSession = session
  console.log('📝 Session stockée:', session?.user?.email || 'null')
  console.log('🔑 Access token présent:', !!session?.access_token)

  try {
    if (session?.expires_at) {
      console.log('🔑 Token expires at:', new Date(session.expires_at * 1000).toLocaleString())
    }
    if (session?.access_token) {
      console.log('🔑 Token (premiers 20 chars):', session.access_token.substring(0, 20) + '...')
    }
  } catch (err) {
    console.warn('⚠️ Erreur affichage session:', err)
  }
}

export const getCurrentSession = () => {
  return currentSession
}

export const getCurrentUserId = () => {
  if (!currentSession?.user?.id) {
    throw new Error('Utilisateur non connecté')
  }
  return currentSession.user.id
}
