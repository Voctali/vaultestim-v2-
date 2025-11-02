-- Script SQL pour ajouter les colonnes nécessaires au tri des cartes
-- Exécuter dans Supabase SQL Editor : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

-- Vérifier et ajouter la colonne 'number' si elle n'existe pas
-- Cette colonne stocke le numéro de la carte dans l'extension (ex: "97", "12")
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'user_collection' AND column_name = 'number'
  ) THEN
    ALTER TABLE user_collection ADD COLUMN number TEXT;
    RAISE NOTICE 'Colonne "number" ajoutée avec succès';
  ELSE
    RAISE NOTICE 'Colonne "number" existe déjà';
  END IF;
END $$;

-- Vérifier et ajouter la colonne 'set' si elle n'existe pas
-- Cette colonne stocke les informations de l'extension (JSON avec set.id, set.name, set.releaseDate, etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'user_collection' AND column_name = 'set'
  ) THEN
    ALTER TABLE user_collection ADD COLUMN "set" JSONB;
    RAISE NOTICE 'Colonne "set" ajoutée avec succès';
  ELSE
    RAISE NOTICE 'Colonne "set" existe déjà';
  END IF;
END $$;

-- Créer un index sur set.releaseDate pour optimiser le tri
CREATE INDEX IF NOT EXISTS idx_user_collection_set_releaseDate
ON user_collection ((set->>'releaseDate'));

-- Commentaires pour documentation
COMMENT ON COLUMN user_collection.number IS 'Numéro de la carte dans l''extension (ex: "97")';
COMMENT ON COLUMN user_collection.set IS 'Informations de l''extension (set.id, set.name, set.releaseDate, etc.)';

-- Afficher un résumé
SELECT
  COUNT(*) as total_cartes,
  COUNT(number) as cartes_avec_number,
  COUNT(set) as cartes_avec_set,
  COUNT(*) - COUNT(number) as cartes_sans_number,
  COUNT(*) - COUNT(set) as cartes_sans_set
FROM user_collection;
