/**
 * Proxy serverless pour l'API Pokemon TCG
 * Contourne les problèmes CORS et timeout des rewrites Vercel
 */

export const config = {
  maxDuration: 60, // 60 secondes max (plan Pro Vercel)
};

export default async function handler(req, res) {
  // Récupérer le chemin depuis l'URL
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;

  // Construire l'URL de l'API Pokemon TCG
  const queryString = new URL(req.url, `http://${req.headers.host}`).search;
  const targetUrl = `https://api.pokemontcg.io/v2/${apiPath}${queryString}`;

  console.log(`🔄 Proxy Pokemon TCG: ${targetUrl}`);

  try {
    // Headers pour l'API Pokemon TCG
    const headers = {
      'Content-Type': 'application/json',
    };

    // Ajouter la clé API si disponible (augmente le rate limit)
    if (process.env.VITE_POKEMON_TCG_API_KEY) {
      headers['X-Api-Key'] = process.env.VITE_POKEMON_TCG_API_KEY;
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
    });

    if (!response.ok) {
      console.error(`❌ API Pokemon TCG error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: `API Pokemon TCG: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();

    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // Cache 5 min

    return res.status(200).json(data);

  } catch (error) {
    console.error(`❌ Proxy error: ${error.message}`);
    return res.status(500).json({
      error: 'Erreur proxy Pokemon TCG API',
      details: error.message
    });
  }
}
