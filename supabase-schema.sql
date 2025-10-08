-- ============================================================================
-- SCHÉMA SUPABASE POUR VAULTESTIM V2
-- Migration depuis IndexedDB + Backend SQLite
-- ============================================================================

-- ============================================================================
-- TABLES PRINCIPALES
-- ============================================================================

-- Table des utilisateurs (Supabase Auth gère auth.users automatiquement)
-- On crée une table publique pour les données utilisateur étendues
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CARTES DÉCOUVERTES (discovered_cards)
-- Toutes les cartes que l'utilisateur a découvertes via l'API Pokemon TCG
-- ============================================================================
CREATE TABLE public.discovered_cards (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_fr TEXT,
  supertype TEXT,
  subtypes JSONB,
  types JSONB,
  hp TEXT,
  level TEXT,
  evolves_from TEXT,
  evolves_to JSONB,
  abilities JSONB,
  attacks JSONB,
  weaknesses JSONB,
  resistances JSONB,
  retreat_cost JSONB,
  number TEXT,
  artist TEXT,
  rarity TEXT,
  rarity_fr TEXT,
  flavor_text TEXT,
  national_pokedex_numbers JSONB,
  legalities JSONB,
  images JSONB,
  tcgplayer JSONB,
  cardmarket JSONB,
  set JSONB,
  set_id TEXT,
  _source TEXT, -- 'tcgdex' ou 'pokemontcg'
  _saved_at TIMESTAMPTZ DEFAULT NOW(),
  _updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_discovered_cards_user_id ON public.discovered_cards(user_id);
CREATE INDEX idx_discovered_cards_name ON public.discovered_cards(name);
CREATE INDEX idx_discovered_cards_set_id ON public.discovered_cards(set_id);
CREATE INDEX idx_discovered_cards_source ON public.discovered_cards(_source);

-- ============================================================================
-- SÉRIES/EXTENSIONS (series_database)
-- Base de données des extensions Pokemon TCG
-- ============================================================================
CREATE TABLE public.series_database (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_fr TEXT,
  series TEXT,
  printed_total INTEGER,
  total INTEGER,
  legalities JSONB,
  ptcgo_code TEXT,
  release_date TEXT,
  updated_at TEXT,
  images JSONB,
  year INTEGER,
  card_count INTEGER DEFAULT 0,
  _saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_series_user_id ON public.series_database(user_id);
CREATE INDEX idx_series_name ON public.series_database(name);
CREATE INDEX idx_series_series ON public.series_database(series);

-- ============================================================================
-- BLOCS PERSONNALISÉS (custom_blocks)
-- Blocs créés manuellement par l'utilisateur
-- ============================================================================
CREATE TABLE public.custom_blocks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  year INTEGER,
  end_year INTEGER,
  image_url TEXT,
  logo_url TEXT,
  total_cards INTEGER DEFAULT 0,
  type TEXT DEFAULT 'custom' CHECK (type IN ('custom', 'generated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_custom_blocks_user_id ON public.custom_blocks(user_id);
CREATE INDEX idx_custom_blocks_name ON public.custom_blocks(name);

-- ============================================================================
-- EXTENSIONS PERSONNALISÉES (custom_extensions)
-- Déplacements d'extensions entre blocs
-- ============================================================================
CREATE TABLE public.custom_extensions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  series TEXT NOT NULL, -- Nouveau bloc assigné
  original_series TEXT, -- Bloc d'origine
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_custom_extensions_user_id ON public.custom_extensions(user_id);
CREATE INDEX idx_custom_extensions_series ON public.custom_extensions(series);

-- ============================================================================
-- IMAGES UPLOADÉES (uploaded_images)
-- Images uploadées par l'utilisateur pour blocs/extensions/cartes
-- ============================================================================
CREATE TABLE public.uploaded_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('block', 'extension', 'card')),
  entity_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL, -- Chemin dans Supabase Storage
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_uploaded_images_user_id ON public.uploaded_images(user_id);
CREATE INDEX idx_uploaded_images_entity ON public.uploaded_images(entity_type, entity_id);

-- ============================================================================
-- COLLECTION UTILISATEUR (user_collection)
-- Cartes que l'utilisateur possède dans sa collection
-- ============================================================================
CREATE TABLE public.user_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  name TEXT NOT NULL,
  series TEXT,
  extension TEXT,
  rarity TEXT,
  image TEXT,
  images JSONB,
  quantity INTEGER DEFAULT 1,
  condition TEXT DEFAULT 'Non spécifié',
  purchase_price DECIMAL(10,2),
  market_price DECIMAL(10,2),
  value DECIMAL(10,2),
  date_added TIMESTAMPTZ DEFAULT NOW(),
  display_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_user_collection_user_id ON public.user_collection(user_id);
CREATE INDEX idx_user_collection_card_id ON public.user_collection(card_id);
CREATE INDEX idx_user_collection_name ON public.user_collection(name);

-- ============================================================================
-- FAVORIS (user_favorites)
-- Cartes favorites de l'utilisateur
-- ============================================================================
CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  name TEXT NOT NULL,
  series TEXT,
  rarity TEXT,
  image TEXT,
  images JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_card_id ON public.user_favorites(card_id);

-- ============================================================================
-- WISHLIST (user_wishlist)
-- Liste de souhaits de l'utilisateur
-- ============================================================================
CREATE TABLE public.user_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  name TEXT NOT NULL,
  series TEXT,
  rarity TEXT,
  image TEXT,
  images JSONB,
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_user_wishlist_user_id ON public.user_wishlist(user_id);
CREATE INDEX idx_user_wishlist_card_id ON public.user_wishlist(card_id);

-- ============================================================================
-- LOTS DE DOUBLONS (duplicate_batches)
-- Lots de cartes en double créés par l'utilisateur
-- ============================================================================
CREATE TABLE public.duplicate_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cards JSONB NOT NULL,
  total_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_duplicate_batches_user_id ON public.duplicate_batches(user_id);

-- ============================================================================
-- VENTES (user_sales)
-- Historique des ventes de cartes/lots
-- ============================================================================
CREATE TABLE public.user_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'batch')),
  card_id TEXT,
  card_name TEXT,
  card_series TEXT,
  card_rarity TEXT,
  card_image TEXT,
  batch_id TEXT,
  batch_name TEXT,
  batch_description TEXT,
  cards JSONB,
  quantity INTEGER DEFAULT 1,
  purchase_price DECIMAL(10,2),
  sale_price DECIMAL(10,2) NOT NULL,
  buyer_name TEXT,
  buyer_email TEXT,
  platform TEXT,
  notes TEXT,
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  display_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_user_sales_user_id ON public.user_sales(user_id);
CREATE INDEX idx_user_sales_type ON public.user_sales(type);
CREATE INDEX idx_user_sales_date ON public.user_sales(sale_date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovered_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicate_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sales ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: user_profiles
-- ============================================================================

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: discovered_cards
-- ============================================================================

CREATE POLICY "Users can view own discovered cards"
  ON public.discovered_cards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discovered cards"
  ON public.discovered_cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discovered cards"
  ON public.discovered_cards
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own discovered cards"
  ON public.discovered_cards
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: series_database
-- ============================================================================

CREATE POLICY "Users can view own series"
  ON public.series_database
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own series"
  ON public.series_database
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own series"
  ON public.series_database
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own series"
  ON public.series_database
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: custom_blocks
-- ============================================================================

CREATE POLICY "Users can view own blocks"
  ON public.custom_blocks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blocks"
  ON public.custom_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blocks"
  ON public.custom_blocks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blocks"
  ON public.custom_blocks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: custom_extensions
-- ============================================================================

CREATE POLICY "Users can view own custom extensions"
  ON public.custom_extensions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom extensions"
  ON public.custom_extensions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom extensions"
  ON public.custom_extensions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom extensions"
  ON public.custom_extensions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: uploaded_images
-- ============================================================================

CREATE POLICY "Users can view own images"
  ON public.uploaded_images
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images"
  ON public.uploaded_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own images"
  ON public.uploaded_images
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own images"
  ON public.uploaded_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: user_collection
-- ============================================================================

CREATE POLICY "Users can view own collection"
  ON public.user_collection
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collection"
  ON public.user_collection
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collection"
  ON public.user_collection
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collection"
  ON public.user_collection
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: user_favorites
-- ============================================================================

CREATE POLICY "Users can view own favorites"
  ON public.user_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.user_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.user_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: user_wishlist
-- ============================================================================

CREATE POLICY "Users can view own wishlist"
  ON public.user_wishlist
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist"
  ON public.user_wishlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlist"
  ON public.user_wishlist
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist"
  ON public.user_wishlist
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: duplicate_batches
-- ============================================================================

CREATE POLICY "Users can view own batches"
  ON public.duplicate_batches
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batches"
  ON public.duplicate_batches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batches"
  ON public.duplicate_batches
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batches"
  ON public.duplicate_batches
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: user_sales
-- ============================================================================

CREATE POLICY "Users can view own sales"
  ON public.user_sales
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales"
  ON public.user_sales
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales"
  ON public.user_sales
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FONCTIONS ET TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discovered_cards_updated_at
  BEFORE UPDATE ON public.discovered_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_blocks_updated_at
  BEFORE UPDATE ON public.custom_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_collection_updated_at
  BEFORE UPDATE ON public.user_collection
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_duplicate_batches_updated_at
  BEFORE UPDATE ON public.duplicate_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BUCKET STORAGE POUR LES IMAGES
-- ============================================================================

-- Note: À exécuter manuellement dans l'interface Supabase Storage
-- 1. Créer un bucket "card-images" avec accès public
-- 2. Créer un bucket "user-uploads" avec accès privé (RLS)

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.user_profiles IS 'Profils utilisateurs étendus (lié à auth.users)';
COMMENT ON TABLE public.discovered_cards IS 'Cartes découvertes via Pokemon TCG API (8515+ cartes)';
COMMENT ON TABLE public.series_database IS 'Extensions Pokemon TCG (162+ extensions)';
COMMENT ON TABLE public.custom_blocks IS 'Blocs personnalisés créés par les utilisateurs';
COMMENT ON TABLE public.custom_extensions IS 'Déplacements d extensions entre blocs';
COMMENT ON TABLE public.uploaded_images IS 'Images uploadées par les utilisateurs';
COMMENT ON TABLE public.user_collection IS 'Collection de cartes de l utilisateur';
COMMENT ON TABLE public.user_favorites IS 'Cartes favorites';
COMMENT ON TABLE public.user_wishlist IS 'Liste de souhaits';
COMMENT ON TABLE public.duplicate_batches IS 'Lots de doublons';
COMMENT ON TABLE public.user_sales IS 'Historique des ventes';
