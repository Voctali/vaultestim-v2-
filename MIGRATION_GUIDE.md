# Guide de Migration vers Production

Ce guide explique comment migrer VaultEstim de SQLite local vers une base de données cloud pour la publication sur Google Play.

## 📋 Étape 1 : Exporter les données actuelles

### Script d'export SQLite → JSON
```javascript
// scripts/export-data.js
import Database from 'better-sqlite3'
import fs from 'fs'

const db = new Database('backend/vaultestim.db')

const exportData = {
  users: db.prepare('SELECT * FROM users').all(),
  discovered_cards: db.prepare('SELECT * FROM discovered_cards').all(),
  series_database: db.prepare('SELECT * FROM series_database').all(),
  custom_blocks: db.prepare('SELECT * FROM custom_blocks').all(),
  custom_extensions: db.prepare('SELECT * FROM custom_extensions').all(),
  exported_at: new Date().toISOString()
}

fs.writeFileSync('data-export.json', JSON.stringify(exportData, null, 2))
console.log('✅ Données exportées vers data-export.json')
db.close()
```

**Commande :** `node scripts/export-data.js`

## 📋 Étape 2 : Choisir un hébergeur cloud

### Options recommandées (gratuites pour commencer)

#### Option A : Railway.app (Recommandé - Le plus simple)
- ✅ PostgreSQL gratuit (500MB)
- ✅ Déploiement automatique depuis GitHub
- ✅ HTTPS inclus
- ✅ Domaine gratuit fourni

#### Option B : Supabase (Alternative excellent)
- ✅ PostgreSQL + Auth + Storage
- ✅ 500MB gratuit
- ✅ Interface d'administration

#### Option C : PlanetScale (MySQL)
- ✅ MySQL serverless
- ✅ 5GB gratuit
- ✅ Scaling automatique

## 📋 Étape 3 : Adapter le code backend

### Installation des dépendances
```bash
# PostgreSQL
npm install pg

# MySQL
npm install mysql2

# MongoDB
npm install mongodb
```

### Créer un adaptateur de base de données

**backend/db-adapter.js**
```javascript
// Support SQLite (dev) et PostgreSQL (prod)
import Database from 'better-sqlite3'
import pg from 'pg'

const USE_POSTGRES = process.env.DATABASE_URL !== undefined

let db

if (USE_POSTGRES) {
  // Production : PostgreSQL
  const { Pool } = pg
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  // Wrapper pour compatibilité
  db.prepare = (sql) => ({
    all: async (...params) => {
      const result = await db.query(sql, params)
      return result.rows
    },
    get: async (...params) => {
      const result = await db.query(sql + ' LIMIT 1', params)
      return result.rows[0]
    },
    run: async (...params) => {
      return await db.query(sql, params)
    }
  })
} else {
  // Développement : SQLite
  db = new Database('vaultestim.db')
}

export default db
```

### Variables d'environnement

**.env.production**
```env
DATABASE_URL=postgresql://user:password@host:5432/vaultestim
JWT_SECRET=votre_secret_production_super_securise
PORT=3000
NODE_ENV=production
```

## 📋 Étape 4 : Importer les données

### Script d'import JSON → PostgreSQL
```javascript
// scripts/import-data.js
import pg from 'pg'
import fs from 'fs'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
})

const data = JSON.parse(fs.readFileSync('data-export.json', 'utf8'))

async function importData() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Importer users
    for (const user of data.users) {
      await client.query(
        'INSERT INTO users (id, email, password, name, role, isPremium, cardCount, level, createdAt, lastLogin) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [user.id, user.email, user.password, user.name, user.role, user.isPremium, user.cardCount, user.level, user.createdAt, user.lastLogin]
      )
    }

    // Importer discovered_cards
    for (const card of data.discovered_cards) {
      await client.query(
        'INSERT INTO discovered_cards (userId, cardData, discoveredAt) VALUES ($1, $2, $3)',
        [card.userId, card.cardData, card.discoveredAt]
      )
    }

    // ... (même chose pour les autres tables)

    await client.query('COMMIT')
    console.log('✅ Import terminé avec succès')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Erreur import:', error)
  } finally {
    client.release()
    pool.end()
  }
}

importData()
```

