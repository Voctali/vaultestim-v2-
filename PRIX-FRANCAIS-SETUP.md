# 🇫🇷 Configuration des Prix en Français - Guide de Mise en Place

## ✅ Ce qui a été implémenté

### 1. **Modifications de la Base de Données**
- ✅ Ajout de la colonne `id_language` dans `cardmarket_prices` pour filtrer par langue
- ✅ Ajout de la colonne `language` dans `user_sealed_products` pour stocker la langue du produit
- ✅ Création des index pour optimiser les requêtes

### 2. **Services Backend**
- ✅ **CardMarketSupabaseService** :
  - Ajout de l'import du champ `id_language` depuis les JSON
  - Constantes de mapping langue : `CARDMARKET_LANGUAGE_IDS`, `LANGUAGE_LABELS`
  - Méthodes helper : `getLanguageId()`, `getLanguageCode()`
  - Filtrage par défaut en français (ID 2)

- ✅ **UserSealedProductsService** :
  - Ajout du champ `language` lors de l'ajout de produits
  - Mise à jour de `refreshAllPrices()` pour utiliser la langue du produit
  - Logs détaillés avec indication de la langue

### 3. **Interface Utilisateur**
- ✅ **SealedProductModal** :
  - Ajout d'un sélecteur de langue avec 5 options (Français, Anglais, Allemand, Espagnol, Italien)
  - Récupération automatique des prix en fonction de la langue sélectionnée
  - Messages d'information sur l'utilisation de la langue

## 📋 Étapes de Finalisation

### Étape 1 : Exécuter le Script SQL dans Supabase

**URL** : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

**Script à exécuter** : `scripts/add-language-columns.sql`

```sql
-- 1. Ajouter la colonne id_language à cardmarket_prices
ALTER TABLE cardmarket_prices
ADD COLUMN IF NOT EXISTS id_language INTEGER DEFAULT 2;

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_cardmarket_prices_language
ON cardmarket_prices(id_language);

CREATE INDEX IF NOT EXISTS idx_cardmarket_prices_product_language
ON cardmarket_prices(id_product, id_language);

-- 3. Ajouter la colonne language à user_sealed_products
ALTER TABLE user_sealed_products
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'fr';

-- 4. Index pour user_sealed_products.language
CREATE INDEX IF NOT EXISTS idx_user_sealed_products_language
ON user_sealed_products(language);
```

**Vérification** :
```sql
-- Vérifier que les colonnes sont ajoutées
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cardmarket_prices'
AND column_name = 'id_language';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_sealed_products'
AND column_name = 'language';
```

### Étape 2 : Ré-importer les Données CardMarket (si nécessaire)

Si les données CardMarket ont déjà été importées **AVANT** l'ajout du champ `id_language`, vous devez :

**Option A : Ajouter manuellement id_language aux données existantes**
```sql
-- Mettre toutes les entrées existantes à Français (2) par défaut
UPDATE cardmarket_prices
SET id_language = 2
WHERE id_language IS NULL;
```

**Option B : Ré-importer les données JSON** (si le JSON source contient `idLanguage`)
- Utiliser l'interface admin pour ré-importer les prix
- Le nouveau code importera automatiquement le champ `id_language`

### Étape 3 : Tester le Système

#### Test 1 : Ajouter un Produit Scellé
1. Aller sur `/produits-scelles` ou `/admin/base-donnees`
2. Cliquer sur "Ajouter un produit"
3. Remplir le formulaire :
   - **Nom** : Test Booster FR
   - **ID CardMarket** : [Un ID valide]
   - **Langue** : Français ✅
4. Cliquer sur "Récupérer le prix CardMarket"
5. Vérifier que le prix affiché est bien en français

#### Test 2 : Actualiser les Prix
1. Aller sur `/produits-scelles`
2. Cliquer sur "Actualiser les prix"
3. Vérifier les logs console :
   - `🌐 Récupération prix pour [nom] en fr (ID: 2)`
   - `✅ Prix mis à jour: [nom] ([ancien]€ → [nouveau]€) [fr]`

