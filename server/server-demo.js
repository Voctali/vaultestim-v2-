/**
 * Serveur démonstration VaultEstim (sans base de données)
 * Version simplifiée pour test interface
 */
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true
}))
app.use(express.json())

// Données mockées pour démonstration - Plus étendues
const mockSets = []

// Template de sets pour génération de test
const mockSetsTemplate = [
  { id: 'sv1', name: 'Scarlet & Violet Base Set', series: 'Scarlet & Violet', release_date: '2023-03-31', card_count: 198 },
  { id: 'sv2', name: 'Paldea Evolved', series: 'Scarlet & Violet', release_date: '2023-06-09', card_count: 193 },
  { id: 'sv3', name: 'Obsidian Flames', series: 'Scarlet & Violet', release_date: '2023-08-11', card_count: 197 },
  { id: 'sv4', name: 'Paradox Rift', series: 'Scarlet & Violet', release_date: '2023-11-03', card_count: 182 },
  { id: 'sv5', name: 'Temporal Forces', series: 'Scarlet & Violet', release_date: '2024-03-22', card_count: 162 },
  { id: 'swsh1', name: 'Sword & Shield Base Set', series: 'Sword & Shield', release_date: '2020-02-07', card_count: 202 },
  { id: 'swsh2', name: 'Rebel Clash', series: 'Sword & Shield', release_date: '2020-05-01', card_count: 192 },
  { id: 'swsh3', name: 'Darkness Ablaze', series: 'Sword & Shield', release_date: '2020-08-14', card_count: 189 },
  { id: 'swsh4', name: 'Vivid Voltage', series: 'Sword & Shield', release_date: '2020-11-13', card_count: 185 },
  { id: 'swsh5', name: 'Battle Styles', series: 'Sword & Shield', release_date: '2021-03-19', card_count: 163 },
  { id: 'swsh6', name: 'Chilling Reign', series: 'Sword & Shield', release_date: '2021-06-18', card_count: 198 },
  { id: 'swsh7', name: 'Evolving Skies', series: 'Sword & Shield', release_date: '2021-08-27', card_count: 203 },
  { id: 'swsh8', name: 'Fusion Strike', series: 'Sword & Shield', release_date: '2021-11-12', card_count: 264 },
  { id: 'swsh9', name: 'Brilliant Stars', series: 'Sword & Shield', release_date: '2022-02-25', card_count: 172 },
  { id: 'swsh10', name: 'Astral Radiance', series: 'Sword & Shield', release_date: '2022-05-27', card_count: 189 }
]

// Générer des cartes mockées pour correspondre aux stats
const generateMockCards = () => {
  const cards = []
  const pokemonNames = [
    'Pikachu', 'Charizard', 'Blastoise', 'Venusaur', 'Mewtwo', 'Mew', 'Alakazam', 'Gengar', 'Dragonite',
    'Zapdos', 'Moltres', 'Articuno', 'Snorlax', 'Gyarados', 'Lapras', 'Eevee', 'Vaporeon', 'Jolteon',
    'Flareon', 'Umbreon', 'Espeon', 'Leafeon', 'Glaceon', 'Sylveon', 'Lucario', 'Garchomp', 'Dialga',
    'Palkia', 'Giratina', 'Arceus', 'Reshiram', 'Zekrom', 'Kyurem', 'Xerneas', 'Yveltal', 'Zygarde',
    'Solgaleo', 'Lunala', 'Necrozma', 'Zacian', 'Zamazenta', 'Eternatus', 'Koraidon', 'Miraidon'
  ]

  const types = ['Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Fighting', 'Dark', 'Steel', 'Fairy', 'Dragon']
  const rarities = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Ultra Rare', 'Secret Rare']

  let cardId = 1

  mockSetsTemplate.forEach(set => {
    for (let i = 1; i <= set.card_count; i++) {
      const pokemonName = pokemonNames[Math.floor(Math.random() * pokemonNames.length)]
      const cardType = types[Math.floor(Math.random() * types.length)]
      const rarity = rarities[Math.floor(Math.random() * rarities.length)]

      cards.push({
        id: `${set.id}-${i.toString().padStart(3, '0')}`,
        name: `${pokemonName}`,
        name_fr: `${pokemonName}`,
        set_id: set.id,
        number: i.toString(),
        supertype: Math.random() > 0.1 ? 'Pokémon' : (Math.random() > 0.5 ? 'Trainer' : 'Energy'),
        types: [cardType],
        hp: Math.floor(Math.random() * 200) + 30,
        rarity: rarity,
        artist: 'Mock Artist',
        images: {
          large: `https://images.pokemontcg.io/${set.id}/${i}_hires.png`,
          small: `https://images.pokemontcg.io/${set.id}/${i}.png`
        },
        set: {
          name: set.name,
          series: set.series,
          release_date: set.release_date
        },
        price: {
          market: Math.random() * 50 + 0.50,
          currency: 'USD',
          updatedAt: new Date().toISOString()
        }
      })
      cardId++
    }
  })

  return cards
}

