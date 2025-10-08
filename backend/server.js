import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import db from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' })) // Augmenter la limite pour supporter de gros volumes de cartes
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' })
    }
    req.user = user
    next()
  })
}

// ==================== ROUTES AUTHENTIFICATION ====================

// Inscription
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Tous les champs sont requis' })
    }

    // Vérifier si l'email existe déjà
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim())
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const stmt = db.prepare(`
      INSERT INTO users (email, password, name, role, isPremium, cardCount, level, createdAt, lastLogin)
      VALUES (?, ?, ?, 'user', 0, 0, 1, datetime('now'), datetime('now'))
    `)
    const result = stmt.run(email.toLowerCase().trim(), hashedPassword, name.trim())

    // Récupérer l'utilisateur créé
    const newUser = db.prepare('SELECT id, email, name, role, isPremium, cardCount, level, createdAt FROM users WHERE id = ?').get(result.lastInsertRowid)

    // Générer le token JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ user: newUser, token })
  } catch (error) {
    console.error('❌ Erreur registration:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Connexion
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }

    // Récupérer l'utilisateur
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim())
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    // Mettre à jour lastLogin
    db.prepare('UPDATE users SET lastLogin = datetime(\'now\') WHERE id = ?').run(user.id)

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ user: userWithoutPassword, token })
  } catch (error) {
    console.error('❌ Erreur login:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Vérifier le token (pour auto-login)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, role, isPremium, cardCount, level, createdAt, lastLogin FROM users WHERE id = ?').get(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }
    res.json({ user })
  } catch (error) {
    console.error('❌ Erreur /me:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ==================== ROUTES ADMIN ====================

// Récupérer tous les utilisateurs (admin uniquement)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const currentUser = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id)
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Accès interdit' })
    }

    // Récupérer tous les utilisateurs
    const users = db.prepare('SELECT id, email, name, role, isPremium, cardCount, level, createdAt, lastLogin FROM users ORDER BY createdAt DESC').all()

    res.json({ users })
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Mettre à jour un utilisateur (admin uniquement)
app.put('/api/admin/users/:userId', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const currentUser = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id)
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Accès interdit' })
    }

    const { userId } = req.params
    const { name, email, role, isPremium } = req.body

    // Construire la requête de mise à jour
    const updates = []
    const params = []

    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name.trim())
    }
    if (email !== undefined) {
      updates.push('email = ?')
      params.push(email.toLowerCase().trim())
    }
    if (role !== undefined) {
      updates.push('role = ?')
      params.push(role)
    }
    if (isPremium !== undefined) {
      updates.push('isPremium = ?')
      params.push(isPremium ? 1 : 0)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune mise à jour fournie' })
    }

    params.push(userId)
    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    stmt.run(...params)

    // Récupérer l'utilisateur mis à jour
    const updatedUser = db.prepare('SELECT id, email, name, role, isPremium, cardCount, level, createdAt, lastLogin FROM users WHERE id = ?').get(userId)

    res.json({ user: updatedUser })
  } catch (error) {
    console.error('❌ Erreur mise à jour utilisateur:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Supprimer un utilisateur (admin uniquement)
app.delete('/api/admin/users/:userId', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const currentUser = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id)
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Accès interdit' })
    }

    const { userId } = req.params

    // Ne pas permettre à l'admin de se supprimer lui-même
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' })
    }

    // Supprimer l'utilisateur
    db.prepare('DELETE FROM users WHERE id = ?').run(userId)

    res.json({ message: 'Utilisateur supprimé avec succès' })
  } catch (error) {
    console.error('❌ Erreur suppression utilisateur:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ==================== ROUTES UTILISATEUR ====================

// Mettre à jour le profil
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body
    const userId = req.user.id

    // Si l'email change, vérifier qu'il n'est pas déjà utilisé
    if (email) {
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase().trim(), userId)
      if (existingUser) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' })
      }
    }

    // Construire la requête de mise à jour
    const updates = []
    const params = []

    if (name) {
      updates.push('name = ?')
      params.push(name.trim())
    }
    if (email) {
      updates.push('email = ?')
      params.push(email.toLowerCase().trim())
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune mise à jour fournie' })
    }

    params.push(userId)
    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    stmt.run(...params)

    // Récupérer l'utilisateur mis à jour
    const updatedUser = db.prepare('SELECT id, email, name, role, isPremium, cardCount, level, createdAt, lastLogin FROM users WHERE id = ?').get(userId)

    res.json({ user: updatedUser })
  } catch (error) {
    console.error('❌ Erreur update profile:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Changer le mot de passe
app.put('/api/users/password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    const userId = req.user.id

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' })
    }

    // Récupérer l'utilisateur
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId)
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Vérifier l'ancien mot de passe
    const validPassword = await bcrypt.compare(oldPassword, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' })
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId)

    res.json({ message: 'Mot de passe changé avec succès' })
  } catch (error) {
    console.error('❌ Erreur change password:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ==================== ROUTES MIGRATION ====================

// Migrer la collection
app.post('/api/collection/migrate', authenticateToken, async (req, res) => {
  try {
    const { cards } = req.body
    const userId = req.user.id

    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: 'Format de données invalide' })
    }

    // Pour l'instant, on stocke dans localStorage côté client
    // Plus tard, on pourra créer une table collection dans la DB
    res.json({
      success: true,
      message: `${cards.length} cartes reçues`,
      count: cards.length
    })
  } catch (error) {
    console.error('❌ Erreur migration collection:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Migrer les favoris
app.post('/api/collection/migrate-favorites', authenticateToken, async (req, res) => {
  try {
    const { cards } = req.body
    const userId = req.user.id

    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: 'Format de données invalide' })
    }

    res.json({
      success: true,
      message: `${cards.length} favoris reçus`,
      count: cards.length
    })
  } catch (error) {
    console.error('❌ Erreur migration favoris:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Migrer la wishlist
app.post('/api/collection/migrate-wishlist', authenticateToken, async (req, res) => {
  try {
    const { cards } = req.body
    const userId = req.user.id

    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: 'Format de données invalide' })
    }

    res.json({
      success: true,
      message: `${cards.length} cartes wishlist reçues`,
      count: cards.length
    })
  } catch (error) {
    console.error('❌ Erreur migration wishlist:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Migrer les cartes découvertes
app.post('/api/collection/migrate-discovered', authenticateToken, async (req, res) => {
  try {
    const { cards } = req.body
    const userId = req.user.id

    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: 'Format de données invalide' })
    }

    // Supprimer les anciennes cartes découvertes de cet utilisateur
    db.prepare('DELETE FROM discovered_cards WHERE userId = ?').run(userId)

    // Insérer les nouvelles cartes découvertes
    const stmt = db.prepare('INSERT INTO discovered_cards (userId, cardData) VALUES (?, ?)')
    const insertMany = db.transaction((cardsArray) => {
      for (const card of cardsArray) {
        stmt.run(userId, JSON.stringify(card))
      }
    })
    insertMany(cards)

    res.json({
      success: true,
      message: `${cards.length} cartes découvertes migrées`,
      count: cards.length
    })
  } catch (error) {
    console.error('❌ Erreur migration cartes découvertes:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Migrer la base de données des séries
app.post('/api/collection/migrate-series', authenticateToken, async (req, res) => {
  try {
    const { series } = req.body
    const userId = req.user.id

    if (!series || !Array.isArray(series)) {
      return res.status(400).json({ error: 'Format de données invalide' })
    }

    // Supprimer les anciennes séries de cet utilisateur
    db.prepare('DELETE FROM series_database WHERE userId = ?').run(userId)

    // Insérer les nouvelles séries
    const stmt = db.prepare('INSERT INTO series_database (userId, seriesData) VALUES (?, ?)')
    const insertMany = db.transaction((seriesArray) => {
      for (const serie of seriesArray) {
        stmt.run(userId, JSON.stringify(serie))
      }
    })
    insertMany(series)

    res.json({
      success: true,
      message: `${series.length} séries migrées`,
      count: series.length
    })
  } catch (error) {
    console.error('❌ Erreur migration séries:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Migrer les blocs personnalisés
app.post('/api/collection/migrate-blocks', authenticateToken, async (req, res) => {
  try {
    const { blocks } = req.body
    const userId = req.user.id

    if (!blocks || !Array.isArray(blocks)) {
      return res.status(400).json({ error: 'Format de données invalide' })
    }

    // Supprimer les anciens blocs de cet utilisateur
    db.prepare('DELETE FROM custom_blocks WHERE userId = ?').run(userId)

    // Insérer les nouveaux blocs
    const stmt = db.prepare('INSERT INTO custom_blocks (userId, blockData) VALUES (?, ?)')
    const insertMany = db.transaction((blocksArray) => {
      for (const block of blocksArray) {
        stmt.run(userId, JSON.stringify(block))
      }
    })
    insertMany(blocks)

    res.json({
      success: true,
      message: `${blocks.length} blocs personnalisés migrés`,
      count: blocks.length
    })
  } catch (error) {
    console.error('❌ Erreur migration blocs:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Migrer les extensions personnalisées
app.post('/api/collection/migrate-custom-extensions', authenticateToken, async (req, res) => {
  try {
    const { extensions } = req.body
    const userId = req.user.id

    if (!extensions || !Array.isArray(extensions)) {
      return res.status(400).json({ error: 'Format de données invalide' })
    }

    // Supprimer les anciennes extensions de cet utilisateur
    db.prepare('DELETE FROM custom_extensions WHERE userId = ?').run(userId)

    // Insérer les nouvelles extensions
    const stmt = db.prepare('INSERT INTO custom_extensions (userId, extensionData) VALUES (?, ?)')
    const insertMany = db.transaction((extensionsArray) => {
      for (const extension of extensionsArray) {
        stmt.run(userId, JSON.stringify(extension))
      }
    })
    insertMany(extensions)

    res.json({
      success: true,
      message: `${extensions.length} extensions personnalisées migrées`,
      count: extensions.length
    })
  } catch (error) {
    console.error('❌ Erreur migration extensions:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Récupérer les cartes découvertes
app.get('/api/collection/discovered', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const rows = db.prepare('SELECT cardData FROM discovered_cards WHERE userId = ?').all(userId)
    const cards = rows.map(row => JSON.parse(row.cardData))
    res.json({ cards })
  } catch (error) {
    console.error('❌ Erreur récupération cartes découvertes:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Supprimer toutes les cartes découvertes d'un utilisateur
app.delete('/api/collection/discovered', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const result = db.prepare('DELETE FROM discovered_cards WHERE userId = ?').run(userId)
    console.log(`🗑️ ${result.changes} cartes découvertes supprimées pour userId=${userId}`)
    res.json({ success: true, deleted: result.changes })
  } catch (error) {
    console.error('❌ Erreur suppression cartes découvertes:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Récupérer la base de données des séries
app.get('/api/collection/series', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const rows = db.prepare('SELECT seriesData FROM series_database WHERE userId = ?').all(userId)
    const series = rows.map(row => JSON.parse(row.seriesData))
    res.json({ series })
  } catch (error) {
    console.error('❌ Erreur récupération séries:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Récupérer les blocs personnalisés
app.get('/api/collection/blocks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const rows = db.prepare('SELECT blockData FROM custom_blocks WHERE userId = ?').all(userId)
    const blocks = rows.map(row => JSON.parse(row.blockData))
    res.json({ blocks })
  } catch (error) {
    console.error('❌ Erreur récupération blocs:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Récupérer les extensions personnalisées
app.get('/api/collection/custom-extensions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const rows = db.prepare('SELECT extensionData FROM custom_extensions WHERE userId = ?').all(userId)
    const extensions = rows.map(row => JSON.parse(row.extensionData))
    res.json({ extensions })
  } catch (error) {
    console.error('❌ Erreur récupération extensions:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Rechercher des cartes dans la collection
app.get('/api/collection/search', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { query } = req.query

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Paramètre de recherche manquant' })
    }

    // Récupérer toutes les cartes découvertes
    const rows = db.prepare('SELECT cardData FROM discovered_cards WHERE userId = ?').all(userId)
    const cards = rows.map(row => JSON.parse(row.cardData))

    // Filtrer les cartes selon la requête
    const queryLower = query.toLowerCase().trim()
    const results = cards.filter(card => {
      return card.name?.toLowerCase().includes(queryLower) ||
             card.name_fr?.toLowerCase().includes(queryLower) ||
             card.set?.name?.toLowerCase().includes(queryLower) ||
             card.artist?.toLowerCase().includes(queryLower) ||
             card.types?.some(type => type.toLowerCase().includes(queryLower))
    })

    res.json({ cards: results, count: results.length })
  } catch (error) {
    console.error('❌ Erreur recherche cartes:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Ajouter de nouvelles cartes découvertes (sans doublons)
app.post('/api/collection/add-cards', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { cards } = req.body

    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: 'Format de données invalide' })
    }

    // Récupérer les cartes existantes
    const existingRows = db.prepare('SELECT cardData FROM discovered_cards WHERE userId = ?').all(userId)
    const existingCards = existingRows.map(row => JSON.parse(row.cardData))
    const existingIds = new Set(existingCards.map(card => card.id))

    // Filtrer les nouvelles cartes (éviter doublons)
    const newCards = cards.filter(card => !existingIds.has(card.id))

    if (newCards.length === 0) {
      return res.json({ success: true, added: 0, message: 'Aucune nouvelle carte à ajouter' })
    }

    // Insérer les nouvelles cartes
    const stmt = db.prepare('INSERT INTO discovered_cards (userId, cardData) VALUES (?, ?)')
    const insertMany = db.transaction((cardsArray) => {
      for (const card of cardsArray) {
        stmt.run(userId, JSON.stringify(card))
      }
    })
    insertMany(newCards)

    res.json({ success: true, added: newCards.length, message: `${newCards.length} nouvelles cartes ajoutées` })
  } catch (error) {
    console.error('❌ Erreur ajout cartes:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Mettre à jour une carte existante
app.put('/api/collection/update-card/:cardId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { cardId } = req.params
    const { updates } = req.body

    if (!updates) {
      return res.status(400).json({ error: 'Données de mise à jour manquantes' })
    }

    // Récupérer toutes les cartes
    const rows = db.prepare('SELECT id as rowId, cardData FROM discovered_cards WHERE userId = ?').all(userId)

    // Trouver la carte à mettre à jour
    let updated = false
    for (const row of rows) {
      const card = JSON.parse(row.cardData)
      if (card.id === cardId) {
        // Mettre à jour la carte
        const updatedCard = { ...card, ...updates }
        db.prepare('UPDATE discovered_cards SET cardData = ? WHERE id = ?').run(
          JSON.stringify(updatedCard),
          row.rowId
        )
        updated = true
        break
      }
    }

    if (!updated) {
      return res.status(404).json({ error: 'Carte non trouvée' })
    }

    res.json({ success: true, message: 'Carte mise à jour' })
  } catch (error) {
    console.error('❌ Erreur mise à jour carte:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Supprimer une carte
app.delete('/api/collection/delete-card/:cardId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { cardId } = req.params

    // Récupérer toutes les cartes
    const rows = db.prepare('SELECT id as rowId, cardData FROM discovered_cards WHERE userId = ?').all(userId)

    // Trouver et supprimer la carte
    let deleted = false
    for (const row of rows) {
      const card = JSON.parse(row.cardData)
      if (card.id === cardId) {
        db.prepare('DELETE FROM discovered_cards WHERE id = ?').run(row.rowId)
        deleted = true
        break
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Carte non trouvée' })
    }

    res.json({ success: true, message: 'Carte supprimée' })
  } catch (error) {
    console.error('❌ Erreur suppression carte:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ==================== ROUTES DONNÉES UTILISATEUR ====================

// Collection utilisateur - GET
app.get('/api/user/collection', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const rows = db.prepare('SELECT * FROM user_collection WHERE userId = ?').all(userId)

    const collection = rows.map(row => ({
      ...JSON.parse(row.cardData),
      id: row.id,
      quantity: row.quantity,
      condition: row.condition,
      purchasePrice: row.purchasePrice,
      marketPrice: row.marketPrice,
      dateAdded: row.dateAdded
    }))

    res.json({ collection })
  } catch (error) {
    console.error('❌ Erreur récupération collection:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Collection utilisateur - POST (ajouter une carte)
app.post('/api/user/collection', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { card } = req.body

    if (!card) {
      return res.status(400).json({ error: 'Données manquantes' })
    }

    const stmt = db.prepare(`
      INSERT INTO user_collection (userId, cardData, quantity, condition, purchasePrice, marketPrice, dateAdded)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      userId,
      JSON.stringify(card),
      card.quantity || 1,
      card.condition || null,
      card.purchasePrice || null,
      card.marketPrice || null,
      card.dateAdded || new Date().toISOString()
    )

    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error('❌ Erreur ajout collection:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Collection utilisateur - PUT (mettre à jour une carte)
app.put('/api/user/collection/:cardId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { cardId } = req.params
    const { updates } = req.body

    const stmt = db.prepare(`
      UPDATE user_collection
      SET quantity = ?, condition = ?, purchasePrice = ?, marketPrice = ?, cardData = ?
      WHERE id = ? AND userId = ?
    `)

    stmt.run(
      updates.quantity,
      updates.condition,
      updates.purchasePrice,
      updates.marketPrice,
      JSON.stringify(updates),
      cardId,
      userId
    )

    res.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur mise à jour collection:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Collection utilisateur - DELETE
app.delete('/api/user/collection/:cardId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { cardId } = req.params

    db.prepare('DELETE FROM user_collection WHERE id = ? AND userId = ?').run(cardId, userId)

    res.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur suppression collection:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Favoris - GET
app.get('/api/user/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const rows = db.prepare('SELECT * FROM user_favorites WHERE userId = ?').all(userId)

    const favorites = rows.map(row => ({
      ...JSON.parse(row.cardData),
      id: row.id,
      addedAt: row.addedAt
    }))

    res.json({ favorites })
  } catch (error) {
    console.error('❌ Erreur récupération favoris:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Favoris - POST
app.post('/api/user/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { card } = req.body

    const stmt = db.prepare('INSERT INTO user_favorites (userId, cardData) VALUES (?, ?)')
    const result = stmt.run(userId, JSON.stringify(card))

    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error('❌ Erreur ajout favoris:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Favoris - DELETE
app.delete('/api/user/favorites/:cardId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { cardId } = req.params

    db.prepare('DELETE FROM user_favorites WHERE id = ? AND userId = ?').run(cardId, userId)

    res.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur suppression favoris:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Wishlist - GET
app.get('/api/user/wishlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const rows = db.prepare('SELECT * FROM user_wishlist WHERE userId = ?').all(userId)

    const wishlist = rows.map(row => ({
      ...JSON.parse(row.cardData),
      id: row.id,
      addedAt: row.addedAt
    }))

    res.json({ wishlist })
  } catch (error) {
    console.error('❌ Erreur récupération wishlist:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Wishlist - POST
app.post('/api/user/wishlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { card } = req.body

    const stmt = db.prepare('INSERT INTO user_wishlist (userId, cardData) VALUES (?, ?)')
    const result = stmt.run(userId, JSON.stringify(card))

    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error('❌ Erreur ajout wishlist:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Wishlist - DELETE
app.delete('/api/user/wishlist/:cardId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { cardId } = req.params

    db.prepare('DELETE FROM user_wishlist WHERE id = ? AND userId = ?').run(cardId, userId)

    res.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur suppression wishlist:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Lots de doublons - GET
app.get('/api/user/duplicate-batches', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const rows = db.prepare('SELECT * FROM duplicate_batches WHERE userId = ?').all(userId)

    const batches = rows.map(row => ({
      ...JSON.parse(row.batchData),
      id: row.id,
      createdAt: row.createdAt
    }))

    res.json({ batches })
  } catch (error) {
    console.error('❌ Erreur récupération lots doublons:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Lots de doublons - POST
app.post('/api/user/duplicate-batches', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { batch } = req.body

    const stmt = db.prepare('INSERT INTO duplicate_batches (userId, batchData) VALUES (?, ?)')
    const result = stmt.run(userId, JSON.stringify(batch))

    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error('❌ Erreur ajout lot doublons:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Lots de doublons - PUT
app.put('/api/user/duplicate-batches/:batchId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { batchId } = req.params
    const { batch } = req.body

    const stmt = db.prepare('UPDATE duplicate_batches SET batchData = ? WHERE id = ? AND userId = ?')
    stmt.run(JSON.stringify(batch), batchId, userId)

    res.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur mise à jour lot doublons:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Lots de doublons - DELETE
app.delete('/api/user/duplicate-batches/:batchId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { batchId } = req.params

    db.prepare('DELETE FROM duplicate_batches WHERE id = ? AND userId = ?').run(batchId, userId)

    res.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur suppression lot doublons:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Ventes - GET
app.get('/api/user/sales', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const rows = db.prepare('SELECT * FROM sales WHERE userId = ? ORDER BY saleDate DESC').all(userId)

    const sales = rows.map(row => ({
      ...JSON.parse(row.saleData),
      id: row.id,
      saleDate: row.saleDate
    }))

    res.json({ sales })
  } catch (error) {
    console.error('❌ Erreur récupération ventes:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Ventes - POST
app.post('/api/user/sales', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { sale } = req.body

    const stmt = db.prepare('INSERT INTO sales (userId, saleData, saleDate) VALUES (?, ?, ?)')
    const result = stmt.run(
      userId,
      JSON.stringify(sale),
      sale.saleDate || new Date().toISOString()
    )

    res.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error('❌ Erreur ajout vente:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Ventes - DELETE
app.delete('/api/user/sales/:saleId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { saleId } = req.params

    db.prepare('DELETE FROM sales WHERE id = ? AND userId = ?').run(saleId, userId)

    res.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur suppression vente:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend VaultEstim opérationnel' })
})

// Configuration HTTPS avec les certificats mkcert
const sslOptions = {
  key: fs.readFileSync(path.resolve(__dirname, '../localhost+2-key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, '../localhost+2.pem'))
}

// Démarrer le serveur HTTPS
https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur backend HTTPS démarré sur https://0.0.0.0:${PORT}`)
  console.log(`📱 Accessible sur le réseau local à https://192.168.50.137:${PORT}`)
})
