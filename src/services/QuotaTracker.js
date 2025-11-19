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
  static BLOCK_THRESHOLD = 0.99 // Bloquer à 99%
  static requestLock = false // Verrou pour empêcher requêtes simultanées

  /**
   * Obtenir le nombre de requêtes en cours depuis localStorage
   * (persiste même après rechargement de la page)
   */
  static getPendingRequests() {
    const data = this.getQuotaData()
    return data.pendingRequests || 0
  }

  /**
   * Mettre à jour le nombre de requêtes en cours
   */
  static setPendingRequests(count) {
    const data = this.getQuotaData()
    data.pendingRequests = Math.max(0, count)
    this.saveQuotaData(data)
  }

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
      lastUpdated: Date.now(),
      pendingRequests: 0 // Réinitialiser les requêtes en cours
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
    // Prendre en compte les requêtes en cours pour calculer le remaining réel
    const pendingCount = data.pendingRequests || 0
    const effectiveUsed = data.used + pendingCount
    const remaining = data.limit - effectiveUsed
    const percentUsed = effectiveUsed / data.limit

    // BLOCAGE AUTOMATIQUE À 99%
    if (percentUsed >= this.BLOCK_THRESHOLD) {
      const resetDate = new Date(data.resetAt)
      console.error(`🚫 QuotaTracker: QUOTA BLOQUÉ à ${Math.round(percentUsed * 100)}% (${effectiveUsed}/${data.limit})`)
      return {
        allowed: false,
        remaining,
        used: effectiveUsed,
        limit: data.limit,
        percentUsed: Math.round(percentUsed * 100),
        message: `🚫 QUOTA BLOQUÉ : ${Math.round(percentUsed * 100)}% utilisé (${effectiveUsed}/${data.limit}). Requêtes bloquées pour éviter dépassement. Reset à ${resetDate.toLocaleTimeString('fr-FR')}`
      }
    }

    if (effectiveUsed >= data.limit) {
      const resetDate = new Date(data.resetAt)
      return {
        allowed: false,
        remaining: 0,
        used: effectiveUsed,
        limit: data.limit,
        percentUsed: 100,
        message: `Quota quotidien épuisé (${effectiveUsed}/${data.limit}). Reset à ${resetDate.toLocaleTimeString('fr-FR')}`
      }
    }

    // Alerte si proche de la limite
    if (percentUsed >= this.WARNING_THRESHOLD && percentUsed < 1) {
      console.warn(`⚠️ QuotaTracker: ${Math.round(percentUsed * 100)}% du quota utilisé (${effectiveUsed}/${data.limit})`)
    }

    return {
      allowed: true,
      remaining,
      used: effectiveUsed,
      limit: data.limit,
      percentUsed: Math.round(percentUsed * 100),
      message: `${remaining} requêtes restantes sur ${data.limit}`
    }
  }

  /**
   * Réserver une requête (incrémenter le compteur en cours)
   * À appeler AVANT de faire la requête HTTP
   *
   * @returns {boolean} true si réservation réussie, false si quota dépassé
   */
  static reserveRequest() {
    const check = this.canMakeRequest()

    if (!check.allowed) {
      console.warn(`🚫 QuotaTracker: Requête refusée - ${check.message}`)
      return false
    }

    const pending = this.getPendingRequests() + 1
    this.setPendingRequests(pending)
    console.log(`🔒 QuotaTracker: Requête réservée (${pending} en cours, ${check.remaining - 1} disponibles)`)
    return true
  }

  /**
   * Confirmer une requête réussie (convertir réservation en utilisation)
   * À appeler APRÈS une requête HTTP réussie
   */
  static confirmRequest() {
    const data = this.getQuotaData()

    // Décrémenter les pending
    if (data.pendingRequests > 0) {
      data.pendingRequests--
    }

    // Incrémenter les used
    data.used += 1
    data.lastUpdated = Date.now()
    this.saveQuotaData(data)

    console.log(`✅ QuotaTracker: Requête confirmée - ${data.used}/${data.limit} utilisées (${data.limit - data.used} restantes)`)
    return data
  }

  /**
   * Annuler une requête réservée (en cas d'erreur avant l'appel HTTP)
   */
  static releaseRequest() {
    const pending = this.getPendingRequests()
    if (pending > 0) {
      this.setPendingRequests(pending - 1)
      console.log(`🔓 QuotaTracker: Requête libérée (${pending - 1} en cours)`)
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
