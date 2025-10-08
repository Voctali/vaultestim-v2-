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
- **APIs**: Tyradex (Pokémon français) + Pokemon TCG API
- **État**: Context API avec hooks personnalisés
- **Authentification**: Système mock avec localStorage
- **Stockage**: IndexedDB pour données illimitées (cartes, extensions, images)
- **Upload d'images**: Système de stockage local avec prévisualisation

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
4. **👤 Authentification Mock** - Système de connexion de démonstration
5. **📊 Tableau de Bord** - Statistiques utilisateur et progression
6. **⭐ Système de Niveaux** - 6 niveaux basés sur le nombre de cartes
7. **👑 Gestion Premium** - Fonctionnalités premium avec badges
8. **🔧 Interface Admin** - Gestion des utilisateurs premium avec plans tarifaires
9. **🗃️ Base de Données Locale** - Stockage IndexedDB illimité pour cartes et extensions
10. **📷 Upload d'Images** - Système complet de gestion d'images avec prévisualisation
11. **📦 Gestion des Blocs** - Création, modification, suppression de blocs personnalisés
12. **🔄 Déplacement d'Extensions** - Transfert permanent d'extensions entre blocs
13. **🗑️ Suppression Complète** - Suppression de blocs/extensions/cartes de la base locale

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
- `searchCards(query, limit)` - Recherche de cartes avec traduction français→anglais
- `getCardById(cardId)` - Récupération d'une carte spécifique
- `getSets()` - Liste des extensions disponibles
- `organizeCardsBySet()` / `organizeCardsByBlock()` - Organisation par extensions/blocs
- Mapping complet des séries (Scarlet & Violet, Sword & Shield, etc.)
- Support prix de marché (TCGPlayer, CardMarket)
- Traductions types et raretés en français
- **Proxy CORS** : Utilise `/api/pokemontcg` via configuration Vite

#### IndexedDBService (Stockage Local)
- `saveDiscoveredCards()` / `loadDiscoveredCards()` - Gestion des cartes découvertes
- `saveSeriesDatabase()` / `loadSeriesDatabase()` - Gestion des extensions
- `saveCustomBlock()` / `loadCustomBlocks()` - Gestion des blocs personnalisés
- `saveCustomExtension()` / `loadCustomExtensions()` - Gestion des déplacements d'extensions
- `deleteCompleteBlock()` / `deleteCompleteExtension()` - Suppression complète
- `getStorageStats()` - Statistiques de stockage
- **Traitement par batch** : Optimisé pour gros volumes de données
- **Base de données v3** : Stores pour cartes, extensions, blocs, images

#### ImageUploadService (Gestion d'Images)
- `uploadImage()` - Upload et stockage d'images dans IndexedDB
- `getImagesForEntity()` - Récupération d'images par entité (bloc/extension/carte)
- `deleteImage()` - Suppression d'images
- `getStorageStats()` - Statistiques de stockage des images
- **Validation** : Types supportés (JPG, PNG, GIF, WebP) - Maximum 5MB
- **Conversion** : Base64 → Blob URL pour affichage
- **Base de données dédiée** : VaultEstim_Images avec indexation

### Système d'Authentification
- **Authentification** : Mock avec localStorage (clé: `vaultestim_user`)
- **Rôles** : `user`, `admin` - Protection des routes admin
- **États** : `isPremium` pour fonctionnalités premium
- **Hook** : `useAuth()` avec `isAuthenticated`, `isAdmin`, `isPremium`
- **Connexion demo** : N'importe quel email/mot de passe accepté

### Gestion de l'État Global
- **useAuth** : Authentification et profil utilisateur
- **useCollection** : Gestion des cartes de collection
- **useCardDatabase** : Base de données de cartes avec recherche/filtrés et stockage IndexedDB
- **États personnalisés** : customBlocks, customExtensions pour les modifications utilisateur

### Thème et Design
- **Système de couleurs** : CSS Variables avec Tailwind (--primary, --background, etc.)
- **Police principale** : Cinzel (Google Fonts) pour l'élégance
- **Thème** : Sombre avec accents dorés et lueurs
- **Composants** : shadcn/ui avec variantes personnalisées
- **Responsive** : Mobile-first avec breakpoints Tailwind

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
- **Tyradex** : `https://tyradex.vercel.app/api/v1` (Pokémon français)
- **Pokemon TCG** : `https://api.pokemontcg.io/v2` (cartes TCG)
- **Traduction** : Français→Anglais automatique pour recherche cartes

## Démarrage Rapide
```bash
cd vaultestim-v2
npm install --legacy-peer-deps
npm run dev
```

L'application sera accessible sur http://localhost:5174

**Connexion Demo** : Utilisez n'importe quel email/mot de passe ou cliquez sur "Remplir automatiquement"

## Fonctionnalités Avancées Récentes

### 🗃️ Système de Base de Données Locale (IndexedDB)

#### **Architecture**
- **VaultEstimDB v3** : Base principale avec 5 stores
  - `discovered_cards` : Cartes découvertes avec métadonnées
  - `series_database` : Extensions avec informations complètes
  - `custom_blocks` : Blocs créés par l'utilisateur
  - `custom_extensions` : Déplacements d'extensions entre blocs
  - `search_cache` : Cache des recherches pour performance
- **VaultEstim_Images** : Base dédiée aux images
  - `uploaded_images` : Images uploadées avec indexation par entité

#### **Capacités**
- **Stockage illimité** : Plus de limitations de localStorage
- **Traitement par batch** : Optimisé pour milliers de cartes
- **Index performants** : Recherche rapide par nom, type, extension
- **Migration automatique** : Depuis localStorage vers IndexedDB

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

#### **Éditeur de Base de Données**
- **Vue générale** : Onglets Blocs/Extensions/Cartes
- **Vue détail** : Navigation dans la hiérarchie
- **Actions** : Édition, suppression, prévisualisation sur chaque niveau

### 🎨 Améliorations Visuelles

#### **Affichage des Logos**
- **Taille optimisée** : 48x48px avec `object-contain`
- **Fallback** : Icônes par défaut si pas de logo
- **Priorité** : Images uploadées > URLs > icônes par défaut

#### **Indicateurs d'État**
- **Extensions déplacées** : Badge "Déplacé depuis [Bloc]"
- **Dates de bloc** : Affichage start/end dates
- **Statistiques temps réel** : Compteurs mis à jour automatiquement

## Debugging et Maintenance

### 🔍 Outils de Debug
- **Bouton "Debug DB"** : Vérification état IndexedDB vs React
- **Logs détaillés** : Console avec emojis pour traçabilité
- **Statistiques stockage** : Cartes, extensions, images, tailles

### 🔧 Résolution de Problèmes Courants
- **CORS TCG API** : Résolu par proxy Vite
- **Persistence modifications** : Type de bloc correctement détecté
- **Reconstruction données** : useEffect optimisés pour éviter boucles
- **Performance** : Traitement par batch pour gros volumes