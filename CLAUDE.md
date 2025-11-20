# CLAUDE.md

Guide de référence pour Claude Code lors du travail avec le code de ce dépôt.

> **📋 Historique Détaillé** : Voir [CHANGELOG.md](./CHANGELOG.md) pour l'historique complet des 80 fonctionnalités implémentées.

---

## Aperçu du Projet

VaultEstim v2 - Application de gestion de collections de cartes Pokémon avec React + Vite.
- **Thème** : Sombre avec accents dorés et police Cinzel
- **Stack** : React 18, Vite, Tailwind CSS, shadcn/ui, Supabase
- **Port** : 5174

## Commandes Essentielles

```bash
npm install --legacy-peer-deps  # Installation des dépendances
npm run dev                      # Serveur de développement (port 5174)
npm run build                    # Build production
npm run lint                     # ESLint
```

## Architecture

### Stack Technique
- **Frontend** : React 18 + Vite + React Router DOM v7
- **Styling** : Tailwind CSS + shadcn/ui (Radix UI primitives)
- **État** : Context API (AuthProvider → CollectionProvider → CardDatabaseProvider)
- **Backend** : Supabase (Auth + PostgreSQL + Storage)
- **APIs** : Pokemon TCG API (proxy `/api/pokemontcg`)
- **Cache** : IndexedDB (illimité) + Synchronisation delta Supabase

### Structure des Dossiers

```
src/
├── components/
│   ├── ui/                     # shadcn/ui de base
│   └── features/               # Composants métier par domaine
├── pages/                      # Pages de l'application
├── hooks/                      # useAuth, useCollection, useCardDatabase
├── services/                   # Services API et métier
├── utils/                      # Traductions et helpers
├── constants/                  # Configuration et navigation
└── lib/                        # Utilitaires (cn function)
```

### Services Principaux

- **TCGdxService** : Recherche cartes Pokemon TCG avec traduction FR→EN
- **SupabaseService** : Stockage cloud avec déduplication intelligente
- **CardCacheService** : Cache IndexedDB avec reconnexion automatique + retry
- **CardMarketMatchingService** : Matching automatique (attaques 50% + numéro 25% + nom 15% + suffixes 10%)
- **PriceRefreshService** : Actualisation automatique quotidienne (1500 cartes/jour, cycle complet ~12 jours)
- **SealedProductPriceRefreshService** : Actualisation automatique des prix produits scellés (500 produits/jour)
- **HybridPriceService** : Système hybride intelligent RapidAPI + Pokemon TCG (100 req/jour → fallback automatique)
- **RapidAPIService** : Connexion CardMarket API TCG via RapidAPI (prix EUR précis, cartes gradées, produits scellés)
- **QuotaTracker** : Gestion quota quotidien avec persistance Supabase + localStorage et reset automatique
- **CardMarketUrlFixService** : Correction automatique des liens CardMarket via RapidAPI
- **CardMarketDynamicLinkService** : Récupération dynamique des liens CardMarket au clic (cache → RapidAPI → sauvegarde Supabase)

## Fonctionnalités Clés

### 🌍 Base de Données Commune
- **Table** : `discovered_cards` - 17,400+ cartes visibles par TOUS les utilisateurs
- **Comportement** : "Explorer les séries" est commun, "Ma Collection" est personnelle
- **Déduplication** : Conserve la version la plus complète de chaque carte (score basé sur données disponibles)

### ⚡ Cache Intelligent avec Versioning
- **Version actuelle** : `CACHE_VERSION = 2.0.0` dans `CardCacheService.js`
- **Première connexion** : Téléchargement complet depuis Supabase → sauvegarde IndexedDB
- **Connexions suivantes** : Chargement instantané depuis IndexedDB (< 1s) → sync arrière-plan des nouvelles cartes
- **Auto-invalidation** : Si version obsolète → rechargement automatique complet
- **Sync forcée** : Bouton dans Paramètres pour forcer rechargement manuel

### 🌐 Recherche Bilingue
- **Dictionnaires** :
  - `src/utils/pokemonTranslations.js` - 1060+ Pokémon (Gen 1-9)
  - `src/utils/trainerTranslations.js` - 230+ Dresseurs et Objets (313 avec variantes)
