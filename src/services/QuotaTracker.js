/**
 * QuotaTracker - Gestion du quota quotidien RapidAPI
 *
 * Fonctionnalités :
 * - Compteur de requêtes quotidiennes avec reset automatique à minuit
 * - Alertes avant épuisement du quota (à 90%)
 * - Sauvegarde dans localStorage avec timestamp
 * - Support multi-plans (Free: 100, Pro: 2500, Ultra: 15000, Mega: 50000)
 */

export class QuotaTracker {
  static STORAGE_KEY = 'rapidapi_quota'
  static DAILY_LIMIT = parseInt(import.meta.env.VITE_RAPIDAPI_DAILY_QUOTA || '100')
  static WARNING_THRESHOLD = 0.9 // Alerte à 90%

  /**
   * Obtenir les données du quota depuis localStorage
   */
  static getQuotaData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        return this.initQuotaData()
      }

      const data = JSON.parse(stored)

      // Vérifier si on doit reset (nouveau jour)
      if (this.shouldReset(data.resetAt)) {
        console.log('🔄 QuotaTracker: Nouveau jour détecté, reset du compteur')
        return this.initQuotaData()
      }

      return data
    } catch (error) {
      console.error('❌ QuotaTracker: Erreur lecture quota:', error)
      return this.initQuotaData()
    }
  }

  /**
   * Initialiser les données du quota (nouveau jour)
   */
  static initQuotaData() {
    const tomorrow = new Date()
    tomorrow.setHours(24, 0, 0, 0) // Minuit demain

    const data = {
      used: 0,
      limit: this.DAILY_LIMIT,
      resetAt: tomorrow.getTime(),
      lastUpdated: Date.now()
    }

    this.saveQuotaData(data)
    return data
  }

  /**
   * Sauvegarder les données du quota
   */
  static saveQuotaData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('❌ QuotaTracker: Erreur sauvegarde quota:', error)
    }
  }

  /**
   * Vérifier si le quota doit être reset
   */
  static shouldReset(resetAt) {
    return Date.now() >= resetAt
  }

  /**
   * Vérifier si on peut faire une requête
   *
   * @returns {Object} { allowed: boolean, remaining: number, message: string }
   */
  static canMakeRequest() {
    const data = this.getQuotaData()
    const remaining = data.limit - data.used

    if (data.used >= data.limit) {
      const resetDate = new Date(data.resetAt)
      return {
        allowed: false,
        remaining: 0,
        used: data.used,
        limit: data.limit,
        message: `Quota quotidien épuisé (${data.used}/${data.limit}). Reset à ${resetDate.toLocaleTimeString('fr-FR')}`
      }
    }

    // Alerte si proche de la limite
    const percentUsed = data.used / data.limit
    if (percentUsed >= this.WARNING_THRESHOLD && percentUsed < 1) {
      console.warn(`⚠️ QuotaTracker: ${Math.round(percentUsed * 100)}% du quota utilisé (${data.used}/${data.limit})`)
    }

    return {
      allowed: true,
      remaining,
      used: data.used,
      limit: data.limit,
      message: `${remaining} requêtes restantes sur ${data.limit}`
    }
  }

  /**
   * Incrémenter le compteur de requêtes
   */
  static incrementUsage() {
    const data = this.getQuotaData()
    data.used += 1
    data.lastUpdated = Date.now()
    this.saveQuotaData(data)

    console.log(`📊 QuotaTracker: ${data.used}/${data.limit} requêtes utilisées (${data.limit - data.used} restantes)`)

    return data
  }

  /**
   * Obtenir les statistiques du quota
   *
   * @returns {Object} Statistiques détaillées
   */
  static getStats() {
    const data = this.getQuotaData()
    const percentUsed = Math.round((data.used / data.limit) * 100)
    const resetDate = new Date(data.resetAt)
    const hoursUntilReset = Math.ceil((data.resetAt - Date.now()) / (1000 * 60 * 60))

    return {
      used: data.used,
      limit: data.limit,
      remaining: data.limit - data.used,
      percentUsed,
      resetAt: resetDate,
      hoursUntilReset,
      isNearLimit: percentUsed >= this.WARNING_THRESHOLD * 100,
      isExhausted: data.used >= data.limit
    }
  }

  /**
   * Forcer le reset du quota (pour tests ou debug)
   */
  static forceReset() {
    console.log('🔄 QuotaTracker: Reset forcé du quota')
    localStorage.removeItem(this.STORAGE_KEY)
    return this.initQuotaData()
  }

  /**
   * Afficher les stats dans la console
   */
  static logStats() {
    const stats = this.getStats()

    console.log('\n📊 === RapidAPI Quota Stats ===')
    console.log(`   Utilisé: ${stats.used}/${stats.limit} (${stats.percentUsed}%)`)
    console.log(`   Restant: ${stats.remaining} requêtes`)
    console.log(`   Reset dans: ${stats.hoursUntilReset}h (${stats.resetAt.toLocaleString('fr-FR')})`)

    if (stats.isExhausted) {
      console.log('   ❌ QUOTA ÉPUISÉ')
    } else if (stats.isNearLimit) {
      console.log('   ⚠️ PROCHE DE LA LIMITE')
    } else {
      console.log('   ✅ OK')
    }
    console.log('================================\n')
  }
}
