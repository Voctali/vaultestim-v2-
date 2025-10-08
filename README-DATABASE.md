# 🎮 VaultEstim v2 - Base de Données Complète

## 🎯 Vue d'ensemble

Système complet de base de données pour cartes Pokémon TCG avec API backend, synchronisation automatique, prix temps réel et interface de recherche avancée.

## 🏗️ Architecture

```
📦 VaultEstim Database System
├── 🗄️ PostgreSQL + Redis
├── 🔄 API Backend (Node.js/Express)
├── 📡 Multi-Source Sync (Pokemon TCG + LimitlessTCG + Tyradex)
├── 💰 Prix Temps Réel
├── 🖼️ Cache Images Optimisé
└── 🔍 Interface Recherche Avancée
```

## 🚀 Installation Rapide

### 1. Prerequisites
```bash
# PostgreSQL
sudo apt install postgresql postgresql-contrib

# Redis
sudo apt install redis-server

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Configuration Base de Données
```bash
# Créer la base PostgreSQL
sudo -u postgres createdb vaultestim

# Créer utilisateur
sudo -u postgres createuser --interactive vaultestim_user
```

### 3. Installation Backend
```bash
cd server
npm install
cp .env.example .env

# Éditer .env avec vos configurations
nano .env
```

### 4. Configuration Initiale
```bash
# Setup base de données
npm run setup-db

# Synchronisation initiale
npm run sync
```

### 5. Démarrage
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📊 Endpoints API

### 🔍 Recherche Cartes
```http
GET /api/cards?q=pikachu&set=sv1&type=Pokemon&page=1&limit=50
GET /api/cards/:id
GET /api/cards/autocomplete?q=draca
```

### 📦 Extensions
```http
GET /api/sets
GET /api/sets/:id
GET /api/sets/:id/cards
GET /api/sets/series
```

### 💰 Prix
```http
GET /api/prices/:cardId
GET /api/prices/trending
GET /api/prices/expensive
POST /api/prices/:cardId
```

### 📈 Statistiques
```http
GET /api/stats
GET /api/stats/sets
GET /api/stats/sync
```

### 🔄 Synchronisation
```http
POST /api/sync/full
POST /api/sync/sets
POST /api/sync/prices
GET /api/sync/status
```

## 🔧 Configuration

### Variables d'Environnement
```bash
# Base de données
DATABASE_URL=postgresql://user:pass@localhost:5432/vaultestim
REDIS_URL=redis://localhost:6379

# APIs externes
POKEMON_TCG_API_KEY=your_key_here
TCGPLAYER_API_KEY=your_key_here

# Serveur
PORT=3001
NODE_ENV=development
JWT_SECRET=your_secret

# Images
IMAGES_PATH=./public/images
IMAGES_BASE_URL=http://localhost:3001/images

# Sync
SYNC_ENABLED=true
SYNC_INTERVAL_HOURS=24
```

### Limites de Taux
```bash
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # 100 requêtes/15min
```

## 🎯 Fonctionnalités

### ✅ Recherche Avancée
- **Recherche textuelle** : Noms français/anglais
- **Filtres** : Extension, type, rareté, éléments
- **Autocomplétion** : Suggestions en temps réel
- **Pagination** : Chargement par lots
- **Tri** : Nom, rareté, prix, date

### ✅ Prix Temps Réel
- **Sources multiples** : TCGPlayer, Cardmarket, LimitlessTCG
- **Historique** : Évolution des prix
- **Tendances** : Cartes en hausse/baisse
- **Top cartes** : Plus chères, plus recherchées

### ✅ Synchronisation Auto
- **Sync quotidienne** : Nouvelles cartes et prix
- **Multi-sources** : Agrégation intelligente
- **Cache optimisé** : Images WebP compressées
- **Recovery** : Gestion erreurs et fallbacks

### ✅ Interface Moderne
- **Mode grille/liste** : Affichage flexible
- **Images optimisées** : WebP + lazy loading
- **Détails complets** : Modal avec toutes infos
- **Responsive** : Mobile-first design

## 📈 Performances

### Cache Strategy
```javascript
// Redis Cache Layers
- Recherches: 5 minutes
- Cartes: 30 minutes
- Extensions: 1 heure
- Statistiques: 30 minutes
- Prix: 10 minutes
```

### Optimisations Images
```javascript
// Sharp Processing
- Format: WebP (85% qualité)
- Taille: 400x558px max
- Compression: Automatique
- Cache local: Permanent
```

### Database Indexing
```sql
-- Index principaux
CREATE INDEX idx_cards_search ON cards USING gin(to_tsvector('french', name));
CREATE INDEX idx_cards_name ON cards(name);
CREATE INDEX idx_cards_set ON cards(set_id);
CREATE INDEX idx_prices_recent ON card_prices(card_id, recorded_at DESC);
```

## 🔄 Synchronisation

### Sources de Données
1. **Pokemon TCG API** - Source principale officielle
2. **LimitlessTCG** - Données françaises + prix alternatifs
3. **Tyradex** - Traductions françaises des noms

### Processus Sync
```bash
# Sync complète manuelle
node scripts/sync-database.js full

