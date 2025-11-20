-- Ajouter les colonnes pour les URLs CardMarket

-- Table des cartes
ALTER TABLE discovered_cards
ADD COLUMN IF NOT EXISTS cardmarket_url TEXT;

-- Table des produits scellés (catalogue)
ALTER TABLE cardmarket_nonsingles
ADD COLUMN IF NOT EXISTS cardmarket_url TEXT;

-- Table des produits scellés utilisateurs
ALTER TABLE user_sealed_products
ADD COLUMN IF NOT EXISTS cardmarket_url TEXT;

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_discovered_cards_cardmarket_url ON discovered_cards(cardmarket_url);
CREATE INDEX IF NOT EXISTS idx_cardmarket_nonsingles_cardmarket_url ON cardmarket_nonsingles(cardmarket_url);
CREATE INDEX IF NOT EXISTS idx_user_sealed_products_cardmarket_url ON user_sealed_products(cardmarket_url);

-- Commentaires
COMMENT ON COLUMN discovered_cards.cardmarket_url IS 'URL directe vers la page CardMarket de la carte (source: RapidAPI)';
COMMENT ON COLUMN cardmarket_nonsingles.cardmarket_url IS 'URL directe vers la page CardMarket du produit catalogue (source: RapidAPI)';
COMMENT ON COLUMN user_sealed_products.cardmarket_url IS 'URL directe vers la page CardMarket du produit utilisateur (source: RapidAPI)';