// Démarrer avec une base vide - les données seront générées seulement si demandé
const mockCards = []

console.log(`📊 Serveur démarré avec base vide: ${mockSets.length} sets, ${mockCards.length} cartes`)

// Fonction pour calculer les stats dynamiquement
const calculateStats = () => {
  // Calculer la distribution des types dynamiquement
  const typesCount = {}
  const raritiesCount = {}

  mockCards.forEach(card => {
    // Compter les types
    if (card.types && Array.isArray(card.types)) {
      card.types.forEach(type => {
        typesCount[type] = (typesCount[type] || 0) + 1
      })
    }

    // Compter les raretés
    if (card.rarity) {
      raritiesCount[card.rarity] = (raritiesCount[card.rarity] || 0) + 1
    }
  })

  // Convertir en tableaux triés
  const types = Object.entries(typesCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10 types

  const rarities = Object.entries(raritiesCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return {
    total_sets: mockSets.length,
    total_cards: mockCards.length,
    recent_prices: Math.floor(mockCards.length * 0.7),
    cards_with_prices: Math.floor(mockCards.length * 0.85),
    last_sync: new Date().toISOString(),
    topSets: mockSets.slice(0, 5).map(set => ({
      name: set.name,
      card_count: set.card_count,
      completion: Math.floor(Math.random() * 30) + 70
    })),
    distribution: {
      types: types.length > 0 ? types : [
        { name: 'Aucune donnée', count: 0 }
      ],
      rarities: rarities.length > 0 ? rarities : [
        { name: 'Aucune donnée', count: 0 }
      ]
    }
  }
}

// Routes API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0-demo',
    services: {
      database: 'mock',
      redis: 'mock',
      sync: 'disabled'
    }
  })
})

app.get('/api/stats', (req, res) => {
  res.json(calculateStats())
})

app.get('/api/sync/status', (req, res) => {
  res.json({
    isRunning: false,
    lastSync: new Date().toISOString(),
    nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    stats: {
      sets: { added: 2, updated: 13, errors: 0 },
      cards: { added: 45, updated: 234, errors: 0 },
      prices: { added: 156, updated: 1667, errors: 0 },
      images: { cached: 89, optimized: 67, errors: 0 }
    }
  })
})

app.post('/api/sync/:type', (req, res) => {
  const { type } = req.params

  setTimeout(() => {
    res.json({
      success: true,
      message: `Synchronisation ${type} terminée`,
      stats: {
        processed: Math.floor(Math.random() * 100) + 50,
        updated: Math.floor(Math.random() * 20) + 10,
        errors: 0
      }
    })
  }, 2000)
})

app.get('/api/sets', (req, res) => {
  res.json({
    data: mockSets,
    pagination: {
      page: 1,
      limit: 50,
      total: mockSets.length,
      hasNext: false
    }
  })
})

app.get('/api/cards', (req, res) => {
  const { page = 1, limit = 50 } = req.query
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const startIndex = (pageNum - 1) * limitNum
  const endIndex = startIndex + limitNum

  const paginatedCards = mockCards.slice(startIndex, endIndex)

  res.json({
    data: paginatedCards,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: mockCards.length,
      hasNext: endIndex < mockCards.length
    }
  })
})

