/**
 * Service pour matcher automatiquement les cartes utilisateur avec CardMarket
 * Utilise les noms + attaques pour trouver la meilleure correspondance
 */

import { CardMarketSupabaseService } from './CardMarketSupabaseService'

export class CardMarketMatchingService {
  /**
   * Matcher une carte utilisateur avec la base CardMarket
   *
   * @param {object} card - La carte utilisateur (avec name, attacks, set, etc.)
   * @param {string} userId - ID utilisateur
   * @param {boolean} saveMatch - Sauvegarder automatiquement le meilleur match
   * @returns {object} - { match, score, candidates }
   */
  static async matchCard(card, userId, saveMatch = true) {
    console.log(`🔍 Matching carte: ${card.name} (#${card.number || 'N/A'})`)

    try {
      // 1. Extraire le nom du Pokémon (sans suffixes V, VMAX, ex, etc.)
      const pokemonBaseName = this._extractPokemonBaseName(card.name)

      // 2. Rechercher les cartes CardMarket qui matchent le nom
      const candidates = await CardMarketSupabaseService.searchCardsByName(
        pokemonBaseName,
        50 // Limiter à 50 résultats
      )

      if (!candidates.length) {
        console.warn(`⚠️ Aucune carte CardMarket trouvée pour "${pokemonBaseName}"`)
        return {
          match: null,
          score: 0,
          candidates: []
        }
      }

      console.log(`📋 ${candidates.length} candidats trouvés pour "${pokemonBaseName}"`)

      // 3. Extraire les attaques de la carte utilisateur
      const cardAttacks = this._extractCardAttacks(card)

      // 4. Calculer le score de matching pour chaque candidat
      const scoredCandidates = candidates.map(candidate => {
        const cmAttacks = CardMarketSupabaseService.extractAttacksFromName(candidate.name)

        let score = 0

        // Score basé sur les attaques (poids 70%)
        if (cardAttacks.length > 0 && cmAttacks.length > 0) {
          const attackScore = CardMarketSupabaseService.calculateAttackMatchScore(
            cardAttacks,
            cmAttacks
          )
          score += attackScore * 0.7
        }

        // Score basé sur la similarité du nom complet (poids 20%)
        const nameScore = this._calculateNameSimilarity(card.name, candidate.name)
        score += nameScore * 0.2

        // Bonus si le nom contient exactement les mêmes suffixes (V, VMAX, ex, etc.) (poids 10%)
        if (this._hasSameSuffixes(card.name, candidate.name)) {
          score += 0.1
        }

        return {
          ...candidate,
          matchScore: Math.min(score, 1) // Limiter à 1.0
        }
      })

      // 5. Trier par score décroissant
      scoredCandidates.sort((a, b) => b.matchScore - a.matchScore)

      // 6. Prendre le meilleur match
      const bestMatch = scoredCandidates[0]

      console.log(`🎯 Meilleur match: ${bestMatch.name} (score: ${(bestMatch.matchScore * 100).toFixed(1)}%)`)

      // 7. Sauvegarder le match si demandé et score suffisant
      // Seuil abaissé à 0.2 (20%) pour les cas difficiles
      if (saveMatch && bestMatch.matchScore >= 0.2 && userId) {
        const cardId = this._generateCardId(card)

        await CardMarketSupabaseService.saveUserMatch(
          userId,
          cardId,
          bestMatch.id_product,
          bestMatch.matchScore,
          cardAttacks.length > 0 ? 'auto_attacks' : 'auto_name',
          false, // is_sealed_product
          bestMatch.name // cardmarketName - pour construire l'URL de recherche
        )

        console.log(`💾 Match sauvegardé: ${cardId} → ${bestMatch.id_product} (score: ${(bestMatch.matchScore * 100).toFixed(1)}%)`)

        if (bestMatch.matchScore < 0.5) {
          console.warn(`⚠️ Score faible - vérifiez que c'est la bonne carte: ${bestMatch.name}`)
        }
      }

      return {
        match: bestMatch,
        score: bestMatch.matchScore,
        candidates: scoredCandidates.slice(0, 10) // Retourner top 10
      }

    } catch (error) {
      console.error('❌ Erreur matching:', error)
      throw error
    }
  }

