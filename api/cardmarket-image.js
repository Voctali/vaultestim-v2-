/**
 * Vercel Serverless Function - Proxy pour images CardMarket
 *
 * Les images S3 de CardMarket sont protégées par referer (403 sans referer cardmarket.com)
 * Cette fonction contourne la protection en récupérant l'image côté serveur avec les bons headers
 *
 * Usage: /api/cardmarket-image?category={id_category}&product={id_product}
 * Exemple: /api/cardmarket-image?category=1016&product=692101
 */

export default async function handler(req, res) {
  // Extraire les paramètres
  const { category, product } = req.query

  // Validation des paramètres
  if (!category || !product) {
    return res.status(400).json({
      error: 'Missing required parameters',
      usage: '/api/cardmarket-image?category={id_category}&product={id_product}'
    })
  }

  try {
    // Construire l'URL S3 CardMarket
    const imageUrl = `https://product-images.s3.cardmarket.com/${category}/${product}/${product}.png`

    console.log(`🖼️ Fetching image: ${imageUrl}`)

    // Récupérer l'image avec le referer CardMarket
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'Referer': 'https://www.cardmarket.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    // Vérifier si l'image existe
    if (!imageResponse.ok) {
      console.log(`❌ Image not found: ${imageUrl} (${imageResponse.status})`)
      return res.status(404).json({
        error: 'Image not found',
        url: imageUrl,
        status: imageResponse.status
      })
    }

    // Récupérer les données de l'image
    const imageBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)

    console.log(`✅ Image fetched successfully: ${buffer.length} bytes`)

    // Headers de cache pour optimiser les performances
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=86400') // Cache 24h
    res.setHeader('Access-Control-Allow-Origin', '*') // CORS

    // Renvoyer l'image
    return res.status(200).send(buffer)

  } catch (error) {
    console.error(`❌ Error proxying image:`, error)
    return res.status(500).json({
      error: 'Failed to fetch image',
      message: error.message
    })
  }
}
