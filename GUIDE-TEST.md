# 🧪 Guide de Test - VaultEstim Database

## 🚀 **Démarrage Rapide (5 minutes)**

### **Étape 1: Prérequis**
Assurez-vous d'avoir installé :
- **PostgreSQL** (port 5432)
- **Redis** (port 6379)
- **Node.js 18+**

### **Étape 2: Installation**
```bash
# Dans le dossier vaultestim-v2
cd server
npm install
```

### **Étape 3: Configuration**
Le fichier `.env` est déjà créé avec une configuration de test locale.

### **Étape 4: Setup de la base**
```bash
# Créer la base PostgreSQL (une seule fois)
createdb -U postgres vaultestim_test

# Setup des tables
npm run setup-db
```

### **Étape 5: Démarrer le serveur**
```bash
npm run dev
```
✅ **API disponible sur :** http://localhost:3001

### **Étape 6: Tester l'interface**
1. **Démarrez votre frontend Vite** (port 5174)
2. **Connectez-vous** à votre app
3. **Allez dans** : **Administration > Base de Données**

---

## 📋 **Tests à Effectuer**

### **Test 1: Interface Admin**
✅ Accéder à **Administration > Base de Données**
✅ Vérifier que les **statistiques** s'affichent
✅ Vérifier le **statut de connexion** (vert = OK)

### **Test 2: Recherche**
✅ Aller dans l'onglet **"Recherche"**
✅ Taper **"Pikachu"** dans la barre de recherche
✅ Vérifier l'**autocomplétion**
✅ Voir les **résultats** (même avec peu de données)

### **Test 3: Synchronisation**
✅ Aller dans l'onglet **"Synchronisation"**
✅ Cliquer sur **"Sync Complète"**
✅ Attendre que le processus se termine
✅ Vérifier que les **statistiques** augmentent

### **Test 4: API Direct**
✅ Ouvrir : http://localhost:3001/api/health
✅ Ouvrir : http://localhost:3001/api/stats
✅ Ouvrir : http://localhost:3001/api/cards?q=Pikachu

---

## 🔧 **Tests Manuels Rapides**

### **Test API avec curl:**
```bash
# Health check
curl http://localhost:3001/api/health

# Statistiques
curl http://localhost:3001/api/stats

# Recherche Pikachu
curl "http://localhost:3001/api/cards?q=Pikachu&limit=5"

# Autocomplétion
curl "http://localhost:3001/api/cards/autocomplete?q=pika"
```

### **Test Interface Web:**
Ouvrez `test-frontend.html` dans votre navigateur pour une interface de test complète.

---

## 🐛 **Résolution de Problèmes**

### **Erreur "API non disponible"**
- ✅ Vérifiez que le serveur backend tourne (`npm run dev`)
- ✅ Vérifiez l'URL : http://localhost:3001/api/health

### **Erreur "Base de données"**
- ✅ PostgreSQL est-il démarré ? `pg_isready`
- ✅ La base existe-t-elle ? `psql -U postgres -l | grep vaultestim`

### **Erreur "Redis"**
- ✅ Redis est-il démarré ? `redis-cli ping`

### **Pas de données de cartes**
- ✅ Lancez une synchronisation : Onglet "Sync" > "Sync Complète"
- ✅ Ou via script : `npm run sync`

### **Images ne s'affichent pas**
- ✅ Normal au début, elles se téléchargent progressivement
- ✅ Forcer le cache : `node scripts/sync-database.js images`

---

## 📊 **Résultats Attendus**

### **Après setup initial:**
- Extensions: ~5-10
- Cartes: ~50-100
- Avec Prix: ~0-20
- Interface responsive et fonctionnelle

### **Après sync complète (10-30 min):**
- Extensions: ~200+
- Cartes: ~20,000+
- Avec Prix: ~5,000+
- Images progressivement disponibles

---

## 🎯 **Points Clés à Vérifier**

✅ **Interface intégrée** dans Administration > Base de Données
✅ **Recherche temps réel** avec autocomplétion
✅ **Filtres avancés** (extension, type, rareté)
✅ **Prix des cartes** (quand disponibles)
✅ **Synchronisation** fonctionnelle
✅ **Statistiques** en temps réel
✅ **Performance** correcte (cache Redis)

---

## 📞 **En cas de problème**

1. **Vérifiez les logs** : `tail -f server/logs/server.log`
2. **Redémarrez** les services (PostgreSQL, Redis, serveur)
3. **Re-setup** : `npm run setup-db`
4. **Test simple** : Ouvrez `test-frontend.html`

---

Vous devriez maintenant avoir une base de données complète accessible directement depuis votre interface d'administration ! 🎉