-- Script SQL pour ajouter les colonnes manquantes à la table user_sealed_products
-- À exécuter dans le SQL Editor de Supabase

-- Ajouter les colonnes pour quantity, condition et purchase_price
ALTER TABLE user_sealed_products
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'Impeccable',
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2);

-- Ajouter des contraintes pour validation
ALTER TABLE user_sealed_products
ADD CONSTRAINT check_quantity_positive CHECK (quantity > 0);

ALTER TABLE user_sealed_products
ADD CONSTRAINT check_condition_valid CHECK (condition IN ('Impeccable', 'Défaut léger', 'Abîmé'));

-- Commentaires pour documentation
COMMENT ON COLUMN user_sealed_products.quantity IS 'Nombre d''exemplaires du produit scellé';
COMMENT ON COLUMN user_sealed_products.condition IS 'État du produit scellé (Impeccable, Défaut léger, Abîmé)';
COMMENT ON COLUMN user_sealed_products.purchase_price IS 'Prix d''achat du produit en EUR';

-- Vérification : afficher la structure mise à jour
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_sealed_products'
ORDER BY ordinal_position;
