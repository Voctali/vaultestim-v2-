/**
 * Service de réinitialisation de mot de passe
 * Gère la génération de tokens et l'envoi d'emails de réinitialisation
 */

import { UserAuthService } from './UserAuthService'

export class PasswordResetService {
  static DB_NAME = 'VaultEstim_PasswordReset'
  static DB_VERSION = 1
  static STORE_NAME = 'reset_tokens'
  static db = null
  static TOKEN_EXPIRY_HOURS = 24

  /**
   * Initialiser la base de données des tokens de reset
   */
  static async initDB() {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => {
        console.error('❌ Erreur ouverture DB reset tokens:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ DB reset tokens initialisée')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        console.log('🔄 Création structure DB reset tokens...')

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const tokenStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'token' })
          tokenStore.createIndex('email', 'email', { unique: false })
          tokenStore.createIndex('expiresAt', 'expiresAt', { unique: false })
          console.log('🔑 Store reset tokens créé')
        }
      }
    })
  }

  /**
   * Générer un token de réinitialisation sécurisé
   */
  static generateToken() {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Demander une réinitialisation de mot de passe
   */
  static async requestPasswordReset(email) {
    try {
      await this.initDB()

      // Vérifier que l'utilisateur existe
      const user = await UserAuthService.getUserByEmail(email)
      if (!user) {
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
        console.log('⚠️ Tentative de reset pour email inexistant:', email)
        // On retourne quand même un succès pour ne pas révéler l'existence du compte
        return { success: true, message: 'Email envoyé si le compte existe' }
      }

      // Générer un token de réinitialisation
      const token = this.generateToken()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS)

      // Sauvegarder le token
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(this.STORE_NAME)

        const resetData = {
          token,
          email: email.toLowerCase().trim(),
          userId: user.id,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          used: false
        }

        const request = store.add(resetData)

        request.onsuccess = () => {
          console.log('✅ Token de reset créé pour:', email)

          // Générer le lien de réinitialisation
          const resetLink = `${window.location.origin}/reset-password?token=${token}`

          // Simuler l'envoi d'email (dans un vrai projet, appeler une API d'envoi d'email)
          const emailContent = this.generateResetEmail(user.name, resetLink, expiresAt)

          // Afficher l'email dans la console pour développement/test
          console.log('📧 EMAIL DE RÉINITIALISATION:', emailContent)

          // Dans un environnement de production, on enverrait l'email via une API
          // await fetch('/api/send-email', { method: 'POST', body: JSON.stringify({ to: email, ...emailContent }) })

          resolve({
            success: true,
            message: 'Email de réinitialisation envoyé',
            // En mode dev, on retourne aussi le token pour faciliter les tests
            ...(process.env.NODE_ENV === 'development' && { resetLink })
          })
        }

        request.onerror = () => {
          console.error('❌ Erreur création token:', request.error)
          reject(new Error('Erreur lors de la création du token'))
        }
      })
    } catch (error) {
      console.error('❌ Erreur requestPasswordReset:', error)
      throw new Error('Erreur lors de la demande de réinitialisation')
    }
  }

  /**
   * Générer le contenu de l'email de réinitialisation
   */
  static generateResetEmail(userName, resetLink, expiresAt) {
    const expiryDate = new Date(expiresAt).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return {
      subject: 'VaultEstim - Réinitialisation de votre mot de passe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1f2937 0%, #000000 50%, #1f2937 100%); color: #fbbf24; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">🔐 VaultEstim</h1>
              <p style="margin: 10px 0 0 0;">Réinitialisation de mot de passe</p>
            </div>
            <div class="content">
              <p>Bonjour <strong>${userName}</strong>,</p>

              <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte VaultEstim.</p>

              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
              </div>

              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="background: #e5e7eb; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
                ${resetLink}
              </p>

              <div class="warning">
                <strong>⚠️ Important :</strong>
                <ul style="margin: 10px 0 0 0;">
                  <li>Ce lien expire le <strong>${expiryDate}</strong></li>
                  <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                  <li>Ne partagez jamais ce lien avec qui que ce soit</li>
                </ul>
              </div>

              <p>Si le bouton ne fonctionne pas, copiez et collez le lien complet dans votre navigateur.</p>

              <p>Cordialement,<br>L'équipe VaultEstim</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>© 2025 VaultEstim - Gestion de collection Pokémon</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Bonjour ${userName},

Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte VaultEstim.

Pour créer un nouveau mot de passe, cliquez sur ce lien :
${resetLink}

⚠️ Important :
- Ce lien expire le ${expiryDate}
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
- Ne partagez jamais ce lien avec qui que ce soit

Cordialement,
L'équipe VaultEstim
      `
    }
  }

  /**
   * Vérifier et consommer un token de réinitialisation
   */
  static async verifyResetToken(token) {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readonly')
        const store = transaction.objectStore(this.STORE_NAME)
        const request = store.get(token)

        request.onsuccess = () => {
          const resetData = request.result

          if (!resetData) {
            reject(new Error('Token invalide ou expiré'))
            return
          }

          if (resetData.used) {
            reject(new Error('Ce lien a déjà été utilisé'))
            return
          }

          const now = new Date()
          const expiresAt = new Date(resetData.expiresAt)

          if (now > expiresAt) {
            reject(new Error('Ce lien a expiré'))
            return
          }

          resolve({
            valid: true,
            email: resetData.email,
            userId: resetData.userId
          })
        }

        request.onerror = () => {
          reject(new Error('Erreur lors de la vérification du token'))
        }
      })
    } catch (error) {
      console.error('❌ Erreur verifyResetToken:', error)
      throw error
    }
  }

  /**
   * Réinitialiser le mot de passe avec un token valide
   */
  static async resetPassword(token, newPassword) {
    try {
      // Vérifier le token
      const tokenData = await this.verifyResetToken(token)

      // Hasher le nouveau mot de passe
      const hashedPassword = await UserAuthService.hashPassword(newPassword)

      // Mettre à jour le mot de passe de l'utilisateur
      await UserAuthService.initDB()

      return new Promise((resolve, reject) => {
        const transaction = UserAuthService.db.transaction([UserAuthService.STORE_NAME], 'readwrite')
        const userStore = transaction.objectStore(UserAuthService.STORE_NAME)
        const getUserRequest = userStore.get(tokenData.userId)

        getUserRequest.onsuccess = () => {
          const user = getUserRequest.result

          if (!user) {
            reject(new Error('Utilisateur introuvable'))
            return
          }

          // Mettre à jour le mot de passe
          user.password = hashedPassword
          const updateRequest = userStore.put(user)

          updateRequest.onsuccess = async () => {
            // Marquer le token comme utilisé
            await this.markTokenAsUsed(token)

            console.log('✅ Mot de passe réinitialisé pour:', tokenData.email)
            resolve({ success: true, email: tokenData.email })
          }

          updateRequest.onerror = () => {
            reject(new Error('Erreur lors de la mise à jour du mot de passe'))
          }
        }

        getUserRequest.onerror = () => {
          reject(new Error('Erreur lors de la récupération de l\'utilisateur'))
        }
      })
    } catch (error) {
      console.error('❌ Erreur resetPassword:', error)
      throw error
    }
  }

  /**
   * Marquer un token comme utilisé
   */
  static async markTokenAsUsed(token) {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(this.STORE_NAME)
        const getRequest = store.get(token)

        getRequest.onsuccess = () => {
          const resetData = getRequest.result

          if (resetData) {
            resetData.used = true
            resetData.usedAt = new Date().toISOString()

            const updateRequest = store.put(resetData)
            updateRequest.onsuccess = () => resolve()
            updateRequest.onerror = () => reject(updateRequest.error)
          } else {
            resolve()
          }
        }

        getRequest.onerror = () => reject(getRequest.error)
      })
    } catch (error) {
      console.error('❌ Erreur markTokenAsUsed:', error)
    }
  }

  /**
   * Nettoyer les tokens expirés (à appeler périodiquement)
   */
  static async cleanupExpiredTokens() {
    try {
      await this.initDB()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(this.STORE_NAME)
        const index = store.index('expiresAt')
        const request = index.openCursor()

        const now = new Date().toISOString()
        let deletedCount = 0

        request.onsuccess = (event) => {
          const cursor = event.target.result

          if (cursor) {
            if (cursor.value.expiresAt < now) {
              cursor.delete()
              deletedCount++
            }
            cursor.continue()
          } else {
            console.log(`🧹 ${deletedCount} token(s) expiré(s) supprimé(s)`)
            resolve(deletedCount)
          }
        }

        request.onerror = () => {
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('❌ Erreur cleanupExpiredTokens:', error)
      return 0
    }
  }
}
