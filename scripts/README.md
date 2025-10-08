# 📦 Scripts de Migration de Données

Ce dossier contient tous les scripts nécessaires pour exporter et importer vos données VaultEstim lors du passage de SQLite (développement) vers PostgreSQL (production).

## 🎯 Utilisation rapide

### Export de toutes les données
```bash
npm run db:export
```
Crée `data-export.json` avec toutes vos données + un backup daté dans `backups/`

### Vérification de l'export
```bash
npm run db:verify
```
Vérifie que l'export est valide et complet

### Créer un backup manuel
```bash
npm run db:backup
```
Même chose que `db:export` mais avec un message de confirmation

### Import vers PostgreSQL (production)
```bash
# Définir d'abord l'URL de la base de données
DATABASE_URL=postgresql://user:password@host:5432/database npm run db:import
```

## 📋 Scripts disponibles

### 1. `export-data.js`
**Description:** Exporte toutes les données de SQLite vers JSON

**Utilisation:**
```bash
node scripts/export-data.js
```

**Ce qu'il fait:**
- ✅ Lit toutes les tables de `backend/vaultestim.db`
- ✅ Exporte les données au format JSON
- ✅ Crée `data-export.json` à la racine
- ✅ Crée un backup daté dans `backups/backup-YYYY-MM-DD.json`
- ✅ Affiche des statistiques détaillées

**Sortie:**
```
📊 RÉSUMÉ DE L'EXPORT:
═══════════════════════════════════════
📅 Date: 2025-10-03T23:25:54.157Z
📋 Tables exportées: 5

📈 Statistiques:
   • Utilisateurs: 2
   • Cartes découvertes: 145
   • Séries: 23
   • Blocs personnalisés: 5
   • Extensions personnalisées: 12

💾 Taille du fichier: 342.15 KB
```

### 2. `verify-export.js`
**Description:** Vérifie qu'un export est valide

**Utilisation:**
```bash
node scripts/verify-export.js [fichier-export.json]
```

**Ce qu'il vérifie:**
- ✅ Structure du fichier (métadonnées, tables)
- ✅ Présence de toutes les tables requises
- ✅ Intégrité des données (champs requis)
- ✅ Statistiques et informations du fichier

**Sortie:**
```
✅ EXPORT VALIDE - Prêt pour l'import!
```

### 3. `import-data.js`
**Description:** Importe les données JSON vers PostgreSQL

**Pré-requis:**
```bash
# Installer pg
npm install pg

# Définir DATABASE_URL
export DATABASE_URL=postgresql://user:password@host:5432/database
# OU dans .env
DATABASE_URL=postgresql://...
```

**Utilisation:**
```bash
# Avec le fichier par défaut
node scripts/import-data.js

# Avec un fichier spécifique
node scripts/import-data.js backups/backup-2025-10-03.json
```

**Ce qu'il fait:**
- ✅ Se connecte à PostgreSQL
- ✅ Démarre une transaction
- ✅ Importe toutes les tables dans l'ordre (gère les clés étrangères)
- ✅ Met à jour les séquences (auto-increment)
- ✅ Valide la transaction
- ✅ Affiche les statistiques

**Sortie:**
```
📊 RÉSUMÉ DE L'IMPORT:
═══════════════════════════════════════
✅ Total de lignes importées: 187
   • users: 2 lignes
   • discovered_cards: 145 lignes
   • series_database: 23 lignes
   • custom_blocks: 5 lignes
   • custom_extensions: 12 lignes

🎉 Import terminé avec succès!
```

## 🔒 Sécurité

### Fichiers sensibles
Les fichiers suivants sont automatiquement ignorés par Git (`.gitignore`):
- `data-export.json` - Contient les données exportées
- `backups/*.json` - Contient les backups datés
- `.env` - Contient les mots de passe de base de données

⚠️ **Ne jamais commiter ces fichiers !** Ils contiennent:
- Mots de passe hashés
- Emails des utilisateurs
- Données personnelles