app.get('/api/cards/search', (req, res) => {
  const { query = '', page = 1, limit = 50 } = req.query

  let results = mockCards
  if (query) {
    // Support pour recherche par set avec "set:setId"
    if (query.startsWith('set:')) {
      const setId = query.replace('set:', '').trim()
      results = mockCards.filter(card => card.set_id === setId)
      console.log(`🔍 Recherche par set "${setId}": ${results.length} cartes trouvées`)
    } else {
      // Recherche normale par nom
      results = mockCards.filter(card =>
        card.name.toLowerCase().includes(query.toLowerCase()) ||
        card.name_fr?.toLowerCase().includes(query.toLowerCase())
      )
    }
  }

  res.json({
    data: results,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: results.length,
      hasNext: false
    }
  })
})

app.get('/api/cards/autocomplete', (req, res) => {
  const { query = '', limit = 8 } = req.query

  if (query.length < 2) {
    return res.json({ suggestions: [] })
  }

  const suggestions = mockCards
    .filter(card => card.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, parseInt(limit))
    .map(card => ({
      name: card.name,
      name_fr: card.name_fr,
      image: card.images?.small,
      set: card.set?.name
    }))

  res.json({ suggestions })
})

// Middleware pour traiter les fichiers uploadés
import multer from 'multer'
import fs from 'fs'

// Configuration multer pour gérer les uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