  /**
   * Matcher plusieurs cartes en batch
   */
  static async matchCards(cards, userId, onProgress = null) {
    console.log(`🔄 Matching de ${cards.length} cartes...`)

    const results = []
    let processed = 0

    for (const card of cards) {
      try {
        const result = await this.matchCard(card, userId, true)
        results.push({
          card,
          ...result
        })

        processed++
        if (onProgress) {
          onProgress({
            current: processed,
            total: cards.length,
            percent: Math.round((processed / cards.length) * 100)
          })
        }

        // Petite pause pour éviter rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`❌ Erreur matching ${card.name}:`, error)
        results.push({
          card,
          match: null,
          score: 0,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.match && r.score >= 0.5).length
    console.log(`✅ Matching terminé: ${successCount}/${cards.length} cartes matchées avec succès`)

    return results
  }

  /**
   * Extraire le nom de base du Pokémon (sans suffixes)
   * Ex: "Charizard VMAX" → "Charizard"
   */
  static _extractPokemonBaseName(name) {
    // Liste des suffixes à retirer
    const suffixes = [
      'VMAX', 'VSTAR', 'V', 'GX', 'EX', 'ex', 'Radiant',
      'Shining', 'Prism Star', 'Break', 'Mega', 'M'
    ]

    let baseName = name

    // Retirer les suffixes
    suffixes.forEach(suffix => {
      const regex = new RegExp(`\\b${suffix}\\b`, 'gi')
      baseName = baseName.replace(regex, '')
    })

    // Nettoyer les espaces multiples
    baseName = baseName.replace(/\s+/g, ' ').trim()

    return baseName
  }

  /**
   * Extraire les attaques d'une carte
   */
  static _extractCardAttacks(card) {
    // Si la carte a un champ attacks (API Pokemon TCG)
    if (card.attacks && Array.isArray(card.attacks)) {
      return card.attacks.map(attack => attack.name || attack)
    }

    // Sinon retourner vide
    return []
  }

  /**
   * Calculer la similarité entre deux noms
   * @returns {number} Score entre 0 et 1
   */
  static _calculateNameSimilarity(name1, name2) {
    const n1 = name1.toLowerCase().trim()
    const n2 = name2.toLowerCase().trim()

    // Exact match
    if (n1 === n2) return 1.0

    // Contient
    if (n2.includes(n1) || n1.includes(n2)) return 0.8

    // Similarité par caractères communs (approximatif)
    const commonChars = this._countCommonChars(n1, n2)
    const maxLength = Math.max(n1.length, n2.length)

    return commonChars / maxLength
  }

  /**
   * Compter les caractères communs entre deux strings
   */
  static _countCommonChars(str1, str2) {
    let count = 0
    const chars1 = str1.split('')
    const chars2 = str2.split('')

    chars1.forEach(char => {
      const index = chars2.indexOf(char)
      if (index !== -1) {
        count++
        chars2.splice(index, 1) // Retirer pour éviter double comptage
      }
    })

    return count
  }

  /**
   * Vérifier si deux noms ont les mêmes suffixes (V, VMAX, ex, etc.)
   */
  static _hasSameSuffixes(name1, name2) {
    const suffixes = ['VMAX', 'VSTAR', 'V', 'GX', 'EX', 'ex']

    const suffixes1 = suffixes.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(name1))
    const suffixes2 = suffixes.filter(s => new RegExp(`\\b${s}\\b`, 'i').test(name2))

    // Même nombre et mêmes suffixes
    if (suffixes1.length !== suffixes2.length) return false

    return suffixes1.every(s => suffixes2.includes(s))
  }

  /**
   * Générer un ID unique pour une carte
   * Format: "set-number" ou "name-hash" si pas de set
   */
  static _generateCardId(card) {
    if (card.set?.id && card.number) {
      return `${card.set.id}-${card.number}`
    }

    if (card.id) {
      return card.id
    }

    // Fallback: hash du nom
    const hash = this._simpleHash(card.name)
    return `${card.name.toLowerCase().replace(/\s+/g, '-')}-${hash}`
  }

  /**
   * Hash simple pour générer un ID
   */
  static _simpleHash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }
}
