// Script pour réinitialiser le mot de passe d'un utilisateur
// Usage: node reset-password.cjs "email@example.com" "nouveauMotDePasse"

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ubphwlmnfjdaiarbihcx.supabase.co'
// Clé SERVICE ROLE (pas la clé anon) - à récupérer dans Supabase Dashboard > Settings > API
const SUPABASE_SERVICE_ROLE_KEY = 'VOTRE_SERVICE_ROLE_KEY_ICI'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetPassword(email, newPassword) {
  console.log(`Recherche de l'utilisateur: ${email}...`)

  // Récupérer l'utilisateur par email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('Erreur:', listError.message)
    return
  }

  const user = users.find(u => u.email === email)

  if (!user) {
    console.error(`Utilisateur ${email} non trouvé`)
    return
  }

  console.log(`Utilisateur trouvé: ${user.id}`)
  console.log(`Mise à jour du mot de passe...`)

  // Mettre à jour le mot de passe
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword
  })

  if (updateError) {
    console.error('Erreur:', updateError.message)
    return
  }

  console.log(`✅ Mot de passe réinitialisé avec succès pour ${email}`)
}

// Récupérer les arguments
const email = process.argv[2]
const newPassword = process.argv[3]

if (!email || !newPassword) {
  console.log('Usage: node reset-password.cjs "email@example.com" "nouveauMotDePasse"')
  process.exit(1)
}

if (SUPABASE_SERVICE_ROLE_KEY === 'VOTRE_SERVICE_ROLE_KEY_ICI') {
  console.log('⚠️  Vous devez d\'abord ajouter votre clé SERVICE ROLE dans le script')
  console.log('   Allez dans: Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

resetPassword(email, newPassword)
