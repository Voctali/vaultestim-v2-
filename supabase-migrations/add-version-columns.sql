-- Migration pour ajouter les colonnes de version et de gradation à la table user_collection
-- Date: 2025-10-14
-- Description: Ajoute les colonnes version, is_graded, grade_company, grade pour supporter la gestion des versions de cartes

-- Vérifier si les colonnes existent déjà avant de les ajouter
DO $$
BEGIN
  -- Ajouter la colonne version si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_collection' AND column_name = 'version'
  ) THEN
    ALTER TABLE user_collection ADD COLUMN version TEXT DEFAULT 'Normale';
    COMMENT ON COLUMN user_collection.version IS 'Version de la carte (Normale, Holo, Reverse Holo, Full Art, Alternate Art)';
  END IF;

  -- Ajouter la colonne is_graded si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_collection' AND column_name = 'is_graded'
  ) THEN
    ALTER TABLE user_collection ADD COLUMN is_graded BOOLEAN DEFAULT false;
    COMMENT ON COLUMN user_collection.is_graded IS 'Indique si la carte est gradée';
  END IF;

  -- Ajouter la colonne grade_company si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_collection' AND column_name = 'grade_company'
  ) THEN
    ALTER TABLE user_collection ADD COLUMN grade_company TEXT;
    COMMENT ON COLUMN user_collection.grade_company IS 'Société de gradation (PSA, BGS, CGC, SGC)';
  END IF;

  -- Ajouter la colonne grade si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_collection' AND column_name = 'grade'
  ) THEN
    ALTER TABLE user_collection ADD COLUMN grade TEXT;
    COMMENT ON COLUMN user_collection.grade IS 'Note de gradation (ex: 10, 9.5)';
  END IF;
END $$;

-- Mettre à jour toutes les cartes existantes sans version définie
UPDATE user_collection
SET version = 'Normale'
WHERE version IS NULL;

-- Mettre à jour toutes les cartes existantes sans is_graded défini
UPDATE user_collection
SET is_graded = false
WHERE is_graded IS NULL;

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration terminée : Colonnes version, is_graded, grade_company et grade ajoutées avec succès à user_collection';
END $$;
