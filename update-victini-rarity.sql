-- Mettre à jour la rareté de Victini #171 (Black Bolt / SV10.5)
-- De "Rare" vers "Black White Rare"

UPDATE discovered_cards
SET rarity = 'Black White Rare'
WHERE 
  (name ILIKE '%victini%' OR name = 'Victini')
  AND number = '171'
  AND (
    set->>'id' = 'zsv10pt5' 
    OR set->>'name' ILIKE '%Black Bolt%'
    OR set->>'name' ILIKE '%Foudre Noire%'
  );

-- Vérifier le résultat
SELECT 
  id,
  name,
  number,
  rarity,
  set->>'id' as set_id,
  set->>'name' as set_name
FROM discovered_cards
WHERE 
  (name ILIKE '%victini%' OR name = 'Victini')
  AND number = '171';
