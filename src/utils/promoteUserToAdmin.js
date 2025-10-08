/**
 * Script pour promouvoir un utilisateur en administrateur
 * À exécuter dans la console du navigateur
 */

import { UserAuthService } from '../services/UserAuthService'

/**
 * Promouvoir un utilisateur en admin par son email
 */
export async function promoteUserToAdmin(email) {
  try {
    console.log(`🔄 Recherche de l'utilisateur: ${email}`)

    const user = await UserAuthService.getUserByEmail(email)

    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${email}`)
      return false
    }

    if (user.role === 'admin') {
      console.log(`✅ ${email} est déjà administrateur`)
      return true
    }

    await UserAuthService.updateUser(user.id, { role: 'admin' })
    console.log(`✅ ${email} a été promu administrateur!`)
    return true
  } catch (error) {
    console.error('❌ Erreur lors de la promotion:', error)
    return false
  }
}

/**
 * Rétrograder un admin en utilisateur normal
 */
export async function demoteAdminToUser(email) {
  try {
    console.log(`🔄 Recherche de l'utilisateur: ${email}`)

    const user = await UserAuthService.getUserByEmail(email)

    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${email}`)
      return false
    }

    if (user.role === 'user') {
      console.log(`ℹ️ ${email} est déjà un utilisateur normal`)
      return true
    }

    await UserAuthService.updateUser(user.id, { role: 'user' })
    console.log(`✅ ${email} a été rétrogradé en utilisateur normal`)
    return true
  } catch (error) {
    console.error('❌ Erreur lors de la rétrogradation:', error)
    return false
  }
}

/**
 * Lister tous les administrateurs
 */
export async function listAdmins() {
  try {
    const allUsers = await UserAuthService.getAllUsers()
    const admins = allUsers.filter(u => u.role === 'admin')

    console.log(`👑 ${admins.length} administrateur(s) trouvé(s):`)
    admins.forEach(admin => {
      console.log(`  - ${admin.name} (${admin.email})`)
    })

    return admins
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des admins:', error)
    return []
  }
}

// Fonction automatique pour promouvoir voctali
export async function setupVoctaliAsAdmin() {
  console.log('🔧 Configuration de voctali en tant qu\'administrateur...')

  // Chercher voctali avec différents formats d'email possibles
  const possibleEmails = [
    'voctali@vaultestim.com',
    'voctali@gmail.com',
    'voctali@email.com'
  ]

  const allUsers = await UserAuthService.getAllUsers()
  const voctaliUser = allUsers.find(u =>
    u.name.toLowerCase().includes('voctali') ||
    u.email.toLowerCase().includes('voctali')
  )

  if (voctaliUser) {
    console.log(`✅ Utilisateur trouvé: ${voctaliUser.name} (${voctaliUser.email})`)
    await promoteUserToAdmin(voctaliUser.email)
  } else {
    console.log('⚠️ Aucun utilisateur "voctali" trouvé')
    console.log('Utilisateurs disponibles:')
    allUsers.forEach(u => console.log(`  - ${u.name} (${u.email})`))
  }
}

// Si ce fichier est importé dans la console, exécuter automatiquement
if (typeof window !== 'undefined') {
  window.promoteUserToAdmin = promoteUserToAdmin
  window.demoteAdminToUser = demoteAdminToUser
  window.listAdmins = listAdmins
  window.setupVoctaliAsAdmin = setupVoctaliAsAdmin

  console.log('✅ Fonctions admin disponibles:')
  console.log('  - promoteUserToAdmin(email)')
  console.log('  - demoteAdminToUser(email)')
  console.log('  - listAdmins()')
  console.log('  - setupVoctaliAsAdmin()')
}
