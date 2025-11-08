/**
 * Traductions Français → Anglais pour les cartes Dresseur
 *
 * Ce fichier contient les traductions des noms de dresseurs (champions d'arène,
 * rivaux, personnages) du français vers l'anglais pour l'API Pokemon TCG.
 */

// Version du dictionnaire - Incrémenter à chaque ajout/modification pour invalider le cache
export const TRAINER_TRANSLATIONS_VERSION = '1.9.1' // Dernière mise à jour: 2025-01-07 - Ajout "rubber gloves"

const TRAINER_TRANSLATIONS = {
  // ========================================
  // CHAMPIONS D'ARÈNE (GYM LEADERS)
  // ========================================

  // Johto (Gen 2)
  'albert': 'falkner', // Mauville/Violette - Type Vol
  'peter': 'lance', // Champion de la Ligue Pokémon Johto/Kanto (Type Dragon)
  'regard de jasmine': 'jasmine\'s gaze', // Championne d'Arène Oliville (Type Acier)



  // Kanto (Gen 1)
  'aldo': 'bruno', // Conseil des 4 Kanto (Type Combat)
  // Hoenn (Gen 3)
  'adriane': 'flannery', // Championne d'Arène Vermilava (Type Feu)
  'damien': 'sidney', // Conseil des 4 Hoenn (Type Ténèbres)
  'spectra': 'phoebe', // Conseil des 4 Hoenn (Type Spectre)
  'marc': 'wallace', // Maître de la Ligue Pokémon Hoenn (Type Eau)
  'amaryllis': 'zinnia', // Draconologue et antagoniste - Pokémon Rubis Oméga/Saphir Alpha
  'résolution d\'amaryllis': 'zinnia\'s resolve', // Carte Supporter - Celestial Storm

  // Galar (Gen 8)
  'alba minçalor': 'cara liss', // Scientifique - Restauration de fossiles
  'alba mincalor': 'cara liss', // Variante sans cédille
  'alistair': 'allister', // Champion d'Arène Galar (Type Spectre)
  'dhilan': 'peony', // Ex-Champion Galar (Type Acier) - Crown Tundra DLC
  'pivonia': 'peonia', // Fille de Dhilan - Crown Tundra DLC
  'shehroz': 'rose', // Président Macro Cosmos, frère de Dhilan
  'donna': 'nessa', // Championne d'Arène Galar (Type Eau)
  'sica': 'choy', // Personnage Galar (Gen 8)
  'faïza': 'bea', // Championne d'Arène Galar (Type Combat)
  'faiza': 'bea', // Variante sans tréma
  'kabu': 'kabu', // Champion d'Arène Kickenham Galar (Type Feu)
  'liv': 'oleana', // Assistante du président de Macro Cosmos Galar (Gen 8)
  'professeure magnolia': 'professor magnolia', // Professeure de Galar - Grand-mère de Sonia
  'professeur magnolia': 'professor magnolia', // Variante masculine (rare)
  'sonya': 'sonia', // Assistante du Professeur Magnolia et rivale - Galar (Gen 8)
  'lona': 'melony', // Championne d'Arène Kickenham Galar (Type Glace) - Pokémon Épée
  'mustar': 'mustard', // Ancien Champion de Galar et Maître du Dojo - Isle of Armor DLC
  'mustar style mille poings': 'rapid strike style mustard', // Carte Supporter - Battle Styles
  'mustar style poing final': 'single strike style mustard', // Carte Supporter - Battle Styles
  'saturnin': 'avery', // Rival du DLC Isle of Armor - Galar (Gen 8)
  'sophora': 'klara', // Rivale du DLC Isle of Armor - Galar (Gen 8)
  'nabil': 'hop', // Rival principal de Pokémon Épée et Bouclier - Galar (Gen 8)
  'tarak': 'leon', // Maître de la Ligue Pokémon Galar et frère de Nabil - Galar (Gen 8)
  'travis': 'bede', // Rival de Pokémon Épée et Bouclier - Galar (Gen 8)
  'percy': 'milo', // Champion d'Arène Galar (Type Plante) - Turffield
  'peterson': 'piers', // Champion d'Arène Galar (Type Ténèbres) - Spikemuth
  'roy': 'raihan', // Champion d'Arène Kickenham Galar (Type Dragon)
  'sally': 'opal', // Championne d'Arène Motorby Galar (Type Fée)
  'jean-fleuret et jean-targe': 'sordward & shielbert', // Antagonistes Galar (Gen 8)
  'sbire de la team yell': 'team yell grunt', // Membre de la Team Yell Galar (Gen 8)
  'trou brothers': 'digging duo', // Duo de frères fouisseurs - Galar (Gen 8)
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

  'thaïm': 'tyme', // Championne d'Arène Paldea (Type Roche) - Professeure de Mathématiques
  'thaim': 'tyme', // Variante sans tréma
  'tully': 'tulip', // Championne d'Arène Paldea (Type Psy) - Influenceuse
  // Kalos (Gen 6)
  'lino': 'grant', // Champion d'Arène Cailloumagne Kalos (Type Roche)
  'narcisse': 'siebold', // Membre du Conseil des 4 Kalos (Type Eau)
  'sannah': 'shauna', // Rivale principale de Pokémon X/Y - Kalos (Gen 6)

  // Hisui / Sinnoh (Legends: Arceus)
  'adamantin': 'adaman', // Chef du Clan Diamant - Astral Radiance
  'cormier': 'kamado', // Commandant du Corps des Inspecteurs Rusti-Cité - Astral Radiance
  'nacchara': 'irida', // Cheffe du Clan Perle - Astral Radiance
  'lucio': 'lucian', // Membre du Conseil des 4 Sinnoh (Type Psy) - Twilight Masquerade
  'pierrick': 'roark', // Champion d'Arène Charbourg Sinnoh (Type Roche)
  'rené': 'barry', // Rival principal de Pokémon Diamant/Perle/Platine - Sinnoh (Gen 4)
  'sara': 'cheryl', // Personnage de Pokémon Diamant/Perle/Platine - Sinnoh (Gen 4)
  'kiméra': 'fantina', // Championne d'Arène Voilaroc Sinnoh (Type Spectre)
  'kimera': 'fantina', // Variante sans accent
  'gladys': 'candice', // Championne d'Arène Frimapic Sinnoh (Type Glace)
  'flo': 'gardenia', // Championne d'Arène Vestigion Sinnoh (Type Plante)
  'vitalité de flo': 'gardenia\'s vigor', // Carte Supporter - Astral Radiance
  'vitalite de flo': 'gardenia\'s vigor', // Variante sans accent
  'graham': 'iscan', // Gardien Bastion Hisui - Astral Radiance
  'marcia': 'arezu', // Gardienne Hisui (Pokémon Seigneur Cerbyllin) - Astral Radiance
  'percupio': 'volo', // Marchand et antagoniste principal de Pokémon Legends: Arceus
  'professeur lavande': 'professor laventon', // Professeur du Groupe Galaxie - Pokémon Legends: Arceus
  'professeure lavande': 'professor laventon', // Variante féminine
  'selena': 'cyllene', // Commandante du Groupe Galaxie Hisui - Pokémon Legends: Arceus
  'professeur pimprenelle': 'professor burnet', // Professeure d'Alola - Étude des Ultra-Brèches
  'professeure pimprenelle': 'professor burnet', // Variante féminine

  // Unys / Unova (Gen 5)
  'anis': 'shauntal', // Conseil des 4 Unys (Type Spectre)
  'clown': 'harlequin', // Classe de Dresseur - White Flare
  'saltimbanque': 'kindler', // Classe de Dresseur spécialisée Type Feu
  'percila': 'caitlin', // Conseil des 4 Unys (Type Psy)
  'les détroussœurs': 'miss fortune sisters', // Duo de voleuses Unys (Gen 5)
  'les detroussœurs': 'miss fortune sisters', // Variante sans accent
  'les detrousseurs': 'miss fortune sisters', // Variante sans accents ni ligature
  'détroussœurs': 'miss fortune sisters', // Variante courte
  'detroussœurs': 'miss fortune sisters', // Variante courte sans accent
  'detrousseurs': 'miss fortune sisters', // Variante courte sans accents ni ligature
  'ludvina': 'hilda', // Protagoniste de Pokémon Noir et Blanc
  'oryse': 'fennel', // Scientifique spécialiste des rêves Pokémon - Unys
  'carolina': 'skyla', // Championne d'Arène Méanville Unys (Type Vol)
  'anis': 'shauntal', // Conseil des 4 Unys (Type Spectre)

  // ========================================
  // CARTES SUPPORTER GÉNÉRALES
  // ========================================

  'amos de la team rocket': 'team rocket\'s archer', // Général de la Team Rocket - Johto
  'ariane de la team rocket': 'team rocket\'s ariana', // Générale de la Team Rocket - Johto
  'giovanni de la team rocket': 'team rocket\'s giovanni', // Chef de la Team Rocket - Kanto
  'lambda de la team rocket': 'team rocket\'s petrel', // Général de la Team Rocket - Johto
  'lance de la team rocket': 'team rocket\'s proton', // Général de la Team Rocket - Johto
  'admin rocket': 'rocket\'s admin', // Admin générique de la Team Rocket
  'aide de nina': 'daisy\'s help',
  'transfert de léo': 'bill\'s transfer',
  'transfert de leo': 'bill\'s transfer', // Variante sans accent
  'charisme de giovanni': 'giovanni\'s charisma',
  'amis de paldea': 'friends in paldea', // Supporter Gen 9
  'ambition de cynthia': 'cynthia\'s ambition', // Maîtresse de la Ligue Sinnoh - Carte Supporter
  'amis de galar': 'friends in galar', // Supporter Gen 8
  'amis de hisui': 'friends in hisui', // Supporter Hisui (Legends Arceus)
  'amis de sinnoh': 'friends in sinnoh', // Supporter Sinnoh (Gen 4)
  'apia': 'honey', // Personnage Sinnoh
  'armand': 'riley', // Aura Guardian - Sinnoh
  'armando, rachid et noa': 'chili & cilan & cress', // Trio Gym Leaders Unova (Gen 5)
  'aromathérapeute': 'aroma lady', // Classe de dresseuse
  'attention de tcheren': 'cheren\'s care', // Carte Supporter Unova (Gen 5)
  'éclat d\'inezia': 'elesa\'s sparkle', // Carte Supporter Unova (Gen 5)
  'eclat d\'inezia': 'elesa\'s sparkle', // Variante sans accent
  'ball masqué': 'ball guy', // Personnage Galar (Gen 8)
  'barista': 'café master', // Classe de personnage
  'bastien': 'brawly', // Champion d'Arène Myokara Hoenn (Type Combat)
  'bayar': 'brandon', // Pyramid King - Frontier de Combat Hoenn (Gen 3)
  'bélila': 'zisu', // Capitaine de sécurité Hisui (Legends Arceus)
  'belila': 'zisu', // Variante sans accent
  'ornithologue': 'bird keeper', // Classe de dresseur
  'scout': 'bug catcher', // Classe de dresseur spécialisée Type Insecte
  'canon': 'beauty', // Classe de dresseuse
  'danseuse': 'dancer', // Classe de dresseuse
  'docteure': 'doctor', // Classe de dresseur
  'docteur': 'doctor', // Variante masculine
  'mademoiselle': 'lady', // Classe de dresseuse
  'dresseurs d\'arène': 'gym trainer', // Classe de dresseur (pluriel)
  'dresseurs d arène': 'gym trainer', // Variante sans apostrophe
  'dresseur d\'arène': 'gym trainer', // Singulier
  'dresseur d arène': 'gym trainer', // Singulier sans apostrophe
  'capitaine d\'équipe blanche': 'blanche', // Leader Team Mystic - Pokémon GO
  'capitaine d equipe blanche': 'blanche', // Variante sans apostrophe
  'capitaine d\'équipe candela': 'candela', // Leader Team Valor - Pokémon GO
  'capitaine d equipe candela': 'candela', // Variante sans apostrophe
  'capitaine d\'équipe spark': 'spark', // Leader Team Instinct - Pokémon GO
  'capitaine d equipe spark': 'spark', // Variante sans apostrophe
  'cardus': 'thorton', // Factory Head - Frontier de Combat Sinnoh (Gen 4)
  'carolina': 'skyla', // Championne d'Arène Méanville Unova (Type Vol)
  'chaz': 'gordie', // Champion d'Arène Galar (Type Roche)
  'concentration de cornélia': "korrina's focus", // Championne d'Arène Relifac-le-Haut Kalos (Type Combat)
  'conviction de marion': "karen's conviction", // Membre du Conseil des 4 Johto (Type Ténèbres)
  'copieuse': 'copycat', // Carte Supporter classique
  'dame du centre pokémon': 'pokemon center lady', // Infirmière des Centres Pokémon
  'dame du centre pokemon': 'pokemon center lady', // Variante sans accent
  'art secret de jeannine': 'janine\'s secret art', // Fuchsia Gym Leader
  'art secret de janine': 'janine\'s secret art', // Variante orthographe anglaise
  'charme d\'atalante': 'lisia\'s appeal', // Championne de Concours Hoenn - Surging Sparks (SSP)
  'charme d atalante': 'lisia\'s appeal', // Variante espace
  'charme atalante': 'lisia\'s appeal', // Variante courte
  'atalante': 'lisia', // Nom du personnage seul (carte plus ancienne, Celestial Storm)
  'tcheren': 'cheren', // Rival de Pokémon Noir et Blanc (Gen 5)
  'gamin': 'youngster', // Dresseur classe Gamin - Scarlet & Violet
  'écolier': 'schoolboy', // Classe de dresseur
  'ecolier': 'schoolboy', // Variante sans accent
  'écolière': 'schoolgirl', // Classe de dresseuse
  'ecoliere': 'schoolgirl', // Variante sans accent
  'employés de la ligue': 'league staff', // Classe de dresseur
  'employes de la ligue': 'league staff', // Variante sans accent
  'encouragement de la team yell': 'team yell\'s cheer', // Carte Supporter Galar (Gen 8)
  'rosemary': 'marnie', // Rivale principale de Pokémon Épée/Bouclier - Galar (Gen 8)
  'la fierté de rosemary': 'marnie\'s pride', // Carte Supporter Galar (Gen 8)
  'la fierte de rosemary': 'marnie\'s pride', // Variante sans accent
  'guido': 'dan', // Guide d\'Arène - Personnage récurrent
  'fille en kimono': 'furisode girl', // Classe de dresseuse Kalos (Gen 6)
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
  'soins de l\'éleveur de pokémon': 'pokemon breeder\'s nurturing', // Carte Supporter
  'soins de l\'eleveur de pokemon': 'pokemon breeder\'s nurturing', // Variante sans accents
  'soins de l éleveur de pokémon': 'pokemon breeder\'s nurturing', // Variante espace
  'soins de l eleveur de pokemon': 'pokemon breeder\'s nurturing', // Variante espace sans accents
  'ouvrière': 'worker', // Classe de dresseur
  'ouvriere': 'worker', // Variante sans accent
  'poké enfant': 'poké kid', // Classe de dresseur
  'poke enfant': 'poké kid', // Variante sans accent
  'prémonition de margie': 'acerola\'s premonition', // Capitaine d'Épreuve Alola (Type Spectre)
  'premonition de margie': 'acerola\'s premonition', // Variante sans accent
  'plan de n': 'n\'s plan', // Carte signature de N (Team Plasma) - Unova
  'plan du professeur turum': 'professor turo\'s scenario', // Professeur de Paldea (Pokémon Écarlate)
  'vitalité de la professeure olim': 'professor sada\'s vitality', // Professeure de Paldea (Pokémon Violet)
  'recherches professorales': 'professor\'s research', // Carte Supporter classique - Multiple rééditions
  'recherches professorales professeure magnolia': 'professor\'s research (professor magnolia)', // Variante spécifique Magnolia
  'recherches professorales magnolia': 'professor\'s research (professor magnolia)', // Variante courte
  'soutien de néphie': 'lana\'s aid', // Capitaine d'Épreuve Alola (Type Eau)
  'soutien de nephie': 'lana\'s aid', // Variante sans accent
  'tili': 'hau', // Rival Alola (Gen 7) - Pokémon Soleil et Lune
  'ténacité de nikolaï': 'colress\'s tenacity', // Scientifique Team Plasma - Unys
  'tenacite de nikolai': 'colress\'s tenacity', // Variante sans accents
  'expérience de nikolaï': 'colress\'s experiment', // Scientifique Team Plasma - Unys
  'experience de nikolai': 'colress\'s experiment', // Variante sans accents
  'surfeur': 'surfer', // Classe de dresseur

  // ========================================
  // OBJETS ET CARTES DRESSEUR
  // ========================================

  'badge élémentaire': 'elemental badge', // Objet Dresseur
  'badge elementaire': 'elemental badge', // Variante sans accent
  'badge feuille neige': 'snow leaf badge', // Objet Dresseur
  'badge lune et soleil': 'moon & sun badge', // Objet Dresseur
  'badge ruban': 'ribbon badge', // Objet Dresseur
  'baie prine': 'lum berry', // Objet - Baie
  'baie sitrus': 'sitrus berry', // Objet - Baie
  'ballon': 'air balloon', // Objet Dresseur
  'bandana brûlant': 'burning scarf', // Objet Dresseur
  'bandana brulant': 'burning scarf', // Variante sans accent
  'bandeau rigide': 'rigid band',
  'bandeau vitalité': 'vitality band', // Objet Dresseur
  'bandeau vitalite': 'vitality band', // Variante sans accent
  'lunettes de protection': 'protective goggles',
  'piste cyclable': 'cycling road',
  'gros ballon': 'big air balloon',
  'vieil ambre ancien': 'antique old amber',
  'fossile nautile ancien': 'antique helix fossil',
  'fossile plume ancien': 'antique plume fossil', // Fossile Objet - Galar
  'fossile dôme ancien': 'antique dome fossil', // Fossile Objet - Galar
  'fossile dome ancien': 'antique dome fossil', // Variante sans accent
  'fossile plaque ancien': 'antique cover fossil', // Fossile Objet - Galar
  'fossile racine ancien': 'antique root fossil', // Fossile Objet - Galar
  'planche de sauvetage': 'rescue board', // Objet Dresseur
  'masque de monstre': 'ogre\'s mask', // Objet Dresseur
  'max canne': 'max rod', // Objet ACE SPEC - Prismatic Evolutions (SV8.5)
  'méga canne': 'super rod', // Objet Dresseur - Multiple éditions (Neo Genesis, Paldea Evolved, etc.)
  'mega canne': 'super rod', // Variante sans accent
  'mixeur brillant': 'brilliant blender', // Objet Dresseur - Scarlet & Violet
  'note d\'ingérence': 'meddling memo', // Objet Dresseur - Scarlet & Violet
  'note d\'ingerence': 'meddling memo', // Variante sans accent
  'note d ingerence': 'meddling memo', // Variante sans apostrophe ni accent
  'orbe téracristal': 'tera orb', // Objet ACE SPEC - Scarlet & Violet (Téracristallisation)
  'orbe teracristal': 'tera orb', // Variante sans accent
  'panier de pique-nique': 'picnic basket', // Objet Dresseur - Scarlet & Violet
  'panier de pique nique': 'picnic basket', // Variante sans tiret
  'perche à motismart': 'roto-stick', // Objet Dresseur - Prismatic Evolutions (Chercher Supporters)
  'perche a motismart': 'roto-stick', // Variante sans accent
  'pièce énergie': 'energy coin', // Objet Dresseur - Permet de manipuler les énergies
  'piece energie': 'energy coin', // Variante sans accent
  'pince attrapeuse': 'grabber', // Objet Dresseur - Permet de récupérer des cartes
  'poffin copain-copain': 'buddy-buddy poffin', // Objet Dresseur - Scarlet & Violet
  'poffin copain copain': 'buddy-buddy poffin', // Variante sans tiret
  'poing vengeance': 'vengeful punch', // Objet Dresseur - Scarlet & Violet
  'pokématos 3.0': 'pokégear 3.0', // Objet Dresseur - HeartGold & SoulSilver
  'pokematos 3.0': 'pokegear 3.0', // Variante sans accent
  'poupée ronflex': 'snorlax doll', // Objet Dresseur - Carte classique
  'poupee ronflex': 'snorlax doll', // Variante sans accent
  'pp plus de n': 'n\'s pp up', // Objet Dresseur - Black & White
  'rappel cyclone': 'scoop up cyclone', // Objet ACE SPEC - Scarlet & Violet
  'recherche d\'énergie': 'energy search', // Objet Dresseur - Carte classique de base
  'recherche d\'energie': 'energy search', // Variante sans accent
  'recherche energie': 'energy search', // Variante sans "d'"
  'recherche d\'énergie pro': 'energy search pro', // Objet Dresseur - Version améliorée
  'recherche d\'energie pro': 'energy search pro', // Variante sans accent
  'recherche energie pro': 'energy search pro', // Variante sans "d'"
  'récupération d\'énergie': 'energy retrieval', // Objet Dresseur - Carte classique
  'récupération d\'energie': 'energy retrieval', // Variante sans accent
  'recuperation d\'energie': 'energy retrieval', // Variante sans accents
  'recuperation energie': 'energy retrieval', // Variante sans accents ni "d'"
  'récupération d\'énergie supérieure': 'superior energy retrieval', // Objet Dresseur - Version améliorée
  'récupération d\'energie supérieure': 'superior energy retrieval', // Variante sans accent "é"
  'récupération d\'energie superieure': 'superior energy retrieval', // Variante sans accents
  'recuperation d\'energie superieure': 'superior energy retrieval', // Variante sans accents
  'recuperation energie superieure': 'superior energy retrieval', // Variante sans accents ni "d'"
  'registre ami': 'pal pad', // Objet Dresseur - Diamond & Pearl / HeartGold SoulSilver
  'robot-bêtant de la team rocket': 'team rocket\'s bother-bot', // Objet Dresseur - Prismatic Evolutions
  'robot-betant de la team rocket': 'team rocket\'s bother-bot', // Variante sans accent
  'robot betant de la team rocket': 'team rocket\'s bother-bot', // Variante sans tiret ni accent
  'émetteur-récepteur de la team rocket': 'team rocket\'s transceiver', // Objet Dresseur - Prismatic Evolutions
  'émetteur-recepteur de la team rocket': 'team rocket\'s transceiver', // Variante sans accent "é"
  'emetteur-recepteur de la team rocket': 'team rocket\'s transceiver', // Variante sans accents
  'emetteur recepteur de la team rocket': 'team rocket\'s transceiver', // Variante sans accents ni tiret
  'sauvegarde de rose': 'roseanne\'s backup', // Carte Supporter - Diamond & Pearl
  'découverte de l\'aventurière': 'adventurer\'s discovery', // Carte Objet
  'decouverte de l\'aventuriere': 'adventurer\'s discovery', // Variante sans accents
  'sac de menzi': 'nemona\'s backpack', // Objet Paldea - Paldean Fates
  'sac de nabil': 'hop\'s bag', // Objet Dresseur - Sword & Shield
  'sandwich de pepper': 'arven\'s sandwich', // Objet Paldea - Carte signature d'Arven
  'sombre ball': 'dusk ball', // Objet Dresseur - Poké Ball spéciale
  'sonnette d\'appel': 'call bell', // Objet Dresseur - Scarlet & Violet
  'sonnette appel': 'call bell', // Variante sans "d'"
  'souffleur titanesque': 'megaton blower', // Objet Dresseur - Scarlet & Violet
  'stickers énergie': 'energy sticker', // Objet Dresseur - Scarlet & Violet
  'stickers energie': 'energy sticker', // Variante sans accent
  'super ball': 'great ball', // Objet Dresseur - Poké Ball classique
  'super ball de la team rocket': 'team rocket\'s great ball', // Objet Dresseur - Prismatic Evolutions
  'super bonbon': 'rare candy', // Objet Dresseur - Carte classique d'évolution
  'tambour éveil': 'awakening drum', // Objet Dresseur - Sword & Shield
  'tambour eveil': 'awakening drum', // Variante sans accent
  'tampon injuste': 'unfair stamp', // Objet ACE SPEC - Scarlet & Violet
  'machine à ct': 'tm machine', // Objet Dresseur - Scarlet & Violet
  'machine a ct': 'tm machine', // Variante sans accent
  'tondeuse de main': 'hand trimmer', // Objet Dresseur - Scarlet & Violet
  'trompette de verre': 'glass trumpet', // Objet Dresseur - Scarlet & Violet
  'urne terrestre': 'earthen vessel', // Objet Dresseur - Scarlet & Violet
  'vieil ambre ancien': 'antique old amber', // Objet Dresseur - Prismatic Evolutions
  'arrache-outil': 'tool scrapper', // Objet Dresseur - Carte classique
  'arrache outil': 'tool scrapper', // Variante sans tiret
  'attrape-pokémon': 'pokémon catcher', // Objet classique - Multiple rééditions
  'attrape-pokemon': 'pokemon catcher', // Variante sans accents
  'attrape-ultime': 'prime catcher', // Objet ACE SPEC - Scarlet & Violet
  'attrape ultime': 'prime catcher', // Variante sans tiret
  'bombe risquée de la team rocket': 'team rocket\'s venture bomb', // Objet Dresseur - Prismatic Evolutions
  'bombe risquee de la team rocket': 'team rocket\'s venture bomb', // Variante sans accent
  'billet à échanger': 'redeemable ticket', // Objet
  'billet a echanger': 'redeemable ticket', // Variante sans accents
  'bloqueur d\'outil': 'tool jammer', // Objet Dresseur
  'bloqueur d outil': 'tool jammer', // Variante sans apostrophe
  'boîte à secrets': 'secret box', // Objet
  'boite a secrets': 'secret box', // Variante sans accents
  'boîte à désastre': 'box of disaster', // Objet Dresseur
  'boite a desastre': 'box of disaster', // Variante sans accents
  'boule de cristal brume': 'fog crystal', // Objet Dresseur
  'bras à remontoir': 'windup arm', // Objet Dresseur
  'bras a remontoir': 'windup arm', // Variante sans accent
  'caisse à outils': 'tool box', // Objet Dresseur
  'caisse a outils': 'tool box', // Variante sans accent
  'canne ordinaire': 'ordinary rod', // Objet Dresseur
  'cape d\'endurance': 'cape of toughness', // Objet Dresseur
  'cape d endurance': 'cape of toughness', // Variante sans apostrophe
  'capsule de redémarrage': 'reboot pod', // Objet
  'capsule de redemarrage': 'reboot pod', // Variante sans accents
  'capsule mémoire': 'memory capsule', // Objet Dresseur
  'capsule memoire': 'memory capsule', // Variante sans accent
  'cendre sacrée': 'sacred ash', // Objet Dresseur - Carte classique
  'cendre sacree': 'sacred ash', // Variante sans accents
  'casque miracle': 'miracle headset', // Objet
  'casque brut': 'rocky helmet', // Objet Dresseur
  'casque costaud': 'rugged helmet', // Objet Dresseur
  'casque intégral': 'full face guard', // Objet Dresseur
  'casque integral': 'full face guard', // Variante sans accent
  'casque marmite': 'pot helmet', // Objet Dresseur
  'casquette de patrouille': 'patrol cap', // Objet
  'caverne de cristal': 'crystal cave', // Objet Dresseur - Stade
  'ceinture choix': 'choice belt', // Objet Dresseur
  'chariot échange': 'switch cart', // Objet Dresseur
  'chariot echange': 'switch cart', // Variante sans accent
  'chariot précieux': 'precious trolley', // Objet
  'chariot precieux': 'precious trolley', // Variante sans accent
  'chaussures de randonnée': 'trekking shoes', // Objet Dresseur
  'chaussures de randonnee': 'trekking shoes', // Variante sans accent
  'clairon de la team yell': 'yell horn', // Objet Dresseur - Galar
  'cloche familière': 'familiar bell', // Objet Dresseur
  'cloche familiere': 'familiar bell', // Variante sans accent
  'conserve douteuse': 'suspicious food tin', // Objet Dresseur
  'corde sortie': 'escape rope', // Objet Dresseur
  'corne résonnante': 'echoing horn', // Objet Dresseur
  'corne resonnante': 'echoing horn', // Variante sans accent
  'curry épicé aux piments': 'spicy seasoned curry', // Objet Dresseur
  'curry epice aux piments': 'spicy seasoned curry', // Variante sans accent
  'civière nocturne': 'night stretcher', // Objet
  'civiere nocturne': 'night stretcher', // Variante sans accent
  'combat au lait': 'fighting au lait', // Objet - Boisson café latte
  'commande emballée': 'boxed order', // Objet
  'commande emballee': 'boxed order', // Variante sans accent
  'aspirateur perdu': 'lost vacuum', // Objet Dresseur
  'assurance échec': 'blunder policy', // Objet Dresseur - Battle Styles (BRS)
  'assurance echec': 'blunder policy', // Variante sans accent
  'attrape-riposte': 'counter catcher', // Objet
  'attrape riposte': 'counter catcher', // Variante sans tiret
  'arôme captivant': 'capturing aroma', // Objet Dresseur
  'arome captivant': 'capturing aroma', // Variante sans accent
  'détecteur de trésors': 'treasure tracker', // Objet
  'detecteur de tresors': 'treasure tracker', // Variante sans accents
  'drone livreur': 'delivery drone', // Objet
  'urne terrestre': 'earthen vessel', // Objet
  'échange croisé': 'cross switcher', // Objet Dresseur
  'echange croise': 'cross switcher', // Variante sans accents
  'échange': 'switch', // Objet classique - Multiple rééditions
  'echange': 'switch', // Variante sans accent
  'échange combiné': 'scramble switch', // Objet ACE SPEC
  'echange combine': 'scramble switch', // Variante sans accents
  'échange d\'énergie': 'energy switch', // Objet classique - Multiple rééditions
  'echange d\'energie': 'energy switch', // Variante sans accents
  'echange d energie': 'energy switch', // Variante sans apostrophe ni accents
  'écusson métal': 'metal saucer', // Objet Dresseur
  'ecusson metal': 'metal saucer', // Variante sans accent
  'élixir de dragon': 'dragon elixir', // Objet
  'elixir de dragon': 'dragon elixir', // Variante sans accent
  'encens d\'évolution': 'evolution incense', // Objet Dresseur
  'encens d\'evolution': 'evolution incense', // Variante sans accent
  'encens d evolution': 'evolution incense', // Variante sans apostrophe ni accent
  'épuisette de rappel': 'scoop up net', // Objet Dresseur
  'epuisette de rappel': 'scoop up net', // Variante sans accent
  'et voila les team rocket !': 'here comes team rocket!', // Supporter - Team Rocket
  'et voila les team rocket': 'here comes team rocket!', // Variante sans point d'exclamation
  'éventail houleux': 'fan of waves', // Objet Dresseur
  'eventail houleux': 'fan of waves', // Variante sans accent
  'faux professeur chen': 'imposter professor oak', // Supporter
  'fortifiant obscur': 'dark patch', // Objet Dresseur
  'fortifiant turbo': 'turbo patch', // Objet Dresseur
  'fossile inconnu': 'unidentified fossil', // Objet Dresseur
  'fossile rare': 'rare fossil', // Objet Dresseur
  'fromage meumeu': 'moomoo cheese', // Objet Dresseur
  'gants d\'épreuve': 'struggle gloves', // Objet Dresseur
  'gants d\'epreuve': 'struggle gloves', // Variante sans accent
  'gants d epreuve': 'struggle gloves', // Variante sans apostrophe ni accent
  'gants de caoutchouc': 'rubber gloves', // Objet Dresseur
  'recycleur d\'énergie': 'energy recycler', // Objet
  'recycleur d\'energie': 'energy recycler', // Variante sans accent
  'recycleur d energie': 'energy recycler', // Variante sans apostrophe ni accent
  'récupération d\'énergie': 'energy retrieval', // Objet classique - Multiple rééditions
  'recuperation d\'energie': 'energy retrieval', // Variante sans accents
  'recuperation d energie': 'energy retrieval', // Variante sans apostrophe ni accents
  'faiblo ball': 'nest ball', // Objet classique - Multiple rééditions
  'flûte d\'accompagnement': 'accompanying flute', // Objet
  'flute d\'accompagnement': 'accompanying flute', // Variante sans accent
  'flute d accompagnement': 'accompanying flute', // Variante sans apostrophe ni accent
  'générateur électrique': 'electric generator', // Objet
  'generateur electrique': 'electric generator', // Variante sans accents
  'grande amulette': 'big charm', // Objet Dresseur
  'hyper arôme': 'hyper aroma', // Objet
  'hyper arome': 'hyper aroma', // Variante sans accent
  'hyper ball': 'ultra ball', // Objet classique - Multiple rééditions
  'jouet plumeau': 'chill teaser toy', // Objet
  'kit attrape-insecte': 'bug catching set', // Objet
  'kit attrape insecte': 'bug catching set', // Variante sans tiret
  'kit de déduction': 'deduction kit', // Objet
  'kit de deduction': 'deduction kit', // Variante sans accent
  'laser dangereux': 'dangerous laser', // Objet
  'lettre d\'encouragement': 'letter of encouragement', // Objet
  'lettre d\'encouragement': 'letter of encouragement', // Variante sans accent
  'lettre d encouragement': 'letter of encouragement', // Variante sans apostrophe ni accent
  'love ball': 'love ball', // Objet - Poké Ball (même nom en français/anglais)
  'machine technique : poing de crise': 'technical machine: crisis punch', // Machine Technique - Carte Objet
  'machine technique poing de crise': 'technical machine: crisis punch', // Variante sans deux-points
  'maillet amélioré': 'enhanced hammer', // Objet Dresseur - Carte Objet
  'maillet ameliore': 'enhanced hammer', // Variante sans accent
  'maillet écrasant': 'crushing hammer', // Objet Dresseur - Carte Objet
  'maillet ecrasant': 'crushing hammer' // Variante sans accent
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
