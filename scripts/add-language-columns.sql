-- Script SQL pour ajouter les colonnes de langue
-- À exécuter dans Supabase SQL Editor : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

-- 1. Ajouter la colonne id_language à cardmarket_prices (si elle n'existe pas déjà)
ALTER TABLE cardmarket_prices
ADD COLUMN IF NOT EXISTS id_language INTEGER DEFAULT 2;

-- 2. Créer un index pour améliorer les performances des requêtes filtrées par langue
CREATE INDEX IF NOT EXISTS idx_cardmarket_prices_language
ON cardmarket_prices(id_language);

-- 3. Créer un index composite pour (id_product, id_language) car c'est la requête la plus fréquente
CREATE INDEX IF NOT EXISTS idx_cardmarket_prices_product_language
ON cardmarket_prices(id_product, id_language);

-- 4. Ajouter la colonne language à user_sealed_products (si elle n'existe pas déjà)
ALTER TABLE user_sealed_products
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'fr';

-- 5. Créer un index pour user_sealed_products.language
CREATE INDEX IF NOT EXISTS idx_user_sealed_products_language
ON user_sealed_products(language);

-- Commentaires pour documentation
COMMENT ON COLUMN cardmarket_prices.id_language IS 'ID de la langue CardMarket (1=Anglais, 2=Français, 3=Allemand, 4=Espagnol, 5=Italien)';
COMMENT ON COLUMN user_sealed_products.language IS 'Code langue du produit (fr, en, de, es, it)';

-- Vérification : afficher les 10 premiers prix avec langue
SELECT id_product, id_language, avg, low, trend
FROM cardmarket_prices
WHERE id_language IS NOT NULL
LIMIT 10;

-- Vérification : compter les prix par langue
SELECT id_language, COUNT(*) as count
FROM cardmarket_prices
GROUP BY id_language
ORDER BY id_language;
