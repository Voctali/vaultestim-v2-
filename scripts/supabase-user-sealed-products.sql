-- Table pour les produits scellés de la collection utilisateur
-- À exécuter dans Supabase SQL Editor: https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

-- Créer la table
CREATE TABLE IF NOT EXISTS user_sealed_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  market_price DECIMAL(10, 2),
  image_url TEXT,
  image_file TEXT, -- Base64 si image uploadée
  cardmarket_id_product INTEGER, -- Lien vers produit CardMarket (optionnel)
  category TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_sealed_products_user_id ON user_sealed_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sealed_products_created_at ON user_sealed_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sealed_products_cardmarket ON user_sealed_products(cardmarket_id_product);

-- Row Level Security (RLS)
ALTER TABLE user_sealed_products ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir uniquement leurs propres produits
CREATE POLICY "Users can view own sealed products"
  ON user_sealed_products
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent insérer leurs propres produits
CREATE POLICY "Users can insert own sealed products"
  ON user_sealed_products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres produits
CREATE POLICY "Users can update own sealed products"
  ON user_sealed_products
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres produits
CREATE POLICY "Users can delete own sealed products"
  ON user_sealed_products
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_sealed_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_sealed_products_updated_at
  BEFORE UPDATE ON user_sealed_products
  FOR EACH ROW
  EXECUTE FUNCTION update_user_sealed_products_updated_at();

-- Commentaires pour documentation
COMMENT ON TABLE user_sealed_products IS 'Produits scellés de la collection utilisateur (boosters, decks, etc.)';
COMMENT ON COLUMN user_sealed_products.name IS 'Nom du produit scellé';
COMMENT ON COLUMN user_sealed_products.market_price IS 'Prix du marché en EUR';
COMMENT ON COLUMN user_sealed_products.image_url IS 'URL de l''image (si lien externe)';
COMMENT ON COLUMN user_sealed_products.image_file IS 'Image en Base64 (si uploadée)';
COMMENT ON COLUMN user_sealed_products.cardmarket_id_product IS 'ID du produit CardMarket associé (optionnel)';
COMMENT ON COLUMN user_sealed_products.category IS 'Catégorie du produit (Booster, Deck, ETB, etc.)';
COMMENT ON COLUMN user_sealed_products.notes IS 'Notes personnelles de l''utilisateur';
