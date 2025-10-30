-- Script SQL pour ajouter la colonne cardmarket_name à la table user_cardmarket_matches
-- À exécuter dans Supabase SQL Editor : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

-- ========================================
-- AJOUTER LA COLONNE cardmarket_name
-- ========================================

-- Ajouter la colonne pour stocker le nom de la carte sur CardMarket
-- Cela permet de construire des URLs de recherche plus précises
ALTER TABLE user_cardmarket_matches
ADD COLUMN IF NOT EXISTS cardmarket_name TEXT;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN user_cardmarket_matches.cardmarket_name IS 'Nom de la carte sur CardMarket (pour construire l''URL de recherche par nom au lieu de par ID)';

-- ========================================
-- VÉRIFICATION
-- ========================================

-- Vérifier que la colonne a bien été ajoutée
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_cardmarket_matches'
AND column_name = 'cardmarket_name';

-- Afficher la structure complète de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_cardmarket_matches'
ORDER BY ordinal_position;

-- ========================================
-- NOTES
-- ========================================

/*
POURQUOI CETTE COLONNE ?

Pour les cartes singles (non scellées), CardMarket ne supporte pas bien la recherche par ID produit.
La recherche par ID est très lente et retourne souvent des résultats incorrects ou "page non trouvée".

SOLUTION :
Stocker le NOM exact de la carte sur CardMarket et construire une URL de recherche par nom :
https://www.cardmarket.com/en/Pokemon/Products/Search?searchString="Nom Exact de la Carte"&language=2

Cette approche est BEAUCOUP plus rapide et plus fiable que la recherche par ID.

EXEMPLE :
- AVANT (lent et parfois cassé) : searchString=123456
- APRÈS (rapide et fiable) : searchString="Pikachu ex (211/198)"

Les guillemets dans la recherche garantissent que CardMarket cherche le nom EXACT,
évitant les résultats parasites.
*/
