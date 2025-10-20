/**
 * Service pour la gestion des utilisateurs par les administrateurs
 * Utilise Supabase directement pour les opérations CRUD
 */

import { supabase } from '@/lib/supabaseClient'

export class AdminApiService {
  /**
   * Récupérer tous les utilisateurs (admin uniquement)
   * Combine les données de auth.users et user_profiles
   */
  static async getAllUsers() {
    try {
      console.log('📥 Récupération de tous les utilisateurs...')

      // 1. Récupérer les profils utilisateurs depuis user_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        throw profilesError
      }

      console.log(`✅ ${profiles?.length || 0} profils utilisateurs récupérés`)

      // 2. Enrichir avec les métadonnées de auth.users si disponible
      // Note: auth.users n'est pas accessible directement via API standard
      // On utilise donc uniquement user_profiles qui contient email et metadata

      const users = profiles.map(profile => ({
        id: profile.user_id,
        email: profile.email,
        name: profile.full_name || profile.email?.split('@')[0] || 'Utilisateur',
        role: profile.role || 'user',
        is_premium: profile.is_premium || false,
        premium_until: profile.premium_until,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        metadata: profile.metadata || {}
      }))

      return users
    } catch (error) {
      console.error('❌ Erreur getAllUsers:', error)
      throw error
    }
  }

  /**
   * Mettre à jour un utilisateur (admin uniquement)
   */
  static async updateUser(userId, updates) {
    try {
      console.log(`📝 Mise à jour utilisateur ${userId}...`, updates)

      // Préparer les données à mettre à jour
      const profileUpdates = {}

      if (updates.name) {
        profileUpdates.full_name = updates.name
      }

      if (updates.email) {
        profileUpdates.email = updates.email
      }

      if (updates.role) {
        profileUpdates.role = updates.role
      }

      if (updates.is_premium !== undefined) {
        profileUpdates.is_premium = updates.is_premium
      }

      if (updates.premium_until) {
        profileUpdates.premium_until = updates.premium_until
      }

      // Mettre à jour dans user_profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileUpdates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Utilisateur mis à jour')

      return {
        id: data.user_id,
        email: data.email,
        name: data.full_name,
        role: data.role,
        is_premium: data.is_premium,
        premium_until: data.premium_until
      }
    } catch (error) {
      console.error('❌ Erreur updateUser:', error)
      throw error
    }
  }

  /**
   * Supprimer un utilisateur (admin uniquement)
   * Note: La suppression d'un utilisateur auth.users doit se faire via Supabase Admin API
   * Pour l'instant, on marque juste le profil comme désactivé
   */
  static async deleteUser(userId) {
    try {
      console.log(`🗑️ Suppression utilisateur ${userId}...`)

      // Marquer le profil comme désactivé (soft delete)
      const { error } = await supabase
        .from('user_profiles')
        .update({
          role: 'disabled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      console.log('✅ Utilisateur désactivé')

      return { success: true, message: 'Utilisateur désactivé avec succès' }
    } catch (error) {
      console.error('❌ Erreur deleteUser:', error)
      throw error
    }
  }

  /**
   * Activer/désactiver le statut premium d'un utilisateur
   */
  static async togglePremium(userId, isPremium, daysToAdd = 30) {
    try {
      console.log(`👑 Toggle premium pour ${userId}: ${isPremium}`)

      const updates = {
        is_premium: isPremium
      }

      if (isPremium && daysToAdd > 0) {
        const premiumUntil = new Date()
        premiumUntil.setDate(premiumUntil.getDate() + daysToAdd)
        updates.premium_until = premiumUntil.toISOString()
      } else if (!isPremium) {
        updates.premium_until = null
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Statut premium mis à jour')

      return {
        id: data.user_id,
        is_premium: data.is_premium,
        premium_until: data.premium_until
      }
    } catch (error) {
      console.error('❌ Erreur togglePremium:', error)
      throw error
    }
  }
}
