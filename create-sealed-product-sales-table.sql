-- Script SQL pour créer la table sealed_product_sales
-- À exécuter dans le SQL Editor de Supabase
-- URL: https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

-- Créer la table pour les ventes de produits scellés
CREATE TABLE IF NOT EXISTS sealed_product_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES user_sealed_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER DEFAULT 1,
  sale_price DECIMAL(10, 2) NOT NULL,
  purchase_price DECIMAL(10, 2) DEFAULT 0,
  buyer TEXT,
  notes TEXT,
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_sealed_product_sales_user_id
ON sealed_product_sales(user_id);

CREATE INDEX IF NOT EXISTS idx_sealed_product_sales_product_id
ON sealed_product_sales(product_id);

CREATE INDEX IF NOT EXISTS idx_sealed_product_sales_sale_date
ON sealed_product_sales(sale_date DESC);

-- Ajouter des commentaires pour documentation
COMMENT ON TABLE sealed_product_sales IS 'Historique des ventes de produits scellés des utilisateurs';
COMMENT ON COLUMN sealed_product_sales.user_id IS 'ID de l''utilisateur qui a vendu le produit';
COMMENT ON COLUMN sealed_product_sales.product_id IS 'ID du produit scellé vendu (peut être NULL si produit supprimé)';
COMMENT ON COLUMN sealed_product_sales.product_name IS 'Nom du produit au moment de la vente';
COMMENT ON COLUMN sealed_product_sales.sale_price IS 'Prix de vente du produit';
COMMENT ON COLUMN sealed_product_sales.purchase_price IS 'Prix d''achat du produit (pour calcul du profit)';
COMMENT ON COLUMN sealed_product_sales.buyer IS 'Nom de l''acheteur (optionnel)';
COMMENT ON COLUMN sealed_product_sales.sale_date IS 'Date de la vente';

-- Activer Row Level Security (RLS)
ALTER TABLE sealed_product_sales ENABLE ROW LEVEL SECURITY;

-- Politique de sécurité : Les utilisateurs peuvent uniquement voir/gérer leurs propres ventes
CREATE POLICY "Users can view their own sealed product sales"
  ON sealed_product_sales
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sealed product sales"
  ON sealed_product_sales
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sealed product sales"
  ON sealed_product_sales
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sealed product sales"
  ON sealed_product_sales
  FOR DELETE
  USING (auth.uid() = user_id);

-- Vérification : afficher la structure de la table
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'sealed_product_sales'
ORDER BY ordinal_position;
