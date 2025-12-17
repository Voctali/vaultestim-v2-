# CLAUDE.md

Guide de référence pour Claude Code lors du travail avec le code de ce dépôt.

> **📋 Historique Détaillé** : Voir [CHANGELOG.md](./CHANGELOG.md) pour l'historique complet des fonctionnalités.

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
- **APIs** : Pokemon TCG API + RapidAPI CardMarket
- **Cache** : IndexedDB + Synchronisation delta Supabase

### Structure des Dossiers

```
src/
├── components/ui/              # shadcn/ui de base
├── components/features/        # Composants métier par domaine
├── pages/                      # Pages de l'application
├── hooks/                      # useAuth, useCollection, useCardDatabase
├── services/                   # Services API et métier
├── utils/                      # Traductions et helpers
└── constants/                  # Configuration et navigation
```

### Services Principaux

| Service | Fonction |
|---------|----------|
| `TCGdxService` | Recherche cartes avec traduction FR→EN |
| `SupabaseService` | Stockage cloud + déduplication |
| `CardCacheService` | Cache IndexedDB avec reconnexion auto |
| `HybridPriceService` | RapidAPI → fallback Pokemon TCG API |
| `RapidAPIService` | Prix EUR CardMarket + cartes gradées |
| `QuotaTracker` | Gestion quota RapidAPI (plans Basic/Pro, seuil sécurité, reset 00h20) |
| `CardMarketUrlFixService` | Correction URLs CardMarket |
| `PriceRefreshService` | Actualisation prix (configurable, défaut 1500 cartes/jour) |
| `SealedProductPriceRefreshService` | Actualisation prix produits scellés (configurable, défaut 500/jour) |
| `PokemonTCGAPIService` | Fallback gratuit pour découverte extensions (proxy Vercel) |

## Configuration

### Variables d'Environnement
```
VITE_SUPABASE_URL=xxx            # Requis
VITE_SUPABASE_ANON_KEY=xxx       # Requis
VITE_USE_RAPIDAPI=true           # Activer RapidAPI
VITE_RAPIDAPI_KEY=xxx            # Clé API RapidAPI
VITE_RAPIDAPI_HOST=cardmarket-api-tcg.p.rapidapi.com
VITE_RAPIDAPI_DAILY_QUOTA=100    # Quota quotidien
```

### Alias de Chemins
`@/` → `./src/` pour imports absolus

## Standards de Code

- **Langage** : JavaScript (.jsx), pas TypeScript
- **Interface** : 100% en français
- **Imports** : Toujours utiliser les alias `@/`

## Patterns Importants

### Traductions
- **Pokémon** : `translatePokemonName()` depuis `pokemonTranslations.js` (1060+ noms)
- **Dresseurs** : `translateTrainerName()` depuis `trainerTranslations.js` (313 noms)
- **⚠️ Ajout** : Utiliser `node add-trainer-translation.cjs "fr" "en"`

### Gestion de CACHE_VERSION

Incrémenter `CACHE_VERSION` dans `CardCacheService.js` si :
1. Ajout massif de cartes (>100)
2. Changement structure cache/Supabase
3. Bug de synchronisation

```bash
npm run increment-cache-version  # Incrémente automatiquement
```

## Déploiement

```bash
git add . && git commit -m "Description" && git push github main
# → Vercel déploie automatiquement sur https://vaultestim-v2.vercel.app
```

## Debugging

| Problème | Solution |
|----------|----------|
| 404 API en production | Vérifier `vercel.json` rewrites |
| Session perdue | Hard refresh + reconnecter |
| Prix N/A | Vérifier colonnes JSONB Supabase |
| IndexedDB closing | Retry automatique intégré |

---

## 🛠️ Correction URLs CardMarket (29/11/2025)

### Panneau Admin (v1.27.0)
Interface dans Admin → Éditeur de base de données → Correction URLs CardMarket.

