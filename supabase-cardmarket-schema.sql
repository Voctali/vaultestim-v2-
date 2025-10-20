-- =========================================
-- SCHEMA CARDMARKET POUR VAULTESTIM V2
-- =========================================
-- À exécuter dans Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

-- =========================================
-- 0. ACTIVER LES EXTENSIONS (EN PREMIER!)
-- =========================================

-- Activer l'extension pour recherche floue (DOIT être fait avant les index)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================================
-- 1. TABLES PUBLIQUES (données de référence)
-- =========================================

-- Table des cartes singles CardMarket (59,683 cartes)
CREATE TABLE IF NOT EXISTS cardmarket_singles (
  id_product INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  id_category INTEGER,
  category_name TEXT,
  id_expansion INTEGER,
  id_metacard INTEGER,
  date_added TIMESTAMP,
  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_cardmarket_singles_name ON cardmarket_singles(name);
CREATE INDEX IF NOT EXISTS idx_cardmarket_singles_expansion ON cardmarket_singles(id_expansion);
CREATE INDEX IF NOT EXISTS idx_cardmarket_singles_metacard ON cardmarket_singles(id_metacard);

-- Index texte pour recherche ILIKE optimisée
CREATE INDEX IF NOT EXISTS idx_cardmarket_singles_name_trgm ON cardmarket_singles USING gin(name gin_trgm_ops);

-- Commentaires
COMMENT ON TABLE cardmarket_singles IS 'Cartes Pokémon individuelles CardMarket (données publiques en lecture seule)';
COMMENT ON COLUMN cardmarket_singles.id_product IS 'ID unique CardMarket du produit';
COMMENT ON COLUMN cardmarket_singles.name IS 'Nom de la carte avec attaques, ex: "Amoonguss [Sporprise | Rising Lunge]"';

-- =========================================
-- Table des produits scellés (4,527 produits)
CREATE TABLE IF NOT EXISTS cardmarket_nonsingles (
  id_product INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  id_category INTEGER,
  category_name TEXT,
  id_expansion INTEGER,
  id_metacard INTEGER,
  date_added TIMESTAMP,
  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cardmarket_nonsingles_name ON cardmarket_nonsingles(name);
CREATE INDEX IF NOT EXISTS idx_cardmarket_nonsingles_category ON cardmarket_nonsingles(id_category);
CREATE INDEX IF NOT EXISTS idx_cardmarket_nonsingles_expansion ON cardmarket_nonsingles(id_expansion);

-- Index texte
CREATE INDEX IF NOT EXISTS idx_cardmarket_nonsingles_name_trgm ON cardmarket_nonsingles USING gin(name gin_trgm_ops);

COMMENT ON TABLE cardmarket_nonsingles IS 'Produits scellés Pokémon CardMarket (boosters, decks, etc.) - données publiques';

-- =========================================
-- Table des prix (64,210 prix)
CREATE TABLE IF NOT EXISTS cardmarket_prices (
  id_product INTEGER PRIMARY KEY,
  id_category INTEGER,
  -- Prix normaux
  avg DECIMAL(10,2),
  low DECIMAL(10,2),
  trend DECIMAL(10,2),
  avg1 DECIMAL(10,2),
  avg7 DECIMAL(10,2),
  avg30 DECIMAL(10,2),
  -- Prix holofoil/reverse
  avg_holo DECIMAL(10,2),
  low_holo DECIMAL(10,2),
  trend_holo DECIMAL(10,2),
  avg1_holo DECIMAL(10,2),
  avg7_holo DECIMAL(10,2),
  avg30_holo DECIMAL(10,2),
  -- Métadonnées
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cardmarket_prices_category ON cardmarket_prices(id_category);

COMMENT ON TABLE cardmarket_prices IS 'Guide des prix CardMarket (EUR) - données publiques, mises à jour régulièrement';

-- =========================================
-- 2. TABLE PRIVÉE (matchings utilisateur)
-- =========================================

-- Table des matchings utilisateur (avec RLS)
CREATE TABLE IF NOT EXISTS user_cardmarket_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Identification de la carte utilisateur
  card_id TEXT NOT NULL,                    -- ID unique de la carte (ex: "bw4-11")

  -- Lien vers CardMarket
  cardmarket_id_product INTEGER NOT NULL,   -- Référence vers cardmarket_singles ou cardmarket_nonsingles
  is_sealed_product BOOLEAN DEFAULT false,  -- true si produit scellé, false si carte single

  -- Métadonnées du matching
  match_score DECIMAL(3,2) CHECK (match_score >= 0 AND match_score <= 1), -- Score de confiance (0-1)
  manual_override BOOLEAN DEFAULT false,    -- true si match manuel par utilisateur
  match_method TEXT,                        -- 'auto_attacks' | 'auto_name' | 'manual'

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Contrainte unique : une carte = un seul match CardMarket
  UNIQUE(user_id, card_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_matches_user_id ON user_cardmarket_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_matches_card_id ON user_cardmarket_matches(card_id);
CREATE INDEX IF NOT EXISTS idx_user_matches_cardmarket_id ON user_cardmarket_matches(cardmarket_id_product);

COMMENT ON TABLE user_cardmarket_matches IS 'Liens entre les cartes utilisateur et la base CardMarket (données privées avec RLS)';

-- =========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =========================================

-- Activer RLS sur les tables
ALTER TABLE cardmarket_singles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardmarket_nonsingles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardmarket_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cardmarket_matches ENABLE ROW LEVEL SECURITY;

-- =========================================
-- Policies pour tables publiques (lecture seule pour tous)
-- =========================================

-- Singles (lecture publique)
DROP POLICY IF EXISTS "Anyone can read cardmarket singles" ON cardmarket_singles;
CREATE POLICY "Anyone can read cardmarket singles"
  ON cardmarket_singles
  FOR SELECT
  USING (true);

-- NonSingles (lecture publique)
DROP POLICY IF EXISTS "Anyone can read cardmarket nonsingles" ON cardmarket_nonsingles;
CREATE POLICY "Anyone can read cardmarket nonsingles"
  ON cardmarket_nonsingles
  FOR SELECT
  USING (true);

-- Prices (lecture publique)
DROP POLICY IF EXISTS "Anyone can read cardmarket prices" ON cardmarket_prices;
CREATE POLICY "Anyone can read cardmarket prices"
  ON cardmarket_prices
  FOR SELECT
  USING (true);

-- =========================================
-- Policies pour table privée (matchings utilisateur)
-- =========================================

-- SELECT: Utilisateurs peuvent voir uniquement leurs propres matchings
DROP POLICY IF EXISTS "Users can view their own matches" ON user_cardmarket_matches;
CREATE POLICY "Users can view their own matches"
  ON user_cardmarket_matches
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Utilisateurs peuvent créer leurs propres matchings
DROP POLICY IF EXISTS "Users can create their own matches" ON user_cardmarket_matches;
CREATE POLICY "Users can create their own matches"
  ON user_cardmarket_matches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Utilisateurs peuvent modifier leurs propres matchings
DROP POLICY IF EXISTS "Users can update their own matches" ON user_cardmarket_matches;
CREATE POLICY "Users can update their own matches"
  ON user_cardmarket_matches
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Utilisateurs peuvent supprimer leurs propres matchings
DROP POLICY IF EXISTS "Users can delete their own matches" ON user_cardmarket_matches;
CREATE POLICY "Users can delete their own matches"
  ON user_cardmarket_matches
  FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================
-- 4. TRIGGERS (mise à jour automatique)
-- =========================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour user_cardmarket_matches
DROP TRIGGER IF EXISTS update_user_matches_updated_at ON user_cardmarket_matches;
CREATE TRIGGER update_user_matches_updated_at
  BEFORE UPDATE ON user_cardmarket_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 5. STATISTIQUES ET VUES UTILES
-- =========================================

-- Vue pour les statistiques globales (accessible à tous)
CREATE OR REPLACE VIEW cardmarket_stats AS
SELECT
  (SELECT COUNT(*) FROM cardmarket_singles) as total_singles,
  (SELECT COUNT(*) FROM cardmarket_nonsingles) as total_nonsingles,
  (SELECT COUNT(*) FROM cardmarket_prices) as total_prices,
  (SELECT MAX(updated_at) FROM cardmarket_prices) as last_price_update;

COMMENT ON VIEW cardmarket_stats IS 'Statistiques globales de la base CardMarket';

-- Vue pour les matchings utilisateur avec détails (RLS appliqué)
CREATE OR REPLACE VIEW user_matches_with_details AS
SELECT
  m.id,
  m.user_id,
  m.card_id,
  m.cardmarket_id_product,
  m.is_sealed_product,
  m.match_score,
  m.manual_override,
  m.match_method,
  -- Joindre les détails CardMarket (singles OU nonsingles)
  COALESCE(s.name, ns.name) as cardmarket_name,
  COALESCE(s.id_expansion, ns.id_expansion) as id_expansion,
  -- Joindre les prix
  p.avg as price_avg,
  p.low as price_low,
  p.trend as price_trend,
  p.avg7 as price_avg7,
  m.created_at,
  m.updated_at
FROM user_cardmarket_matches m
LEFT JOIN cardmarket_singles s ON m.cardmarket_id_product = s.id_product AND m.is_sealed_product = false
LEFT JOIN cardmarket_nonsingles ns ON m.cardmarket_id_product = ns.id_product AND m.is_sealed_product = true
LEFT JOIN cardmarket_prices p ON m.cardmarket_id_product = p.id_product;

COMMENT ON VIEW user_matches_with_details IS 'Vue enrichie des matchings utilisateur avec détails CardMarket et prix';

-- =========================================
-- 6. FIN DU SCHEMA
-- =========================================

-- Vérification finale
SELECT
  'cardmarket_singles' as table_name,
  (SELECT COUNT(*) FROM cardmarket_singles) as row_count
UNION ALL
SELECT
  'cardmarket_nonsingles',
  (SELECT COUNT(*) FROM cardmarket_nonsingles)
UNION ALL
SELECT
  'cardmarket_prices',
  (SELECT COUNT(*) FROM cardmarket_prices)
UNION ALL
SELECT
  'user_cardmarket_matches',
  (SELECT COUNT(*) FROM user_cardmarket_matches);
