-- Script SQL pour ajouter le support des versions Holo Cosmos
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter colonne pour indiquer qu'une carte existe en version holo cosmos
ALTER TABLE discovered_cards
ADD COLUMN IF NOT EXISTS has_cosmos_holo BOOLEAN DEFAULT false;

-- 2. Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_discovered_cards_cosmos
ON discovered_cards(has_cosmos_holo)
WHERE has_cosmos_holo = true;

-- 3. Commentaire pour documentation
COMMENT ON COLUMN discovered_cards.has_cosmos_holo IS
'Indique si cette carte existe en version Holo Cosmos (rareté spéciale avec motif cosmique)';

-- Vérification
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'discovered_cards'
AND column_name = 'has_cosmos_holo';
