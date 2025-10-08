# 🚀 Migration vers Supabase - VaultEstim v2

## Guide complet de migration multi-appareils

Ce guide vous accompagne pour migrer vos **8515 cartes** et **162 extensions** vers Supabase pour une synchronisation multi-appareils.

---

## ✅ Prérequis (DÉJÀ FAIT)

- [x] Projet Supabase créé
- [x] Schéma SQL exécuté
- [x] Variables d'environnement configurées
- [x] Services Supabase créés
- [x] Hooks mis à jour

**Tout est prêt !** Il ne reste plus qu'à lancer la migration.

---

## 📋 Étapes de migration

### 1. Créer un compte utilisateur dans Supabase

Avant de migrer, vous devez créer votre compte utilisateur :

```bash
# Démarrer l'application
npm run dev
```

**Option A : Utiliser la page de migration (RECOMMANDÉ)**

1. Allez sur http://localhost:5174
2. Créez un nouveau compte avec votre email
3. Supabase Auth créera automatiquement votre profil

**Option B : Console Supabase directement**

Vous pouvez aussi vous inscrire directement depuis l'interface Supabase.

---

### 2. Accéder à la page de migration

**Méthode 1 : URL directe**
```
http://localhost:5174/migrate-supabase
```

**Méthode 2 : Console navigateur**

Ouvrez la console (`F12`) et tapez :
```javascript
window.location.href = '/migrate-supabase'
```

---

### 3. Lancer la migration

Sur la page de migration :

1. **Vérifiez les informations** : 8515+ cartes, 162+ extensions
2. **Cliquez sur "Lancer la migration"**
3. **Attendez** : Un backup sera automatiquement téléchargé
4. **Patientez** : La migration peut prendre plusieurs minutes

#### Ce qui se passe pendant la migration :

```
ÉTAPE 1/5 : Création du backup
├─ 8515 cartes sauvegardées
├─ 162 extensions sauvegardées
└─ Téléchargement automatique du backup.json

ÉTAPE 2/5 : Migration des cartes découvertes
├─ Upload par batch de 500 cartes
├─ Vérification après chaque batch
└─ ✅ 8515/8515 cartes migrées

ÉTAPE 3/5 : Migration des extensions
├─ Upload des 162 extensions
└─ ✅ 162/162 extensions migrées

ÉTAPE 4/5 : Migration des données personnalisées
├─ Blocs personnalisés
└─ Extensions déplacées

ÉTAPE 5/5 : Migration de la collection utilisateur
├─ Collection
├─ Favoris
├─ Wishlist
├─ Lots de doublons
└─ Ventes
```

---

### 4. Vérification post-migration

Une fois la migration terminée :

1. **Rafraîchissez la page** (bouton ou F5)
2. **Vérifiez vos données** :
   - Allez dans "Explorer" → Vérifiez le nombre de cartes
   - Allez dans "Ma Collection" → Vérifiez vos cartes
   - Allez dans "Admin → Base de Données" → Testez l'édition

3. **Consultez le rapport de migration** :
   - Nombre de cartes migrées
   - Nombre d'extensions migrées
   - Durée totale
   - Éventuels avertissements

---

## 🎯 Fonctionnalités après migration

### ✅ Synchronisation multi-appareils

Vos données sont maintenant synchronisées automatiquement :

**PC Principal**
```
Modifier un bloc → Sauvegarder
                ↓
           SUPABASE
                ↓
Téléphone ← Mise à jour automatique
```

### ✅ Accès depuis n'importe où

1. **Depuis votre PC** : http://localhost:5174
2. **Depuis votre téléphone** : Via Tailscale ou hébergement
3. **Depuis votre tablette** : Même interface partout

### ✅ Onglet Admin amélioré

L'onglet "Administration → Base de Données" fonctionne **encore mieux** :

- ✅ Modifications instantanées
- ✅ Synchronisation en temps réel
- ✅ Backup automatique Supabase
- ✅ Historique des modifications
- ✅ Interface SQL avancée (dans Supabase Dashboard)

---