**Fonctionnalités** :
- Sélecteurs Bloc → Extension
- Quota RapidAPI temps réel
- 3 modes de correction :
  - **Sans URL** : Cartes sans lien CardMarket
  - **URLs invalides** : Format `cardmarket.com` (ancien format)
  - **URLs cassées (404)** : URLs `tcggo.com` dont l'ID a changé

**URLs valides** :
- ✅ `tcggo.com/external/cm/{id}?language=2` (seul format valide)
- ❌ `cardmarket.com/...` (tout format direct = invalide, peut rediriger silencieusement)

### Progression (99% terminé)

| Extension | Statut |
|-----------|--------|
| 151, SV1-10, ME1-2 | ✅ 100% |
| Silver Tempest TG | ✅ 100% (corrigé manuellement) |
| SV Promos | ⚠️ 93% (14 non indexées) |

**Promos non indexées** : svp-166, 171, 174, 181-184, 186, 188-189, 203, 206-207, 87

### Script Batch
```bash
node fix-cardmarket-urls-batch.cjs  # 3000 req/exécution
```

### Diagnostic URLs par extension
```javascript
// Lister les cartes avec ancien format cardmarket.com
const { data } = await supabase
  .from('discovered_cards')
  .select('name, number, cardmarket_url')
  .eq('set_id', 'EXTENSION_ID')
  .like('cardmarket_url', '%cardmarket.com%');
```

---

## 🎯 Fonctionnalités Récentes

### v1.28.20 (17/12/2025)
- **Pokemon TCG API comme fallback** : Quand RapidAPI n'est pas disponible, l'application utilise automatiquement l'API Pokemon TCG gratuite
  - Proxy serverless Vercel (`api/pokemontcg.js`) avec timeout 60s
  - Détection dynamique prod/dev via `window.location.hostname`
  - Activé par défaut (désactivable avec `VITE_USE_POKEMON_TCG_API=false`)
  - Rewrite Vercel : `/api/pokemontcg/v2/*` → fonction serverless

### v1.28.10 (06/12/2025)
- **Fix race condition upsert cardmarket_prices** : Correction de l'erreur `duplicate key value violates unique constraint "cardmarket_prices_pkey"` lors de l'actualisation des prix
  - Remplacé le pattern SELECT + INSERT/UPDATE par un upsert atomique avec `onConflict: 'id_product,id_language'`
  - Corrigé dans 3 fonctions : `updateCatalogProductPrice`, `upsertSealedProductsFromRapidAPI`, `_importInBatches`
  - Ajout de `id_language` manquant dans le mapping de `upsertSealedProductsFromRapidAPI`

### v1.28.9 (05/12/2025)
- **Fix badges versions mobile** : Correction du bug où les badges de versions ne se mettaient pas à jour en temps réel sur mobile
  - Utilisation de `EMPTY_INSTANCES` constant au lieu de `[]` pour éviter les problèmes de référence
  - Amélioration de la comparaison memo dans `ExploreCard.jsx` avec vérification de l'ID unique
- **Fix erreur Supabase cardmarket_prices** : Correction de l'erreur `column cardmarket_prices.id does not exist`
  - La table utilise une clé composite `(id_product, id_language)` et non une colonne `id`

### v1.28.5 (01/12/2025)
- **Sélection rapide intelligente** : Le bouton "+" sélectionne automatiquement la première version en double disponible
  - Si pas de "Normale" en double mais "Reverse" → affiche "1x R"
  - Si pas de "Normale" ni "Reverse" mais "Holo" → affiche "1x H"
  - Priorité : Normale > Reverse > Holo > Holo Cosmos > etc.

### v1.28.4 (01/12/2025)
- **Vue détaillée lot** : Affiche uniquement le badge de la version de chaque carte dans le lot (pas toutes les versions de la collection)

### v1.28.3 (01/12/2025)
- **Optimisation onglet Doublons** : Correction des freezes lors de sélections multiples (37+ cartes)
  - Composant `DuplicateCard` mémorisé avec `React.memo` pour éviter re-renders de toutes les cartes
  - `CardVersionBadges` optimisé avec `useMemo` et `React.memo` (suppression `console.log` en prod)
  - `CardImage` optimisé avec `React.memo` et `useCallback`
  - `duplicateCards` mémorisé avec `useMemo` (évite recalcul à chaque render)
  - Handlers `toggleCardSelectionQuick`, `handleCardImageClick`, `handleSellCard` mémorisés avec `useCallback`

