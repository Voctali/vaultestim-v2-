-- Table pour l'historique des prix des produits scellés
-- À exécuter dans Supabase SQL Editor: https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

-- Créer la table d'historique des prix
CREATE TABLE IF NOT EXISTS sealed_product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_sealed_product_id UUID NOT NULL REFERENCES user_sealed_products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  price_source TEXT DEFAULT 'cardmarket', -- 'cardmarket', 'manual', 'auto_refresh'
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON sealed_product_price_history(user_sealed_product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON sealed_product_price_history(recorded_at DESC);

-- Row Level Security (RLS)
ALTER TABLE sealed_product_price_history ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir l'historique de leurs propres produits
CREATE POLICY "Users can view own product price history"
  ON sealed_product_price_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_sealed_products
      WHERE user_sealed_products.id = sealed_product_price_history.user_sealed_product_id
      AND user_sealed_products.user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent insérer l'historique pour leurs propres produits
CREATE POLICY "Users can insert own product price history"
  ON sealed_product_price_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_sealed_products
      WHERE user_sealed_products.id = sealed_product_price_history.user_sealed_product_id
      AND user_sealed_products.user_id = auth.uid()
    )
  );

-- Fonction pour ajouter automatiquement un enregistrement d'historique lors d'un changement de prix
CREATE OR REPLACE FUNCTION log_sealed_product_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le prix a changé et n'est pas NULL
  IF NEW.market_price IS NOT NULL AND (
    OLD.market_price IS NULL OR
    OLD.market_price != NEW.market_price
  ) THEN
    INSERT INTO sealed_product_price_history (
      user_sealed_product_id,
      price,
      price_source,
      recorded_at
    ) VALUES (
      NEW.id,
      NEW.market_price,
      'auto_refresh',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour log automatique des changements de prix
CREATE TRIGGER sealed_product_price_change_trigger
  AFTER UPDATE ON user_sealed_products
  FOR EACH ROW
  EXECUTE FUNCTION log_sealed_product_price_change();

-- Commentaires pour documentation
COMMENT ON TABLE sealed_product_price_history IS 'Historique des prix des produits scellés pour suivi de l''évolution';
COMMENT ON COLUMN sealed_product_price_history.price IS 'Prix enregistré en EUR';
COMMENT ON COLUMN sealed_product_price_history.price_source IS 'Source du prix: cardmarket (API), manual (saisie manuelle), auto_refresh (actualisation auto)';
COMMENT ON COLUMN sealed_product_price_history.recorded_at IS 'Date et heure d''enregistrement du prix';
