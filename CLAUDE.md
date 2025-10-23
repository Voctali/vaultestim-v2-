# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Ce fichier fournit des conseils à Claude Code (claude.ai/code) lors du travail avec le code de ce dépôt.

## Aperçu du Projet

VaultEstim v2 est une application complète de gestion de collections de cartes Pokémon construite avec React + Vite. L'application présente un thème sombre élégant avec des accents dorés et une police Cinzel sophistiquée.

## Commandes de Développement

### Développement Principal
- `npm run dev` - Démarre le serveur de développement (Vite) sur le port 5174
- `npm run build` - Construit pour la production
- `npm run preview` - Prévisualise le build de production
- `npm run lint` - Exécute ESLint

### Gestion des Packages
- `npm install --legacy-peer-deps` - Installe les dépendances (nécessaire pour la compatibilité React 18)

## Architecture de l'Application

### Framework Principal
- **Frontend**: React 18 avec Vite (port 5174)
- **Routage**: React Router DOM v7
- **Styling**: Tailwind CSS avec système de design shadcn/ui
- **Composants**: shadcn/ui avec Radix UI primitives
- **APIs**: Pokemon TCG API (avec proxy CORS Vite)
- **État**: Context API avec hooks personnalisés
- **Authentification**: Supabase Auth avec gestion de session complète
- **Base de données**: Supabase PostgreSQL pour stockage cloud multi-device
- **Stockage local**: Cache pour performance avec synchronisation cloud
- **Backend**: Supabase Functions (optionnel pour opérations complexes)

### Structure du Projet

```
src/
├── components/
│   ├── ui/                     # Composants shadcn/ui de base (Button, Card, Dialog, etc.)
│   ├── features/               # Composants par domaine métier
│   │   ├── navigation/         # Sidebar avec navigation multi-niveaux
│   │   ├── explore/           # Recherche Pokémon et cartes TCG
│   │   └── collection/        # Gestion de collection avec modales
│   └── Layout.jsx             # Layout principal avec authentification
├── pages/                     # Pages de l'application (Dashboard, Collection, etc.)
├── hooks/                     # Hooks personnalisés (useAuth, useCollection, useCardDatabase)
├── api/services/              # Services API (PokemonService)
├── services/                  # Services métier (PokemonTCGService, IndexedDBService, ImageUploadService)
├── constants/                 # Configuration (navigation, niveaux utilisateur)
├── lib/                       # Utilitaires (cn function pour class merging)
└── utils/                     # Traductions et helpers
```

### Architecture des Providers
L'application utilise une architecture en couches de Context API :
```jsx
<AuthProvider>
  <CollectionProvider>
    <CardDatabaseProvider>
      <Router>
        <!-- Application -->
      </Router>
    </CardDatabaseProvider>
  </CollectionProvider>
</AuthProvider>
```

### Fonctionnalités Implémentées

#### ✅ Terminé
1. **🎨 Thème Sombre/Doré** - Interface élégante avec police Cinzel
2. **🔍 Recherche Pokémon Française** - API PokéAPI avec traductions françaises
3. **📱 Navigation Sidebar** - Navigation repliable avec indicateurs de statut
4. **👤 Authentification Supabase** - Système d'authentification complet avec gestion de session
5. **📊 Tableau de Bord** - Statistiques utilisateur et progression
6. **⭐ Système de Niveaux** - 6 niveaux basés sur le nombre de cartes
7. **👑 Gestion Premium** - Fonctionnalités premium avec badges
8. **🔧 Interface Admin** - Gestion des utilisateurs premium avec plans tarifaires
9. **🗃️ Base de Données Supabase** - Stockage cloud illimité pour cartes et extensions
10. **📷 Upload d'Images** - Système complet de gestion d'images avec prévisualisation
11. **📦 Gestion des Blocs** - Création, modification, suppression de blocs personnalisés
12. **🔄 Déplacement d'Extensions** - Transfert permanent d'extensions entre blocs
13. **🗑️ Suppression Complète** - Suppression de blocs/extensions/cartes de la base locale
14. **🔎 Recherche Intelligente** - Filtrage par limite de mots (Mew vs Mewtwo)
15. **📱 Pull-to-Refresh Désactivé** - Empêche le rafraîchissement accidentel sur mobile
16. **🔍 Recherche avec Annulation** - AbortController pour annuler les recherches en cours
17. **📋 Dictionnaire de Traductions** - Traductions Français→Anglais pour noms Pokémon (archéomire, flotajou, ptiravi, etc.)
18. **📐 Layout Responsive Explorer** - Bouton "Ajouter carte" et navigation adaptés mobile/desktop
19. **⚡ Cache Intelligent avec IndexedDB** - Système de cache local avec synchronisation incrémentale
20. **🔄 Synchronisation Delta** - Chargement instantané depuis cache + sync arrière-plan des nouvelles cartes
21. **🔐 Gestion de Session Optimisée** - Custom storage adapter synchrone pour Supabase (localStorage + sessionStorage avec redondance)
22. **🌐 Recherche Bilingue Français/Anglais** - Recherche de cartes en français ou anglais dans toutes les collections
23. **🔧 Storage Adapter Synchrone** - Fix critique : méthodes synchrones pour compatibilité Supabase Auth (évite perte de session)
24. **💰 Système de Gestion des Prix** - Affichage et formatage complet des prix CardMarket (EUR) et TCGPlayer (USD)
25. **🔄 Migration Automatique des Prix** - Outil admin pour récupérer les prix de 14,000+ cartes avec reprise automatique
26. **☁️ Sauvegarde Prix dans Supabase** - Synchronisation multi-device des structures complètes de prix (colonnes JSONB)
27. **🔗 Intégration CardMarket Complète** - Base de 59,683 cartes + 4,527 produits scellés + 64,210 prix dans Supabase
28. **🤖 Matching Automatique CardMarket** - Algorithme intelligent basé sur attaques (70%) + nom (20%) + suffixes (10%)
29. **⚙️ Migration des Attaques** - Script de migration pour ajouter attaques/abilities/weaknesses aux cartes existantes
30. **✨ Liens Directs CardMarket** - Bouton "Trouver lien direct" dans CardMarketLinks pour matching auto
31. **🌍 Base de Données Commune** - Architecture partagée où TOUS les utilisateurs voient les mêmes blocs/extensions/cartes dans "Explorer les séries"
32. **📊 Composants Admin CardMarket** - Nouveaux composants intégrés pour gestion avancée des produits scellés et prix
   - **CardMarketBulkHelper** : Assistant de recherche en masse CardMarket (dans Admin/Base de Données)
   - **PriceHistoryChart & Modal** : Graphiques d'évolution des prix avec historique détaillé
   - **SealedProductModal** : Modale d'ajout/édition de produits scellés
   - **SealedProductsManager** : Gestionnaire complet de produits scellés (dans Admin/Base de Données)
   - **Accessible via** : `/produits-scelles` et `/admin/base-donnees`
