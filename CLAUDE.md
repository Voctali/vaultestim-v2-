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

### 💰 Gestion des Prix
- **Formats** : CardMarket (EUR) + TCGPlayer (USD)
- **Stockage** : JSONB Supabase (`cardmarket`, `tcgplayer`) + IndexedDB
- **Migration** : Outil admin avec barre de progression et reprise intelligente

## Configuration

### Variables d'Environnement
```
VITE_POKEMON_TCG_API_KEY=xxx     # Optionnel
VITE_SUPABASE_URL=xxx            # Requis
VITE_SUPABASE_ANON_KEY=xxx       # Requis
```

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

## ✅ Fonctionnalités Récentes (Janvier 2025)

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

## 🚧 Tâches en Cours

1. **Migration des Attaques** (92.3% complétée - 16,105/17,456 cartes) - Relancer Admin → Migration des attaques pour terminer

## Liens Utiles

- **Production** : https://vaultestim-v2.vercel.app
- **Supabase Dashboard** : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx
- **Repository GitHub** : https://github.com/Voctali/vaultestim-v2-
- **Historique complet** : [CHANGELOG.md](./CHANGELOG.md)

---

**Dernière mise à jour** : 2025-01-11 (v1.9.108)
