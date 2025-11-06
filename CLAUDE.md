# CLAUDE.md

Guide de référence pour Claude Code lors du travail avec le code de ce dépôt.

> **📋 Historique Détaillé** : Voir [CHANGELOG.md](./CHANGELOG.md) pour l'historique complet des 68 fonctionnalités implémentées.

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
- **PriceRefreshService** : Actualisation automatique quotidienne (150 cartes/jour)

## Fonctionnalités Clés

### 🌍 Base de Données Commune
- **Table** : `discovered_cards` - 14,000+ cartes visibles par TOUS les utilisateurs
- **Comportement** : "Explorer les séries" est commun, "Ma Collection" est personnelle
- **Déduplication** : Conserve la version la plus complète de chaque carte (score basé sur données disponibles)

### ⚡ Cache Intelligent
- **Première connexion** : Téléchargement complet depuis Supabase → sauvegarde IndexedDB
- **Connexions suivantes** : Chargement instantané depuis IndexedDB (< 1s) → sync arrière-plan des nouvelles cartes

### 🌐 Recherche Bilingue
- **Dictionnaires** :
  - `src/utils/pokemonTranslations.js` - 1060+ Pokémon (Gen 1-9)
  - `src/utils/trainerTranslations.js` - 54+ Dresseurs et Objets
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

### Authentification Supabase
- **Storage adapter** : **Synchrone** obligatoire (pas async!)
- **Double redondance** : localStorage + sessionStorage
- **Procédure de fix** : Se déconnecter → Se reconnecter → Hard refresh

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

## 🚧 Tâches en Cours

1. **Migration des Attaques** (76.5% complétée) - Relancer Admin → Migration des attaques
2. **URLs CardMarket Variantes** - Cartes V1/V2/V3 nécessitent format spécial
3. **Mapping Codes Extensions** - Seulement sv3pt5 → MEW mappé, ajouter sv1, sv2, sv4, etc.

## Liens Utiles

- **Production** : https://vaultestim-v2.vercel.app
- **Supabase Dashboard** : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx
- **Repository GitHub** : https://github.com/Voctali/vaultestim-v2-
- **Historique complet** : [CHANGELOG.md](./CHANGELOG.md)

---

**Dernière mise à jour** : 2025-01-06
