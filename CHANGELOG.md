# CHANGELOG - VaultEstim v2

Historique détaillé de toutes les fonctionnalités implémentées, corrections de bugs et améliorations.

**Dernière mise à jour** : 2025-01-09 | **Version cache** : 2.0.0 | **Cartes totales** : 17,432

---

## Table des Matières

- [Nouvelles Fonctionnalités 2025 (81-86)](#nouvelles-fonctionnalités-2025-81-86)
- [Fonctionnalités Majeures (1-40)](#fonctionnalités-majeures-1-40)
- [Traductions et Corrections (41-50)](#traductions-et-corrections-41-50)
- [Améliorations UX et Fixes (51-80)](#améliorations-ux-et-fixes-51-80)

---

## Nouvelles Fonctionnalités 2025 (81-86)

### 81. 🔄 Système de Versioning du Cache (2025-01-09)
Gestion automatique des versions de cache IndexedDB pour synchronisation multi-appareils.

**Fonctionnalités** :
- Constante `CACHE_VERSION` dans `CardCacheService.js`
- Détection automatique de cache obsolète
- Invalidation et rechargement automatique
- Logs détaillés de la version du cache

**Impact** : Résout les problèmes de désynchronisation entre mobile et desktop (16660 vs 17432 cartes)

### 82. 🔧 Synchronisation Forcée Manuelle (2025-01-09)
Bouton "Forcer la synchronisation" dans page Paramètres.

**Fonctionnalités** :
- Méthode `forceSyncFromSupabase()` dans `CardCacheService`
- Vide le cache local
- Recharge toutes les cartes depuis Supabase
- Rechargement automatique de la page
- États visuels : Normal, En cours, Succès, Erreur

**Localisation** : Paramètres → Section "Cache et Synchronisation"

### 83. 🤖 Scripts d'Auto-Détection Cache (2025-01-09)
Outils automatiques pour détecter quand incrémenter `CACHE_VERSION`.

**Scripts** :
- `scripts/check-cache-version.cjs` - Analyse les modifications
- `scripts/increment-cache-version.cjs` - Incrémentation automatique

**Commandes NPM** :
```bash
npm run check-cache-version      # Vérifier si incrémentation nécessaire
npm run increment-cache-version  # Incrémenter (minor/major/patch)
npm run precommit                # Vérification avant commit
```

**Détecte** : Modifications de structure cache, migrations SQL, ajouts massifs de cartes, bugs cache

### 84. 📚 Documentation Système Cache (2025-01-09)
Documentation complète du workflow de versioning.

**Fichiers mis à jour** :
- `CLAUDE.md` - Section "Gestion de CACHE_VERSION" avec workflow détaillé
- `scripts/README.md` - Guide complet des scripts et commandes

**Workflow** : Modification → Vérification auto → Proposition incrémentation → Commit

### 85. 🐛 Correction Erreur getDuplicates (2025-01-09)
Fix de l'erreur `ReferenceError: getDuplicates is not defined` causant écran noir.

**Corrections** :
- `src/pages/Favorites.jsx` - Remplacement `getDuplicates` par `duplicates`
- `src/hooks/useCollection.jsx` - Fix `getDuplicates().length` → `duplicates.length`

**Impact** : Résout l'écran noir sur mobile après connexion

### 86. ⚡ Intégration checkCacheVersion (2025-01-09)
Ajout de la vérification de version dans le flux de chargement.

**Modifications** :
- `src/hooks/useCardDatabase.jsx` - Appel `checkCacheVersion()` au démarrage
- Condition : `isCacheValid && hasCachedData && lastSyncTimestamp`

**Comportement** :
- Cache valide → Chargement instantané
- Cache obsolète → Invalidation → Rechargement complet automatique

---

## Table des Matières

- [Fonctionnalités Majeures (1-40)](#fonctionnalités-majeures-1-40)
- [Traductions et Corrections (41-50)](#traductions-et-corrections-41-50)
- [Améliorations UX et Fixes (51-80)](#améliorations-ux-et-fixes-51-80)

---

## Fonctionnalités Majeures (1-40)

### 1. 🎨 Thème Sombre/Doré
Interface élégante avec police Cinzel sophistiquée et système de couleurs CSS variables.

### 2. 🔍 Recherche Pokémon Française
Intégration API PokéAPI avec traductions françaises complètes pour noms, types et talents.

### 3. 📱 Navigation Sidebar
Navigation repliable multi-niveaux avec indicateurs de statut et badges visuels.

### 4. 👤 Authentification Supabase
Système complet avec gestion de session, refresh tokens et protection des routes.

### 5. 📊 Tableau de Bord
Statistiques utilisateur détaillées avec progression et visualisation des niveaux.

### 6. ⭐ Système de Niveaux
6 niveaux basés sur le nombre de cartes : Débutant (0-49), Collectionneur (50-149), Expert (150-299), Maître (300-499), Champion (500-999), Légendaire (1000+).

### 7. 👑 Gestion Premium
Fonctionnalités premium avec badges, plans tarifaires et restrictions d'accès.

### 8. 🔧 Interface Admin
Gestion des utilisateurs premium, profils et configurations système.

### 9. 🗃️ Base de Données Supabase
Stockage cloud PostgreSQL illimité pour cartes, extensions et collections.

### 10. 📷 Upload d'Images
Système complet de gestion d'images avec prévisualisation, validation (5MB max) et stockage IndexedDB.

### 11. 📦 Gestion des Blocs
Création, modification et suppression de blocs personnalisés avec types (generated/custom).

### 12. 🔄 Déplacement d'Extensions
Transfert permanent d'extensions entre blocs avec traçabilité et restauration.

### 13. 🗑️ Suppression Complète
Suppression hiérarchique : blocs → extensions → cartes avec confirmations et rapports.

### 14. 🔎 Recherche Intelligente
Filtrage par limite de mots pour éviter faux positifs (ex: "mew" ne matche PAS "mewtwo").

### 15. 📱 Pull-to-Refresh Désactivé
`overscroll-behavior-y: contain` pour empêcher rafraîchissement accidentel sur mobile.

### 16. 🔍 Recherche avec Annulation
AbortController pour annuler les recherches en cours et éviter race conditions.

### 17. 📋 Dictionnaire de Traductions
Traductions Français→Anglais pour 1060+ Pokémon (Gen 1-9) dans `pokemonTranslations.js`.

### 18. 📐 Layout Responsive Explorer
Bouton "Ajouter carte" et navigation adaptés mobile (flex-col) / desktop (md:flex-row).

### 19. ⚡ Cache Intelligent avec IndexedDB
Système de cache local illimité avec synchronisation incrémentale depuis Supabase.

### 20. 🔄 Synchronisation Delta
Chargement instantané depuis cache + sync arrière-plan des nouvelles cartes (`loadCardsModifiedSince`).

### 21. 🔐 Gestion de Session Optimisée
Custom storage adapter **synchrone** pour Supabase (localStorage + sessionStorage avec redondance).

### 22. 🌐 Recherche Bilingue Français/Anglais
Recherche de cartes en français OU anglais dans Collection, Favoris, Doublons, Explore.

### 23. 🔧 Storage Adapter Synchrone
Fix critique : méthodes synchrones pour compatibilité Supabase Auth (évite perte de session).

### 24. 💰 Système de Gestion des Prix
Affichage et formatage complet des prix CardMarket (EUR) et TCGPlayer (USD) avec `priceFormatter.js`.

### 25. 🔄 Migration Automatique des Prix
Outil admin pour récupérer les prix de 14,000+ cartes avec reprise automatique et barre de progression.

### 26. ☁️ Sauvegarde Prix dans Supabase
Synchronisation multi-device des structures complètes de prix (colonnes JSONB `cardmarket` et `tcgplayer`).

### 27. 🔗 Intégration CardMarket Complète
Base de 59,683 cartes + 4,527 produits scellés + 64,210 prix dans Supabase.

### 28. 🤖 Matching Automatique CardMarket
Algorithme intelligent basé sur attaques (50%) + numéro (25%) + nom (15%) + suffixes (10%).

### 29. ⚙️ Migration des Attaques
Script de migration pour ajouter attaques/abilities/weaknesses aux cartes existantes.

### 30. ✨ Liens Directs CardMarket
Boutons "Trouver lien direct" et "Réessayer" dans CardMarketLinks pour matching automatique.

### 31. 🌍 Base de Données Commune
Architecture partagée où TOUS les utilisateurs voient les mêmes blocs/extensions/cartes dans "Explorer les séries".

### 32. 📊 Composants Admin CardMarket
- **CardMarketBulkHelper** : Assistant de recherche en masse
- **PriceHistoryChart & Modal** : Graphiques d'évolution des prix
- **SealedProductModal** : Modale d'ajout/édition de produits scellés
- **SealedProductsManager** : Gestionnaire complet de produits scellés
- **Accessible via** : `/produits-scelles` et `/admin/base-donnees`

### 33. ⏰ Actualisation Automatique Quotidienne des Prix
- **PriceRefreshService** : Service dédié avec priorisation intelligente
- **PriceRefreshPanel** : Interface admin pour contrôle manuel
- **Démarrage automatique** : 5 secondes après login si > 24h depuis dernière actualisation
- **Stratégie** : Priorité aux cartes à forte valeur (> 5€) et consultées récemment
- **Batch de 150 cartes/jour** : Évite rate limiting API, cycle complet en ~95 jours

### 34. 🌐 Proxy API Production
Vercel Serverless Function pour contournement CORS en production :
- **Route** : `/api/pokemontcg/*` → `https://api.pokemontcg.io/*`
- **Fonctionnement** : Dev (proxy Vite) + Production (Vercel Function)

### 35. 🔤 Traductions Pokémon Étendues
21+ nouvelles traductions Gen 7-8 ajoutées (gouroutan, quartermac, sovkipou, goupilou, roublenard, etc.).

### 36. 🔧 Gestion des Erreurs API Améliorée
Différenciation claire entre "0 résultats" et "erreur API" dans `MultiApiService`.

### 37. 📝 Corrections Traductions Pokémon
- **Type:0 → Type: Null** : Correction espace manquant + variantes (type zéro, type zero)
- **Denticrisse → Bruxish** : Suppression doublon erroné (`denticrisse: ogerpon`)

### 38. 🔗 Encodage URL Caractères Spéciaux
`encodeURIComponent()` pour supporter caractères spéciaux (&, ', ", etc.) dans noms de cartes.

### 39. 📊 Colonnes Supabase Prix Tracking
Ajout colonnes `_price_updated_at` et `_last_viewed` (TIMESTAMPTZ) avec index GIN pour priorisation.

### 40. 🔧 Correction Syntaxe Wildcard API
Fix erreur 400 : wildcard sans guillemets → `name:pheromosa*` au lieu de `name:"pheromosa"*`.

---

## Traductions et Corrections (41-50)

### 41. 🔄 Rollback Proxy API
Retour au rewrite direct suite problème Serverless Function capturant les requêtes API.

### 42. 🧹 Nettoyage Doublons Traductions
Correction 9 doublons/erreurs dans dictionnaire Pokémon :
- `coléodôme` → `dottler` (suppression doublon `iron bundle`)
- `sucroquin` → `swirlix` (suppression doublon `espurr`)
- `hotte-de-fer` → `iron bundle` (Pokémon Paradoxe correct)
- + 6 autres corrections critiques

### 43. ➕ Ajout Traduction Manquante - Dunaconda
`'dunaconda': 'sandaconda'` (Gen 8, ligne 880).

### 44. ➕ Ajout Traduction Manquante - Nigosier
`'nigosier': 'cramorant'` (Gen 8 #845).

### 45. ➕ Ajout Ligne Évolutive - Embrochet/Hastacuda
- `'embrochet': 'arrokuda'` (#846)
- `'hastacuda': 'barraskewda'` (#847)

### 46. ➕ Correction Traduction - Pêchaminus
Correction `'pêchaminusmo'` → `'pêchaminus': 'pecharunt'` + variante sans accent.

### 47. 📚 Extension Massive Dictionnaire Traductions
Ajout de 75+ traductions Gen 8-9 et corrections :
- **Traductions Gen 8** (#848-#905) : toxizap, salarsen, grillepattes, scolocendre, poulpaf, krakos, etc.
- **Corrections Gen 9** (~25 erreurs de mapping) : terracool/terracruel, flotillon, ferdeter, flamenroule, toutombe, deusolourdo, etc.
- **Pokémon Paradoxes** : fort-ivoire, hurle-queue, fongus-furie, flotte-mèche, rampe-ailes, pelage-sablé, etc.
- **Résultat** : 1060 traductions uniques, 0 doublons détectés

### 48. 🔧 Correction Formes Galar Exclusives
Ajout préfixe "galarian" pour 6 Pokémon :
1. `'ixon'` → `galarian obstagoon` (#862)
2. `'berserkatt'` → `galarian perrserker` (#863)
3. `'corayôme'` → `galarian cursola` (#864)
4. `'palarticho'` → `galarian sirfetch'd` (#865)
5. `'m. glaquette'` → `galarian mr. rime` (#866)
6. `'tutétékri'` → `galarian runerigus` (#867)

### 49. 🔧 Correction Critique IndexedDB
Reconnexion automatique et système de retry avec backoff exponentiel :
- Méthode `withRetry(operation, maxRetries = 3)` pour toutes transactions
- Event handlers lifecycle : `onclose`, `onversionchange`, `onblocked`
- Protection concurrence avec flag `isInitializing`
- **Fichier** : `src/services/CardCacheService.js`

### 50. 🌐 Fix Proxy API Vercel (404 → 200)
Correction du catch-all capturant les routes API :
- **Syntaxe moderne rewrites** : `:path*` au lieu de `(.*)`
- **Negative lookahead regex** : `(?!api)` exclut `/api/*` du catch-all SPA
- **Fichier** : `vercel.json` lignes 7-12

---

## Améliorations UX et Fixes (51-80)

### 51. 🎴 Enrichissement Traductions Dresseurs (11 nouvelles)
Traductions Paldea (hassa, irido, kassis), Hisui (nacchara), Unova (clown, ludvina), Supporters générales (guide d'exploration, juge, intendant).

### 52. 📦 Système d'Import Automatique d'Extensions
- **SetImportService** : Import complet d'une extension depuis l'API Pokemon TCG
- **SetImportPanel** : Interface Admin avec select, barre de progression, bouton annuler
- **Impact** : Import d'extensions nouvellement sorties en quelques secondes au lieu de plusieurs heures

### 53. 🔍 Fix Recherche Dresseurs - Word Boundary
Recherche par mot complet pour éviter faux positifs (ex: "nèflie" → "eri" ne matche PLUS "**Eri**ka").

### 54. 🎴 Enrichissement Traductions Dresseurs (14 nouvelles)
Traductions Paldea (ortiga, pania, pepper, popi), Unova (oryse), Supporters classiques (ordres du boss, recherches professorales, plan de n), Classes (sœur parasol, petite frappe), Objets (planche de sauvetage).

### 55. 🔧 Fix Cache Obsolète Recherche Arven/Pepper
Invalidation automatique cache au démarrage pour "arven" et "pepper" dans `CacheService.js`.

### 56. 🔍 Séparation des Champs de Recherche
Distinction entre filtrage local (`filterTerm`) et recherche API globale (`searchTerm`) dans `Explore.jsx`.

### 57. 🐛 Fix Affichage des Cartes dans Ma Collection
Correction du filtrage de recherche vide : ajout condition early-return si `searchTerm` vide.

### 58. 🔧 Fix Matching CardMarket - Table Inexistante
- Suppression accès table `cardmarket_expansions` (404)
- Augmentation poids numéro de carte : 15% → 25%
- Ajout bouton "Réessayer" pour relancer le matching

### 59. 🔗 Fix Construction URL CardMarket Directe
- Nouvelle fonction `buildCardMarketCardSlug()` avec format correct : `{CardName}-{SETCODE}{PaddedNumber}`
- Mapping codes d'extension : `sv3pt5` → `MEW` pour extension 151
- Indicateurs visuels : ⚡ Zap (lien direct API), ✨ Sparkles (matching auto), ⚠️ AlertCircle (recherche générique)

### 60. 🎴 Système de Gradation des Cartes
Ajout complet des champs `gradeCompany` et `grade` dans AddCardModal et CardDetailsModal.

### 61. 📊 Grades PSA Officiels
Implémentation nomenclature PSA : 10 GEM MINT, 9 MINT, 8.5 NM-MT+, ..., N0 AUTHENTIC, AA ALTERED AUTHENTIC.

### 62. 🇫🇷 Grades PCA Français Officiels
Nomenclature française PCA : 10+ COLLECTOR, 10 NEUF SUP', 9.5 NEUF, ..., 1 TRÈS MAUVAIS.

### 63. 🎴 Traduction Dresseur - Cormier
`'cormier': 'kamado'` - Commandant du Corps des Inspecteurs de Rusti-Cité (Legends: Arceus).

### 64. 🎴 Traduction Dresseur - Professeur Pimprenelle
`'professeur pimprenelle': 'professor burnet'` + variante féminine - Professeure d'Alola.

### 65. 🎴 Traduction Dresseur - Professeure Magnolia
4 traductions ajoutées : professeure magnolia, professeur magnolia, recherches professorales professeure magnolia, recherches professorales magnolia.

### 66. 🎴 Traduction Dresseur - René
`'rené': 'barry'` - Rival principal de Pokémon Diamant/Perle/Platine (Sinnoh Gen 4).

### 67. 🎴 Traduction Dresseur - Amaryllis
2 traductions : `'amaryllis': 'zinnia'` + `'résolution d'amaryllis': 'zinnia's resolve'` (Draconologue Hoenn).

### 68. 🎴 Traduction Dresseur - Rosemary
`'rosemary': 'marnie'` - Rivale principale de Pokémon Épée/Bouclier (Galar Gen 8).

### 69. 🎴 Traduction Dresseur - Machine Technique : Poing de Crise
`'machine technique : poing de crise': 'technical machine: crisis punch'` + variante sans deux-points - Carte Objet Dresseur.

### 70. 📂 Réorganisation Structure Projet
Création de 3 nouveaux dossiers pour organiser les 57 fichiers de la racine :
- `.debug/` : 24 fichiers HTML de debug (check-*, clear-*, debug-*, etc.)
- `.scripts/` : 20 scripts utilitaires et fixes (fix-*.cjs, test-*.js, etc.)
- `.docs/` : 2 fichiers de documentation technique
- **Impact** : Racine réduite de 57 à 6 fichiers essentiels (config uniquement)

### 71. 📝 Réduction CLAUDE.md (93%)
- **Avant** : 101,049 caractères (trop large pour lecture)
- **Après** : 7,217 caractères (guide de référence condensé)
- **Création CHANGELOG.md** : 14,170 caractères avec historique complet de 68+ fonctionnalités
- **Organisation** : 3 sections (Fonctionnalités Majeures 1-40, Traductions 41-50, UX/Fixes 51-68)

### 72. 🎴 Traduction Dresseur - Maillet Amélioré
`'maillet amélioré': 'enhanced hammer'` + variante sans accent - Objet Dresseur.

### 73. 🎴 Traduction Dresseur - Maillet Écrasant
`'maillet écrasant': 'crushing hammer'` + variante sans accent - Objet Dresseur.

### 74. 🔧 Fix Critique - cleanLegacyApiData()
- **Problème** : Erreur `TypeError: zs.cleanLegacyApiCache is not a function` bloquait le chargement
- **Cause** : Double erreur sur le nom de méthode (`cleanOldApiCache` → `cleanLegacyApiCache` → `cleanLegacyApiData`)
- **Impact** : 0 cartes, 0 extensions, 0 blocs chargés
- **Fichier** : `src/hooks/useCardDatabase.jsx` ligne 192

### 75. 📦 Système de Backup/Restauration Supabase
- **DatabaseBackupService** : Export/import complet de toutes les tables Supabase
- **DatabaseBackupPanel** : Interface admin avec 3 sections :
  1. **Créer backup** : Télécharge fichier JSON complet (toutes les tables)
  2. **Analyser backup** : Voir contenu et statistiques sans restaurer
  3. **Restaurer backup** : Avec confirmation, barre de progression et résultats détaillés
- **Données incluses** : discovered_cards (base commune), user_collection, user_favorites, user_wishlist, sealed_products, sales, duplicate_lots, user_cardmarket_matches, discovered_sets
- **Fonctionnalités** :
  - Restauration intelligente avec upsert (pas de doublons)
  - Remplace user_id automatiquement lors de la restauration
  - Fichier JSON portable et compressible
  - Protection contre perte de données
  - Multi-device : Restaurez sur n'importe quel appareil
- **Accès** : Admin → Base de Données → Section "Sauvegarde complète Supabase (Cloud)"
- **Complémentaire** : S'ajoute au backup IndexedDB existant (local vs cloud)

### 76. 🎴 Traduction Dresseur - Masque de Monstre
`'masque de monstre': 'ogre\'s mask'` - Objet Dresseur.

### 77. 🐛 Fix Critique - Cache des Résultats Vides
**Problème** : Les recherches retournant 0 résultats étaient mises en cache pendant 15 minutes, empêchant les nouvelles recherches même après l'ajout de traductions.

**Solution** : Ne plus mettre en cache les résultats vides (`TCGdxService.js:256-263`).

**Bénéfices** :
- ✅ Les nouvelles traductions fonctionnent immédiatement
- ✅ Plus besoin de vider le cache manuellement
- ✅ Plus besoin d'incrémenter les versions à chaque traduction

**Fichier** : `src/services/TCGdxService.js`

### 78. 🎴 Traduction Dresseur - Perche à Motismart
`'perche à motismart': 'roto-stick'` + variante sans accent - Objet Dresseur (Prismatic Evolutions).

Permet de chercher des cartes Supporter depuis le deck.

### 79. 🎴 Traduction Dresseur - Pièce Énergie
`'pièce énergie': 'energy coin'` + variante sans accent - Objet Dresseur (Black Bolt BLK 081).

### 80. 🎴 Traduction Dresseur - Pince Attrapeuse
`'pince attrapeuse': 'grabber'` - Objet Dresseur permettant de récupérer des cartes.

---

## 🚧 À Corriger / En Cours

### 1. Migration des Attaques (EN COURS - 76.5% complétée)
- **État** : Migration stoppée à 76.5% (environ 12,000-13,000 cartes enrichies sur 16,719)
- **Restant** : 23.5% des cartes (~4,000 cartes) sans attaques/abilities/weaknesses
- **À relancer** : Admin → Éditeur de Base de Données → Migration des attaques
- **Fichier** : `src/hooks/useCardDatabase.jsx` (fonction `migrateAttacks()`)

### 2. Bug Cartes avec Variantes CardMarket (NON RÉSOLU)
- **Problème** : Cartes avec variantes (V1, V2, V3) ont des URLs CardMarket incorrectes
- **Exemple** : Omanyte #138 (extension 151) nécessite "-V1-" dans l'URL
- **Fichier** : `src/components/features/collection/CardMarketLinks.jsx` (lignes 75-137)

### 3. Mapping Codes Extensions CardMarket (INCOMPLET)
- **Problème** : Seulement 1 extension mappée (sv3pt5 → MEW)
- **À faire** : Ajouter mappings pour toutes les extensions populaires (sv1: SVI, sv2: PAL, sv3: OBF, sv4: PAR, etc.)

### 4. Cache Recherche Obsolète (RÉSOLU pour Arven, possiblement d'autres)
- **À surveiller** : D'autres recherches peuvent avoir le même problème
- **Solution générale** : Ajouter clés de cache à invalider dans `CacheService.js` ligne 376

### 5. Traductions Manquantes (À SIGNALER)
- **Fichiers concernés** :
  - `src/utils/pokemonTranslations.js` (1060+ Pokémon Gen 1-9)
  - `src/utils/trainerTranslations.js` (51+ Dresseurs et Supporters)
- **Note** : Toujours vérifier doublons avec `grep -n "nom" fichier.js` avant d'ajouter

---

## Dernière mise à jour
- **Date** : 2025-01-06
- **Version** : v2.0
- **Total fonctionnalités** : 68 entrées documentées
