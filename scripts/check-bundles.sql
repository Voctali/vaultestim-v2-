-- Script SQL pour vérifier la présence des bundles dans la base CardMarket
-- À exécuter dans Supabase SQL Editor : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

-- ========================================
-- ÉTAPE 1 : VÉRIFIER LES CATÉGORIES
-- ========================================

-- 1. Lister toutes les catégories disponibles avec le nombre de produits
SELECT
  ns.id_category,
  ns.category_name,
  COUNT(*) as nombre_produits
FROM cardmarket_nonsingles ns
GROUP BY ns.id_category, ns.category_name
ORDER BY nombre_produits DESC;

-- ========================================
-- ÉTAPE 2 : CHERCHER LES BUNDLES
-- ========================================

-- 2. Rechercher les produits avec "bundle" dans le nom (insensible à la casse)
SELECT
  id_product,
  name,
  category_name,
  id_category
FROM cardmarket_nonsingles
WHERE name ILIKE '%bundle%'
ORDER BY name
LIMIT 50;

-- 3. Rechercher les produits avec "6 booster" ou "six booster" dans le nom
SELECT
  id_product,
  name,
  category_name,
  id_category
FROM cardmarket_nonsingles
WHERE name ILIKE '%6 booster%' OR name ILIKE '%six booster%'
ORDER BY name
LIMIT 50;

-- 4. Compter combien de bundles existent
SELECT COUNT(*) as total_bundles
FROM cardmarket_nonsingles
WHERE name ILIKE '%bundle%';

-- ========================================
-- ÉTAPE 3 : VÉRIFIER LES CATÉGORIES MANQUANTES
-- ========================================

-- 5. Lister toutes les catégories uniques
SELECT DISTINCT
  id_category,
  category_name
FROM cardmarket_nonsingles
ORDER BY id_category;

-- ========================================
-- RÉSULTATS ATTENDUS
-- ========================================

/*
Si vous voyez des produits dans les résultats 2 ou 3, les bundles sont bien dans la base.
Dans ce cas, le problème vient peut-être du frontend qui filtre ces produits.

Si aucun résultat n'apparaît :
- Les bundles n'ont pas été importés depuis le JSON source
- Ils sont peut-être dans une catégorie différente (ex: "Display" ou "Booster Box")

CATÉGORIES CARDMARKET CONNUES :
- 1 = Booster Packs
- 2 = Booster Boxes
- 3 = Starter Decks
- 4 = Theme Decks
- 5 = Elite Trainer Boxes
- 6 = Collection Boxes
- 7 = Bundle (boîtes de 6 boosters) ← C'EST CETTE CATÉGORIE QUI NOUS INTÉRESSE

Si la catégorie 7 n'apparaît pas dans les résultats :
→ Les bundles n'ont pas été importés dans Supabase
*/