#### Test 3 : Changer la Langue d'un Produit
1. Éditer un produit existant
2. Changer la langue : Français → Anglais
3. Cliquer sur "Récupérer le prix CardMarket"
4. Vérifier que le prix récupéré est différent (prix anglais)

## 🌐 Mapping des Langues CardMarket

| Code | Langue    | ID CardMarket |
|------|-----------|---------------|
| `fr` | Français  | 2 (défaut)    |
| `en` | Anglais   | 1             |
| `de` | Allemand  | 3             |
| `es` | Espagnol  | 4             |
| `it` | Italien   | 5             |

## 📝 Comportement par Défaut

- **Nouveau produit sans langue spécifiée** → Français (`fr`)
- **Prix CardMarket sans id_language** → Français (ID 2)
- **Produit existant sans langue** → Français lors de l'actualisation

## 🐛 Résolution de Problèmes

### Problème : "Aucun prix trouvé pour cet ID CardMarket en Français"

**Causes possibles :**
1. Le produit n'a pas de prix en français dans la base CardMarket
2. La colonne `id_language` n'a pas été ajoutée à la table
3. Les données n'ont pas été ré-importées avec `id_language`

**Solution :**
```sql
-- Vérifier si des prix existent pour ce produit
SELECT id_product, id_language, avg, low, trend
FROM cardmarket_prices
WHERE id_product = [ID_PRODUIT];

-- Si id_language est NULL, mettre à jour
UPDATE cardmarket_prices
SET id_language = 2
WHERE id_product = [ID_PRODUIT] AND id_language IS NULL;
```

### Problème : Colonne `language` n'existe pas dans `user_sealed_products`

**Solution :**
```sql
ALTER TABLE user_sealed_products
ADD COLUMN language VARCHAR(10) DEFAULT 'fr';
```

### Problème : Les prix ne changent pas en changeant la langue

**Vérification :**
1. Ouvrir la console du navigateur
2. Chercher les logs : `🌐 Récupération du prix en [langue] (ID: [X])`
3. Vérifier que l'ID de langue change bien

## 📊 Logs et Debugging

Les logs suivants confirment le bon fonctionnement :

```
✅ Logs attendus lors de l'ajout d'un produit :
console.log(`✅ Produit scellé ajouté: [nom] (langue: fr)`)

✅ Logs attendus lors de la récupération de prix :
console.log(`🌐 Récupération du prix en fr (ID: 2)`)
console.log(`✅ Prix récupéré: [prix]€ [fr]`)

✅ Logs attendus lors de l'actualisation :
console.log(`🌐 Récupération prix pour [nom] en fr (ID: 2)`)
console.log(`✅ Prix mis à jour: [nom] ([ancien]€ → [nouveau]€) [fr]`)
```

## 🚀 Déploiement

Après avoir testé localement :

1. Commit et push vers GitHub :
   ```bash
   git add .
   git commit -m "feat: Ajout système de langue pour prix CardMarket français"
   git push github main
   ```

2. Vercel déploiera automatiquement les changements

3. **IMPORTANT** : Exécuter le script SQL en production (Supabase) également !

## 📚 Fichiers Modifiés

- ✅ `src/services/CardMarketSupabaseService.js` - Constantes et import langue
- ✅ `src/services/UserSealedProductsService.js` - Support champ language
- ✅ `src/components/features/admin/SealedProductModal.jsx` - Sélecteur langue
- ✅ `scripts/add-language-columns.sql` - Script SQL migrations
- ✅ `PRIX-FRANCAIS-SETUP.md` - Ce guide

## ✨ Prochaines Étapes (Optionnel)

Pour aller plus loin :

1. **Ajouter la langue pour les cartes normales** (pas juste produits scellés)
2. **Afficher l'indicateur de langue** dans la liste des produits
3. **Filtrer par langue** dans la recherche
4. **Graphiques d'évolution de prix par langue**

---

**Questions ?** Consultez les logs console ou vérifiez la base de données Supabase directement.
