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
    // Essayer d'abord .png, puis .jpg (les produits utilisent l'un ou l'autre)
    const extensions = ['png', 'jpg']
    let imageResponse = null
    let successUrl = null

    for (const ext of extensions) {
      const imageUrl = `https://product-images.s3.cardmarket.com/${category}/${product}/${product}.${ext}`

      console.log(`🖼️ Trying: ${imageUrl}`)

      imageResponse = await fetch(imageUrl, {
        headers: {
          'Referer': 'https://www.cardmarket.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (imageResponse.ok) {
        successUrl = imageUrl
        console.log(`✅ Image found: ${imageUrl}`)
        break
      }
    }

    // Vérifier si l'image a été trouvée
    if (!imageResponse.ok) {
      console.log(`❌ Image not found for product ${product} (tried .png and .jpg)`)
      return res.status(404).json({
        error: 'Image not found',
        product: product,
        category: category,
        tried: extensions.map(ext => `${product}.${ext}`)
      })
    }

    // Récupérer les données de l'image
    const imageBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)

    console.log(`✅ Image fetched successfully: ${buffer.length} bytes`)

    // Déterminer le Content-Type basé sur l'URL qui a fonctionné
    const contentType = successUrl.endsWith('.png') ? 'image/png' : 'image/jpeg'

    // Headers de cache pour optimiser les performances
    res.setHeader('Content-Type', contentType)
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
