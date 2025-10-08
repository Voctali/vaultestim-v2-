/**
 * Script de debug pour vérifier les utilisateurs dans IndexedDB
 * À exécuter dans la console du navigateur
 */

import { UserAuthService } from '../services/UserAuthService'

/**
 * Lister tous les utilisateurs
 */
export async function listAllUsers() {
  try {
    const users = await UserAuthService.getAllUsers()
    console.log('=== UTILISATEURS DANS LA BASE ===')
    console.log(`Total: ${users.length}`)
    console.table(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isPremium: u.isPremium,
      createdAt: u.createdAt
    })))
    return users
  } catch (error) {
    console.error('Erreur:', error)
    return []
  }
}

/**
 * Tester la connexion avec email et mot de passe
 */
export async function testLogin(email, password) {
  try {
    console.log(`🔄 Test de connexion pour: ${email}`)

    // Vérifier que l'utilisateur existe
    const user = await UserAuthService.getUserByEmail(email)
    if (!user) {
      console.error('❌ Utilisateur non trouvé avec cet email')
      return false
    }

    console.log('✅ Utilisateur trouvé:', {
      id: user.id,
      name: user.name,
      email: user.email,
      hasPassword: !!user.password
    })

    // Hasher le mot de passe fourni
    const hashedInput = await UserAuthService.hashPassword(password)
    console.log('🔑 Hash du mot de passe fourni:', hashedInput.substring(0, 20) + '...')
    console.log('🔑 Hash dans la base:', user.password.substring(0, 20) + '...')

    if (hashedInput === user.password) {
      console.log('✅ Les mots de passe correspondent!')
      return true
    } else {
      console.log('❌ Les mots de passe ne correspondent pas')
      return false
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
    return false
  }
}

/**
 * Réinitialiser le mot de passe d'un utilisateur (sans token)
 */
export async function forceResetPassword(email, newPassword) {
  try {
    console.log(`🔄 Réinitialisation forcée pour: ${email}`)

    const user = await UserAuthService.getUserByEmail(email)
    if (!user) {
      console.error('❌ Utilisateur non trouvé')
      return false
    }

    const hashedPassword = await UserAuthService.hashPassword(newPassword)

    await UserAuthService.initDB()

    return new Promise((resolve, reject) => {
      const transaction = UserAuthService.db.transaction([UserAuthService.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(UserAuthService.STORE_NAME)

      user.password = hashedPassword
      const request = store.put(user)

      request.onsuccess = () => {
        console.log('✅ Mot de passe réinitialisé avec succès!')
        console.log(`Nouvel hash: ${hashedPassword.substring(0, 20)}...`)
        resolve(true)
      }

      request.onerror = () => {
        console.error('❌ Erreur lors de la mise à jour')
        reject(false)
      }
    })
  } catch (error) {
    console.error('❌ Erreur:', error)
    return false
  }
}

/**
 * Vérifier un compte spécifique
 */
export async function checkAccount(email) {
  try {
    console.log(`🔍 Vérification du compte: ${email}`)

    const user = await UserAuthService.getUserByEmail(email)
    if (!user) {
      console.error('❌ Compte inexistant')
      return null
    }

    console.log('✅ Compte trouvé:')
    console.log({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
      cardCount: user.cardCount,
      level: user.level,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    })

    return user
  } catch (error) {
    console.error('❌ Erreur:', error)
    return null
  }
}

// Exposer les fonctions dans le window pour la console
if (typeof window !== 'undefined') {
  window.listAllUsers = listAllUsers
  window.testLogin = testLogin
  window.forceResetPassword = forceResetPassword
  window.checkAccount = checkAccount

  console.log('✅ Fonctions de debug disponibles:')
  console.log('  - listAllUsers()')
  console.log('  - checkAccount(email)')
  console.log('  - testLogin(email, password)')
  console.log('  - forceResetPassword(email, newPassword)')
}

export default {
  listAllUsers,
  testLogin,
  forceResetPassword,
  checkAccount
}
