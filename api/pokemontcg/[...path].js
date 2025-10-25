/**
 * Vercel Serverless Function - Proxy pour l'API Pokemon TCG
 *
 * Route: /api/pokemontcg/* (catch-all)
 * Permet de contourner les problèmes CORS et d'augmenter le timeout
 * Timeout : 60 secondes (vs 10s pour les rewrites directs)
 */

export const config = {
  maxDuration: 60, // Timeout de 60 secondes (max pour Vercel gratuit)
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key')
    return res.status(200).end()
  }

  // Extraire le path depuis les query params de Vercel
  const { path } = req.query
  const pathSegments = Array.isArray(path) ? path.join('/') : path || ''

  // Construire l'URL complète vers l'API Pokemon TCG
  const queryString = new URL(req.url, `https://${req.headers.host}`).search
  const apiUrl = `https://api.pokemontcg.io/${pathSegments}${queryString}`

  console.log(`🔗 Proxy API Pokemon TCG: ${apiUrl}`)

  try {
    // Préparer les headers pour l'API
    const headers = {
      'Content-Type': 'application/json',
    }

    // Ajouter la clé API si disponible
    if (process.env.VITE_POKEMON_TCG_API_KEY) {
      headers['X-Api-Key'] = process.env.VITE_POKEMON_TCG_API_KEY
    }

    // Faire la requête vers l'API Pokemon TCG avec timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 55000) // 55s timeout

    const apiResponse = await fetch(apiUrl, {
      method: req.method,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    // Récupérer les données
    const data = await apiResponse.json()

    // Définir les headers CORS et cache
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key')
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200')

    // Retourner la réponse
    return res.status(apiResponse.status).json(data)

  } catch (error) {
    console.error('❌ Erreur Proxy API Pokemon TCG:', error.message)

    // Définir les headers CORS même en cas d'erreur
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key')

    // Gérer les erreurs de timeout/abort
    if (error.name === 'AbortError' || error.message.includes('aborted')) {
      return res.status(504).json({
        error: 'Gateway Timeout',
        message: 'L\'API Pokemon TCG a mis trop de temps à répondre (> 55s)'
      })
    }

    // Autres erreurs
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}
