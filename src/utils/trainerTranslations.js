/**
 * Traductions Français → Anglais pour les cartes Dresseur
 *
 * Ce fichier contient les traductions des noms de dresseurs (champions d'arène,
 * rivaux, personnages) du français vers l'anglais pour l'API Pokemon TCG.
 */

const TRAINER_TRANSLATIONS = {
  // ========================================
  // CHAMPIONS D'ARÈNE (GYM LEADERS)
  // ========================================

  // Johto (Gen 2)
  'albert': 'falkner', // Mauville/Violette - Type Vol

  // Paldea (Gen 9)
  'alisma': 'geeta', // Maîtresse de la Ligue Pokémon
  'bria': 'briar', // Professeure de l'Académie Myrtille
  'brôme': 'giacomo', // Boss Team Star (DJ)
  'brome': 'giacomo', // Variante sans accent
  'cassiopée': 'cassiopeia', // Boss Team Star (Poison)
  'cassiopee': 'cassiopeia', // Variante sans accent
  'clavel': 'clavell', // Directeur de l'Académie Raisin (Paldea)
  'colza': 'brassius', // Champion d'Arène Paldea (Type Plante)
  'clove': 'clive', // Identité secrète de Clavel (Directeur déguisé)
  'hassa': 'hassel', // Membre du Conseil des 4 Paldea (Type Dragon) - Twilight Masquerade
  'irido': 'drayton', // Membre du Conseil des 4 de l'Académie Myrtille - Surging Sparks
  'kassis': 'kieran', // Rival de l'extension Teal Mask - Scarlet & Violet

  // Hisui / Sinnoh (Legends: Arceus)
  'nacchara': 'irida', // Cheffe du Clan Perle - Astral Radiance

  // Unys / Unova (Gen 5)
  'clown': 'harlequin', // Classe de Dresseur - White Flare
  'ludvina': 'hilda', // Protagoniste de Pokémon Noir et Blanc

  // ========================================
  // CARTES SUPPORTER GÉNÉRALES
  // ========================================

  'aide de nina': 'daisy\'s help',
  'transfert de léo': 'bill\'s transfer',
  'transfert de leo': 'bill\'s transfer', // Variante sans accent
  'charisme de giovanni': 'giovanni\'s charisma',
  'amis de paldea': 'friends in paldea', // Supporter Gen 9
  'art secret de jeannine': 'janine\'s secret art', // Fuchsia Gym Leader
  'art secret de janine': 'janine\'s secret art', // Variante orthographe anglaise
  'charme d\'atalante': 'lisia\'s appeal', // Championne de Concours Hoenn - Surging Sparks (SSP)
  'charme d atalante': 'lisia\'s appeal', // Variante espace
  'charme atalante': 'lisia\'s appeal', // Variante courte
  'atalante': 'lisia', // Nom du personnage seul (carte plus ancienne, Celestial Storm)
  'tcheren': 'cheren', // Rival de Pokémon Noir et Blanc (Gen 5)
  'gamin': 'youngster', // Dresseur classe Gamin - Scarlet & Violet
  'guide d\'exploration': 'explorer\'s guidance', // Temporal Forces - Scarlet & Violet
  'guide d exploration': 'explorer\'s guidance', // Variante sans apostrophe
  'juge': 'judge', // Carte Supporter classique - Multiple rééditions
  'intendant': 'caretaker', // Carte Supporter

  // ========================================
  // OBJETS ET CARTES DRESSEUR
  // ========================================

  'bandeau rigide': 'rigid band',
  'lunettes de protection': 'protective goggles',
  'piste cyclable': 'cycling road',
  'gros ballon': 'big air balloon',
  'vieil ambre ancien': 'antique old amber',
  'fossile nautile ancien': 'antique helix fossil'
}

/**
 * Traduit un nom de dresseur français vers l'anglais
 * @param {string} frenchName - Nom français du dresseur
 * @returns {string} - Nom anglais ou nom original si pas de traduction
 */
export function translateTrainerName(frenchName) {
  const name = frenchName.toLowerCase().trim()
  return TRAINER_TRANSLATIONS[name] || name
}

/**
 * Vérifie si une traduction existe pour ce dresseur
 * @param {string} name - Nom à vérifier
 * @returns {boolean}
 */
export function isTrainerTranslationNeeded(name) {
  return TRAINER_TRANSLATIONS[name.toLowerCase()] !== undefined
}

/**
 * Retourne toutes les traductions de dresseurs
 * @returns {Object}
 */
export function getAllTrainerTranslations() {
  return { ...TRAINER_TRANSLATIONS }
}

export default TRAINER_TRANSLATIONS
