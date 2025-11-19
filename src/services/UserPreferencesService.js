/**
 * UserPreferencesService
 *
 * Service pour gérer les préférences utilisateur stockées dans Supabase.
 * Remplace le localStorage pour une persistence à travers les appareils et sessions.
 */

import { supabase } from '@/lib/supabaseClient'

// Clés de préférences disponibles
export const PREFERENCE_KEYS = {
  HIDDEN_SEALED_CATEGORIES: 'hidden_sealed_categories'
}

export const UserPreferencesService = {
  /**
   * Récupère une préférence utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} key - Clé de la préférence
   * @param {*} defaultValue - Valeur par défaut si la préférence n'existe pas
   * @returns {Promise<*>} - Valeur de la préférence
   */
  async getPreference(userId, key, defaultValue = null) {
    if (!userId) {
      console.warn('⚠️ UserPreferencesService.getPreference: userId manquant')
      return defaultValue
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('user_id', userId)
        .eq('preference_key', key)
        .maybeSingle()

      if (error) {
        console.error(`❌ Erreur récupération préférence ${key}:`, error)
        return defaultValue
      }

      if (!data) {
        console.log(`ℹ️ Préférence ${key} non trouvée, utilisation valeur par défaut`)
        return defaultValue
      }

      console.log(`✅ Préférence ${key} chargée:`, data.preference_value)
      return data.preference_value
    } catch (error) {
      console.error(`❌ Exception récupération préférence ${key}:`, error)
      return defaultValue
    }
  },

  /**
   * Sauvegarde une préférence utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} key - Clé de la préférence
   * @param {*} value - Valeur à sauvegarder (sera convertie en JSON)
   * @returns {Promise<boolean>} - true si succès
   */
  async setPreference(userId, key, value) {
    if (!userId) {
      console.warn('⚠️ UserPreferencesService.setPreference: userId manquant')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preference_key: key,
          preference_value: value
        }, {
          onConflict: 'user_id,preference_key'
        })

      if (error) {
        console.error(`❌ Erreur sauvegarde préférence ${key}:`, error)
        return false
      }

      console.log(`✅ Préférence ${key} sauvegardée:`, value)
      return true
    } catch (error) {
      console.error(`❌ Exception sauvegarde préférence ${key}:`, error)
      return false
    }
  },

  /**
   * Supprime une préférence utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} key - Clé de la préférence
   * @returns {Promise<boolean>} - true si succès
   */
  async deletePreference(userId, key) {
    if (!userId) {
      console.warn('⚠️ UserPreferencesService.deletePreference: userId manquant')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId)
        .eq('preference_key', key)

      if (error) {
        console.error(`❌ Erreur suppression préférence ${key}:`, error)
        return false
      }

      console.log(`✅ Préférence ${key} supprimée`)
      return true
    } catch (error) {
      console.error(`❌ Exception suppression préférence ${key}:`, error)
      return false
    }
  },

  // === Méthodes spécialisées pour les catégories masquées ===

  /**
   * Récupère les catégories de produits scellés masquées
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<string[]>} - Liste des noms de catégories masquées
   */
  async getHiddenSealedCategories(userId) {
    const result = await this.getPreference(
      userId,
      PREFERENCE_KEYS.HIDDEN_SEALED_CATEGORIES,
      []
    )
    return Array.isArray(result) ? result : []
  },

  /**
   * Sauvegarde les catégories de produits scellés masquées
   * @param {string} userId - ID de l'utilisateur
   * @param {string[]} categories - Liste des noms de catégories masquées
   * @returns {Promise<boolean>} - true si succès
   */
  async setHiddenSealedCategories(userId, categories) {
    return this.setPreference(
      userId,
      PREFERENCE_KEYS.HIDDEN_SEALED_CATEGORIES,
      Array.isArray(categories) ? categories : []
    )
  },

  /**
   * Masque une catégorie
   * @param {string} userId - ID de l'utilisateur
   * @param {string} categoryName - Nom de la catégorie à masquer
   * @returns {Promise<string[]>} - Nouvelle liste des catégories masquées
   */
  async hideCategory(userId, categoryName) {
    const current = await this.getHiddenSealedCategories(userId)
    if (!current.includes(categoryName)) {
      const newList = [...current, categoryName]
      await this.setHiddenSealedCategories(userId, newList)
      return newList
    }
    return current
  },

  /**
   * Affiche une catégorie (retire du masquage)
   * @param {string} userId - ID de l'utilisateur
   * @param {string} categoryName - Nom de la catégorie à afficher
   * @returns {Promise<string[]>} - Nouvelle liste des catégories masquées
   */
  async showCategory(userId, categoryName) {
    const current = await this.getHiddenSealedCategories(userId)
    const newList = current.filter(c => c !== categoryName)
    await this.setHiddenSealedCategories(userId, newList)
    return newList
  },

  /**
   * Bascule la visibilité d'une catégorie
   * @param {string} userId - ID de l'utilisateur
   * @param {string} categoryName - Nom de la catégorie
   * @returns {Promise<{hidden: string[], isHidden: boolean}>}
   */
  async toggleCategoryVisibility(userId, categoryName) {
    const current = await this.getHiddenSealedCategories(userId)
    const isCurrentlyHidden = current.includes(categoryName)

    let newList
    if (isCurrentlyHidden) {
      newList = current.filter(c => c !== categoryName)
    } else {
      newList = [...current, categoryName]
    }

    await this.setHiddenSealedCategories(userId, newList)
    return {
      hidden: newList,
      isHidden: !isCurrentlyHidden
    }
  }
}
