/**
 * Proxy serverless pour l'API Pokemon TCG
 * Route: /api/pokemontcg?path=...
 */

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  // Récupérer le chemin depuis le query param
  const apiPath = req.query.path || '';

  // Reconstruire les autres query params (sauf 'path')
  const url = new URL(req.url, `https://${req.headers.host}`);
  const params = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (key !== 'path') {
      params.append(key, value);
    }
  }
  const queryString = params.toString() ? `?${params.toString()}` : '';

  const targetUrl = `https://api.pokemontcg.io/v2/${apiPath}${queryString}`;

  console.log(`[Pokemon TCG Proxy] ${req.method} ${targetUrl}`);

  // Headers CORS pour OPTIONS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');
    return res.status(200).end();
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (process.env.VITE_POKEMON_TCG_API_KEY) {
      headers['X-Api-Key'] = process.env.VITE_POKEMON_TCG_API_KEY;
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Pokemon TCG Proxy] Error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({
        error: `Pokemon TCG API: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();

    // Cache
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