33. **⏰ Actualisation Automatique Quotidienne des Prix** - Système intelligent de mise à jour progressive (150 cartes/jour)
   - **PriceRefreshService** : Service dédié avec priorisation intelligente
   - **PriceRefreshPanel** : Interface admin pour contrôle manuel et statistiques
   - **Démarrage automatique** : 5 secondes après le lancement si > 24h depuis dernière actualisation
   - **Stratégie intelligente** : Priorité aux cartes à forte valeur (> 5€) et consultées récemment
   - **Batch de 150 cartes/jour** : Évite rate limiting API, cycle complet en ~95 jours (14,234 cartes)
34. **🌐 Proxy API Production** - Vercel Serverless Function pour contournement CORS en production
   - **Fichier** : `api/pokemontcg/[...path].js` (Vercel Serverless Function)
   - **Route** : `/api/pokemontcg/*` → `https://api.pokemontcg.io/*`
   - **Fonctionnement** : Dev (proxy Vite) + Production (Vercel Function)
   - **Headers** : CORS, Cache-Control, API Key automatique
35. **🔤 Traductions Pokémon Étendues** - 21+ nouvelles traductions Gen 7-8 ajoutées
   - **Gen 7** : gouroutan, quartermac, sovkipou, sarmurai/sarmuraï, bacabouh, trépassable, etc.
   - **Gen 8** : goupilou, roublenard, charbi, wagomine, monthracite, verpom, etc.
   - **Variantes accents** : Support trémas et accents (sarmurai + sarmuraï)
36. **🔧 Gestion des Erreurs API Améliorée** - Différenciation claire entre "0 résultats" et "erreur API"
   - **MultiApiService** : Détection si l'API répond (même avec 0 résultats) vs vraie erreur réseau/serveur
   - **Messages clairs** : Plus de faux "API indisponible" quand une recherche ne trouve simplement aucune carte
   - **Retour [] au lieu d'erreur** : Comportement cohérent pour recherches sans résultats
37. **📝 Corrections Traductions Pokémon** - Corrections critiques du dictionnaire de traductions
   - **Type:0 → Type: Null** : Correction espace manquant (`type:null` → `type: null`)
   - **Variantes Type:0** : Ajout `type zéro`, `type zero` pour recherche flexible
   - **Denticrisse → Bruxish** : Suppression doublon erroné (`denticrisse: ogerpon`)
   - **Fichier** : `src/utils/pokemonTranslations.js` (980+ traductions Gen 1-9)
38. **🔗 Encodage URL Caractères Spéciaux** - Support complet des caractères spéciaux dans noms de cartes
   - **encodeURIComponent()** : Encodage automatique des query strings pour API Pokemon TCG
   - **Caractère &** : Correction erreurs 400 pour cartes comme "Gengar & Mimikyu-GX"
   - **Autres caractères** : Gère également `'`, `"`, espaces, etc.
   - **Fichier** : `src/services/TCGdxService.js` - méthode `searchCards()`
39. **📊 Colonnes Supabase Prix Tracking** - Ajout colonnes pour suivi actualisation des prix
   - **_price_updated_at** : TIMESTAMPTZ - Timestamp dernière actualisation des prix
   - **_last_viewed** : TIMESTAMPTZ - Timestamp dernière consultation (priorisation)
   - **Index GIN créés** : Optimisation requêtes de priorisation pour PriceRefreshService
   - **Table** : `discovered_cards` - Requis pour système actualisation automatique quotidienne
40. **🔧 Correction Syntaxe Wildcard API** - Fix erreur 400 pour recherches wildcard avec traductions
   - **Problème** : `name:"pheromosa"*` générait Bad Request 400 (syntaxe invalide)
   - **Solution** : Wildcard sans guillemets → `name:pheromosa*` conforme à l'API Pokemon TCG
   - **Impact** : Recherches traduites (ex: "cancrelove" → "pheromosa") fonctionnent maintenant
   - **Fichier** : `src/services/TCGdxService.js` - méthode `searchCards()` ligne 154-156

#### 🔄 Pages Créées (Structure de base)
- **Explorer** - Recherche et découverte de Pokémon avec navigation hiérarchique (Blocs → Extensions → Cartes)
- **Ma Collection** - Gestion des cartes possédées
- **Favoris** - Liste de souhaits
- **Produits Scellés** - Boosters et decks
- **Premium** - Fonctionnalités avancées
- **Admin** - Gestion administrative
- **Admin/Base de Données** - Éditeur complet de la base de données locale avec navigation hiérarchique

### API et Services

#### PokemonService (Tyradex API)
- `searchPokemon(query, limit)` - Recherche de Pokémon avec noms français
- `getPokemonDetails(nameOrId)` - Détails complets d'un Pokémon
- `getPokemonDetailsFromTyradex(pokemonId)` - API Tyradex directe
- Support complet français (noms, types, talents)
- Traductions automatiques des types
- Images haute qualité (sprites normaux + shiny)

#### TCGdxService (Pokemon TCG API)
- `searchCards(query, limit, signal)` - Recherche de cartes avec traduction français→anglais et AbortSignal
- `getCardById(cardId)` - Récupération d'une carte spécifique
- `getSets()` - Liste des extensions disponibles
- `organizeCardsBySet()` / `organizeCardsByBlock()` - Organisation par extensions/blocs
- Mapping complet des séries (Scarlet & Violet, Sword & Shield, etc.)
- Support prix de marché (TCGPlayer, CardMarket)
- Traductions types et raretés en français
- **Proxy CORS** : Utilise `/api/pokemontcg` via configuration Vite
- **Filtrage intelligent** : Recherche par limite de mots (ex: "mew" ne matche PAS "mewtwo")
- **Correspondances exactes prioritaires** : "Mew", "Mew ex", "Mew V" acceptés, "Mewtwo" rejeté
- **AbortController** : Support de l'annulation des requêtes via signal

#### SupabaseService (Stockage Cloud)
- `saveDiscoveredCards()` / `loadDiscoveredCards()` - Gestion des cartes découvertes dans PostgreSQL
- `loadCardsModifiedSince(timestamp)` - Synchronisation incrémentale (delta sync)
- `saveSeriesDatabase()` / `loadSeriesDatabase()` - Gestion des extensions
- `addDiscoveredCards()` - Ajout incrémental de cartes (pas de remplacement)
- `deleteCardById()` - Suppression de cartes spécifiques
- **🌍 Base commune partagée** : `discovered_cards` charge TOUTES les cartes sans filtre user_id - tous les utilisateurs voient les mêmes blocs/extensions/cartes dans "Explorer les séries"
- **🔄 Déduplication intelligente** : `getCardCompletenessScore()` sélectionne la version la plus complète de chaque carte (priorité aux prix, attaques, etc.)
- **👤 Collections personnelles** : Les ajouts à "Ma Collection" restent personnels par utilisateur (séparation affichage/possession)
- **Multi-device** : Synchronisation automatique entre appareils
- **Traitement par batch** : Optimisé pour gros volumes de données (chunking de 1000 cartes/batch)
- **Index optimisés** : Recherche rapide par user_id, card_id
- **Synchronisation incrémentale** : Récupération uniquement des cartes modifiées depuis un timestamp
- **Tables principales** :
  - `discovered_cards` : Base commune de 14,000+ cartes visibles par TOUS (affichage dans Explorer)
  - `user_profiles` : Profils utilisateurs avec métadonnées

