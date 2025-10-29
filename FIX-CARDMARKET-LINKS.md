# Fix: Liens et Images CardMarket des Produits Scellés

## Problème Identifié

**Symptômes** :
- Dans "Rechercher un produit scellé" (catalogue) → le lien CardMarket fonctionne ✅
- Après ajout à la collection → dans "Mes produits" :
  - Le lien CardMarket ne fonctionne plus ❌
  - L'image ne s'affiche pas ❌

**Cause racine** :
La colonne `cardmarket_id_category` n'existait pas dans la table `user_sealed_products`, donc l'URL CardMarket était incomplète.

## URL CardMarket Correcte

L'URL complète nécessite 3 paramètres :
```
https://www.cardmarket.com/fr/Pokemon/Products/Sealed-Products/{category}/{slug}/{id_product}
```

Exemple :
- ✅ Correct : `https://www.cardmarket.com/fr/Pokemon/Products/Sealed-Products/Booster-Boxes/Scarlet-Violet-Obsidian-Flames-Booster-Box/1148699`
- ❌ Incorrect (sans catégorie) : `https://www.cardmarket.com/fr/Pokemon/Products/Sealed-Products/Scarlet-Violet-Obsidian-Flames-Booster-Box/1148699`

## Corrections Appliquées

### 1. Script SQL pour Ajouter la Colonne

**Fichier** : `add-cardmarket-category-column.sql`

⚠️ **IMPORTANT** : Exécuter ce script dans Supabase SQL Editor AVANT de déployer le code :

```sql
ALTER TABLE user_sealed_products
ADD COLUMN IF NOT EXISTS cardmarket_id_category INTEGER;

COMMENT ON COLUMN user_sealed_products.cardmarket_id_category IS 'ID de la catégorie CardMarket pour construire l''URL correcte du produit';
```

**URL Supabase** : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

### 2. Service de Sauvegarde

**Fichier** : `src/services/UserSealedProductsService.js`

**Changement** : Ajout de `cardmarket_id_category` dans l'insertion (ligne 44)

```javascript
.insert({
  user_id: userId,
  name: productData.name,
  // ...
  cardmarket_id_product: productData.cardmarket_id_product || null,
  cardmarket_id_category: productData.cardmarket_id_category || null, // ✅ AJOUTÉ
  // ...
})
```

### 3. Page "Mes Produits"

**Fichier** : `src/pages/SealedProducts.jsx`

**Changement** : Ajout du 3ème paramètre `cardmarket_id_category` au lien (ligne 470)

```javascript
// ❌ AVANT (2 paramètres)
href={CardMarketSupabaseService.buildSealedProductUrl(
  product.cardmarket_id_product,
  product.name
)}

// ✅ APRÈS (3 paramètres)
href={CardMarketSupabaseService.buildSealedProductUrl(
  product.cardmarket_id_product,
  product.name,
  product.cardmarket_id_category
)}
```

### 4. Images CardMarket

**Fichier** : `src/pages/SealedProducts.jsx`

Les images utilisent déjà le fallback CardMarket (ligne 357) :
```javascript
src={
  product.image_file ||
  product.image_url ||
  CardMarketSupabaseService.getCardMarketImageUrl(product.cardmarket_id_product)
}
```

## Procédure de Déploiement

### Étape 1 : Exécuter le Script SQL dans Supabase

1. Ouvrir Supabase SQL Editor : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new
2. Copier le contenu de `add-cardmarket-category-column.sql`
3. Cliquer sur "Run" pour exécuter
4. Vérifier que la colonne a été ajoutée :
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'user_sealed_products'
   AND column_name LIKE '%cardmarket%';
   ```
   Devrait afficher :
   - `cardmarket_id_product` (integer)
   - `cardmarket_id_category` (integer) ✅ NOUVEAU

### Étape 2 : Déployer le Code

```bash
cd /f/Logiciels/Appli\ Vaultestim/vaultestim-v2
git add .
git commit -m "fix: Correction liens CardMarket produits scellés"
git push github main
```

Le déploiement Vercel se fera automatiquement.

### Étape 3 : Tester

1. **Dans le catalogue** ("Rechercher un produit scellé") :
   - Ajouter un nouveau produit à la collection
   - Vérifier que l'image s'affiche correctement
   - Vérifier que le lien CardMarket fonctionne

2. **Dans "Mes produits"** :
   - Cliquer sur le lien CardMarket du produit nouvellement ajouté
   - ✅ Le lien devrait fonctionner et rediriger vers la bonne page CardMarket
   - ✅ L'image devrait s'afficher

### Étape 4 : Migration des Produits Existants (Optionnel)

Les produits ajoutés AVANT cette correction n'ont pas de `cardmarket_id_category`.

**Option A** : Les supprimer et les rajouter depuis le catalogue

**Option B** : Script SQL pour récupérer les catégories depuis les produits du catalogue :
```sql
UPDATE user_sealed_products usp
SET cardmarket_id_category = sp.id_category
FROM cardmarket_sealed_products sp
WHERE usp.cardmarket_id_product = sp.id_product
AND usp.cardmarket_id_category IS NULL;
```

## Vérification

Pour vérifier que tout fonctionne :

1. Les produits ajoutés depuis le catalogue ont maintenant `cardmarket_id_category` rempli
2. Les liens CardMarket dans "Mes produits" redirigent vers la bonne page
3. Les images CardMarket s'affichent automatiquement

## Commit

✅ Corrections appliquées dans le commit : `[à venir]`

---

**Date de correction** : 2025-01-29
**Auteur** : Claude Code
