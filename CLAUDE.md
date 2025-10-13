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
21. **🔐 Gestion de Session Optimisée** - Stockage de session pour éviter la disparition des onglets mobiles

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
- **Multi-device** : Synchronisation automatique entre appareils
- **Traitement par batch** : Optimisé pour gros volumes de données (chunking)
- **Index optimisés** : Recherche rapide par user_id, card_id
- **Synchronisation incrémentale** : Récupération uniquement des cartes modifiées depuis un timestamp
- **Tables principales** :
  - `discovered_cards` : Toutes les cartes découvertes par utilisateur avec `_saved_at` timestamp
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

### Système d'Authentification
- **Authentification** : Supabase Auth avec gestion complète de session
- **Providers** : Email/Password avec validation
- **Sessions** : Gestion automatique avec refresh tokens
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
  - Exemples récents ajoutés : archéomire→bronzor, archéodong→bronzong, ptiravi→happiny, flotajou→panpour
  - Attention aux doublons : vérifier qu'une traduction n'existe pas déjà avant d'en ajouter une nouvelle

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

#### **Architecture**
- **Tables PostgreSQL** :
  - `discovered_cards` : Cartes découvertes par utilisateur avec métadonnées complètes
  - `user_profiles` : Profils utilisateurs liés à auth.users
  - Row Level Security (RLS) : Isolation complète des données par utilisateur

#### **Capacités**
- **Stockage illimité** : Cloud PostgreSQL sans limitations
- **Multi-device** : Synchronisation automatique entre tous les appareils
- **Traitement par batch** : Chunking optimisé pour gros volumes (500 cartes/batch)
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

## Debugging et Maintenance

### 🔍 Outils de Debug
- **Bouton "Debug DB"** : Vérification état IndexedDB vs React
- **Logs détaillés** : Console avec emojis pour traçabilité
- **Statistiques stockage** : Cartes, extensions, images, tailles

### 🔧 Résolution de Problèmes Courants
- **CORS TCG API** : Résolu par proxy Vite (`/api/pokemontcg`)
- **Persistence modifications** : Type de bloc correctement détecté
- **Reconstruction données** : useEffect optimisés pour éviter boucles
- **Performance** : Traitement par batch pour gros volumes
- **Recherche intelligente** : Filtrage par limite de mots pour éviter faux positifs (Mew vs Mewtwo)
- **Multi-device** : Synchronisation Supabase automatique avec cache local pour performance
- **Mobile** : Pull-to-refresh désactivé pour éviter rafraîchissements accidentels
- **Traductions Pokémon** : Dictionnaire centralisé dans `src/utils/pokemonTranslations.js` - Éviter les doublons
- **AbortController** : Annulation des recherches pour éviter race conditions et résultats obsolètes
- **localStorage plein (QuotaExceededError)** : Utiliser `/clean-storage.html` ou lien sur page de login
- **Cache IndexedDB** : Chargement instantané + synchronisation incrémentale pour performance maximale

## Déploiement

### Production (Vercel)
```bash
# Déploiement automatique via CLI
vercel --prod

# Ou push vers GitHub (si connecté)
git push origin master
```

### Variables d'Environnement Vercel
Configurer dans le dashboard Vercel :
- `VITE_SUPABASE_URL` : URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé anonyme Supabase
- `VITE_POKEMON_TCG_API_KEY` : Clé API Pokemon TCG (optionnelle)

### URL de Production
L'application est déployée sur : `vaultestim-v2-3vnio8r0h-voctalis-projects.vercel.app`