#### CardCacheService (Cache Local IndexedDB)
- `getAllCards()` - Chargement rapide de toutes les cartes depuis le cache
- `saveCards(cards)` - Sauvegarde par batch dans IndexedDB
- `getLastSyncTimestamp()` / `updateLastSyncTimestamp()` - Gestion timestamps de synchronisation
- `getCacheStats()` - Statistiques du cache (nombre de cartes, dernière sync)
- `hasCachedData()` - Vérification de l'existence du cache
- `clearCache()` - Nettoyage complet du cache
- **Stockage illimité** : IndexedDB sans limitation de 5-10MB du localStorage
- **Performance** : Chargement instantané des cartes en local
- **Base de données dédiée** : VaultEstim_CardCache avec stores séparés (cards, metadata)

#### ImageUploadService (Gestion d'Images)
- `uploadImage()` - Upload et stockage d'images dans IndexedDB
- `getImagesForEntity()` - Récupération d'images par entité (bloc/extension/carte)
- `deleteImage()` - Suppression d'images
- `getStorageStats()` - Statistiques de stockage des images
- **Validation** : Types supportés (JPG, PNG, GIF, WebP) - Maximum 5MB
- **Conversion** : Base64 → Blob URL pour affichage
- **Base de données dédiée** : VaultEstim_Images avec indexation

#### CardMarketSupabaseService (Intégration CardMarket)
- `searchCardsByName(pokemonName, limit)` - Recherche de cartes CardMarket par nom
- `getPriceForProduct(idProduct)` - Récupération des prix CardMarket en EUR
- `saveUserMatch(userId, cardId, cardmarketId, score, method)` - Sauvegarde d'un matching utilisateur
- `getUserMatch(userId, cardId)` - Récupération d'un matching existant
- `loadUserMatches(userId)` - Chargement de tous les matchings d'un utilisateur
- `buildDirectUrl(idProduct)` - Construction d'URL directe vers produit CardMarket
- `extractAttacksFromName(cardName)` - Extraction des attaques depuis nom CardMarket (format: "Pikachu [Thunderbolt | Quick Attack]")
- `calculateAttackMatchScore(attacks1, attacks2)` - Calcul du score de correspondance entre attaques
- **Base de données** : Tables Supabase publiques (singles, nonsingles, prices) + table privée (user_cardmarket_matches)
- **Données importées** : 59,683 cartes singles + 4,527 produits scellés + 64,210 prix
- **Script d'import** : `import-cardmarket.mjs` pour import depuis JSON vers Supabase

