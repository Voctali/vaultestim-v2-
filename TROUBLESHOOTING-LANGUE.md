# 🔧 Résolution des Problèmes - Sélecteur de Langue

## Problème : Le sélecteur de langue n'apparaît pas dans la modale

### Causes possibles

1. **Cache du navigateur** - Le fichier JavaScript ancien est encore en cache
2. **Build non déployé** - Vercel n'a pas encore déployé les changements
3. **Hard refresh non effectué** - Le navigateur utilise l'ancien fichier

### Solutions

#### Solution 1 : Hard Refresh (Recommandé) ✅

**Windows/Linux** :
```
Ctrl + Shift + R
```

**Mac** :
```
Cmd + Shift + R
```

#### Solution 2 : Vider le cache complet

**Chrome/Edge** :
1. Appuyer sur `F12` pour ouvrir les Dev Tools
2. Clic droit sur le bouton de rafraîchissement (à côté de la barre d'adresse)
3. Sélectionner **"Vider le cache et actualiser de manière forcée"**

**Firefox** :
1. `Ctrl + Shift + Delete`
2. Cocher "Cache"
3. Sélectionner "Dernière heure"
4. Cliquer "Effacer maintenant"

#### Solution 3 : Mode Navigation Privée

1. Ouvrir une fenêtre de navigation privée :
   - Chrome : `Ctrl + Shift + N`
   - Firefox : `Ctrl + Shift + P`
2. Aller sur https://vaultestim-v2.vercel.app
3. Tester l'ajout d'un produit scellé

### Vérification que le sélecteur est bien là

1. Ouvrir la page `/produits-scelles`
2. Cliquer sur **"Ajouter un produit"**
3. Le formulaire doit contenir :
   - ✅ Nom du produit
   - ✅ Catégorie
   - ✅ **🌐 Langue du produit** ← NOUVEAU !
   - ✅ Nombre d'exemplaires
   - ✅ État du produit
   - etc.

### Le sélecteur de langue ressemble à ça :

```
🌐 Langue du produit
┌─────────────────────────┐
│ Français            ▼   │
└─────────────────────────┘
💡 Les prix CardMarket seront récupérés pour la langue sélectionnée
```

**Options disponibles** :
- Français (par défaut)
- Anglais
- Allemand
- Espagnol
- Italien

---

## Problème : Les prix ne correspondent pas aux prix français

### Diagnostic

Exécutez le script SQL `scripts/diagnose-and-fix-prices.sql` dans Supabase :

https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

### Cause probable

La colonne `id_language` dans la table `cardmarket_prices` est **NULL** pour tous les prix.

### Solution rapide

```sql
-- Mettre tous les prix à "Français" (ID 2)
UPDATE cardmarket_prices
SET id_language = 2
WHERE id_language IS NULL;
```

### Vérification

```sql
-- Vérifier qu'un produit a bien un prix en français
SELECT id_product, id_language, avg, low, trend
FROM cardmarket_prices
WHERE id_product = 123456  -- Remplacer par l'ID de votre produit
AND id_language = 2;
```

Si cette requête retourne **0 ligne**, c'est que les données CardMarket importées n'avaient pas le champ `idLanguage`.

### Solution définitive

**Option A** : Si le JSON source contient `idLanguage`
- Ré-importer les données CardMarket avec le nouveau code qui importe `id_language`

**Option B** : Si le JSON source ne contient PAS `idLanguage`
- Exécuter la commande UPDATE ci-dessus pour marquer tous les prix comme français

---

## Problème : Le bouton "Actualiser le prix" ne fait rien

### Causes possibles

1. **Aucune donnée CardMarket** - La table `cardmarket_prices` est vide
2. **id_language NULL** - Les prix ne sont pas filtrés correctement
3. **Pas d'ID CardMarket** - Le produit n'a pas de `cardmarket_id_product`

### Vérification 1 : Le produit a-t-il un ID CardMarket ?

1. Éditer le produit
2. Vérifier que le champ **"ID CardMarket"** est rempli
3. Si vide, entrer l'ID du produit sur CardMarket

### Vérification 2 : Y a-t-il des prix dans la base ?

```sql
-- Vérifier combien de prix sont dans la base
SELECT COUNT(*) FROM cardmarket_prices;

-- Si 0, les données n'ont pas été importées
-- Si > 0, vérifier si id_language est NULL
SELECT COUNT(*) FROM cardmarket_prices WHERE id_language IS NULL;
```

### Vérification 3 : La langue est-elle définie ?

```sql
-- Vérifier la langue du produit
SELECT id, name, language, cardmarket_id_product
FROM user_sealed_products
WHERE name ILIKE '%eevee%';  -- Remplacer par le nom de votre produit
```

Si `language` est NULL, le mettre à `'fr'` :

```sql
UPDATE user_sealed_products
SET language = 'fr'
WHERE language IS NULL;
```

### Vérification 4 : Logs console

1. Ouvrir la console du navigateur (F12)
2. Cliquer sur "Actualiser le prix"
3. Chercher les logs :
   - ✅ `🌐 Récupération du prix en fr (ID: 2)`
   - ✅ `✅ Prix récupéré: X.XX€ [fr]`
   - ❌ `⚠️ Aucun prix trouvé pour [nom] en fr`

Si vous voyez le message d'avertissement, c'est que :
- Soit l'ID produit est incorrect
- Soit il n'y a pas de prix pour ce produit en français dans la base

---

## Problème : Le lien CardMarket ne contient pas ?language=2

### Vérification

Le lien CardMarket doit ressembler à ça :
```
https://www.cardmarket.com/en/Pokemon/Products/Box-Sets/Pokemon-GO-Premium-CollectionRadiant-Eevee?language=2
```

Si le `?language=2` manque, c'est que :
1. Le code n'a pas été déployé
2. Le cache n'a pas été vidé

### Solution

1. **Vider le cache** du navigateur (Ctrl + Shift + R)
2. **Vérifier le déploiement** Vercel :
   - Aller sur https://vercel.com/voctalis-projects/vaultestim-v2/deployments
   - Vérifier que le dernier commit est déployé
   - Status doit être "Ready" avec une ✅

---

## Contact et Support

Si les problèmes persistent après avoir essayé toutes ces solutions :

1. **Vérifier les logs console** (F12 → Console)
2. **Copier les messages d'erreur**
3. **Partager les captures d'écran**
4. **Indiquer les étapes de reproduction**

Les fichiers modifiés dans cette mise à jour :
- ✅ `src/services/CardMarketSupabaseService.js`
- ✅ `src/services/UserSealedProductsService.js`
- ✅ `src/components/features/admin/SealedProductModal.jsx`
- ✅ `src/pages/SealedProducts.jsx`
- ✅ `src/pages/SealedProductsCatalog.jsx`