## 📋 Étape 5 : Déploiement

### Railway.app (Exemple)

1. **Créer un compte sur Railway.app**
2. **Connecter votre repo GitHub**
3. **Créer un nouveau projet PostgreSQL**
4. **Déployer le backend**
   ```bash
   # Railway détecte automatiquement Node.js
   # Il utilisera le script "start" de package.json
   ```
5. **Configurer les variables d'environnement**
   - Ajouter `DATABASE_URL`, `JWT_SECRET`, etc.
6. **Railway génère une URL HTTPS**
   - Ex: `https://vaultestim-backend.up.railway.app`

### Mettre à jour le frontend

**.env.production**
```env
VITE_API_URL=https://vaultestim-backend.up.railway.app/api
```

## 📋 Étape 6 : Test de migration

### Checklist avant publication
- [ ] Exporter toutes les données SQLite
- [ ] Créer les tables PostgreSQL
- [ ] Importer les données
- [ ] Tester toutes les routes API
- [ ] Vérifier l'authentification
- [ ] Tester sur plusieurs appareils
- [ ] Vérifier les performances
- [ ] Configurer les backups automatiques

## 🔒 Sécurité Production

### Modifications nécessaires
```javascript
// backend/server.js
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://vaultestim.app']
    : '*',
  credentials: true
}))
```

### Certificats SSL
- Railway/Heroku : **Inclus automatiquement**
- Domaine custom : Utiliser Let's Encrypt

## 💾 Sauvegarde continue

### Backup automatique (Railway)
```bash
# Cron job quotidien
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

## 📱 Mise à jour de l'app mobile

### Config pour production
```javascript
// src/config.js
export const API_URL = __DEV__
  ? 'https://192.168.50.137:3000/api'  // Dev local
  : 'https://vaultestim-backend.up.railway.app/api'  // Production
```

## 🎯 Résumé du processus

1. ✅ **Développement** : SQLite local (maintenant)
2. 📤 **Export** : Sauvegarder toutes les données
3. ☁️ **Cloud** : Créer base PostgreSQL
4. 🔄 **Adapter** : Modifier connexion DB
5. 📥 **Import** : Transférer les données
6. 🚀 **Deploy** : Publier sur Railway/Heroku
7. 📱 **Update** : Mettre à jour l'URL API dans l'app
8. ✅ **Test** : Vérifier que tout fonctionne

## ⚠️ Points d'attention

### Différences SQLite vs PostgreSQL
- **AUTO_INCREMENT** → **SERIAL**
- **DATETIME('now')** → **NOW()**
- **INTEGER** pour boolean → **BOOLEAN**
- Transactions : Identiques
- Requêtes préparées : Légèrement différentes ($1, $2 au lieu de ?)

### Coût estimé
- **Gratuit** : Jusqu'à ~1000 utilisateurs (Railway gratuit)
- **$5-20/mois** : 1000-10000 utilisateurs
- **$50+/mois** : 10000+ utilisateurs

## 🎓 Recommandation

**Pour VaultEstim**, je recommande :
1. **Développement** : Continuer avec SQLite (ce que vous faites)
2. **Pré-production** : Migrer vers Railway + PostgreSQL
3. **Production** : Même setup (Railway scale automatiquement)

**Avantages** :
- Migration progressive
- Pas de perte de données
- Coût quasi nul au début
- Scaling automatique si succès

**Timeline suggérée** :
- **Maintenant** : Développer avec SQLite
- **Avant publication** : Export → PostgreSQL
- **Publication** : Backend cloud déjà prêt
- **Post-publication** : Monitoring et optimisation
