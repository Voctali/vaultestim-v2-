-- Ajouter le champ updated_at à la table discovered_cards
-- À exécuter dans l'éditeur SQL de Supabase

ALTER TABLE discovered_cards
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Créer un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur la table discovered_cards
DROP TRIGGER IF EXISTS update_discovered_cards_updated_at ON discovered_cards;
CREATE TRIGGER update_discovered_cards_updated_at
    BEFORE UPDATE ON discovered_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vérifier que tout fonctionne
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'discovered_cards'
AND column_name IN ('updated_at', '_saved_at', 'created_at');
