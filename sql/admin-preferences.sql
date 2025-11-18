-- Script SQL pour la table admin_preferences
-- Stocke les préférences d'administration globales (non liées à un utilisateur spécifique)

-- Créer la table admin_preferences
CREATE TABLE IF NOT EXISTS admin_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    preference_key TEXT NOT NULL UNIQUE,
    preference_value JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_admin_preferences_key ON admin_preferences(preference_key);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_admin_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_preferences_updated_at ON admin_preferences;
CREATE TRIGGER trigger_admin_preferences_updated_at
    BEFORE UPDATE ON admin_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_preferences_updated_at();

-- RLS (Row Level Security) - Lecture pour tous, écriture pour admins uniquement
ALTER TABLE admin_preferences ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture (SELECT) - Tous les utilisateurs authentifiés peuvent lire
DROP POLICY IF EXISTS "Anyone can view admin preferences" ON admin_preferences;
CREATE POLICY "Anyone can view admin preferences" ON admin_preferences
    FOR SELECT USING (true);

-- Politique pour insertion (INSERT) - Tous les utilisateurs authentifiés (tu peux restreindre aux admins plus tard)
DROP POLICY IF EXISTS "Authenticated users can insert admin preferences" ON admin_preferences;
CREATE POLICY "Authenticated users can insert admin preferences" ON admin_preferences
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Politique pour mise à jour (UPDATE) - Tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can update admin preferences" ON admin_preferences;
CREATE POLICY "Authenticated users can update admin preferences" ON admin_preferences
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Politique pour suppression (DELETE) - Tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can delete admin preferences" ON admin_preferences;
CREATE POLICY "Authenticated users can delete admin preferences" ON admin_preferences
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Commentaires
COMMENT ON TABLE admin_preferences IS 'Stocke les préférences d''administration globales (catégories masquées, etc.)';
COMMENT ON COLUMN admin_preferences.preference_key IS 'Clé de la préférence (ex: hidden_sealed_categories)';
COMMENT ON COLUMN admin_preferences.preference_value IS 'Valeur JSON de la préférence';