// Routes d'upload de fichiers
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      })
    }

    const { type } = req.body
    console.log(`📁 Upload reçu: ${req.file.originalname} (${type})`)

    // Lire le fichier
    fs.readFile(req.file.path, 'utf8', (err, data) => {
        if (err) {
          console.error('❌ Erreur lecture fichier:', err)
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la lecture du fichier'
          })
        }

        let parsedData = []
        let processed = 0
        let imported = 0
        let errors = 0

        try {
          if (type === 'json') {
            // Parser JSON
            const jsonData = JSON.parse(data)
            parsedData = Array.isArray(jsonData) ? jsonData : [jsonData]
          } else if (type === 'csv') {
            // Parser CSV
            const lines = data.split('\n').filter(line => line.trim())
            if (lines.length === 0) {
              throw new Error('Fichier CSV vide')
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
            parsedData = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
              return headers.reduce((obj, header, index) => {
                obj[header] = values[index] || ''
                return obj
              }, {})
            })
          }

          processed = parsedData.length

          // Traiter chaque carte
          parsedData.forEach(cardData => {
            try {
              // Valider et normaliser la structure de la carte
              const newCard = {
                id: cardData.id || `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: cardData.name || cardData.nom || 'Carte Sans Nom',
                name_fr: cardData.name_fr || cardData.nom_fr || cardData.name || cardData.nom,
                set_id: cardData.set_id || cardData.setId || cardData.extension || 'unknown',
                number: cardData.number || cardData.numero || '0',
                supertype: cardData.supertype || cardData.type || 'Pokémon',
                types: Array.isArray(cardData.types) ? cardData.types :
                       (cardData.types ? [cardData.types] : ['Normal']),
                hp: parseInt(cardData.hp || cardData.pv || 0) || 0,
                rarity: cardData.rarity || cardData.rarete || 'Common',
                artist: cardData.artist || cardData.artiste || 'Artiste Inconnu',
                images: {
                  large: cardData.image_large || cardData.images?.large || '',
                  small: cardData.image_small || cardData.images?.small || ''
                },
                set: {
                  name: cardData.set_name || cardData.extension_nom || 'Extension Inconnue',
                  series: cardData.set_series || cardData.serie || 'Série Inconnue',
                  release_date: cardData.release_date || cardData.date_sortie || new Date().toISOString().split('T')[0]
                },
                price: {
                  market: parseFloat(cardData.price || cardData.prix || Math.random() * 10 + 0.5),
                  currency: 'USD',
                  updatedAt: new Date().toISOString()
                }
              }

              // Vérifier si la carte existe déjà
              const existingIndex = mockCards.findIndex(card => card.id === newCard.id)
              if (existingIndex >= 0) {
                // Mettre à jour la carte existante
                mockCards[existingIndex] = newCard
                console.log(`♻️ Carte mise à jour: ${newCard.name}`)
              } else {
                // Ajouter la nouvelle carte
                mockCards.push(newCard)
                console.log(`➕ Nouvelle carte ajoutée: ${newCard.name}`)
              }

              imported++
            } catch (cardError) {
              console.error(`❌ Erreur traitement carte:`, cardError)
              errors++
            }
          })

          // Nettoyer le fichier temporaire
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.warn('⚠️ Erreur suppression fichier temp:', unlinkErr)
          })

          // Recalculer les stats
          const newStats = {
            total_sets: mockSets.length,
            total_cards: mockCards.length,
            recent_prices: Math.floor(mockCards.length * 0.7),
            cards_with_prices: Math.floor(mockCards.length * 0.85)
          }

          console.log(`✅ Import terminé: ${imported}/${processed} cartes, ${errors} erreurs`)
          console.log(`📊 Nouvelle base: ${mockCards.length} cartes au total`)

          res.json({
            success: true,
            message: `Import réussi: ${imported} cartes ajoutées`,
            processed: {
              total: processed,
              imported: imported,
              errors: errors
            },
            stats: newStats
          })

        } catch (parseError) {
          console.error('❌ Erreur parsing:', parseError)
          res.status(400).json({
            success: false,
            message: `Erreur de parsing: ${parseError.message}`
          })
        }
      })

  } catch (error) {
    console.error('❌ Erreur upload:', error)
    res.status(500).json({
      success: false,
      message: `Erreur serveur: ${error.message}`
    })
  }
})

app.post('/api/upload/validate', (req, res) => {
  // Simulation de validation de fichier
  const { type, data } = req.body

  setTimeout(() => {
    let validation = {
      valid: true,
      errors: [],
      warnings: [],
      preview: null
    }

    if (type === 'json') {
      validation.preview = {
        type: 'cards',
        count: Array.isArray(data) ? data.length : 1,
        sample: Array.isArray(data) ? data.slice(0, 3) : [data]
      }
    } else if (type === 'csv') {
      validation.preview = {
        type: 'cards',
        count: data.totalRows || 0,
        headers: data.headers || [],
        sample: data.preview || []
      }
    }

    res.json(validation)
  }, 1000)
})

app.get('/api/upload/history', (req, res) => {
  // Historique des imports
  const history = [
    {
      id: 1,
      filename: 'pokemon_cards_sv1.json',
      type: 'json',
      uploaded_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      processed: 156,
      imported: 142,
      errors: 14
    },
    {
      id: 2,
      filename: 'card_prices.csv',
      type: 'csv',
      uploaded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      processed: 892,
      imported: 856,
      errors: 36
    }
  ]

  res.json({ data: history })
})

// Route pour vider la base de données
app.delete('/api/database/clear', (req, res) => {
  try {
    console.log('🗑️ Demande de suppression complète de la base de données')

    const originalCardsCount = mockCards.length
    const originalSetsCount = mockSets.length

    // Vider toutes les données
    mockCards.length = 0 // Vider le tableau sans perdre la référence
    mockSets.length = 0  // Vider aussi les sets

    // Régénérer quelques données minimales si souhaité
    const newStats = {
      total_sets: mockSets.length,
      total_cards: mockCards.length,
      recent_prices: 0,
      cards_with_prices: 0,
      last_sync: new Date().toISOString()
    }

    console.log(`✅ Base de données vidée: ${originalCardsCount} cartes et ${originalSetsCount} sets supprimés`)
    console.log(`📊 Nouvelle base: ${mockCards.length} cartes, ${mockSets.length} sets`)

    res.json({
      success: true,
      message: `Base de données vidée avec succès`,
      cleared: {
        cards: originalCardsCount,
        sets: originalSetsCount
      },
      stats: newStats
    })

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
    res.status(500).json({
      success: false,
      message: `Erreur serveur: ${error.message}`
    })
  }
})

// Routes pour l'administration manuelle (AdminService)
app.get('/api/database/sets', (req, res) => {
  res.json({
    data: mockSets,
    total: mockSets.length
  })
})

app.get('/api/database/cards', (req, res) => {
  res.json({
    data: mockCards,
    total: mockCards.length
  })
})

// Routes Admin pour CRUD
app.post('/api/admin/blocks', (req, res) => {
  const blockData = req.body
  console.log('📦 Création bloc:', blockData.name)
  res.json({ success: true, message: 'Bloc créé', data: blockData })
})

app.put('/api/admin/blocks/:id', (req, res) => {
  const { id } = req.params
  const blockData = req.body
  console.log('📝 Mise à jour bloc:', id)
  res.json({ success: true, message: 'Bloc mis à jour', data: blockData })
})

app.delete('/api/admin/blocks/:id', (req, res) => {
  const { id } = req.params
  console.log('🗑️ Suppression bloc:', id)
  res.json({ success: true, message: 'Bloc supprimé' })
})

app.post('/api/admin/sets', (req, res) => {
  const setData = req.body
  console.log('📦 Création extension:', setData.name)
  res.json({ success: true, message: 'Extension créée', data: setData })
})

app.put('/api/admin/sets/:id', (req, res) => {
  const { id } = req.params
  const setData = req.body
  console.log('📝 Mise à jour extension:', id)
  res.json({ success: true, message: 'Extension mise à jour', data: setData })
})

app.delete('/api/admin/sets/:id', (req, res) => {
  const { id } = req.params
  console.log('🗑️ Suppression extension:', id)
  res.json({ success: true, message: 'Extension supprimée' })
})

app.post('/api/admin/cards', (req, res) => {
  const cardData = req.body
  console.log('🃏 Création carte:', cardData.name)
  res.json({ success: true, message: 'Carte créée', data: cardData })
})

app.put('/api/admin/cards/:id', (req, res) => {
  const { id } = req.params
  const cardData = req.body
  console.log('📝 Mise à jour carte:', id)
  res.json({ success: true, message: 'Carte mise à jour', data: cardData })
})

app.delete('/api/admin/cards/:id', (req, res) => {
  const { id } = req.params
  console.log('🗑️ Suppression carte:', id)
  res.json({ success: true, message: 'Carte supprimée' })
})

app.post('/api/admin/sync/:apiSource', (req, res) => {
  const { apiSource } = req.params
  console.log('🔄 Synchronisation avec:', apiSource)
  setTimeout(() => {
    res.json({
      success: true,
      message: `Synchronisation ${apiSource} terminée`,
      stats: { processed: 100, updated: 85, errors: 0 }
    })
  }, 2000)
})

app.get('/api/admin/stats', (req, res) => {
  res.json(calculateStats())
})

app.post('/api/admin/cleanup', (req, res) => {
  console.log('🧹 Nettoyage base de données')
  res.json({
    success: true,
    message: 'Nettoyage terminé',
    cleaned: { orphans: 12, duplicates: 5, cache: 23 }
  })
})

// Route pour générer des données de test
app.post('/api/database/generate-test-data', (req, res) => {
  try {
    console.log('🔄 Génération des données de test...')

    // Vider d'abord
    mockCards.length = 0
    mockSets.length = 0

    // Copier les sets template
    mockSets.push(...mockSetsTemplate)

    // Générer les cartes
    const newCards = generateMockCards()
    mockCards.push(...newCards)

    console.log(`✅ Données de test générées: ${mockSets.length} sets, ${mockCards.length} cartes`)

    res.json({
      success: true,
      message: `Données de test générées avec succès`,
      generated: {
        sets: mockSets.length,
        cards: mockCards.length
      },
      stats: calculateStats()
    })

  } catch (error) {
    console.error('❌ Erreur génération données test:', error)
    res.status(500).json({
      success: false,
      message: `Erreur serveur: ${error.message}`
    })
  }
})

// Proxy PokemonTCG supprimé - utilisation de RapidAPI maintenant

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    path: req.originalUrl,
    method: req.method
  })
})

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur VaultEstim (DEMO) démarré sur le port ${PORT}`)
  console.log(`📡 API disponible sur: http://localhost:${PORT}/api`)
  console.log(`💊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`⚠️  Mode démonstration - données mockées`)
})