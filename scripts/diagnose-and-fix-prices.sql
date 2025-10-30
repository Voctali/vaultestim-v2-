-- Script SQL pour diagnostiquer et corriger les problèmes de prix
-- À exécuter dans Supabase SQL Editor : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

-- ========================================
-- ÉTAPE 1 : DIAGNOSTIC
-- ========================================

-- 1. Vérifier si la colonne id_language existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'cardmarket_prices'
AND column_name = 'id_language';

-- 2. Compter combien de prix ont id_language NULL
SELECT
  COUNT(*) FILTER (WHERE id_language IS NULL) as prix_sans_langue,
  COUNT(*) FILTER (WHERE id_language IS NOT NULL) as prix_avec_langue,
  COUNT(*) as total_prix
FROM cardmarket_prices;

-- 3. Voir la distribution des langues
SELECT
  id_language,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM cardmarket_prices
WHERE id_language IS NOT NULL
GROUP BY id_language
ORDER BY count DESC;

-- 4. Vérifier un exemple de produit scellé spécifique
-- (Remplacer 123456 par l'ID du produit Radiant Eevee ou autre)
SELECT
  p.id_product,
  p.id_language,
  p.avg,
  p.low,
  p.trend,
  ns.name
FROM cardmarket_prices p
LEFT JOIN cardmarket_nonsingles ns ON p.id_product = ns.id_product
WHERE p.id_product IN (
  SELECT id_product
  FROM cardmarket_nonsingles
  WHERE name ILIKE '%radiant%eevee%'
  LIMIT 5
)
ORDER BY p.id_product, p.id_language;

-- 5. Vérifier si les produits utilisateur ont bien le champ language
SELECT
  id,
  name,
  language,
  market_price,
  cardmarket_id_product
FROM user_sealed_products
LIMIT 10;

-- ========================================
-- ÉTAPE 2 : CORRECTION
-- ========================================

-- 6. Si tous les prix ont id_language NULL, les mettre à 2 (français) par défaut
UPDATE cardmarket_prices
SET id_language = 2
WHERE id_language IS NULL;

-- 7. Vérifier que la mise à jour a fonctionné
SELECT
  COUNT(*) FILTER (WHERE id_language IS NULL) as prix_sans_langue,
  COUNT(*) FILTER (WHERE id_language = 2) as prix_francais,
  COUNT(*) as total_prix
FROM cardmarket_prices;

-- 8. Mettre à jour les produits utilisateur sans langue à 'fr'
UPDATE user_sealed_products
SET language = 'fr'
WHERE language IS NULL;

-- 9. Vérifier les produits utilisateur après mise à jour
SELECT
  COUNT(*) FILTER (WHERE language IS NULL) as sans_langue,
  COUNT(*) FILTER (WHERE language = 'fr') as francais,
  COUNT(*) as total
FROM user_sealed_products;

-- ========================================
-- ÉTAPE 3 : TESTS
-- ========================================

-- 10. Tester la récupération d'un prix en français
-- (Remplacer 123456 par un ID de produit réel)
SELECT
  id_product,
  id_language,
  avg as prix_moyen,
  low as prix_bas,
  trend as tendance
FROM cardmarket_prices
WHERE id_product = 123456  -- REMPLACER par l'ID du produit
AND id_language = 2  -- Français
LIMIT 1;

-- 11. Vérifier qu'il y a bien des prix pour différentes langues
SELECT
  id_language,
  COUNT(DISTINCT id_product) as nb_produits_distincts,
  AVG(avg) as prix_moyen_global,
  MIN(avg) as prix_min,
  MAX(avg) as prix_max
FROM cardmarket_prices
WHERE avg IS NOT NULL
GROUP BY id_language
ORDER BY id_language;

-- ========================================
-- RÉSUMÉ DES COMMANDES IMPORTANTES
-- ========================================

/*
PROBLÈME : Tous les prix ont id_language NULL
SOLUTION : UPDATE cardmarket_prices SET id_language = 2 WHERE id_language IS NULL;

PROBLÈME : Les produits utilisateur n'ont pas de langue
SOLUTION : UPDATE user_sealed_products SET language = 'fr' WHERE language IS NULL;

VÉRIFICATION : Les prix français sont récupérables
COMMANDE : SELECT * FROM cardmarket_prices WHERE id_product = [ID] AND id_language = 2;

NOTE IMPORTANTE :
Si les données JSON source de CardMarket ne contenaient PAS le champ "idLanguage",
tous les prix ont été importés avec id_language NULL. Dans ce cas :
1. Soit ré-importer les données avec le champ idLanguage depuis le JSON
2. Soit mettre manuellement tous les prix à id_language=2 si les données sont en français
*/