### v1.28.2 (01/12/2025)
- **Fix conflit upsert cardmarket_prices** : Remplacé l'upsert par SELECT + UPDATE/INSERT pour éviter l'erreur 409 (conflit entre clé primaire `id` et contrainte UNIQUE `(id_product, id_language)`)

### v1.28.1 (30/11/2025)
- **Fix clic plan RapidAPI** : Le clic sur la carte du plan (Basic/Pro) fonctionne maintenant sur toute la zone

### v1.28.0 (30/11/2025)
- **Limites actualisation configurables** : Champs de saisie dans Admin → Système pour ajuster :
  - Nombre de cartes/jour (défaut: 1500, max: 5000)
  - Nombre de produits scellés/jour (défaut: 500, max: 2000)
- **Fix upsert prix catalogue** : Utilisation de `upsert` au lieu de UPDATE+INSERT pour `cardmarket_prices`
- **Contrainte UNIQUE Supabase** : Ajoutée sur `cardmarket_prices(id_product, id_language)`

### v1.27.0 (29/11/2025)
- **Mode URLs cassées (404)** : Nouveau mode de correction pour détecter les URLs tcggo.com dont l'ID CardMarket a changé
- **Validation URLs stricte** : Seul le format `tcggo.com/external/cm/` est valide, les URLs `cardmarket.com` directes sont invalides
- **Bouton estimation** : "Estimer URLs cassées" échantillonne ~20 cartes via RapidAPI

### v1.26.0 (27/11/2025)
- **Gestion quota RapidAPI automatique** : Nouveau système complet
  - Plans configurables : Basic (100 req) ou Pro (3000 req)
  - Seuil de sécurité configurable (défaut 98%)
  - Désactivation automatique quand seuil atteint → fallback Pokemon TCG API
  - Reset à 00h20 (sync avec RapidAPI ~00h19)
- **RapidAPIQuotaSettings** : Interface Admin → Système
  - Sélection source prix (RapidAPI vs Pokemon TCG API)
  - Sélection plan + slider seuil sécurité
  - Stats quota temps réel avec barre progression
  - Boutons: Synchroniser, Réactiver, Reset debug

### v1.24.3 (27/11/2025)
- **CardMarketDebugPanel** : Refonte complète avec sélecteurs bloc/extension
- **Fix écrasement champs** : `updateCardInCollection()` ne passe plus `...card`
- **Clé consolidation robuste** : Fallback `name-set-number` si `card_id` absent
- **Sync cardmarket_url** : Inclus dans requêtes delta et full

### v1.23.0-v1.23.2 (26/11/2025)
- **Sélection version lots** : Modale choix version/quantité pour doublons
- **Tri extensions Doublons** : Dates et blocs corrigés (rsv/zsv → Scarlet & Violet)
- **Liens CardMarket** : Cache Supabase + `?language=2`

### v1.22.8-v1.22.9 (25/11/2025)
- **Consolidation doublons** : Par `card_id` seul (sans version)
- **Enrichissement >1000** : Pagination batches 500 IDs

### v1.19.x (24/11/2025)
- **Pagination Supabase** : `.range()` pour >1000 cartes
- **Tri collection** : Par `set.id` puis numéro
- **Date majoritaire** : Pour extensions dans Doublons

---

## 🐛 Bugs Connus

### Fusion d'Extensions
**État** : Partiellement résolu (v1.11.3)
**Contournement** : Supprimer manuellement l'extension vide au lieu de fusionner

---

## Liens Utiles

- **Production** : https://vaultestim-v2.vercel.app
- **Supabase** : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx
- **GitHub** : https://github.com/Voctali/vaultestim-v2-

---

**Dernière mise à jour** : 2025-12-17 (v1.28.20)
