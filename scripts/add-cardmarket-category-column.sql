-- Script SQL pour ajouter la colonne cardmarket_id_category
-- À exécuter dans le SQL Editor de Supabase
-- URL: https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

-- Ajouter la colonne pour stocker l'ID de catégorie CardMarket
ALTER TABLE user_sealed_products
ADD COLUMN IF NOT EXISTS cardmarket_id_category INTEGER;

-- Commentaire pour documentation
COMMENT ON COLUMN user_sealed_products.cardmarket_id_category IS 'ID de la catégorie CardMarket pour construire l''URL correcte du produit';

-- Vérification : afficher la structure mise à jour
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_sealed_products'
AND column_name LIKE '%cardmarket%'
ORDER BY ordinal_position;
