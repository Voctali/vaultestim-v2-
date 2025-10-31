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
  'regard de jasmine': 'jasmine\'s gaze', // Championne d'Arène Oliville (Type Acier)

  // Paldea (Gen 9)
  'alisma': 'geeta', // Maîtresse de la Ligue Pokémon
  'bria': 'briar', // Professeure de l'Académie Myrtille
  'brôme': 'giacomo', // Boss Team Star (DJ)
  'brome': 'giacomo', // Variante sans accent
  'cassiopée': 'cassiopeia', // Boss Team Star (Poison)
  'cassiopee': 'cassiopeia', // Variante sans accent
  'cayenn': 'rika', // Conseil des 4 Paldea (Type Sol)
  'éra': 'katy', // Championne d'Arène Sevaro Paldea (Type Insecte)
  'era': 'katy', // Variante sans accent
  'clavel': 'clavell', // Directeur de l'Académie Raisin (Paldea)
  'colza': 'brassius', // Champion d'Arène Paldea (Type Plante)
  'clove': 'clive', // Identité secrète de Clavel (Directeur déguisé)
  'hassa': 'hassel', // Membre du Conseil des 4 Paldea (Type Dragon) - Twilight Masquerade
  'irido': 'drayton', // Membre du Conseil des 4 de l'Académie Myrtille - Surging Sparks
  'kassis': 'kieran', // Rival de l'extension Teal Mask - Scarlet & Violet
  'kombu': 'kofu', // Champion d'Arène Paldea (Type Eau) - Stellar Crown
  'laïm': 'ryme', // Champion d'Arène Paldea (Type Spectre) - Obsidian Flames
  'laim': 'ryme', // Variante sans tréma
  'mashynn': 'iono', // Champion d'Arène Paldea (Type Électrique) - Paldea Evolved
  'meloco': 'mela', // Boss Team Star Feu (Schedar Squad) - Paradox Rift
  'menzi': 'nemona', // Rivale principale Paldea - Paldean Fates
  'milio et naire': 'billy & o\'nare', // Duo Kanto - Carte Supporter
  'mimosa': 'miriam', // Infirmière de l'Académie - Scarlet & Violet
  'mora': 'raifort', // Professeur d'Histoire de l'Académie - Twilight Masquerade / Prismatic Evolutions
  'nèflie': 'eri', // Boss Team Star Combat (Caph Squad) - Paldean Fates
  'neflie': 'eri', // Variante sans accent
  'nérine': 'amarys', // Conseil des 4 Académie Myrtille (Type Acier) - Stellar Crown
  'nerine': 'amarys', // Variante sans accent
  'ortiga': 'ortega', // Boss Team Star Fée (Ruchbah Squad) - Paldea
  'pania': 'penny', // Boss de Team Star (vraie identité de Cassiopée) - Paldea
  'pepper': 'arven', // Ami du protagoniste (quête des Herbes Mystérieuses) - Paldea
  'popi': 'poppy', // Membre du Conseil des 4 Paldea (Type Acier)
  'rika': 'rika', // Conseil des 4 Paldea (Type Sol)
  'roseille': 'carmine', // Sœur de Kieran (DLC The Teal Mask) - Paldea
  'rubépin': 'crispin', // Conseil des 4 Académie Myrtille (Type Feu) - Paldea
  'rubepin': 'crispin', // Variante sans accent
  'salvio': 'salvatore', // Professeur de langues Académie Raisin - Paldea
  'sbire de la team star': 'team star grunt', // Classe de dresseur Team Star - Paldea
  'sbire team star': 'team star grunt', // Variante courte
  'taro': 'lacey', // Conseil des 4 Académie Myrtille (DLC Indigo Disk) - Paldea

  // Hisui / Sinnoh (Legends: Arceus)
  'nacchara': 'irida', // Cheffe du Clan Perle - Astral Radiance
  'lucio': 'lucian', // Membre du Conseil des 4 Sinnoh (Type Psy) - Twilight Masquerade
  'pierrick': 'roark', // Champion d'Arène Charbourg Sinnoh (Type Roche)

  // Unys / Unova (Gen 5)
  'clown': 'harlequin', // Classe de Dresseur - White Flare
  'ludvina': 'hilda', // Protagoniste de Pokémon Noir et Blanc
  'oryse': 'fennel', // Scientifique spécialiste des rêves Pokémon - Unys
  'anis': 'shauntal', // Conseil des 4 Unys (Type Spectre)

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
  'ordres du boss': 'boss\'s orders', // Carte Supporter classique - Multiple rééditions
  'intendant': 'caretaker', // Carte Supporter
  'lithia': 'perrin', // Photographe - Twilight Masquerade
  'machinations de xanthin': 'xerosic\'s machinations', // Carte signature - XY Phantom Forces
  'sœur parasol': 'parasol lady', // Classe de dresseuse - Carte Supporter
  'soeur parasol': 'parasol lady', // Variante sans accent
  'petite frappe': 'ruffian', // Classe de dresseur - Carte Supporter
  'plan de n': 'n\'s plan', // Carte signature de N (Team Plasma) - Unova
  'plan du professeur turum': 'professor turo\'s scenario', // Professeur de Paldea (Pokémon Écarlate)
  'vitalité de la professeure olim': 'professor sada\'s vitality', // Professeure de Paldea (Pokémon Violet)
  'recherches professorales': 'professor\'s research', // Carte Supporter classique - Multiple rééditions
  'soutien de néphie': 'lana\'s aid', // Capitaine d'Épreuve Alola (Type Eau)
  'soutien de nephie': 'lana\'s aid', // Variante sans accent
  'surfeur': 'surfer', // Classe de dresseur

  // ========================================
  // OBJETS ET CARTES DRESSEUR
  // ========================================

  'bandeau rigide': 'rigid band',
  'lunettes de protection': 'protective goggles',
  'piste cyclable': 'cycling road',
  'gros ballon': 'big air balloon',
  'vieil ambre ancien': 'antique old amber',
  'fossile nautile ancien': 'antique helix fossil',
  'planche de sauvetage': 'rescue board', // Objet Dresseur
  'sac de menzi': 'nemona\'s backpack' // Objet Paldea - Paldean Fates
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