## 🔧 Dépannage

### Problème : La migration échoue

**Solution :**
1. Vérifiez que vous êtes connecté avec un compte
2. Vérifiez votre connexion Internet
3. Consultez le message d'erreur
4. Un backup a été créé automatiquement - vos données sont sûres

### Problème : Pas toutes les cartes migrées

**Vérification :**
```javascript
// Dans la console
const stats = await SupabaseService.getStorageStats()
console.log(stats)
```

**Si le nombre ne correspond pas :**
- Le rapport de migration indique le nombre exact
- Vérifiez les avertissements
- Relancez la migration si nécessaire

### Problème : Je ne peux pas accéder à /migrate-supabase

**Solution : Ajouter la route manuellement**

Fichier `src/App.jsx` ou votre fichier de routes, ajoutez :

```jsx
import { MigrateToSupabase } from '@/pages/MigrateToSupabase'

// Dans vos routes
<Route path="/migrate-supabase" element={<MigrateToSupabase />} />
```

---

## 📊 Statistiques de votre base

Après migration, vous pouvez consulter vos stats :

```javascript
// Console navigateur
import { SupabaseService } from '@/services/SupabaseService'

const stats = await SupabaseService.getStorageStats()
console.log('Statistiques Supabase:', stats)
```

---

## 🎁 Interface Supabase Dashboard

En bonus, vous avez accès à l'interface Supabase :

1. **Allez sur** : https://supabase.com/dashboard
2. **Sélectionnez votre projet** : ubphwlmnfjdaiarbihcx
3. **Explorez** :
   - **Table Editor** : Voir toutes vos données
   - **SQL Editor** : Exécuter des requêtes SQL
   - **Database** → **Backups** : Backups automatiques
   - **Auth** : Gérer les utilisateurs

### Requêtes SQL utiles

```sql
-- Compter vos cartes
SELECT COUNT(*) FROM discovered_cards;

-- Compter vos extensions
SELECT COUNT(*) FROM series_database;

-- Voir les blocs personnalisés
SELECT * FROM custom_blocks;

-- Statistiques collection
SELECT
  COUNT(*) as total_cards,
  SUM(quantity) as total_quantity
FROM user_collection;
```

---

## ⚠️ Rollback (si besoin)

Si vous souhaitez revenir en arrière :

1. **Votre backup** : Le fichier JSON téléchargé contient toutes vos données
2. **localStorage** : Un backup est aussi dans `vaultestim_backup_before_migration`
3. **Restauration** :

```javascript
// Console navigateur
const backup = JSON.parse(localStorage.getItem('vaultestim_backup_before_migration'))
await SupabaseMigrationService.restoreFromBackup(backup)
```

---

## 🎯 Prochaines étapes recommandées

1. **Tester la synchronisation** :
   - Modifiez une carte sur PC
   - Vérifiez sur téléphone (après avoir configuré l'accès)

2. **Configurer Tailscale** (optionnel) :
   - Pour accéder depuis l'extérieur
   - Voir `TAILSCALE_SETUP.md`

3. **Désactiver le backend SQLite** (optionnel) :
   - Une fois que tout fonctionne
   - Vous n'en avez plus besoin

4. **Profiter** ! 🎉
   - Vos données sont maintenant synchronisées
   - Accès depuis n'importe où
   - Backup automatique quotidien

---

## 📞 Support

En cas de problème :

1. **Consultez les logs de la console** (`F12`)
2. **Vérifiez le rapport de migration**
3. **Votre backup est sûr** - aucune perte de données possible

---

## ✅ Checklist finale

- [ ] Schéma SQL exécuté dans Supabase
- [ ] Compte utilisateur créé
- [ ] Migration lancée depuis `/migrate-supabase`
- [ ] Backup téléchargé automatiquement
- [ ] Rapport de migration vérifié (8515 cartes OK)
- [ ] Application rafraîchie
- [ ] Données vérifiées dans Explorer
- [ ] Admin → Base de Données fonctionne
- [ ] Prêt pour la synchronisation multi-appareils ! 🚀