- **Comportement** : Recherche "salamèche" → trouve "Charmander"

### 💰 Système Hybride de Prix (Nouveau - 13/11/2025)
- **Stratégie intelligente** : RapidAPI (100 req/jour) → Fallback Pokemon TCG API
- **RapidAPI (CardMarket API TCG)** :
  - Prix précis en EUR (Near Mint, Allemagne, France)
  - Prix cartes gradées (PSA 10/9, CGC 9)
  - Moyennes 7 jours et 30 jours
  - 100 requêtes gratuites par jour
  - Host : `cardmarket-api-tcg.p.rapidapi.com`
- **Fallback automatique** : Pokemon TCG API si quota épuisé ou erreur
- **Gestion quota** : QuotaTracker avec persistance Supabase + localStorage, reset quotidien à minuit
- **Activation** : Variable `.env` `VITE_USE_RAPIDAPI=true`
- **Test** : Page `/test-hybrid-system.html` pour validation complète
- **Formats** : CardMarket (EUR) + TCGPlayer (USD)
- **Stockage** : JSONB Supabase (`cardmarket`, `tcgplayer`) + IndexedDB

## Configuration

### Variables d'Environnement
```
VITE_POKEMON_TCG_API_KEY=xxx     # Optionnel
VITE_SUPABASE_URL=xxx            # Requis
VITE_SUPABASE_ANON_KEY=xxx       # Requis

# Système Hybride RapidAPI (Nouveau)
VITE_USE_RAPIDAPI=true           # Activer/désactiver RapidAPI
VITE_RAPIDAPI_KEY=xxx            # Clé API RapidAPI (obtenir sur rapidapi.com)
VITE_RAPIDAPI_HOST=cardmarket-api-tcg.p.rapidapi.com
VITE_RAPIDAPI_DAILY_QUOTA=100   # Quota quotidien (plan Basic gratuit)

# Alternative Pokemon TCG API (désactivé par défaut)
VITE_USE_POKEMON_TCG_API=false   # Activer pour utiliser Pokemon TCG API au lieu de RapidAPI
```

### Pokemon TCG API (Alternative gratuite)

Service de backup si RapidAPI n'est plus disponible. **Fichier** : `src/services/PokemonTCGAPIService.js`

**Endpoints disponibles** :
```bash
# Liste des extensions
GET https://api.pokemontcg.io/v2/sets
GET https://api.pokemontcg.io/v2/sets?page=2&pageSize=10
GET https://api.pokemontcg.io/v2/sets?q=legalities.standard:legal
GET https://api.pokemontcg.io/v2/sets?q=series:"Scarlet & Violet"

# Extension spécifique
GET https://api.pokemontcg.io/v2/sets/{setId}

# Cartes d'une extension
GET https://api.pokemontcg.io/v2/cards?q=set.id:{setId}&pageSize=250

# Recherche de cartes
GET https://api.pokemontcg.io/v2/cards?q=name:charizard&pageSize=50
```

**Activation** : Mettre `VITE_USE_POKEMON_TCG_API=true` dans `.env`

**Méthodes disponibles** :
- `PokemonTCGAPIService.getAllSets()` - Liste toutes les extensions
- `PokemonTCGAPIService.getSet(setId)` - Détails d'une extension
- `PokemonTCGAPIService.getCardsBySet(setId, onProgress)` - Cartes d'une extension
- `PokemonTCGAPIService.searchCards(query)` - Recherche de cartes
- `PokemonTCGAPIService.getStandardLegalSets()` - Extensions légales Standard
- `PokemonTCGAPIService.getExpandedLegalSets()` - Extensions légales Expanded

**Note** : Sans clé API, le rate limit est de 1000 requêtes/jour. Avec clé API gratuite : 20000 req/jour.

### Alias de Chemins
`@/` → `./src/` pour imports absolus

### Proxy API
- **Dev** : Vite proxy `/api/pokemontcg` → `https://api.pokemontcg.io`
- **Production** : Vercel rewrite avec negative lookahead `(?!api)`

## Standards de Code

- **Langage** : JavaScript (.jsx), pas TypeScript
- **Style** : ESLint pour React
- **Interface** : 100% en français
- **Imports** : Toujours utiliser les alias `@/`