# Sync spécifique
node scripts/sync-database.js sets
node scripts/sync-database.js cards
node scripts/sync-database.js prices
node scripts/sync-database.js images
```

### Programmation Auto
```javascript
// Cron Jobs
- Sync complète: Quotidienne à 2h
- Sync prix: Toutes les 6h
- Nettoyage cache: Hebdomadaire
```

## 📊 Schema Base de Données

### Tables Principales
- **sets** - Extensions/Blocs
- **cards** - Cartes individuelles
- **card_prices** - Historique prix
- **card_images** - Cache images local
- **user_collections** - Collections utilisateurs

### Relations
```sql
sets (1) ←→ (n) cards
cards (1) ←→ (n) card_prices
cards (1) ←→ (n) card_images
cards (1) ←→ (n) user_collections
```

## 🛠️ Maintenance

### Monitoring
```bash
# Santé API
curl http://localhost:3001/api/health

# Statistiques
curl http://localhost:3001/api/stats

# Statut sync
curl http://localhost:3001/api/sync/status
```

### Logs
```bash
# Logs serveur
tail -f logs/server.log

# Logs sync
tail -f logs/sync.log

# Logs erreurs
tail -f logs/error.log
```

### Backup
```bash
# Backup PostgreSQL
pg_dump vaultestim > backup_$(date +%Y%m%d).sql

# Backup images
tar -czf images_backup_$(date +%Y%m%d).tar.gz public/images/
```

## 🎮 Intégration Frontend

### Service Client
```javascript
import { DatabaseService } from '@/services/DatabaseService'

// Recherche
const results = await DatabaseService.searchCards({
  query: 'Dracaufeu',
  setId: 'sv1',
  type: 'Pokemon',
  page: 1,
  limit: 50
})

// Autocomplétion
const suggestions = await DatabaseService.getAutocompleteSuggestions('pika')

// Prix
const prices = await DatabaseService.getCardPrices('sv1-25')
```

### Composants React
```jsx
import { DatabaseSearch } from '@/components/features/database/DatabaseSearch'
import { DatabaseCard } from '@/components/features/database/DatabaseCard'

// Page de recherche complète
<DatabaseSearch />

// Carte individuelle
<DatabaseCard card={cardData} viewMode="grid" />
```

## 🔐 Sécurité

### API Protection
- **Rate Limiting** : 100 req/15min par IP
- **CORS** : Origins autorisés uniquement
- **Helmet** : Headers sécurisés
- **Validation** : Inputs sanitisés

### Database Security
- **Requêtes préparées** : Protection SQL injection
- **Connexions limitées** : Pool connections
- **SSL** : Chiffrement en production

## 📞 Support

### Problèmes Courants

**Erreur connexion DB:**
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Vérifier Redis
redis-cli ping
```

**Sync qui échoue:**
```bash
# Vérifier logs
tail -f logs/sync.log

# Relancer manuellement
npm run sync
```

**Images manquantes:**
```bash
# Re-cache images
node scripts/sync-database.js images
```

### Performance Issues
```bash
# Nettoyer cache Redis
redis-cli FLUSHALL

# Analyser requêtes lentes
tail -f logs/slow-queries.log

# Réindexer base
npm run reindex
```

---

## 🎉 Vous avez maintenant une base de données complète !

✅ **40,000+ cartes** avec images et prix
✅ **Recherche instantanée** avec autocomplétion
✅ **Prix temps réel** depuis multiples sources
✅ **Sync automatique** quotidienne
✅ **API REST complète** pour votre frontend
✅ **Cache optimisé** pour performances

**URL API:** http://localhost:3001/api
**Documentation:** http://localhost:3001/api/docs
**Monitoring:** http://localhost:3001/api/health