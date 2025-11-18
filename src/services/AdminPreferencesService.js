/**
 * AdminPreferencesService
 *
 * Service pour gérer les préférences d'administration globales stockées dans Supabase.
 * Ces préférences s'appliquent à tous les utilisateurs (ex: catégories masquées).
 */

import { supabase } from '@/lib/supabaseClient'

// Clés de préférences disponibles
export const ADMIN_PREFERENCE_KEYS = {
  HIDDEN_SEALED_CATEGORIES: 'hidden_sealed_categories',
  SHOW_ONLY_WITH_IMAGES: 'show_only_with_images'
}

export const AdminPreferencesService = {
  /**
   * Récupère une préférence admin
   * @param {string} key - Clé de la préférence
   * @param {*} defaultValue - Valeur par défaut si la préférence n'existe pas
   * @returns {Promise<*>} - Valeur de la préférence
   */
  async getPreference(key, defaultValue = null) {
    try {
      const { data, error } = await supabase
        .from('admin_preferences')
        .select('preference_value')
        .eq('preference_key', key)
        .maybeSingle()

      if (error) {
        console.error(`❌ Erreur récupération préférence admin ${key}:`, error)
        return defaultValue
      }

      if (!data) {
        console.log(`ℹ️ Préférence admin ${key} non trouvée, utilisation valeur par défaut`)
        return defaultValue
      }

      console.log(`✅ Préférence admin ${key} chargée:`, data.preference_value)
      return data.preference_value
    } catch (error) {
      console.error(`❌ Exception récupération préférence admin ${key}:`, error)
      return defaultValue
    }
  },

  /**
   * Sauvegarde une préférence admin
   * @param {string} key - Clé de la préférence
   * @param {*} value - Valeur à sauvegarder (sera convertie en JSON)
   * @returns {Promise<boolean>} - true si succès
   */
  async setPreference(key, value) {
    try {
      const { error } = await supabase
        .from('admin_preferences')
        .upsert({
          preference_key: key,
          preference_value: value
        }, {
          onConflict: 'preference_key'
        })

      if (error) {
        console.error(`❌ Erreur sauvegarde préférence admin ${key}:`, error)
        return false
      }

      console.log(`✅ Préférence admin ${key} sauvegardée:`, value)
      return true
    } catch (error) {
      console.error(`❌ Exception sauvegarde préférence admin ${key}:`, error)
      return false
    }
  },

  /**
   * Supprime une préférence admin
   * @param {string} key - Clé de la préférence
   * @returns {Promise<boolean>} - true si succès
   */
  async deletePreference(key) {
    try {
      const { error } = await supabase
        .from('admin_preferences')
        .delete()
        .eq('preference_key', key)

      if (error) {
        console.error(`❌ Erreur suppression préférence admin ${key}:`, error)
        return false
      }

      console.log(`✅ Préférence admin ${key} supprimée`)
      return true
    } catch (error) {
      console.error(`❌ Exception suppression préférence admin ${key}:`, error)
      return false
    }
  },

  // === Méthodes spécialisées pour les catégories masquées ===

  /**
   * Récupère les catégories de produits scellés masquées
   * @returns {Promise<string[]>} - Liste des noms de catégories masquées
   */
  async getHiddenSealedCategories() {
    const result = await this.getPreference(
      ADMIN_PREFERENCE_KEYS.HIDDEN_SEALED_CATEGORIES,
      []
    )
    return Array.isArray(result) ? result : []
  },

  /**
   * Sauvegarde les catégories de produits scellés masquées
   * @param {string[]} categories - Liste des noms de catégories masquées
   * @returns {Promise<boolean>} - true si succès
   */
  async setHiddenSealedCategories(categories) {
    return this.setPreference(
      ADMIN_PREFERENCE_KEYS.HIDDEN_SEALED_CATEGORIES,
      Array.isArray(categories) ? categories : []
    )
  },

  /**
   * Bascule la visibilité d'une catégorie
   * @param {string} categoryName - Nom de la catégorie
   * @returns {Promise<{hidden: string[], isHidden: boolean}>}
   */
  async toggleCategoryVisibility(categoryName) {
    const current = await this.getHiddenSealedCategories()
    const isCurrentlyHidden = current.includes(categoryName)

    let newList
    if (isCurrentlyHidden) {
      newList = current.filter(c => c !== categoryName)
    } else {
      newList = [...current, categoryName]
    }

    await this.setHiddenSealedCategories(newList)
    return {
      hidden: newList,
      isHidden: !isCurrentlyHidden
    }
  },

  // === Méthodes spécialisées pour le filtre "images uniquement" ===

  /**
   * Récupère l'état du filtre "afficher uniquement les produits avec images"
   * @returns {Promise<boolean>} - true si le filtre est activé
   */
  async getShowOnlyWithImages() {
    const result = await this.getPreference(
      ADMIN_PREFERENCE_KEYS.SHOW_ONLY_WITH_IMAGES,
      false
    )
    return result === true
  },

  /**
   * Définit l'état du filtre "afficher uniquement les produits avec images"
   * @param {boolean} enabled - true pour activer le filtre
   * @returns {Promise<boolean>} - true si succès
   */
  async setShowOnlyWithImages(enabled) {
    return this.setPreference(
      ADMIN_PREFERENCE_KEYS.SHOW_ONLY_WITH_IMAGES,
      enabled === true
    )
  }
}
