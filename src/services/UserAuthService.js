/**
 * Service d'authentification et gestion des utilisateurs
 * Utilise IndexedDB pour stocker les comptes utilisateurs de manière persistante
 */

export class UserAuthService {
  static DB_NAME = 'VaultEstim_Users'
  static DB_VERSION = 1
  static STORE_NAME = 'users'
  static db = null

  /**
   * Initialiser la base de données utilisateurs
   */
  static async initDB() {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => {
        console.error('❌ Erreur ouverture DB utilisateurs:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ DB utilisateurs initialisée')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        console.log('🔄 Création structure DB utilisateurs...')

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const userStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true })
          userStore.createIndex('email', 'email', { unique: true })
          userStore.createIndex('createdAt', 'createdAt', { unique: false })
          console.log('👥 Store utilisateurs créé')
        }
      }
    })
  }

  /**
   * Hasher un mot de passe (version simple - dans un vrai projet, utiliser bcrypt côté serveur)
   */
  static async hashPassword(password) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Créer un nouveau compte utilisateur
   */
  static async register(email, password, name) {
    try {
      await this.initDB()

      // Vérifier si l'email existe déjà
      const existingUser = await this.getUserByEmail(email)
      if (existingUser) {
        throw new Error('Cet email est déjà utilisé')
      }

      // Hasher le mot de passe
      const hashedPassword = await this.hashPassword(password)

      // Créer le nouvel utilisateur
      const newUser = {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        role: 'user',
        isPremium: false,
        cardCount: 0,
        level: 1,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(this.STORE_NAME)
        const request = store.add(newUser)

        transaction.onerror = () => {
          console.error('❌ Erreur transaction:', transaction.error)
          reject(new Error('Erreur transaction IndexedDB'))
        }

        request.onsuccess = () => {
          const userId = request.result
          const userWithId = { ...newUser, id: userId }
          delete userWithId.password // Ne pas retourner le mot de passe
          console.log('✅ Utilisateur créé:', email)
          resolve(userWithId)
        }

        request.onerror = () => {
          console.error('❌ Erreur création utilisateur:', request.error)
          reject(new Error('Erreur lors de la création du compte'))
        }
      })
    } catch (error) {
      console.error('❌ Erreur registration:', error)
      throw error
    }
  }

  /**
   * Récupérer un utilisateur par email
   */
  static async getUserByEmail(email) {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readonly')
        const store = transaction.objectStore(this.STORE_NAME)
        const index = store.index('email')
        const request = index.get(email.toLowerCase().trim())

        request.onsuccess = () => {
          resolve(request.result || null)
        }

        request.onerror = () => {
          console.error('❌ Erreur récupération utilisateur:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur getUserByEmail:', error)
      return null
    }
  }

  /**
   * Authentifier un utilisateur
   */
  static async login(email, password) {
    try {
      await this.initDB()

      // Récupérer l'utilisateur
      const user = await this.getUserByEmail(email)
      if (!user) {
        throw new Error('Email ou mot de passe incorrect')
      }

      // Vérifier le mot de passe
      const hashedPassword = await this.hashPassword(password)
      if (user.password !== hashedPassword) {
        throw new Error('Email ou mot de passe incorrect')
      }

      // Mettre à jour la date de dernière connexion
      await this.updateLastLogin(user.id)

      // Retourner l'utilisateur sans le mot de passe
      const { password: _, ...userWithoutPassword } = user
      console.log('✅ Connexion réussie:', email)
      return userWithoutPassword
    } catch (error) {
      console.error('❌ Erreur login:', error)
      throw error
    }
  }

  /**
   * Mettre à jour la date de dernière connexion
   */
  static async updateLastLogin(userId) {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(this.STORE_NAME)
        const getRequest = store.get(userId)

        getRequest.onsuccess = () => {
          const user = getRequest.result
          if (user) {
            user.lastLogin = new Date().toISOString()
            const updateRequest = store.put(user)
            updateRequest.onsuccess = () => resolve()
            updateRequest.onerror = () => reject(updateRequest.error)
          } else {
            resolve()
          }
        }

        getRequest.onerror = () => reject(getRequest.error)
      })
    } catch (error) {
      console.error('❌ Erreur updateLastLogin:', error)
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  static async updateUser(userId, updates) {
    try {
      await this.initDB()

      return new Promise(async (resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(this.STORE_NAME)
        const getRequest = store.get(userId)

        getRequest.onsuccess = async () => {
          const user = getRequest.result
          if (!user) {
            reject(new Error('Utilisateur introuvable'))
            return
          }

          // Si l'email change, vérifier qu'il n'est pas déjà utilisé
          if (updates.email && updates.email !== user.email) {
            const existingUser = await this.getUserByEmail(updates.email)
            if (existingUser && existingUser.id !== userId) {
              reject(new Error('Cet email est déjà utilisé'))
              return
            }
            user.email = updates.email.toLowerCase().trim()
          }

          // Appliquer les autres mises à jour (sans toucher au mot de passe, id, createdAt)
          const { password, email, id, createdAt, ...allowedUpdates } = updates
          Object.assign(user, allowedUpdates)

          const updateRequest = store.put(user)
          updateRequest.onsuccess = () => {
            const { password: _, ...userWithoutPassword } = user
            console.log('✅ Utilisateur mis à jour:', userId)
            resolve(userWithoutPassword)
          }
          updateRequest.onerror = () => reject(updateRequest.error)
        }

        getRequest.onerror = () => reject(getRequest.error)
      })
    } catch (error) {
      console.error('❌ Erreur updateUser:', error)
      throw error
    }
  }

  /**
   * Changer le mot de passe
   */
  static async changePassword(userId, oldPassword, newPassword) {
    try {
      await this.initDB()

      return new Promise(async (resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(this.STORE_NAME)
        const getRequest = store.get(userId)

        getRequest.onsuccess = async () => {
          const user = getRequest.result
          if (!user) {
            reject(new Error('Utilisateur introuvable'))
            return
          }

          // Vérifier l'ancien mot de passe
          const oldHashedPassword = await this.hashPassword(oldPassword)
          if (user.password !== oldHashedPassword) {
            reject(new Error('Ancien mot de passe incorrect'))
            return
          }

          // Hasher et sauvegarder le nouveau mot de passe
          user.password = await this.hashPassword(newPassword)
          const updateRequest = store.put(user)

          updateRequest.onsuccess = () => {
            console.log('✅ Mot de passe changé:', userId)
            resolve()
          }
          updateRequest.onerror = () => reject(updateRequest.error)
        }

        getRequest.onerror = () => reject(getRequest.error)
      })
    } catch (error) {
      console.error('❌ Erreur changePassword:', error)
      throw error
    }
  }

  /**
   * Supprimer un compte utilisateur
   */
  static async deleteUser(userId) {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(this.STORE_NAME)
        const request = store.delete(userId)

        request.onsuccess = () => {
          console.log('✅ Utilisateur supprimé:', userId)
          resolve()
        }

        request.onerror = () => {
          console.error('❌ Erreur suppression utilisateur:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur deleteUser:', error)
      throw error
    }
  }

  /**
   * Récupérer tous les utilisateurs (admin uniquement)
   */
  static async getAllUsers() {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readonly')
        const store = transaction.objectStore(this.STORE_NAME)
        const request = store.getAll()

        request.onsuccess = () => {
          // Retirer les mots de passe
          const users = request.result.map(user => {
            const { password, ...userWithoutPassword } = user
            return userWithoutPassword
          })
          resolve(users)
        }

        request.onerror = () => {
          console.error('❌ Erreur récupération utilisateurs:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur getAllUsers:', error)
      return []
    }
  }
}
