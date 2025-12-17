/**
 * Proxy serverless pour l'API Pokemon TCG
 * Route: /api/pokemontcg/v2/*
 */

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  // Récupérer le chemin depuis l'URL
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : (path || '');

  // Construire l'URL de l'API Pokemon TCG
  const url = new URL(req.url, `https://${req.headers.host}`);
  const queryString = url.search;
  const targetUrl = `https://api.pokemontcg.io/v2/${apiPath}${queryString}`;

  console.log(`[Pokemon TCG Proxy] ${req.method} ${targetUrl}`);

  try {
    // Headers pour l'API Pokemon TCG
    const headers = {
      'Content-Type': 'application/json',
    };

    // Ajouter la clé API si disponible
    if (process.env.VITE_POKEMON_TCG_API_KEY) {
      headers['X-Api-Key'] = process.env.VITE_POKEMON_TCG_API_KEY;
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
    });

    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');

    if (!response.ok) {
      console.error(`[Pokemon TCG Proxy] Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Pokemon TCG API: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();

    // Cache 5 min pour les sets, 1 min pour les cards
    const cacheTime = apiPath.includes('sets') ? 300 : 60;
    res.setHeader('Cache-Control', `s-maxage=${cacheTime}, stale-while-revalidate`);

    return res.status(200).json(data);

  } catch (error) {
    console.error(`[Pokemon TCG Proxy] Error: ${error.message}`);
    return res.status(500).json({
      error: 'Proxy error',
      details: error.message
    });
  }
}
