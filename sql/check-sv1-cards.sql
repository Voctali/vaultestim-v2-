-- Diagnostic complet des cartes SV1 dans Supabase
-- Copier-coller ce script dans: https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

-- 1. Compter toutes les cartes SV1 (ID pattern: sv1-*)
SELECT
  'Total cartes SV1' as description,
  COUNT(*) as count
FROM discovered_cards
WHERE id LIKE 'sv1-%';

-- 2. Répartition par set_id
SELECT
  'Avec set_id = sv1' as description,
  COUNT(*) as count
FROM discovered_cards
WHERE id LIKE 'sv1-%' AND set_id = 'sv1'
UNION ALL
SELECT
  'Avec set_id = NULL' as description,
  COUNT(*) as count
FROM discovered_cards
WHERE id LIKE 'sv1-%' AND set_id IS NULL;

-- 3. Total attendu vs réel
SELECT
  309 as attendu,
  COUNT(*) as reel,
  (309 - COUNT(*)) as manquant
FROM discovered_cards
WHERE id LIKE 'sv1-%';

-- 4. Afficher les 10 dernières cartes SV1 ajoutées
SELECT
  id,
  name,
  number,
  set_id,
  created_at
FROM discovered_cards
WHERE id LIKE 'sv1-%'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Vérifier si des numéros sont en double
SELECT
  number,
  COUNT(*) as occurrences
FROM discovered_cards
WHERE id LIKE 'sv1-%'
GROUP BY number
HAVING COUNT(*) > 1;