## Patterns Importants

### Recherche Intelligente
- **Filtrage par limite de mots** : "mew" ne matche PAS "mewtwo"
- **Word boundaries** : "eri" ne matche PAS "**Eri**ka" (évite faux positifs)
- **Wildcard** : `name:pokemon*` (sans guillemets) pour recherche partielle
- **Exact** : `name:"pokemon"` (avec guillemets) pour recherche exacte
- **Espaces** : Pas de wildcard si nom contient espace (utilise uniquement exact)

### Gestion d'Erreurs
- **AbortController** : Annulation des recherches en cours
- **Retry avec backoff** : 3 tentatives avec 100ms/200ms/300ms entre chaque
- **Différenciation** : "0 résultats" vs "erreur API" (ne pas confondre)

### Traductions
- **Pokémon** : Utiliser `translatePokemonName(frenchName)` depuis `pokemonTranslations.js`
- **Dresseurs** : Utiliser `translateTrainerName(frenchName)` depuis `trainerTranslations.js`
- **Vérifier doublons** : `grep -n "nom" fichier.js` avant d'ajouter
- **⚠️ IMPORTANT - Ajout de traductions** : **TOUJOURS** utiliser le script `add-trainer-translation.cjs` pour ajouter des traductions (bypass de l'outil Edit capricieux)
  ```bash
  node add-trainer-translation.cjs "nom français" "nom anglais"
  # Exemple : node add-trainer-translation.cjs "gants excavateurs" "digging gloves"
  ```
  - Ajoute automatiquement la variante sans accent
  - Incrémente automatiquement la version TRAINER_TRANSLATIONS_VERSION
  - Insère au bon endroit alphabétique
  - Option `--after "ligne"` pour positionner manuellement

### Authentification Supabase
- **Storage adapter** : **Synchrone** obligatoire (pas async!)
- **Double redondance** : localStorage + sessionStorage
- **Procédure de fix** : Se déconnecter → Se reconnecter → Hard refresh

### Gestion de CACHE_VERSION (IMPORTANT!)

**QUAND INCRÉMENTER** - Claude doit **TOUJOURS** proposer d'incrémenter `CACHE_VERSION` dans ces cas :

1. **Ajout massif de cartes** (>100 cartes ajoutées dans Supabase)
   - Exemple : "J'ai ajouté 771 nouvelles cartes"
   - Action : `npm run increment-cache-version minor`

2. **Changement de structure du cache**
   - Modification de `CardCacheService.js` (createObjectStore, createIndex)
   - Ajout/suppression de colonnes dans IndexedDB
   - Action : `npm run increment-cache-version major`

3. **Changement de structure Supabase**
   - Ajout de colonnes JSONB (cardmarket, tcgplayer, attacks, etc.)
   - Migration SQL (ALTER TABLE, ADD COLUMN)
   - Action : `npm run increment-cache-version major`

4. **Bug dans le cache**
   - Corruption de données détectée
   - Problème de synchronisation delta
   - Action : `npm run increment-cache-version patch`

**COMMANDES DISPONIBLES** :
```bash
npm run check-cache-version      # Vérifie si incrémentation nécessaire
npm run increment-cache-version  # Incrémente automatiquement (minor par défaut)
npm run precommit                # Vérifie avant commit (intégré dans workflow)
```

**WORKFLOW CLAUDE** :
Quand l'utilisateur demande une modification touchant cache/Supabase :
1. Effectuer la modification
2. Lancer `npm run check-cache-version`
3. Si le script détecte un changement critique → proposer l'incrémentation
4. Sinon, demander à l'utilisateur : "Cette modification nécessite-t-elle une invalidation du cache sur tous les appareils ?"

## Déploiement

### Git + Vercel (Automatique)
```bash
git add .
git commit -m "Description"
git push github main  # ⚠️ Utiliser remote "github" (PAS "origin")
# → Vercel déploie automatiquement sur https://vaultestim-v2.vercel.app
```

### Script SQL Requis (Supabase)
Avant d'utiliser la migration des prix, exécuter dans SQL Editor :
```sql
ALTER TABLE discovered_cards
ADD COLUMN IF NOT EXISTS cardmarket JSONB,
ADD COLUMN IF NOT EXISTS tcgplayer JSONB,
ADD COLUMN IF NOT EXISTS _price_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS _last_viewed TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_discovered_cards_cardmarket ON discovered_cards USING GIN (cardmarket);
CREATE INDEX IF NOT EXISTS idx_discovered_cards_tcgplayer ON discovered_cards USING GIN (tcgplayer);
```

## Debugging

### Erreurs Courantes
- **404 API en production** : Vérifier `vercel.json` - rewrite avec negative lookahead `(?!api)`
- **Session perdue** : Hard refresh `Ctrl + Shift + R` puis se reconnecter
- **Prix N/A** : Vérifier colonnes JSONB Supabase + exécuter migration
- **IndexedDB closing** : Système de retry automatique avec reconnexion

### Outils
- **Logs détaillés** : Console avec emojis pour traçabilité
- **Debug DB** : Bouton dans interface pour vérifier IndexedDB vs React
- **Clean storage** : `/clean-storage.html` ou lien sur page login

## ✅ Fonctionnalités Récentes (Novembre 2024 - Janvier 2025)

### 🔗 Liens CardMarket Dynamiques (Nouveau - 16/11/2025)
Système intelligent de récupération des liens CardMarket au clic utilisateur.

**Service** : `CardMarketDynamicLinkService.js`

**Fonctionnement** :
1. **Au clic** sur bouton "CardMarket (EUR)" ou "Voir sur CardMarket"
2. **Vérification cache** : Cherche `cardmarket_url` dans Supabase
3. **Si absent** : Appelle RapidAPI pour obtenir le lien officiel (`links.cardmarket`)
4. **Redirection immédiate** : Ouvre CardMarket dans un nouvel onglet
5. **Sauvegarde arrière-plan** : Enregistre le lien dans Supabase (fire-and-forget)

**Composants impactés** :
- `CardMarketLinks.jsx` : Bouton "CardMarket (EUR)" pour les cartes
- `SealedProducts.jsx` : Bouton "Voir sur CardMarket" (collection personnelle)
- `SealedProductsCatalog.jsx` : Bouton "Voir sur CardMarket" (catalogue)

**Tables Supabase** :
- `discovered_cards.cardmarket_url` - Cartes
- `user_sealed_products.cardmarket_url` - Collection personnelle produits scellés
- `cardmarket_nonsingles.cardmarket_url` - Catalogue complet produits scellés

**Avantages** :
- ✅ Liens officiels CardMarket (100% fiables)
- ✅ Cache automatique (pas de quota gaspillé)
- ✅ Fallback intelligent si erreur
- ✅ Aucun délai ressenti par l'utilisateur

### 📊 Persistance Quota RapidAPI dans Supabase (20/11/2025)
Le compteur de quota RapidAPI persiste maintenant dans Supabase pour éviter la perte au rafraîchissement.

**Fonctionnement** :
- Sauvegarde dans localStorage (cache local) + Supabase (persistance)
- Restauration automatique depuis Supabase si localStorage est vide
- Synchronisation à chaque modification du compteur
- Reset quotidien à minuit synchronisé

**Clé Supabase** : `rapidapi_quota_tracker` dans table `admin_preferences`

### ⚙️ Sélecteur Source des Prix (20/11/2025)
Interface admin pour choisir manuellement entre RapidAPI et Pokemon TCG API.

**Composant** : `PriceAPISelector.jsx` dans Admin → Système

**Options** :
- **RapidAPI (CardMarket)** : Prix EUR précis, cartes gradées, 100 req/jour (plan gratuit)
- **Pokemon TCG API** : Gratuit illimité, prix TCGPlayer USD

**Stockage** : `vaultestim_price_api_source` dans localStorage

### 🔄 Actualisation Produits Scellés Optimisée (20/11/2025)
L'actualisation des prix produits scellés respecte maintenant les catégories masquées.

**Améliorations** :
- Charge les catégories masquées depuis Supabase (plus fiable que localStorage)
- Priorise les produits de la collection personnelle de l'utilisateur
- Réduit de 6000+ produits à ~1500 produits visibles
- Utilise `cardmarket_id_product` pour les produits utilisateur

### 🚀 Système Hybride de Prix RapidAPI (13/11/2025)
- **Implémentation complète** (v2.0.0) : Système intelligent de récupération des prix
  - **HybridPriceService** : Orchestrateur avec tentative RapidAPI → fallback Pokemon TCG API
  - **RapidAPIService** : Connexion à CardMarket API TCG via RapidAPI
  - **QuotaTracker** : Gestion quota quotidien (100 req/jour, reset automatique à minuit)
- **Fonctionnalités** :
  - Prix EUR précis (Near Mint global + localisés DE/FR)
  - Prix cartes gradées (PSA 10/9, CGC 9) - **exclusif RapidAPI**
  - Moyennes 7 jours et 30 jours
  - Fallback automatique sur Pokemon TCG API si quota épuisé
  - Feature flag `.env` pour activation/désactivation
- **Endpoints RapidAPI disponibles** :
  - `/pokemon/cards/search` - Recherche cartes avec prix détaillés
  - `/pokemon/cards/{id}` - Détails carte spécifique
  - `/pokemon/cards/expansion/{slug}` - Cartes par extension
  - `/pokemon/products/search` - Produits scellés (boosters, ETB, cases)
  - `/pokemon/products/expansion/{slug}` - Produits par extension
  - `/pokemon/expansions` - Liste des extensions
- **Test** : Page `/test-hybrid-system.html` avec interface complète
  - 4 modes de test (Hybride, Force RapidAPI, Force Pokemon TCG, Produits scellés)
  - Affichage stats quota en temps réel
  - Détails prix complets (Near Mint, DE, FR, gradées, moyennes)
- **Résultats** : 20 cartes Charizard testées, 100% via RapidAPI, quota 1/100

### Interface Explorer les Séries & Doublons (12/01/2025)
- **Recherche dans extensions** (v1.9.119, v1.9.122) : Champ de recherche dédié par nom/numéro
  - Filtre local : recherche par nom (FR/EN) ou numéro de carte dans l'extension courante
  - Recherche API globale : toujours disponible en dessous du filtre local
  - Réinitialisation automatique du filtre lors des changements de vue
- **Modale détails doublons** (v1.9.113-114) : Détails complets des cartes en double
  - Clic sur carte → modale avec image grande + infos complètes
  - Section "📦 Vos doublons" par version (Normale, Holo, EX, etc.)
  - Groupement instances par condition + langue
  - Calcul valeur totale des doublons
- **Badges versions intelligents** (v1.9.112) : Affichage conditionnel dans Doublons
  - Initiales uniquement pour versions réellement en double (quantité > 1)
  - Nouvelles initiales : RPB (Reverse Pokéball), RMB (Reverse Masterball), M (Métal)
- **Clic carte unifié** (v1.9.120-121) : Cohérence interface
  - Clic carte dans résultats API → modale d'ajout
  - Suppression bouton bleu redondant (Settings)
  - Interface épurée avec bouton vert (ajout rapide) uniquement

### Auto-détection Versions & Versions Spéciales (12/01/2025)
- **Auto-détection bouton "+"** (v1.9.111) : Version automatique selon rareté
  - Cartes EX → version "EX" automatiquement
  - Cartes AR, Full Art, Alternate Art → détection automatique
  - Utilise `getDefaultVersion()` depuis `cardVersions.js`
- **Version Métal** (v1.9.111) : Amphinobi EX 106/167 (Twilight Mascarade)
  - Versions disponibles : EX, Métal
  - Détection par nom + numéro + extension
- **Reverse Pokéball/Masterball** (v1.9.111) : Extensions SV8, SV8a, SV9
  - Pour cartes Common/Uncommon uniquement
  - Extensions : Black Bolt, White Flare, Prismatic Evolution
  - Versions ajoutées : Reverse (Pokéball), Reverse (Masterball)

### Traductions Pokémon & Dresseur (12/01/2025)
- **Pokémon Team Rocket** (v1.9.115-116):
  - Astronelle de la Team Rocket → Team Rocket's Orbeetle
  - Nosferalto de la Team Rocket → Team Rocket's Golbat
  - Tadmorv de la Team Rocket → Team Rocket's Grimer
- **Dresseur/Objets/Stades/Énergies** (v1.9.117-118, v1.9.123):
  - Poids Pouvoir de Cynthia → Cynthia's Power Weight
  - Usine de la Team Rocket → Team Rocket's Factory
  - Énergie de la Team Rocket → Team Rocket's Energy
  - Lieu de la Fête → Festival Grounds
  - Énergie Boomerang → Boomerang Energy
  - Centre Culturel → Community Center

### Versions de Cartes & Holo Cosmos (11/01/2025)
- **Système de versions par rareté** (v1.9.90-105) : Versions conditionnelles selon le type de carte
  - Cartes normales : Normale, Reverse Holo, Holo, Holo Cosmos, Tampon
  - Cartes spéciales : Version unique (EX, Full Art, AR, Alternate Art, Gold, Méga Hyper Rare, Promo)
  - Badges initiales sous images (N, R, H, HC, T, P, EX, FA, AR, AA, G, MHR)
  - Composant `CardVersionBadges.jsx` avec tri automatique
  - Logique de détection dans `cardVersions.js` (ordre spécifique → général)
- **Holo Cosmos** (v1.9.90-91) : Support version "✨ Holo Cosmos" (Journey Together sv9)
  - Deux niveaux : `has_cosmos_holo` (discovered_cards) + `version="Holo Cosmos"` (collection user)
  - Badge animé purple/pink avec `CosmosHoloBadge.jsx`
  - SQL: `ALTER TABLE discovered_cards ADD COLUMN has_cosmos_holo BOOLEAN`

### Traductions Pokémon & Dresseur (11/01/2025)
- **Pokémon** (v1.9.101-104):
  - Guérilande de Lilie → Lillie's Comfey
  - Hexadrone → Falinks (correction de "balinks" erroné)
  - Fulgulairo de Mashynn → Mashynn's Kilowattrel
- **Dresseur/Objets/Stades** (v1.9.106-108):
  - Énergie Cadeau → Gift Energy
  - Ville Perdue → Lost City
  - Lac Savoir → Lake Acuity
  - Marais Bouchebée → Gapejaw Bog

### Actualisation Prix Accélérée (11/01/2025)
- **Modification** : Augmentation de la capacité d'actualisation quotidienne des prix
- **Changements** :
  - **BATCH_SIZE**: 150 → **1500 cartes/jour** (x10 plus rapide)
  - **REQUEST_DELAY_MS**: 500ms → **1000ms** (protection rate limiting renforcée)
  - **Cycle complet**: ~3 mois → **~12 jours** pour 17,400 cartes
  - **Durée estimée**: ~25 minutes par actualisation quotidienne (affichée dans logs)
- **Impact** : Toutes les cartes de la base auront des prix actualisés en moins de 2 semaines
- **Monitoring** : Si problèmes API détectés → réduire à 750 cartes ou augmenter délai à 1500ms

### Liens CardMarket Optimisés V2 (10/01/2025)
- **Problème résolu** : Les liens redigeaient vers la page d'extension au lieu de la carte spécifique
  - Exemple : `Blastoise ex #009` → redigeait vers `/Singles/151` au lieu de `/Singles/151/Blastoise-ex-V1-MEW009`
- **Cause** : Slug mal construit (espaces non remplacés + regex défaillante + casse incorrecte)
- **Solution** :
  - **Slugification corrigée** : Remplace espaces par tirets en préservant la casse (`Blastoise ex` → `Blastoise-ex`)
  - **Format V1 intégré** : Slug contient directement V1 + code extension (`Blastoise-ex-V1-MEW009`)
  - **Langue française** : URLs en `/fr/` au lieu de `/en/` pour affichage en français
  - **40+ extensions mappées** : SV1-8, SWSH1-12, SM1-12 avec codes CardMarket (MEW, SVI, PAL, etc.)
- **Résultat** : Liens directs fonctionnels vers cartes spécifiques pour toutes extensions mappées
- **Format final** : `https://www.cardmarket.com/fr/Pokemon/Products/Singles/{extension}/{Nom-carte-V1-CODE123}`

### Traductions Dresseur/Objets (09/01/2025)
- **49 nouvelles traductions** ajoutées (v1.9.28 → v1.9.77)
- Objets : Ombrelle Géante, Pack d'Eaux Fraîches, Parfum Inhibiteur, Passe de Combat VIP
- Pastilles et soins : Pastille Puissance, Total Soin, Pépite
- Outils : Pelle Maudite, Piolet Courageux, Viseur Téléscopique
- Pierres Scellées : Céleste, Sylvestre, Terrestre
- Rouleaux (6 variantes) : Acerbe, Céleste, Dragon à Crocs, Dragon Volant, Perçant, Tourbillons
- Armes rouillées : Bouclier Rouillé, Épée Rouillée
- Divers : Smarceus, Stade de Greenbury, Bannière Team Yell, Turbo Patience, etc.
- **Gestion ligatures** : œ/oe (ex: "Œuf Chance" → variantes avec/sans ligature)

## 🔧 Outils de Maintenance

### Correction des Liens CardMarket (Nouveau - 16/11/2025)
Service automatisé pour corriger les URLs CardMarket de toutes les cartes et produits scellés.

**Fichiers** :
- `sql/add-cardmarket-urls.sql` - Script SQL pour ajouter les colonnes `cardmarket_url`
- `src/services/CardMarketUrlFixService.js` - Service de correction automatique
- `fix-cardmarket-urls.html` - Interface web de correction

**Fonctionnalités** :
- ✅ Récupération des URLs officielles via RapidAPI (`links.cardmarket`)
- ✅ Traitement par batches de 100 éléments (évite surcharge mémoire)
- ✅ Continuation automatique jusqu'à épuisement ou quota atteint
- ✅ Gestion quota RapidAPI avec pause automatique
- ✅ Progression sauvegardée (reprend où ça s'est arrêté)
- ✅ 3 cibles de correction :
  - **Cartes** : Table `discovered_cards` (~17,400 cartes)
  - **Produits utilisateurs** : Table `user_sealed_products` (collection personnelle)
  - **Catalogue produits** : Table `cardmarket_nonsingles` (catalogue complet)

**Utilisation** :
```bash
# 1. Exécuter le script SQL dans Supabase
sql/add-cardmarket-urls.sql

# 2. Ouvrir l'interface de correction
http://localhost:5174/fix-cardmarket-urls.html

# 3. Cliquer sur un bouton :
#    - 🎴 Corriger les cartes
#    - 📦 Corriger les produits (collection personnelle)
#    - 🔄 Tout corriger (cartes + produits perso + catalogue)
```

**Statistiques affichées** :
- Total d'éléments à corriger
- Nombre mis à jour / ignorés / erreurs
- Progression en temps réel (%)
- Logs détaillés

**Tables Supabase concernées** :
```sql
-- Nouvelles colonnes ajoutées
ALTER TABLE discovered_cards ADD COLUMN cardmarket_url TEXT;
ALTER TABLE cardmarket_nonsingles ADD COLUMN cardmarket_url TEXT;
ALTER TABLE user_sealed_products ADD COLUMN cardmarket_url TEXT;
```

### Actualisation des Prix Produits Scellés (Nouveau - 16/11/2025)
Service d'actualisation automatique des prix des produits scellés.

**Fichier** : `src/services/SealedProductPriceRefreshService.js`

**Configuration** :
- Batch de 500 produits/jour
- Refresh automatique quotidien (si > 24h)
- Pause de 1s entre requêtes
- Progression sauvegardée en localStorage

**Utilisation** :
```javascript
import { SealedProductPriceRefreshService } from '@/services/SealedProductPriceRefreshService'

// Actualisation manuelle avec callback de progression
await SealedProductPriceRefreshService.refreshBatch((progress) => {
  console.log(`${progress.current}/${progress.total}`)
})

// Actualisation automatique au démarrage (si nécessaire)
await SealedProductPriceRefreshService.autoRefreshIfNeeded()
```

## Liens Utiles

- **Production** : https://vaultestim-v2.vercel.app
- **Supabase Dashboard** : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx
- **Repository GitHub** : https://github.com/Voctali/vaultestim-v2-
- **Historique complet** : [CHANGELOG.md](./CHANGELOG.md)

---

**Dernière mise à jour** : 2025-11-20 (v1.6.2)
