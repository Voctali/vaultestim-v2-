/**
 * Vercel Serverless Function - Proxy pour API Pokemon TCG
 *
 * Route : /api/pokemontcg/*
 * Proxifie vers : https://api.pokemontcg.io/*
 *
 * Résout le problème CORS et permet d'utiliser l'API en production
 */

export default async function handler(req, res) {
  // Récupérer le chemin après /api/pokemontcg/
  const pathParts = req.query.path || []
  const path = Array.isArray(pathParts) ? pathParts.join('/') : pathParts

  // Construire l'URL de l'API Pokemon TCG
  const apiUrl = `https://api.pokemontcg.io/${path}`

  // Copier les query parameters (exclure 'path')
  const queryParams = { ...req.query }
  delete queryParams.path

  const queryString = new URLSearchParams(queryParams).toString()
  const fullUrl = queryString ? `${apiUrl}?${queryString}` : apiUrl

  console.log(`[Proxy] ${req.method} ${fullUrl}`)

  try {
    // Headers à transmettre
    const headers = {
      'Content-Type': 'application/json'
    }

    // Ajouter la clé API si disponible
    if (process.env.VITE_POKEMON_TCG_API_KEY) {
      headers['X-Api-Key'] = process.env.VITE_POKEMON_TCG_API_KEY
    }

    // Créer un AbortController avec timeout de 55 secondes
    // (laisse 5s de marge pour le maxDuration de 60s de Vercel)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 55000)

    try {
      // Faire la requête vers l'API Pokemon TCG
      const response = await fetch(fullUrl, {
        method: req.method,
        headers,
        signal: controller.signal
      })

      clearTimeout(timeout)

      // Récupérer le contenu
      const data = await response.json()

      // Retourner avec les bons headers CORS
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key')
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')

      res.status(response.status).json(data)

    } catch (fetchError) {
      clearTimeout(timeout)

      // Gérer timeout spécifiquement
      if (fetchError.name === 'AbortError') {
        console.error('[Proxy] Timeout après 55s')
        return res.status(504).json({
          error: 'Gateway Timeout',
          message: 'L\'API Pokemon TCG met trop de temps à répondre (>55s)'
        })
      }
      throw fetchError
    }

  } catch (error) {
    console.error('[Proxy] Erreur:', error)
    res.status(500).json({
      error: 'Proxy error',
      message: error.message
    })
  }
}