#### CardMarketMatchingService (Matching Automatique)
- `matchCard(card, userId, saveMatch)` - Matcher une carte utilisateur avec CardMarket
- `matchCards(cards, userId, onProgress)` - Matching de plusieurs cartes en batch
- **Algorithme de scoring** :
  - 70% basé sur les attaques (matching exact des noms d'attaques)
  - 20% basé sur la similarité du nom (Levenshtein-like)
  - 10% bonus si mêmes suffixes (V, VMAX, GX, EX, ex, etc.)
- **Seuil de confiance** : 20% minimum pour sauvegarder (peut être ajusté)
- **Méthodes de matching** : `auto_attacks` (par attaques), `auto_name` (par nom), `manual` (utilisateur)
- **Composant UI** : `CardMarketLinks.jsx` avec bouton "Trouver lien direct"

#### PriceRefreshService (Actualisation Automatique des Prix)
- `autoRefresh(cards, onProgress)` - Actualisation quotidienne automatique (150 cartes/jour)
- `forceRefreshAll(cards, onProgress, cancelSignal)` - Actualisation forcée de toutes les cartes
- `selectCardsForRefresh(cards, batchSize)` - Sélection intelligente des cartes à actualiser
- `calculateRefreshPriority(card)` - Calcul du score de priorité
- **Configuration** :
  - `BATCH_SIZE = 150` : Nombre de cartes par actualisation quotidienne
  - `REFRESH_INTERVAL_MS = 24h` : Intervalle minimum entre actualisations
  - `MIN_PRICE_THRESHOLD = 0.10€` : Prix minimum pour actualisation
  - `PRIORITY_PRICE_THRESHOLD = 5.00€` : Seuil pour priorisation haute valeur
- **Stratégie de priorisation** :
  - Score basé sur : prix de la carte (40%) + ancienneté données (30%) + consultation récente (30%)
  - Cartes > 5€ : priorité maximale
  - Cartes jamais actualisées : priorité élevée
  - Cartes consultées récemment : bonus de priorité
- **Composant UI** : `PriceRefreshPanel.jsx` dans Admin → Éditeur de Base de Données
- **Intégration** : Démarrage automatique 5s après login dans `useCardDatabase.jsx`

### Système d'Authentification
- **Authentification** : Supabase Auth avec gestion complète de session
- **Providers** : Email/Password avec validation
- **Sessions** : Gestion automatique avec refresh tokens
- **Custom Storage Adapter** :
  - Méthodes **synchrones** (compatibilité Supabase Auth)
  - Double redondance localStorage + sessionStorage
  - Logs détaillés pour debugging (`🔑 [Storage] getItem/setItem`)
  - Fallback automatique en cas d'erreur
- **Rôles** : `user`, `admin` - Protection des routes admin
- **États** : `isPremium` pour fonctionnalités premium
- **Hook** : `useAuth()` avec `isAuthenticated`, `isAdmin`, `isPremium`, `user`, `logout`, `register`
- **Pages** : Login, Register, ResetPassword avec formulaires Supabase
- **Sécurité** : Row Level Security (RLS) sur toutes les tables

### Gestion de l'État Global
- **useAuth** : Authentification Supabase et profil utilisateur
- **useCollection** : Gestion des cartes de collection avec localStorage
- **useCardDatabase** : Base de données de cartes avec recherche/filtres et stockage Supabase
  - Chargement automatique au login
  - Synchronisation multi-device
  - Cache local pour performance
- **États personnalisés** : customBlocks, customExtensions pour les modifications utilisateur

### Thème et Design
- **Système de couleurs** : CSS Variables avec Tailwind (--primary, --background, etc.)
- **Police principale** : Cinzel (Google Fonts) pour l'élégance
- **Thème** : Sombre avec accents dorés et lueurs
- **Composants** : shadcn/ui avec variantes personnalisées
- **Responsive** : Mobile-first avec breakpoints Tailwind
- **Mobile** : Pull-to-refresh désactivé (`overscroll-behavior-y: contain`)

### Constantes et Configuration

#### Niveaux Utilisateur
```javascript
1. Débutant (0-49 cartes) 🥉
2. Collectionneur (50-149 cartes) 🥈
3. Expert (150-299 cartes) 🥇
4. Maître (300-499 cartes) ⭐
5. Champion (500-999 cartes) 🏆
6. Légendaire (1000+ cartes) 👑
```

#### Navigation (constants/navigation.js)
- **Routes publiques** : `/login`, `/explorer` (PUBLIC_ROUTES)
- **Navigation principale** : NAVIGATION_ITEMS avec icônes Lucide React
- **Sous-navigation** : Collection avec sous-items (favoris, doublons, etc.)
- **Routes admin** : `/admin`, `/admin/base-donnees` avec rôle requis
- **Indicateurs visuels** : Couleurs par section, badges premium

### Configuration Technique

#### Alias de Chemins (vite.config.js)
- `@/` → `./src/` pour imports absolus

#### Variables d'Environnement
- `VITE_POKEMON_TCG_API_KEY` : Clé API Pokemon TCG (optionnelle)
- `VITE_SUPABASE_URL` : URL du projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé anonyme Supabase (publique)

#### Configuration Proxy (vite.config.js)
- `/api/pokemontcg` → `https://api.pokemontcg.io` pour contourner CORS

## Notes de Développement

### Standards de Code
- **Langage** : JavaScript (.jsx), pas de TypeScript
- **Style** : ESLint configuré pour React (eslint.config.js)
- **Langue** : Interface entièrement en français
- **Imports** : Utiliser les alias `@/` pour tous les imports depuis src/

### Patterns Architecturaux
- **Composants** : Séparation ui/ (génériques) vs features/ (métier)
- **Services** : Classes statiques avec méthodes async/await
- **Hooks** : Context Pattern pour l'état global partagé
- **Routing** : Layout wrapper avec protection d'authentification

### APIs Externes
- **Pokemon TCG** : `https://api.pokemontcg.io/v2` (cartes TCG)
  - Proxy CORS via Vite : `/api/pokemontcg`
  - Recherche avec filtrage intelligent par limite de mots
  - Support complet des prix (CardMarket EUR, TCGPlayer USD)
- **Supabase** : Backend complet (Auth + PostgreSQL + Storage)
  - URL: Configurée via `VITE_SUPABASE_URL`
  - Auth: Email/Password avec sessions sécurisées
  - Database: PostgreSQL avec RLS
- **Traduction** : Français→Anglais automatique pour recherche cartes (dictionnaire centralisé dans `src/utils/pokemonTranslations.js`)
  - Exemples récents ajoutés : archéomire→bronzor, archéodong→bronzong, ptiravi→happiny, flotajou→panpour, manglouton→yungoos, guérilande→comfey
  - **Corrections importantes** :
    - Suppression doublons (ex: manglouton était à tort traduit en "sandy shocks" en Gen 9)
    - Vérifier Pokedex order pour éviter confusions entre générations
  - Attention aux doublons : vérifier qu'une traduction n'existe pas déjà avant d'en ajouter une nouvelle avec `grep -n "nom" pokemonTranslations.js`

## Démarrage Rapide
```bash
cd vaultestim-v2
npm install --legacy-peer-deps
npm run dev
```

L'application sera accessible sur http://localhost:5174

**Connexion** : Créez un compte avec votre email ou utilisez un compte existant. L'authentification est gérée par Supabase.

## Fonctionnalités Avancées Récentes

### 🗃️ Système de Base de Données Cloud (Supabase)

#### **Architecture de Base Commune** 🌍
L'application utilise une **architecture hybride** avec deux types de données :

**1. Base commune partagée (Explorer les séries)** :
- **Table** : `discovered_cards` - Base de 14,000+ cartes visibles par TOUS les utilisateurs
- **Comportement** : Pas de filtre `user_id` lors du chargement avec `loadDiscoveredCards()`
- **Objectif** : Affichage uniforme des blocs/extensions/cartes dans l'onglet "Explorer les séries"
- **Enrichissement** : Quand une nouvelle carte est ajoutée, elle devient visible pour TOUS les utilisateurs

**2. Collections personnelles (Ma Collection)** :
- **Comportement** : Les ajouts à "Ma Collection" restent personnels par utilisateur
- **Séparation** : Distinction claire entre "voir les cartes disponibles" (commun) et "posséder les cartes" (personnel)

#### **Déduplication Intelligente**
- **Fonction** : `getCardCompletenessScore(card)` dans `SupabaseService.js` (lignes 287-313)
- **Algorithme de scoring** :
  - Données de base : +1 point (name, types, hp, number, etc.)
  - Prix : +2 points chacun (cardmarket, tcgplayer)
  - Données de combat : +1 point (attacks, abilities, weaknesses, etc.)
- **Comportement** : Quand plusieurs versions d'une même carte existent, conserve celle avec le score le plus élevé
- **Logs** : `✨ X cartes UNIQUES après déduplication`

#### **Capacités**
- **Stockage illimité** : Cloud PostgreSQL sans limitations
- **Multi-device** : Synchronisation automatique entre tous les appareils
- **Traitement par batch** : Chunking optimisé pour gros volumes (1000 cartes/batch)
- **Index optimisés** : Recherche ultra-rapide par user_id, card_id
- **Cache local** : Performance instantanée avec fallback sur Supabase
- **Trigger updated_at** : Mise à jour automatique des timestamps

### 📷 Système de Gestion d'Images

#### **Upload et Stockage**
- **Formats supportés** : JPG, PNG, GIF, WebP (max 5MB)
- **Validation automatique** : Vérification type et taille
- **Conversion Base64 → Blob** : Pour affichage optimisé
- **Stockage par entité** : Images liées aux blocs, extensions, cartes

#### **Interface Utilisateur**
- **Composant ImageUpload** : Interface complète d'upload
- **Prévisualisation** : Aperçu immédiat avec dialog
- **Sélection multiple** : Grille d'images uploadées
- **Actions** : Sélectionner, prévisualiser, supprimer
- **Fallback URL** : Saisie d'URL en alternative

### 📦 Gestion Avancée des Blocs

#### **Types de Blocs**
- **Blocs générés** (`type: 'generated'`) : Créés automatiquement depuis les extensions
- **Blocs personnalisés** (`type: 'custom'`) : Créés manuellement par l'utilisateur

#### **Fonctionnalités**
- **Création/Modification** : Interface complète d'édition
- **Conversion automatique** : Bloc généré → personnalisé lors de modification
- **Persistance** : Sauvegarde IndexedDB pour blocs personnalisés
- **Suppression complète** : Bloc + extensions + cartes associées
- **Images** : Upload de logos avec affichage 48x48px

### 🔄 Déplacement Permanent d'Extensions

#### **Système de Transfert**
- **Déplacement entre blocs** : Extensions peuvent changer de bloc parent
- **Persistance IndexedDB** : Déplacements sauvegardés dans `custom_extensions`
- **Traçabilité** : Conservation du bloc d'origine pour restauration
- **Interface visuelle** : Badges "Déplacé depuis [Bloc d'origine]"

#### **Gestion des États**
- **États synchronisés** : React + IndexedDB
- **Reconstruction intelligente** : Application des déplacements au chargement
- **Restauration** : Bouton pour remettre dans le bloc d'origine

### 🗑️ Suppression Complète

#### **Suppression Hiérarchique**
- **Bloc personnalisé** : Supprime seulement le bloc (préserve extensions)
- **Bloc généré** : Supprime bloc + toutes extensions + toutes cartes
- **Extension** : Supprime extension + toutes cartes associées
- **Carte** : Suppression individuelle

#### **Interface de Suppression**
- **Boutons individuels** : Icône 🗑️ sur chaque élément
- **Suppression en lot** : Sélection multiple avec checkboxes
- **Confirmations** : Messages d'avertissement détaillés
- **Rapports** : Confirmation du nombre d'éléments supprimés

### 🧭 Navigation Hiérarchique

#### **Structure Explorer**
- **Niveau 1** : Vue des blocs avec statistiques
- **Niveau 2** : Extensions du bloc sélectionné
- **Niveau 3** : Cartes de l'extension sélectionnée
- **Breadcrumb** : Navigation avec boutons de retour
- **Bouton "Ajouter carte"** : Positionnement responsive entre navigation et recherche
  - Mobile : Vertical (flex-col), bouton pleine largeur
  - Desktop : Horizontal (md:flex-row), bouton compact

#### **Éditeur de Base de Données**
- **Vue générale** : Onglets Blocs/Extensions/Cartes
- **Vue détail** : Navigation dans la hiérarchie
- **Actions** : Édition, suppression, prévisualisation sur chaque niveau

### 🔍 Système de Recherche Avancé

#### **Recherche Bilingue Français/Anglais** (Nouveau!)
- **Fonctionnalité** : Recherche de cartes avec noms français OU anglais dans toutes les collections
- **Pages supportées** :
  - `Collection.jsx` : Ma Collection → Toutes mes cartes
  - `Favorites.jsx` : Favoris, Liste de souhaits
  - `Duplicates.jsx` : Gestion des doublons
  - `Explore.jsx` : Explorer → Cartes d'une extension
- **Implémentation** :
  ```javascript
  // Recherche directe en anglais
  const matchesEnglish = cardNameLower.includes(searchLower)

  // Traduction automatique français→anglais
  const translatedSearch = translatePokemonName(searchLower)
  const matchesTranslated = translatedSearch !== searchLower && cardNameLower.includes(translatedSearch)

  return matchesEnglish || matchesTranslated
  ```
- **Exemples d'utilisation** :
  - `dracaufeu` → trouve "Charizard"
  - `salamèche` → trouve "Charmander"
  - `pikachu` → fonctionne dans les deux langues
  - `amphinobi` → trouve "Greninja"
- **Couverture** : Support de 976+ Pokémon (Générations 1-9)

#### **Annulation de Recherche**
- **AbortController** : Gestion des requêtes simultanées
- **Bouton Annuler** : Visible pendant la recherche en cours
- **Nettoyage automatique** : Annulation lors de nouvelles recherches
- **Gestion d'erreurs** : Traitement des erreurs AbortError

#### **Traductions Pokémon**
- **Fichier centralisé** : `src/utils/pokemonTranslations.js`
- **Format** : `'nom_français': 'nom_anglais'` (tout en minuscules)
- **Export** : `translatePokemonName(frenchName)` pour conversion automatique
- **Maintenance** : Vérifier les doublons avec `grep -n "nom" pokemonTranslations.js`
- **Utilisation** : Importé dans les pages de collection pour recherche bilingue

### 🎨 Améliorations Visuelles

#### **Affichage des Logos**
- **Taille optimisée** : 48x48px avec `object-contain`
- **Fallback** : Icônes par défaut si pas de logo
- **Priorité** : Images uploadées > URLs > icônes par défaut

#### **Indicateurs d'État**
- **Extensions déplacées** : Badge "Déplacé depuis [Bloc]"
- **Dates de bloc** : Affichage start/end dates
- **Statistiques temps réel** : Compteurs mis à jour automatiquement

### ⚡ Système de Cache Intelligent (Nouveau!)

#### **Architecture**
Le système utilise une approche hybride pour optimiser les performances :
- **IndexedDB** : Cache local illimité pour stockage des cartes
- **Supabase** : Source de vérité cloud pour synchronisation multi-device
- **Delta Sync** : Synchronisation incrémentale pour minimiser les transferts réseau

#### **Flux de Chargement**

**Première Connexion (pas de cache)**
```
1. Téléchargement complet depuis Supabase
2. Sauvegarde dans IndexedDB (cache local)
3. Enregistrement du timestamp de synchronisation
4. Interface prête avec toutes les cartes
```

**Connexions Suivantes (avec cache)**
```
1. Chargement instantané depuis IndexedDB (< 1s)
2. Interface immédiatement utilisable
3. [Après 2s] Synchronisation arrière-plan :
   - Vérification timestamp dernière sync
   - Téléchargement uniquement des nouvelles cartes
   - Fusion avec le cache existant
   - Mise à jour interface en temps réel
```

#### **Avantages**
- **Performance** : Chargement instantané (pas de requête réseau au démarrage)
- **Économie de données** : Seules les nouvelles cartes sont téléchargées
- **Résilience** : Fonctionne hors ligne avec les données en cache
- **Scalabilité** : Pas de limite de stockage (IndexedDB illimité)
- **Multi-device** : Synchronisation automatique via Supabase

#### **Fichiers Impliqués**
- `src/services/CardCacheService.js` : Gestion du cache IndexedDB
- `src/services/SupabaseService.js` : Méthode `loadCardsModifiedSince()`
- `src/hooks/useCardDatabase.jsx` : Logique de chargement intelligent
- `src/services/SupabaseAuthService.js` : Stockage de session pour stabilité

#### **Maintenance**
- **Nettoyage manuel** : Via `/clean-storage.html` ou bouton sur page login
- **Auto-nettoyage** : Pas de nettoyage automatique pour éviter perte de données
- **Debug** : Logs détaillés avec emojis dans la console pour traçabilité

### 💰 Système de Gestion des Prix (Nouveau!)

#### **Architecture de Stockage des Prix**
Les prix sont stockés de deux manières complémentaires :
- **Structures complètes** : `card.cardmarket` (EUR) et `card.tcgplayer` (USD) en JSONB
- **Prix calculés** : `card.marketPrice` pour affichage rapide
- **Multi-device** : Synchronisation automatique via Supabase
- **Cache local** : IndexedDB pour performance instantanée

#### **Extraction et Formatage des Prix**
**Fichier** : `src/utils/priceFormatter.js`

**Fonction principale** : `formatCardPrice(card, decimals = 2)`

**Ordre de priorité d'extraction** :
1. **CardMarket** (EUR) : `card.cardmarket.prices.averageSellPrice`
2. **TCGPlayer Holofoil** (USD) : `card.tcgplayer.prices.holofoil.market`
3. **TCGPlayer Normal** (USD) : `card.tcgplayer.prices.normal.market`
4. **TCGPlayer Reverse** (USD) : `card.tcgplayer.prices.reverseHolofoil.market`
5. **TCGPlayer 1st Edition** (USD) : `card.tcgplayer.prices.1stEditionHolofoil.market`

**Ajustement par condition** :
```javascript
Near Mint: 100% du prix
Excellent: 95%
Good: 85%
Light Played: 75%
Played: 65%
Poor: 50%
```

#### **Migration des Prix**

**Composant** : `src/components/features/admin/PriceMigrationPanel.jsx`

**Fonctionnalités** :
- **Interface Admin** : Panneau dédié dans Admin → Éditeur de Base de Données
- **Statistiques temps réel** : Cartes totales, avec prix, sans prix, % couverture
- **Barre de progression** : Affichage visuel du traitement (0-100%)
- **Compteurs détaillés** : ✅ Migrées | ⏭️ Déjà OK | ❌ Erreurs
- **Interruption/Reprise** : Bouton "Annuler" pour stopper et reprendre plus tard
- **Reprise intelligente** : La progression démarre au bon % (ex: 20% si 20% déjà migrés)
- **Avertissement visuel** : Message jaune "Ne quittez pas cette page pendant la migration"

**Fonction** : `migratePrices(onProgress, cancelSignal)` dans `useCardDatabase.jsx`

**Configuration** :
- **Batch size** : 10 cartes par batch
- **Délai entre batches** : 2 secondes (évite rate limiting API)
- **Estimation** : ~47 minutes pour 14,234 cartes (2s par batch de 10)

**Algorithme de migration** :
```javascript
1. Calculer nombre de cartes avec/sans prix
2. Afficher progression de départ (ex: 20% si 2,847/14,234 ont déjà les prix)
3. Pour chaque batch de 10 cartes :
   - Vérifier signal d'annulation
   - Skipper les cartes avec prix existants
   - Fetch API Pokemon TCG pour cartes sans prix
   - Extraire cardmarket + tcgplayer + marketPrice
   - Sauvegarder dans IndexedDB (cache local)
   - Sauvegarder dans Supabase (multi-device)
   - Mettre à jour React state
   - Pause 2 secondes
4. Mettre à jour timestamp de synchronisation
5. Retourner résultats (success, errors, skipped, total)
```

**Gestion de l'interruption** :
```javascript
// Vérification du signal à chaque batch
if (cancelSignal?.cancelled) {
  return {
    success: updatedCount,
    errors: errorCount,
    skipped: skippedCount,
    total: allCards.length,
    interrupted: true,
    progress: currentProgress
  }
}
```

#### **Sauvegarde Supabase des Prix**

**Modifications** : `src/services/SupabaseService.js`

**Champs JSONB ajoutés** à la table `discovered_cards` :
- `cardmarket` : Structure complète CardMarket (EUR)
  - `prices.averageSellPrice`, `prices.lowPrice`, `prices.trendPrice`, etc.
- `tcgplayer` : Structure complète TCGPlayer (USD)
  - `prices.holofoil.market`, `prices.normal.market`, etc.

**Index GIN créés** pour recherche rapide :
```sql
CREATE INDEX idx_discovered_cards_cardmarket ON discovered_cards USING GIN (cardmarket);
CREATE INDEX idx_discovered_cards_tcgplayer ON discovered_cards USING GIN (tcgplayer);
```

**Whitelist mise à jour** :
```javascript
static ALLOWED_CARD_FIELDS = [
  'id', 'name', 'name_fr', 'types', 'hp', 'number',
  'artist', 'rarity', 'rarity_fr', 'images', 'set',
  'set_id', '_source',
  'cardmarket',  // Structure complète des prix CardMarket (EUR)
  'tcgplayer'    // Structure complète des prix TCGPlayer (USD)
]
```

**Synchronisation automatique** :
- `addDiscoveredCards()` sauvegarde prix pour nouvelles cartes ET mises à jour
- `migratePrices()` synchronise vers Supabase en parallèle de IndexedDB
- Logs détaillés : `☁️ Supabase: X cartes avec prix synchronisées (multi-device)`

#### **Affichage des Prix dans l'Application**

**Pages modifiées** :
- `src/pages/Collection.jsx` : Affichage prix sous chaque carte
- `src/pages/Explore.jsx` : Prix dans grille de cartes
- `src/components/features/collection/CardDetailsModal.jsx` : Prix détaillés
- `src/components/features/explore/AddCardModal.jsx` : Prix avant ajout

**Usage** :
```javascript
import { formatCardPrice } from '@/utils/priceFormatter'

// Dans le JSX
<div className="text-sm text-muted-foreground">
  {formatCardPrice(card)}
</div>
```

#### **Résolution du Bug "Prix N/A"**

**Problème initial** :
- Tous les prix affichaient "Prix N/A" partout dans l'app
- Les structures `cardmarket` et `tcgplayer` n'étaient pas sauvegardées
- Seul `marketPrice` était calculé temporairement

**Solutions apportées** :
1. **formatCardPrice** : Extraction intelligente depuis structures API
2. **Persistence IndexedDB** : Sauvegarde des structures complètes
3. **Persistence Supabase** : Colonnes JSONB pour sync multi-device
4. **Migration automatique** : Récupération des prix pour cartes existantes
5. **Sauvegarde systématique** : Lors de l'ajout de cartes, les prix sont toujours sauvegardés

#### **Messages d'Information Utilisateur**

**Dans PriceMigrationPanel** :
```
Info :
• La migration traite 10 cartes toutes les 2 secondes pour éviter le rate limiting
• Les cartes avec prix existants sont automatiquement sautées
• Vous pouvez interrompre avec le bouton "Annuler" et reprendre plus tard
• La progression est sauvegardée : les cartes déjà migrées ne seront pas retraitées
• ⚠️ Restez sur cette page pendant la migration (sinon elle s'arrête)
```

**Pendant la migration** :
```
⚠️ Important : Ne quittez pas cette page pendant la migration.
Si vous quittez, la migration s'arrêtera mais vous pourrez la reprendre à 20%.
```

#### **Limitations et Comportement**

**Migration s'arrête si** :
- L'utilisateur change de page (React component unmount)
- L'utilisateur ferme le navigateur
- L'utilisateur clique sur "Annuler"

**Migration reprend automatiquement** :
- Calcule combien de cartes ont déjà les prix (ex: 2,847 = 20%)
- Affiche la progression à 20% au lieu de 0%
- Skip automatiquement les cartes déjà migrées
- Continue uniquement avec les cartes sans prix

**Temps de migration** :
- 10 cartes / 2 secondes = 5 cartes/seconde = 300 cartes/minute
- Pour 14,234 cartes : ~47 minutes
- Mais seulement pour les cartes SANS prix (les autres sont skippées)

## Debugging et Maintenance

### 🚨 Erreurs de Build Communes

#### **Erreur : Missing comma in array**
**Symptôme** : Build Vercel échoue avec "Expected ',', got 'string literal'"

**Cause** : Virgule placée dans le commentaire au lieu d'après la valeur
```javascript
// ❌ INCORRECT
'retreat_cost' // Coût de retraite,
'_price_updated_at', // Champ suivant

// ✅ CORRECT
'retreat_cost', // Coût de retraite
'_price_updated_at', // Champ suivant
```

**Solution** : Toujours placer la virgule AVANT le commentaire, jamais à l'intérieur

#### **Erreur : Proxy API 404 en production**
**Symptôme** : `GET /api/pokemontcg/v2/cards 404` en production, fonctionne en dev

**Cause** : Le proxy Vite (`vite.config.js`) ne fonctionne qu'en développement

**Solution** : Utiliser Vercel Serverless Function `api/pokemontcg/[...path].js`
- Déploie automatiquement avec le reste de l'app
- Gère CORS et transmission API Key
- Même route `/api/pokemontcg/*` en dev et production

#### **Erreur : Session perdue après refresh**
**Symptôme** : Navigation tabs disparaissent, utilisateur déconnecté après F5

**Cause** : Cache navigateur contient ancien code avec storage adapter async

**Solution** :
1. Hard refresh : `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. Si insuffisant : Console → `localStorage.clear(); sessionStorage.clear(); location.reload()`
3. Se reconnecter → Le nouveau storage adapter synchrone sauvegarde correctement

### 🔍 Outils de Debug
- **Bouton "Debug DB"** : Vérification état IndexedDB vs React
- **Logs détaillés** : Console avec emojis pour traçabilité
- **Statistiques stockage** : Cartes, extensions, images, tailles

### 🔧 Résolution de Problèmes Courants

#### **Problèmes d'Infrastructure**
- **CORS TCG API** : Résolu par proxy Vite (`/api/pokemontcg`)
- **Persistence modifications** : Type de bloc correctement détecté
- **Reconstruction données** : useEffect optimisés pour éviter boucles
- **Performance** : Traitement par batch pour gros volumes
- **localStorage plein (QuotaExceededError)** : Utiliser `/clean-storage.html` ou lien sur page de login
- **Cache IndexedDB** : Chargement instantané + synchronisation incrémentale pour performance maximale

#### **Problèmes de Recherche**
- **Recherche intelligente** : Filtrage par limite de mots pour éviter faux positifs (Mew vs Mewtwo)
- **Traductions Pokémon** : Dictionnaire centralisé dans `src/utils/pokemonTranslations.js` - Éviter les doublons
- **AbortController** : Annulation des recherches pour éviter race conditions et résultats obsolètes
- **❌ RÉSOLU - "API indisponible" pour 0 résultats** : Faux message d'erreur quand recherche ne trouve aucune carte
  - **Cause** : `MultiApiService` lançait une exception quand l'API retournait 0 résultats
  - **Solution** : Différenciation entre "API répond avec 0 résultats" (retour `[]`) et "API en erreur" (exception)
  - **Fichier** : `src/services/MultiApiService.js` - méthode `searchCards()`
- **❌ RÉSOLU - Type:0 ne trouve pas Type: Null** : Traduction incorrecte sans espace
  - **Cause** : `'type:0': 'type:null'` au lieu de `'type: null'` (espace manquant)
  - **Solution** : Correction traduction + ajout variantes (`type zéro`, `type zero`)
  - **Fichier** : `src/utils/pokemonTranslations.js` lignes 812-816
- **❌ RÉSOLU - Denticrisse traduit en Ogerpon** : Doublon erroné écrasait bonne traduction
  - **Cause** : Deux entrées pour `denticrisse` (ligne 824: bruxish ✅, ligne 1001: ogerpon ❌)
  - **Solution** : Suppression du doublon incorrect, conservation de `denticrisse → bruxish`
  - **Fichier** : `src/utils/pokemonTranslations.js`
- **❌ RÉSOLU - Erreur 400 pour cartes avec &** : "Gengar & Mimikyu-GX" générait Bad Request
  - **Cause** : Caractère `&` non encodé dans URL cassait la query string
  - **Solution** : `encodeURIComponent()` pour encoder tous les caractères spéciaux (&, ', ", etc.)
  - **Fichier** : `src/services/TCGdxService.js` lignes 137-157
- **❌ RÉSOLU - Erreur 400 pour recherche wildcard** : Recherches comme "cancrelove" (→ "pheromosa") échouaient avec Bad Request
  - **Cause** : Syntaxe invalide `name:"pheromosa"*` (guillemets + wildcard incompatibles)
  - **Solution** : Wildcard sans guillemets → `name:pheromosa*` au lieu de `name:"pheromosa"*`
  - **Fichier** : `src/services/TCGdxService.js` ligne 154-156
  - **Syntaxe correcte API** : Exacte `name:"nom"` | Wildcard `name:nom*` (sans guillemets)

#### **Problèmes de Synchronisation**
- **Multi-device** : Synchronisation Supabase automatique avec cache local pour performance
- **Mobile** : Pull-to-refresh désactivé pour éviter rafraîchissements accidentels

#### **Problèmes de Prix**
- **"Prix N/A" partout** : Depuis migration Supabase, les prix n'étaient plus sauvegardés
  - **Cause** : Seul `marketPrice` temporaire était calculé, pas les structures complètes
  - **Solution** : `formatCardPrice` extrait prix depuis `cardmarket`/`tcgplayer`, sauvegarde en JSONB
  - **Migration** : Outil admin pour récupérer prix de toutes les cartes existantes
  - **Progression intelligente** : Reprend à X% au lieu de 0% (skip les cartes déjà migrées)
- **❌ RÉSOLU - Erreur "Could not find '_price_updated_at' column"** : Colonne manquante dans Supabase
  - **Symptôme** : Erreur 400 lors de sauvegarde cartes avec prix dans `discovered_cards`
  - **Cause** : Colonnes `_price_updated_at` et `_last_viewed` référencées dans code mais absentes en DB
  - **Solution** : Exécuter script SQL pour ajouter colonnes + index
  - **Script** : Voir section "Script SQL Supabase (REQUIS pour gestion des prix)"

#### **🔴 CRITIQUE - Problème de Session Supabase (RÉSOLU)**
**Symptôme** : Les onglets de navigation disparaissent après actualisation de la page, utilisateur déconnecté automatiquement.

**Cause Racine** : Le custom storage adapter avait des méthodes `setItem` et `removeItem` déclarées comme `async`, mais Supabase Auth attend un storage adapter **synchrone** (comme l'API localStorage native). Résultat : le token d'authentification n'était **jamais sauvegardé**.

**Solution Appliquée** (Fichier `src/lib/supabaseClient.js`) :
```javascript
// ❌ AVANT (incorrect - async)
const customStorage = {
  setItem: async (key, value) => { ... },
  removeItem: async (key) => { ... }
}

// ✅ APRÈS (correct - synchrone)
const customStorage = {
  setItem: (key, value) => { ... },  // Pas async
  removeItem: (key) => { ... }       // Pas async
}
```

**Procédure de Fix pour Utilisateurs Existants** :
1. **Se déconnecter** complètement de l'application (bouton déconnexion ou `localStorage.clear()`)
2. **Se reconnecter** avec les identifiants → Le nouveau storage synchrone sauvegarde correctement le token
3. **Vérifier les logs console** : Doit afficher `📝 [Storage] setItem appelé pour sb-...-auth-token`
4. **Actualiser la page** : Les onglets restent maintenant visibles ✅

**Fichiers Modifiés** :
- `src/lib/supabaseClient.js` : Storage adapter synchrone avec logs détaillés
- `src/services/SupabaseAuthService.js` : Utilisation cohérente de `getSession()` au lieu de `getUser()`

## Déploiement

### 🚀 Déploiement Automatique (Actif)

**Le projet est configuré pour le déploiement automatique sur Vercel.**

#### Configuration Git

**Repository GitHub** : `Voctali/vaultestim-v2-`

**Remotes configurés** :
- `github` → `https://github.com/Voctali/vaultestim-v2-.git` (remote principal - ✅ UTILISER CELUI-CI)
- `origin` → Placeholder invalide (❌ NE PAS UTILISER)

**Branche de production** : `main`

#### Workflow de Déploiement Automatique

**Chaque push sur `main` déclenche automatiquement un déploiement Vercel !**

```bash
# Workflow standard (géré par Claude Code)
# 1. Modifications de fichiers
# 2. Claude Code gère automatiquement :
git add .
git commit -m "Description des modifications"
git push github main

# 3. Vercel détecte le push et déploie automatiquement en production
# 4. L'app est mise à jour sur https://vaultestim-v2.vercel.app
```

**⚠️ IMPORTANT** : Toujours pousser sur le remote `github` (PAS `origin`)

#### Demander à Claude Code de Déployer

**Vous n'avez pas besoin de retenir les commandes git !** Dites simplement à Claude Code :

- *"Peux-tu commit mes changements ?"*
- *"Déploie mes modifications sur Vercel"*
- *"Pousse les dernières modifs"*
- *"Commit et déploie tout ça"*

**Claude Code gère automatiquement** :
1. ✅ Vérification des fichiers modifiés (`git status`)
2. ✅ Ajout des fichiers (`git add .`)
3. ✅ Création du commit avec message approprié
4. ✅ Push vers GitHub (`git push github main`)
5. ✅ Vérification du déploiement Vercel

### Production (Vercel)

**Déploiement automatique configuré** - Pas besoin de commandes manuelles !

```bash
# Si déploiement manuel nécessaire (rare)
cd /f/Logiciels/Appli\ Vaultestim/vaultestim-v2
vercel --prod --token $VERCEL_TOKEN

# Forcer rebuild sans cache
vercel --prod --force --token $VERCEL_TOKEN
```

**⚠️ SÉCURITÉ** : Ne jamais exposer le token dans le code. Configurez la variable d'environnement `VERCEL_TOKEN` dans votre système.

### Variables d'Environnement Vercel
Configurer dans le dashboard Vercel :
- `VITE_SUPABASE_URL` : URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé anonyme Supabase
- `VITE_POKEMON_TCG_API_KEY` : Clé API Pokemon TCG (optionnelle)

### 📍 Accéder aux Nouveautés CardMarket Déployées

Les nouveaux composants CardMarket sont **déjà déployés en production** et accessibles directement !

#### **Page Produits Scellés**
**URL Production** : https://vaultestim-v2.vercel.app/produits-scelles

**Nouveautés disponibles** :
- ✅ **SealedProductModal** : Modale pour ajouter/éditer des produits scellés (bouton "Ajouter un produit")
- ✅ **PriceHistoryModal** : Graphiques d'évolution des prix (bouton "Voir l'historique" sur chaque produit)
- ✅ Bouton **"Actualiser les prix"** pour refresh automatique via CardMarket
- ✅ **Alertes de prix** avec indicateurs visuels (hausse/baisse)

#### **Éditeur Admin de Base de Données**
**URL Production** : https://vaultestim-v2.vercel.app/admin/base-donnees (nécessite compte admin)

**Nouveautés disponibles** :
- ✅ **CardMarketBulkHelper** : Outil de recherche en masse dans l'onglet dédié
- ✅ **SealedProductsManager** : Gestionnaire complet dans l'onglet "Produits Scellés"
- ✅ **Migration des prix** : Outil de récupération automatique des prix

#### 🔍 Résolution des Problèmes de Cache

Si les nouveautés ne s'affichent pas :

1. **Hard refresh** : `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. **Désactiver le cache** :
   - Chrome : F12 → Network → Cocher "Disable cache"
   - Puis actualiser la page
3. **Navigation privée** : Tester en mode incognito pour contourner le cache

### Script SQL Supabase (REQUIS pour gestion des prix)
**IMPORTANT** : Exécuter ce script dans le SQL Editor de Supabase avant d'utiliser la migration des prix

**URL** : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

```sql
-- Ajouter les colonnes pour les prix
ALTER TABLE discovered_cards
ADD COLUMN IF NOT EXISTS cardmarket JSONB,
ADD COLUMN IF NOT EXISTS tcgplayer JSONB,
ADD COLUMN IF NOT EXISTS _price_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS _last_viewed TIMESTAMPTZ;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_discovered_cards_cardmarket ON discovered_cards USING GIN (cardmarket);
CREATE INDEX IF NOT EXISTS idx_discovered_cards_tcgplayer ON discovered_cards USING GIN (tcgplayer);

-- Index pour optimiser les requêtes de priorisation (PriceRefreshService)
CREATE INDEX IF NOT EXISTS idx_discovered_cards_price_updated
ON discovered_cards(_price_updated_at)
WHERE _price_updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_discovered_cards_last_viewed
ON discovered_cards(_last_viewed)
WHERE _last_viewed IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN discovered_cards.cardmarket IS 'Structure complète des prix CardMarket (EUR)';
COMMENT ON COLUMN discovered_cards.tcgplayer IS 'Structure complète des prix TCGPlayer (USD)';
COMMENT ON COLUMN discovered_cards._price_updated_at IS 'Timestamp de la dernière actualisation des prix de la carte';
COMMENT ON COLUMN discovered_cards._last_viewed IS 'Timestamp de la dernière consultation de la carte (pour priorisation)';
```

**Vérification** :
Après exécution, vérifier dans Table Editor que les colonnes suivantes apparaissent :
- `cardmarket` et `tcgplayer` avec le type `jsonb`
- `_price_updated_at` et `_last_viewed` avec le type `timestamptz`

### URL de Production
- **Domaine personnalisé** : https://vaultestim-v2.vercel.app
- **Projet Vercel** : `vaultestim-v2` (NON "src")

### Notes de Déploiement
- ⚠️ **Ne pas créer de projets multiples** : Utiliser uniquement le projet `vaultestim-v2`
- 📁 **Déployer depuis la racine** : Le dossier `src/` contient le code source, PAS un projet Vercel séparé
- 🔄 **Cache navigateur** : Après déploiement, tester en mode navigation privée pour éviter les problèmes de cache
- ✅ **Vérification du build** : Un build réussi compile ~1927 modules en ~7-8 secondes