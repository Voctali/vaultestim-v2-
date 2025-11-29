-- Script de migration pour corriger les extensions "Unknown Set"
-- Remplace les noms d'extensions manquants par les noms réels depuis set_id

-- 1. Vérifier combien de cartes ont "Unknown Set"
SELECT
  set->>'id' as set_id,
  set->>'name' as set_name,
  COUNT(*) as count
FROM discovered_cards
WHERE set->>'name' = 'Unknown Set'
GROUP BY set->>'id', set->>'name'
ORDER BY count DESC;

-- 2. Mapping des set_id vers les vrais noms d'extensions
-- WHITE FLARE = sv8
-- BLACK BOLT = sv8a

-- 3. Mise à jour des cartes avec les vrais noms d'extensions
UPDATE discovered_cards
SET set = jsonb_set(
  set,
  '{name}',
  '"White Flare"'::jsonb
)
WHERE set->>'id' = 'sv8' AND set->>'name' = 'Unknown Set';

UPDATE discovered_cards
SET set = jsonb_set(
  set,
  '{name}',
  '"Black Bolt"'::jsonb
)
WHERE set->>'id' = 'sv8a' AND set->>'name' = 'Unknown Set';

-- 4. Autres extensions connues qui pourraient avoir "Unknown Set"
UPDATE discovered_cards
SET set = jsonb_set(
  set,
  '{name}',
  '"Journey Together"'::jsonb
)
WHERE set->>'id' = 'sv9' AND set->>'name' = 'Unknown Set';

UPDATE discovered_cards
SET set = jsonb_set(
  set,
  '{name}',
  '"Prismatic Evolution"'::jsonb
)
WHERE set->>'id' = 'sv7' AND set->>'name' = 'Unknown Set';

UPDATE discovered_cards
SET set = jsonb_set(
  set,
  '{name}',
  '"Twilight Masquerade"'::jsonb
)
WHERE set->>'id' = 'sv6' AND set->>'name' = 'Unknown Set';

UPDATE discovered_cards
SET set = jsonb_set(
  set,
  '{name}',
  '"Temporal Forces"'::jsonb
)
WHERE set->>'id' = 'sv5' AND set->>'name' = 'Unknown Set';

-- 5. Vérifier les résultats
SELECT
  set->>'id' as set_id,
  set->>'name' as set_name,
  COUNT(*) as count
FROM discovered_cards
WHERE set->>'id' IN ('sv8', 'sv8a', 'sv9', 'sv7', 'sv6', 'sv5')
GROUP BY set->>'id', set->>'name'
ORDER BY set->>'id';
