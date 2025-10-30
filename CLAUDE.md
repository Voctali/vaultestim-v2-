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
41. **🔄 Rollback Proxy API** - Retour au rewrite direct suite problème Serverless Function
   - **Problème initial** : Tentative d'utiliser Serverless Function pour meilleur contrôle (timeout 60s, logs)
   - **Problème découvert** : Rewrite catch-all `/(.*) → /index.html` capturait les requêtes API
   - **Symptôme** : API retournait HTML au lieu de JSON (`Status 200` mais `<!doctype`)
   - **Solution** : Retour au rewrite direct vers `https://api.pokemontcg.io`
   - **Fichiers** :
     - `vercel.json` : Rewrite direct `/api/pokemontcg/*` remis en place
     - `api/pokemontcg/[...path].js` : Supprimé (non utilisé avec rewrite direct)
   - **Note** : Les Serverless Functions Vercel ne fonctionnent pas comme prévu avec notre config
42. **🧹 Nettoyage Doublons Traductions** - Correction 9 doublons/erreurs dans dictionnaire Pokémon
   - **Problème** : Doublons écrasaient bonnes traductions (même bug que denticrisse)
   - **Corrections appliquées** :
     - ✅ `coléodôme` → `dottler` (suppression doublon `iron bundle` erroné) + variante sans accents
     - ✅ `sucroquin` → `swirlix` (suppression doublon `espurr` erroné, déjà `psystigri`)
     - ✅ `hotte-de-fer` → `iron bundle` (Pokémon Paradoxe, pas coléodôme)
     - ✅ `garde-de-fer` → `iron hands` (Pokémon Paradoxe, pas carmadura)
     - ✅ `chien-volant` → `walking wake` (Pokémon Paradoxe DLC, pas pohm)
     - ✅ `hurle-queue` → `iron leaves` (Pokémon Paradoxe DLC, pas poltchageist)
     - ✅ `poltchageist` et `sinistcha` → noms corrects
     - ✅ `flotajou` → doublon supprimé (ligne 964, original ligne 545 OK)
   - **Fichier** : `src/utils/pokemonTranslations.js` - 9 corrections
   - **Impact** : Recherches Pokémon Gen 8-9 + Paradoxe maintenant correctes
43. **➕ Ajout Traduction Manquante** - Dunaconda (Sandaconda) Gen 8
   - **Problème signalé** : "Dunaconda n'est pas traduit en sandaconda"
   - **Solution** : Ajout `'dunaconda': 'sandaconda'` dans section Gen 8
   - **Note** : `dunaja` (Silicobra) existait déjà ligne 911
   - **Fichier** : `src/utils/pokemonTranslations.js` ligne 880
   - **Impact** : Recherche "dunaconda" trouve maintenant Sandaconda