### Bonnes pratiques
1. ✅ Exporter régulièrement (backup automatique)
2. ✅ Garder plusieurs backups datés
3. ✅ Tester la restauration sur une DB de test
4. ✅ Chiffrer les backups avant de les envoyer
5. ✅ Ne jamais partager DATABASE_URL

## 📅 Workflow recommandé

### En développement (maintenant)
```bash
# Chaque semaine, créer un backup
npm run db:backup

# Vérifier qu'il est valide
npm run db:verify
```

### Avant publication sur Google Play

**Étape 1 - Export final**
```bash
npm run db:export
npm run db:verify
```

**Étape 2 - Créer la base PostgreSQL**
1. Créer un compte sur Railway.app
2. Créer un projet PostgreSQL
3. Copier DATABASE_URL

**Étape 3 - Importer les données**
```bash
# Ajouter DATABASE_URL dans .env
echo "DATABASE_URL=postgresql://..." >> .env

# Installer pg
npm install pg

# Import
npm run db:import
```

**Étape 4 - Vérifier**
```bash
# Se connecter à PostgreSQL et vérifier
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM discovered_cards;"
```

### Après publication
```bash
# Backup régulier depuis PostgreSQL
pg_dump $DATABASE_URL > backup-prod-$(date +%Y%m%d).sql
```

## 🆘 Dépannage

### Erreur: "Cannot find module 'better-sqlite3'"
```bash
npm install better-sqlite3 --legacy-peer-deps
```

### Erreur: "Cannot find module 'pg'"
```bash
npm install pg
```

### Erreur: "DATABASE_URL non définie"
```bash
# Linux/Mac
export DATABASE_URL=postgresql://...

# Windows PowerShell
$env:DATABASE_URL="postgresql://..."

# Windows CMD
set DATABASE_URL=postgresql://...
```

### Erreur: "Permission denied" sur PostgreSQL
Vérifier que l'utilisateur a les droits INSERT:
```sql
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO votre_user;
```

### Vérifier l'état de la base
```bash
# SQLite (local)
sqlite3 backend/vaultestim.db "SELECT COUNT(*) FROM users;"

# PostgreSQL (prod)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

## 📊 Structure des données exportées

```json
{
  "metadata": {
    "exported_at": "2025-10-03T23:25:54.157Z",
    "database_path": "/path/to/vaultestim.db",
    "total_tables": 5,
    "version": "1.0.0",
    "statistics": {
      "users": 2,
      "discovered_cards": 145,
      "series_database": 23,
      "custom_blocks": 5,
      "custom_extensions": 12
    }
  },
  "tables": {
    "users": [...],
    "discovered_cards": [...],
    "series_database": [...],
    "custom_blocks": [...],
    "custom_extensions": [...]
  }
}
```

## 🎓 Pour aller plus loin

- [Guide de migration complet](../MIGRATION_GUIDE.md)
- [Railway.app Documentation](https://docs.railway.app)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 💡 Astuces

### Backup automatique quotidien
Créer un script `backup.bat`:
```bash
@echo off
cd F:\Logiciels\Appli Vaultestim\vaultestim-v2
npm run db:backup
echo Backup terminé à %date% %time%
```

Planifier avec Tâches Windows (Task Scheduler) pour exécuter chaque jour.

### Compression des backups
```bash
# Compresser un backup
tar -czf backup-2025-10-03.tar.gz backups/backup-2025-10-03.json

# Décompresser
tar -xzf backup-2025-10-03.tar.gz
```

### Comparer deux exports
```bash
# Voir les différences
node -e "
const a = require('./backups/backup-2025-10-01.json');
const b = require('./backups/backup-2025-10-03.json');
console.log('Nouvelles cartes:', b.metadata.statistics.discovered_cards - a.metadata.statistics.discovered_cards);
"
```

---

✅ **Vos données sont maintenant en sécurité et prêtes pour la migration !**
