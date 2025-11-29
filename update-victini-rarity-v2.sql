UPDATE discovered_cards
SET rarity = 'Black White Rare'
WHERE name ILIKE '%victini%'
  AND number = '171'
  AND (set->>'id' = 'zsv10pt5' OR set->>'name' ILIKE '%Black Bolt%');
