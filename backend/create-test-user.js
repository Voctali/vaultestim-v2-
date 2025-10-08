import Database from 'better-sqlite3'
import bcrypt from 'bcrypt'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const db = new Database(path.join(__dirname, 'vaultestim.db'))

async function createTestUser() {
  try {
    const email = 'test@test.com'
    const password = 'test123'
    const name = 'Test User'

    // Vérifier si l'utilisateur existe déjà
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existingUser) {
      console.log('✅ Utilisateur test existe déjà')
      console.log('📧 Email:', email)
      console.log('🔑 Mot de passe:', password)
      return
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const stmt = db.prepare(`
      INSERT INTO users (email, password, name, role, isPremium, cardCount, level, createdAt, lastLogin)
      VALUES (?, ?, ?, 'user', 0, 0, 1, datetime('now'), datetime('now'))
    `)
    stmt.run(email, hashedPassword, name)

    console.log('✅ Utilisateur test créé avec succès !')
    console.log('📧 Email:', email)
    console.log('🔑 Mot de passe:', password)
  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error)
  } finally {
    db.close()
  }
}

createTestUser()