44. **➕ Ajout Traduction Manquante** - Nigosier (Cramorant) Gen 8
   - **Problème signalé** : "Nigosier n'est pas traduit en Cramorant"
   - **Solution** : Ajout `'nigosier': 'cramorant'` dans section Gen 8
   - **Placement** : Après dunaconda (#844), avant khélocrok (#846)
   - **Fichier** : `src/utils/pokemonTranslations.js` ligne 881
   - **Impact** : Recherche "nigosier" trouve maintenant Cramorant (#845)
45. **➕ Ajout Ligne Évolutive** - Embrochet/Hastacuda (Arrokuda/Barraskewda) Gen 8
   - **Problème signalé** : "Embrochet n'est pas traduit en Arrokuda"
   - **Solution** : Ajout ligne évolutive complète
     - `'embrochet': 'arrokuda'` (ligne 882)
     - `'hastacuda': 'barraskewda'` (ligne 883) - ⚠️ Corrigé : était "barracuda" par erreur
   - **Placement** : Après nigosier (#845), avant khélocrok (#833)
   - **Fichier** : `src/utils/pokemonTranslations.js` lignes 882-883
   - **Impact** : Recherches "embrochet" (#846) et "hastacuda" (#847) trouvent maintenant Arrokuda et Barraskewda
46. **➕ Correction Traduction** - Pêchaminus (Pecharunt) Gen 9
   - **Problème signalé** : "Pêchaminus n'est pas traduit en pecharunt"
   - **Cause** : Traduction incorrecte `'pêchaminusmo': 'pecharunt'` (avec "mo" à la fin)
   - **Solution** : Correction du nom français correct + ajout variante sans accent
     - `'pêchaminus': 'pecharunt'` (nom officiel français)
     - `'pechaminus': 'pecharunt'` (variante sans accent)
   - **Fichier** : `src/utils/pokemonTranslations.js` lignes 1090-1091
   - **Impact** : Recherche "pêchaminus" trouve maintenant Pecharunt
47. **📚 Extension Massive Dictionnaire Traductions** - Ajout de 75+ traductions Gen 8-9 et corrections
   - **Traductions Gen 8 ajoutées** (#848-#905) :
     - Toxel/Toxtricity (#848-849): toxizap, salarsen
     - Sizzlipede/Centiskorch (#850-851): grillepattes, scolocendre
     - Clobbopus/Grapploct (#852-853): poulpaf, krakos
     - Sinistea/Polteageist (#854-855): théffroi, polthégeist
     - Hatenna line (#856-858): bibichut, chapotus, sorcilence
     - Impidimp line (#859-861): grimalin, fourbelin, angoliath
     - Formes Galar (#862-867): ixon → galarian obstagoon, berserkatt → galarian perrserker, corayôme → galarian cursola, palarticho → galarian sirfetch'd, m. glaquette → galarian mr. rime, tutétékri → galarian runerigus
     - Alcremie line (#868-869): crèmy, charmilly
     - Divers (#870-884): balinks, wimessir, charibari, pachyradjah, galvagon, galvagla, etc.
     - Dreepy line (#885-887): fantyrm, dispareptil, lanssorien
     - Legends Arceus (#899-905): cerbyllin, hachécateur, ursaking, paragruel, farfurex, qwilpik, amovénus
   - **Corrections Gen 9** (~25 erreurs de mapping) :
     - terracool/terracruel: toedscool/toedscruel (étaient wiglett/wugtrio ❌)
     - flotillon: flittle (était orthworm ❌)
     - ferdeter: orthworm (était iron treads ❌)
     - flamenroule: flamigo (était clodsire ❌)
     - toutombe: greavard (était farigiraf ❌)
     - deusolourdo: dudunsparce (était hurlurave ❌)
     - + 15 autres corrections critiques
   - **Traductions Gen 9 ajoutées** :
     - Formes complètes: forgella, forgelina, tomberro, piétacé, balbalèze, délestin, etc.
     - Pokémon Paradoxes: fort-ivoire, hurle-queue, fongus-furie, flotte-mèche, rampe-ailes, pelage-sablé, roue-de-fer, paume-de-fer, têtes-de-fer, mite-de-fer, épine-de-fer
     - Trésors Catastrophes: chongjian, baojian, dinglu, yuyu
     - DLC Teal Mask & Indigo Disk: serpente-eau, vert-de-fer, pomdramour, théffroyable, félicanis, fortusimia, favianos, pondralugon, pomdorochi, feu-perçant, ire-foudre, roc-de-fer, chef-de-fer, pêchaminus
   - **Résultat** :
     - **1060 traductions uniques** (vs ~985 avant)
     - **0 doublons détectés** (vérification script Python)
     - **Couverture complète** Gen 1-9 incluant tous les DLC
   - **Fichier** : `src/utils/pokemonTranslations.js`
   - **Impact** : Toutes les recherches Pokémon Gen 8-9 fonctionnent désormais correctement
48. **🔧 Correction Formes Galar Exclusives** - Ajout préfixe "galarian" pour 6 Pokémon
   - **Problème identifié** : Recherches "berserkatt", "ixon", "corayôme", etc. ne trouvaient AUCUNE carte
   - **Cause racine** :
     - L'API Pokemon TCG utilise le préfixe "Galarian" pour toutes les cartes de ces Pokémon
     - Exemple : "**Galarian** Perrserker" et NON "Perrserker"
     - La recherche wildcard `name:perrserker*` ne matche PAS "Galarian Perrserker" (préfixe avant)
   - **Solution appliquée** : Ajout du préfixe "galarian " dans les traductions de 6 formes Galar exclusives :
     1. `'ixon'` : obstagoon → **galarian obstagoon** (#862)
     2. `'berserkatt'` : perrserker → **galarian perrserker** (#863)
     3. `'corayôme'` : cursola → **galarian cursola** (#864)
     4. `'palarticho'` : sirfetch'd → **galarian sirfetch'd** (#865)
     5. `'m. glaquette'` : mr. rime → **galarian mr. rime** (#866)
     6. `'tutétékri'` : runerigus → **galarian runerigus** (#867)
   - **Vérification** : Bulbapedia confirme que **TOUTES** les cartes TCG de ces 6 Pokémon utilisent le préfixe "Galarian" sans exception
   - **Impact** : Les recherches françaises trouvent maintenant correctement les cartes Galar (ex: "berserkatt" → "galarian perrserker" → cartes trouvées ✅)
   - **Fichier** : `src/utils/pokemonTranslations.js` lignes 898-903
49. **🔧 Correction Critique IndexedDB** - Reconnexion automatique et système de retry
   - **Problème identifié** : Erreurs répétées `InvalidStateError: The database connection is closing.`
   - **Symptômes** :
     - Cache IndexedDB ne se met pas à jour (sauvegarde échoue)
     - Cartes sauvegardées dans Supabase ✅ mais pas en local ❌
     - Chargement lent à chaque reconnexion (pas de cache)
     - Erreurs sporadiques de connexion fermée de manière inattendue
   - **Causes racines** :
     - Transactions concurrentes sur connexion fermée
     - Pas de vérification de validité de connexion
     - Problèmes multi-onglets (changements de version)
     - Navigateur ferme la connexion pour économiser ressources
     - Aucun système de retry en cas d'échec
   - **Corrections appliquées** :
     - ✅ Ajout méthode `isConnectionValid()` : Vérifie si connexion DB est vivante
     - ✅ Reconnexion automatique dans `initDB()` : Détecte et réinitialise connexion fermée
     - ✅ Event handlers lifecycle : `onclose`, `onversionchange` pour détecter fermetures
     - ✅ Protection concurrence : Flag `isInitializing` empêche initialisations multiples simultanées
     - ✅ Handler `onblocked` : Gestion des connexions bloquées (multi-onglets)
     - ✅ **Système de retry avec backoff exponentiel** :
       - Méthode `withRetry(operation, maxRetries = 3)` : Wrapper générique pour toutes transactions
       - Détection erreurs connexion (`InvalidStateError`, message "closing")
       - Backoff exponentiel : Attente de 100ms, 200ms, 300ms entre tentatives
       - Réinitialisation connexion automatique avant chaque retry
       - 3 tentatives maximum avant échec définitif
     - ✅ Application du retry sur **toutes** les méthodes de transaction :
       - `getAllCards()` : Lecture cache avec retry
       - `saveCards()` : Sauvegarde batch avec retry
       - `deleteCard()` : Suppression avec retry
       - `clearCache()` : Vidage cache avec retry
       - `getMetadata()` : Lecture métadonnées avec retry
       - `setMetadata()` : Sauvegarde métadonnées avec retry
       - `getCacheStats()` : Statistiques avec retry
   - **Impact** :
     - Cache IndexedDB fiable même en cas de fermeture inattendue
     - Meilleure gestion multi-onglets sans conflits
     - Performance optimale grâce au cache local fonctionnel
     - Fallback Supabase si échec après tous les retries
     - Logs détaillés pour debugging (`⚠️ Tentative X/3 échouée, reconnexion...`)
   - **Fichier** : `src/services/CardCacheService.js` - Refactoring complet
   - **Commit** : `e6044d1` - "fix: Correction critique IndexedDB - reconnexion automatique et retry"
50. **🌐 Fix Proxy API Vercel (404 → 200)** - Correction du catch-all capturant les routes API
   - **Problème identifié** : Toutes les requêtes API retournaient **404 Not Found** en production
   - **Symptômes** :
     - `GET /api/pokemontcg/v2/cards 404 (Not Found)`
     - Recherches Pokémon impossibles (ex: "Coiffeton" → "quaxly" ✅ traduit mais API inaccessible)
     - Messages "API Pokemon TCG indisponible" alors que l'API fonctionne
     - Traductions correctes mais aucune carte trouvée
   - **Cause racine** : Configuration `vercel.json` incorrecte
     - Le rewrite catch-all `"/(.*)" → "/index.html"` (ligne 11) capturait **TOUTES les routes**
     - Y compris `/api/pokemontcg/*` **avant** que le proxy API (ligne 7) ne soit appliqué
     - Résultat : Vercel redirige `/api/pokemontcg/v2/cards` → `/index.html` (HTML au lieu de JSON)
   - **Problème historique** : Documenté dans entrée #41 mais jamais résolu correctement
   - **Corrections appliquées** :
     - ✅ **Syntaxe moderne rewrites** : `:path*` au lieu de `(.*)`
       ```json
       "source": "/api/pokemontcg/:path*",
       "destination": "https://api.pokemontcg.io/:path*"
       ```
     - ✅ **Negative lookahead regex** : `(?!api)` exclut `/api/*` du catch-all SPA
       ```json
       "source": "/:path((?!api).*)",
       "destination": "/index.html"
       ```
     - ✅ Suppression de la section `routes` (conflit potentiel avec `rewrites`)
   - **Comportement après fix** :
     - `/api/pokemontcg/v2/cards?q=name:quaxly` → Proxy vers `https://api.pokemontcg.io/v2/cards?q=name:quaxly` ✅
     - `/explorer`, `/collection`, etc. → Redirige vers `/index.html` (SPA React) ✅
     - `/api/*` (autres routes API) → Non capturées par le catch-all ✅
   - **Vérification de la fix** :
     - Status Code : 404 → **200 OK**
     - Content-Type : `text/html` → **`application/json`**
     - Réponse : HTML (`<!doctype`) → **JSON valide** (`{"data": [...]}`)
   - **Impact** :
     - Recherches Pokémon fonctionnent maintenant en production ! 🎉
     - "Coiffeton" → "quaxly" → Cartes Quaxly trouvées ✅
     - "Matourgeon" → "floragato" → Cartes Floragato trouvées ✅
     - Toutes les traductions françaises opérationnelles
   - **Fichier** : `vercel.json` lignes 7-12
   - **Commit** : `d94e93d` - "fix: Correction critique proxy API Vercel (404 → 200)"
   - **Note** : Ce fix résout définitivement le problème signalé dans l'entrée #41
51. **🎴 Enrichissement Traductions Dresseurs** - Ajout de 11 nouvelles traductions françaises de cartes Trainer/Supporter
   - **Traductions Paldea ajoutées** (Gen 9 - Scarlet & Violet) :
     - `hassa` → `hassel` : Membre du Conseil des 4 (Type Dragon) - Twilight Masquerade
     - `irido` → `drayton` : Membre du Conseil des 4 Académie Myrtille - Surging Sparks
     - `kassis` → `kieran` : Rival de l'extension Teal Mask
   - **Traductions Hisui ajoutées** (Legends: Arceus) :
     - `nacchara` → `irida` : Cheffe du Clan Perle - Astral Radiance
   - **Traductions Unova ajoutées** (Gen 5) :
     - `clown` → `harlequin` : Classe de Dresseur - White Flare
     - `ludvina` → `hilda` : Protagoniste de Pokémon Noir et Blanc
   - **Cartes Supporter générales** :
     - `guide d'exploration` → `explorer's guidance` : Temporal Forces (⭐ carte demandée)
     - `guide d exploration` → `explorer's guidance` : Variante sans apostrophe
     - `juge` → `judge` : Carte Supporter classique avec multiples rééditions
     - `intendant` → `caretaker` : Carte Supporter
   - **Organisation améliorée** :
     - Nouvelle section "CARTES SUPPORTER GÉNÉRALES" au lieu de "AUTRES DRESSEURS"
     - Regroupement géographique par région (Paldea, Hisui, Unova)
     - Commentaires détaillés avec nom d'extension TCG
   - **Impact** :
     - Recherches françaises de cartes Dresseur maintenant fonctionnelles
     - Support complet Scarlet & Violet (Gen 9)
     - Meilleure organisation pour maintenance future
   - **Fichier** : `src/utils/trainerTranslations.js` - 11 nouvelles entrées
   - **Total traductions** : ~28 traductions de cartes Dresseur + ~10 objets
52. **📦 Système d'Import Automatique d'Extensions** - Import en masse de toutes les cartes d'une extension en un clic
   - **Problème initial** : Nécessité de rechercher manuellement chaque carte pour peupler "Explorer les séries"
   - **Solution implémentée** :
     - **SetImportService** : Service d'import automatique depuis l'API Pokemon TCG
       - `getAllSets()` : Liste toutes les extensions disponibles (triées par date)
       - `importSetCards(setId)` : Import complet d'une extension avec pagination
       - `getSetInfo(setId)` : Récupère les détails d'une extension
       - Support AbortSignal pour annulation en cours d'import
       - Pagination automatique (max 250 cartes/page)
     - **SetImportPanel** : Interface Admin complète et intuitive
       - Select avec liste de toutes les extensions (~100+ extensions)
       - Filtre par série (Scarlet & Violet, Sword & Shield, Sun & Moon, etc.)
       - Affichage des infos de l'extension (nom, série, nombre de cartes, date de sortie)
       - Logo de l'extension si disponible
       - Barre de progression temps réel pendant l'import
       - Bouton "Annuler" pour stopper l'import en cours
       - Messages de statut détaillés (succès/erreur/annulé)
       - Avertissement pour ne pas quitter pendant l'import
       - Badge "Extension à venir" pour les sorties futures
     - **Intégration AdminDatabaseEditor** : Nouveau panneau dans Admin → Base de Données
   - **Fonctionnement** :
     1. Admin sélectionne une extension dans la liste déroulante
     2. Affichage des infos de l'extension (ex: "Paldean Fates - 193 cartes")
     3. Clic sur "Importer l'extension"
     4. Import automatique de toutes les cartes (60-200+ cartes en 5-10 secondes)
     5. Ajout dans `discovered_cards` (base commune visible par tous)
     6. Mise à jour de `seriesDatabase` (organisation par extensions)
   - **Cas d'usage typique** :
     - Extension à venir "ME02 Flammes Fantasmagoriques" (sortie 14 novembre)
     - Admin ouvre Admin → Base de Données → Import Automatique d'Extension
     - Sélectionne "ME02" dans la liste (dès que l'API a les données)
     - Un clic → Toutes les cartes importées et disponibles dans "Explorer les séries"
   - **Avantages** :
     - ✅ **Gain de temps massif** : Un clic au lieu de 50+ recherches manuelles
     - ✅ **Exhaustif** : Garantit que TOUTES les cartes sont importées
     - ✅ **Partagé** : Base commune → tous les utilisateurs en profitent
     - ✅ **Préparation** : Import possible avant sortie officielle (si API a les données)
     - ✅ **Flexible** : Importe n'importe quelle extension (ancienne ou nouvelle)
   - **Traduction ajoutée** : `sac de menzi` → `nemona's backpack` (Paldean Fates)
   - **Fichiers créés** :
     - `src/services/SetImportService.js` (210 lignes)
     - `src/components/features/admin/SetImportPanel.jsx` (330 lignes)
   - **Impact** : Import d'extensions nouvellement sorties en quelques secondes au lieu de plusieurs heures de recherches manuelles

53. **🔍 Fix Recherche Dresseurs - Word Boundary** - Recherche par mot complet pour éviter faux positifs
   - **Problème signalé** : Recherche de "nèflie" retourne 23 cartes non pertinentes (cartes "Erika" au lieu de "Eri")
   - **Exemple du bug** :
     - Utilisateur recherche "nèflie" (Boss Team Star Combat - Paldea)
     - Traduction : `'nèflie': 'eri'`
     - Recherche API : `name:eri*` (wildcard) → retourne 42 cartes
     - Résultats affichés : 23-42 cartes incluant "**Eri**ka" (faux positifs) au lieu de seulement "**Eri**" (correct)
   - **Cause racine** :
     - Filtrage local avec `.includes()` dans 4 fichiers
     - `cardNameLower.includes('eri')` matche "**Eri**" ✅ ET "**Eri**ka" ❌
     - Confusion entre deux personnages distincts :
       - **Eri** (Nèflie) = Boss Team Star Combat de Paldea (Gen 9) - 4 cartes
       - **Erika** = Championne d'arène de Céladopole (Gen 1) - 30+ cartes
   - **Tests API effectués** :
     - Recherche wildcard `name:eri*` → 42 cartes (Eri + Erika)
     - Recherche exacte `name:"eri"` → 4 cartes (seulement Eri) ✅
   - **Solution implémentée** : Recherche par **mot complet** avec word boundaries
     ```javascript
     // AVANT (ligne 169 dans Explore.jsx)
     const matchesTranslated = translatedSearch !== searchLower &&
       cardNameLower.includes(translatedSearch)

     // APRÈS - Recherche par mot complet
     const matchesTranslated = translatedSearch !== searchLower && (
       cardNameLower === translatedSearch ||                    // Exact match: "eri"
       cardNameLower.startsWith(translatedSearch + ' ') ||      // Début: "eri sv5-146"
       cardNameLower.includes(' ' + translatedSearch + ' ') ||  // Milieu: "supporter eri sv5"
       cardNameLower.endsWith(' ' + translatedSearch)           // Fin: "trainer eri"
     )
     ```
   - **Fichiers modifiés** :
     - `src/pages/Explore.jsx` (ligne 169)
     - `src/pages/Collection.jsx` (ligne 70)
     - `src/pages/Favorites.jsx` (ligne 100)
     - `src/pages/Duplicates.jsx` (ligne 59)
   - **Impact** :
     - ✅ "nèflie" → trouve maintenant 4 cartes "Eri" (correct)
     - ✅ "nèflie" → ne matche PLUS les 23 cartes "Erika" (faux positifs éliminés)
     - ✅ Fix appliqué à toutes les pages de recherche (cohérence globale)
     - ✅ Évite les faux positifs pour tous les noms courts de dresseurs (ex: "eri", "mela", "iono")
   - **Commit** : `[hash]` - "fix: Recherche Dresseurs par mot complet - évite faux positifs (eri ≠ Erika)"

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
- **❌ RÉSOLU - Erreur 400 pour wildcard avec espaces** : Recherches de cartes avec espaces ("quaquaval ex") généraient Bad Request lors de la recherche wildcard
  - **Symptôme** : `GET /api/pokemontcg/v2/cards?q=name:quaquaval%20ex*&pageSize=100 400 (Bad Request)`
  - **Cause** : La syntaxe wildcard avec espaces `name:quaquaval ex*` est invalide pour l'API Pokemon TCG
  - **Solution** : Ajouter condition `&& !translatedQuery.includes(' ')` pour skipper wildcard si nom contient un espace
  - **Fichier** : `src/services/TCGdxService.js` ligne 154
  - **Comportement** : Pour noms avec espaces, utilise uniquement la recherche exacte (avec guillemets)

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