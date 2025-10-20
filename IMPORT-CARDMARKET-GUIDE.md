# 🚀 Guide d'import CardMarket - Étapes Simples

## ✅ ÉTAPE 1 : Créer les tables Supabase (2 minutes)

1. **Ouvrir Supabase SQL Editor**
   ```
   https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new
   ```

2. **Copier-coller le fichier** `supabase-cardmarket-schema.sql` dans l'éditeur

3. **Cliquer sur "Run"** (en haut à droite)

4. **Vérifier** qu'il n'y a pas d'erreurs (doit afficher "Success")

---

## ✅ ÉTAPE 2 : Installer dotenv (30 secondes)

```bash
cd "F:\Logiciels\Appli Vaultestim\vaultestim-v2"
npm install dotenv
```

---

## ✅ ÉTAPE 3 : Lancer l'import (10-15 minutes)

```bash
cd "F:\Logiciels\Appli Vaultestim\vaultestim-v2"
node import-cardmarket.mjs
```

### Ce que vous allez voir :

```
🚀 Début import CardMarket vers Supabase...

📥 ÉTAPE 1/4: Chargement des fichiers JSON

📂 Chargement: products_singles_6.json
✅ Chargé: products_singles_6.json
📂 Chargement: products_nonsingles_6.json
✅ Chargé: products_nonsingles_6.json
📂 Chargement: price_guide_6.json
✅ Chargé: price_guide_6.json

📊 Statistiques:
   Singles: 59683
   NonSingles: 4527
   Prix: 64210
   Version: 1
   Créé le: 2025-10-19T08:56:24+0200

📥 ÉTAPE 2/4: Import cartes singles

📦 Import 59683 entrées dans cardmarket_singles (batches de 1000)...
  ⏳ 59683/59683 (100%)
✅ cardmarket_singles: 59683/59683 importés (0 erreurs)

📥 ÉTAPE 3/4: Import produits scellés

📦 Import 4527 entrées dans cardmarket_nonsingles (batches de 500)...
  ⏳ 4527/4527 (100%)
✅ cardmarket_nonsingles: 4527/4527 importés (0 erreurs)

💰 ÉTAPE 4/4: Import guides de prix

📦 Import 64210 entrées dans cardmarket_prices (batches de 1000)...
  ⏳ 64210/64210 (100%)
✅ cardmarket_prices: 64210/64210 importés (0 erreurs)

📊 Vérification finale...

✅ Statistiques Supabase:
   Singles: 59683
   NonSingles: 4527
   Prix: 64210
   Dernière MAJ prix: 2025-01-20T...

🎉 Import terminé avec succès en 487.23s!
```

---

## ⚠️ En cas d'erreur

### Erreur : "Variables d'environnement manquantes"

**Vérifier que le fichier `.env` existe et contient** :
```
VITE_SUPABASE_URL=https://ubphwlmnfjdaiarbihcx.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_ici
```

### Erreur : "Fichier introuvable"

**Vérifier que les fichiers JSON sont bien là** :
```
F:\Logiciels\Appli Vaultestim\Données\cardmarket\
  ├── products_singles_6.json
  ├── products_nonsingles_6.json
  └── price_guide_6.json
```

### Erreur : "permission denied" ou "relation does not exist"

**Les tables Supabase n'ont pas été créées** → Refaire l'ÉTAPE 1

### Import s'arrête au milieu

**Pas de problème !** Le script utilise `upsert` donc vous pouvez le relancer :
```bash
node import-cardmarket.mjs
```
Il va juste mettre à jour ce qui manque.

---

## ✅ ÉTAPE 4 : Vérifier que ça a marché

Aller dans Supabase Table Editor :
```
https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/editor
```

Vous devriez voir :
- ✅ Table `cardmarket_singles` : ~59,683 lignes
- ✅ Table `cardmarket_nonsingles` : ~4,527 lignes
- ✅ Table `cardmarket_prices` : ~64,210 lignes
- ✅ Table `user_cardmarket_matches` : 0 lignes (normal, vide au début)

---

## 🎯 Après l'import

Une fois l'import terminé, le système sera prêt pour :
1. ✅ Matching automatique de vos cartes
2. ✅ Liens directs vers CardMarket
3. ✅ Prix EUR CardMarket
4. ✅ Produits scellés disponibles

Les prochaines étapes seront d'intégrer le matching dans votre application.

---

## 🔄 Mettre à jour les données plus tard

Si vous téléchargez de nouveaux fichiers JSON CardMarket :

```bash
# Remplacer les fichiers dans F:\Logiciels\Appli Vaultestim\Données\cardmarket
# Puis relancer l'import
node import-cardmarket.mjs
```

Les données seront mises à jour (pas de doublons grâce à `upsert`).

---

**C'est tout ! Simple et sûr 🚀**
