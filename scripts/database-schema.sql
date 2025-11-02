-- Schema de base de données pour VaultEstim
-- Inspiré de LimitlessTCG pour une base complète

-- Extensions/Blocs
CREATE TABLE sets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    name_fr VARCHAR(200),
    series VARCHAR(100),
    block VARCHAR(100),
    release_date DATE,
    total_cards INTEGER,
    images JSON, -- {logo, symbol, artwork}
    legalities JSON,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cartes principales
CREATE TABLE cards (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    name_fr VARCHAR(200),
    set_id VARCHAR(50) REFERENCES sets(id),
    number VARCHAR(20),
    supertype VARCHAR(50), -- Pokemon, Trainer, Energy
    types JSON, -- ["Fire", "Dragon"]
    subtypes JSON,
    rarity VARCHAR(50),
    rarity_fr VARCHAR(50),
    hp INTEGER,
    artist VARCHAR(200),
    flavor_text TEXT,
    abilities JSON,
    attacks JSON,
    weaknesses JSON,
    resistances JSON,
    retreat_cost JSON,
    legalities JSON,
    images JSON, -- {small, large, hires}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_cards_name ON cards(name);
CREATE INDEX idx_cards_name_fr ON cards(name_fr);
CREATE INDEX idx_cards_set ON cards(set_id);
CREATE INDEX idx_cards_types ON cards USING GIN(types);

-- Prix de marché (historique)
CREATE TABLE card_prices (
    id SERIAL PRIMARY KEY,
    card_id VARCHAR(100) REFERENCES cards(id),
    source VARCHAR(50), -- tcgplayer, cardmarket, limitless
    condition VARCHAR(50), -- nm, lp, mp, etc
    variant VARCHAR(50), -- normal, holo, reverse, etc
    price_low DECIMAL(10,2),
    price_mid DECIMAL(10,2),
    price_high DECIMAL(10,2),
    price_market DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Cache des images
CREATE TABLE card_images (
    id SERIAL PRIMARY KEY,
    card_id VARCHAR(100) REFERENCES cards(id),
    size VARCHAR(20), -- small, large, hires
    url VARCHAR(500),
    local_path VARCHAR(500),
    is_cached BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Collections utilisateur
CREATE TABLE user_collections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    card_id VARCHAR(100) REFERENCES cards(id),
    quantity INTEGER DEFAULT 1,
    condition VARCHAR(50) DEFAULT 'nm',
    variant VARCHAR(50) DEFAULT 'normal',
    price_paid DECIMAL(10,2),
    acquired_date DATE,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sources de données (suivi)
CREATE TABLE data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    base_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit_per_minute INTEGER,
    last_sync TIMESTAMP,
    total_cards_synced INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Log de synchronisation
CREATE TABLE sync_logs (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES data_sources(id),
    status VARCHAR(50), -- success, error, partial
    cards_processed INTEGER,
    cards_updated INTEGER,
    cards_added INTEGER,
    errors JSON,
    duration_seconds INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Recherches utilisateur (analytics)
CREATE TABLE search_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    query VARCHAR(500),
    results_count INTEGER,
    clicked_card_id VARCHAR(100),
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Vues pour optimisation

-- Vue cartes avec informations complètes
CREATE VIEW cards_complete AS
SELECT
    c.*,
    s.name as set_name,
    s.name_fr as set_name_fr,
    s.series,
    s.block,
    s.release_date,
    COALESCE(p.price_market, 0) as current_market_price
FROM cards c
LEFT JOIN sets s ON c.set_id = s.id
LEFT JOIN LATERAL (
    SELECT price_market
    FROM card_prices
    WHERE card_id = c.id
    AND source = 'tcgplayer'
    ORDER BY recorded_at DESC
    LIMIT 1
) p ON true;

-- Vue statistiques par extension
CREATE VIEW set_statistics AS
SELECT
    s.*,
    COUNT(c.id) as actual_cards,
    COUNT(CASE WHEN c.rarity LIKE '%Rare%' THEN 1 END) as rare_count,
    AVG(p.price_market) as avg_price
FROM sets s
LEFT JOIN cards c ON s.id = c.set_id
LEFT JOIN LATERAL (
    SELECT price_market
    FROM card_prices
    WHERE card_id = c.id
    ORDER BY recorded_at DESC
    LIMIT 1
) p ON true
GROUP BY s.id, s.name, s.series, s.release_date, s.total_cards;