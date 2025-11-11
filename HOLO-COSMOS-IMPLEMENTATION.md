# Implémentation Holo Cosmos

## Vue d'ensemble
Ajout du support pour les versions **Holo Cosmos** (finition spéciale avec motif cosmique).

## Architecture

### 1. Base de données (`discovered_cards`)
- **Colonne**: `has_cosmos_holo` (BOOLEAN, default: false)
- **Usage**: Indique qu'une carte existe en version holo cosmos dans le TCG réel
- **Exemple**: Hop's Wooloo #135 de Journey Together (sv9)

### 2. Collection utilisateur (`user_collection`)
- **Champ**: `is_cosmos_holo` (BOOLEAN, dans l'objet JSON)
- **Usage**: Marque un exemplaire spécifique comme étant en version cosmos
- **Stockage**: Ajouté aux propriétés de la carte (comme `quantity`, `condition`, etc.)

### 3. Interface utilisateur

#### 3.1 Badge Holo Cosmos
- **Affichage**: Badge violet/cosmique avec étoiles ✨
- **Emplacements**:
  - CardGrid (vue grille)
  - CardDetails (modale détails)
  - Collection (ma collection)
  - Explore (explorer les séries)

#### 3.2 Outil Admin
- **Emplacement**: AdminDatabaseEditor
- **Fonction**: Marquer/démarquer les cartes qui ont version cosmos
- **UI**: Checkbox ou toggle dans la modale d'édition de carte

#### 3.3 Modal Ajout Collection
- **Emplacement**: AddToCollectionModal
- **UI**: Checkbox "Version Holo Cosmos ✨"
- **Condition**: Visible seulement si `card.has_cosmos_holo === true`

## Plan d'implémentation

### Étape 1: SQL Supabase ✅
```sql
-- Fichier: supabase-add-cosmos-holo.sql (créé)
ALTER TABLE discovered_cards
ADD COLUMN IF NOT EXISTS has_cosmos_holo BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_discovered_cards_cosmos
ON discovered_cards(has_cosmos_holo)
WHERE has_cosmos_holo = true;
```

**Action**: Exécuter dans Supabase SQL Editor

### Étape 2: Services

#### 2.1 CardCacheService.js
- Ajouter `has_cosmos_holo` dans `createObjectStore`
- Créer index pour recherche rapide

#### 2.2 SupabaseService.js
- Inclure `has_cosmos_holo` dans les SELECT
- Méthode `updateCardCosmosStatus(cardId, hasCosmosHolo)`

#### 2.3 SupabaseCollectionService.js
- Supporter `is_cosmos_holo` dans les objets de collection
- Aucun changement de schéma (stocké dans JSONB existant)

### Étape 3: Components

#### 3.1 Badge Component
```jsx
// Nouveau: src/components/features/collection/CosmosHoloBadge.jsx
export function CosmosHoloBadge({ card, isUserCopy = false }) {
  // Affiche badge si:
  // - isUserCopy && card.is_cosmos_holo (exemplaire user)
  // - !isUserCopy && card.has_cosmos_holo (base commune)

  return (
    <Badge className="bg-purple-600 dark:bg-purple-500">
      ✨ Holo Cosmos
    </Badge>
  )
}
```

#### 3.2 Admin Editor
```jsx
// Modifier: src/pages/AdminDatabaseEditor.jsx
<Checkbox
  checked={selectedCard.has_cosmos_holo || false}
  onCheckedChange={(checked) => updateCosmosStatus(checked)}
>
  Version Holo Cosmos disponible ✨
</Checkbox>
```

#### 3.3 Add to Collection Modal
```jsx
// Modifier: src/components/features/collection/AddToCollectionModal.jsx
{card.has_cosmos_holo && (
  <div className="flex items-center space-x-2">
    <Checkbox
      id="cosmos-holo"
      checked={isCosmosHolo}
      onCheckedChange={setIsCosmosHolo}
    />
    <label htmlFor="cosmos-holo">
      Version Holo Cosmos ✨
    </label>
  </div>
)}
```

### Étape 4: Affichage des badges

#### Emplacements à modifier:
1. `src/components/features/collection/CardGrid.jsx`
2. `src/components/features/collection/CardDetails.jsx`
3. `src/pages/Collection.jsx`
4. `src/pages/Explore.jsx`

#### Pattern d'affichage:
```jsx
// Dans la base commune (Explore)
{card.has_cosmos_holo && <CosmosHoloBadge card={card} />}

// Dans la collection perso
{card.is_cosmos_holo && <CosmosHoloBadge card={card} isUserCopy />}
```

## Workflow utilisateur

### Scénario 1: Admin marque carte
1. Admin ouvre AdminDatabaseEditor
2. Recherche "Hop's Wooloo" (sv9-135)
3. Coche "Version Holo Cosmos disponible"
4. La carte a maintenant `has_cosmos_holo = true` dans `discovered_cards`
5. Badge apparaît dans "Explorer les séries"

### Scénario 2: User ajoute exemplaire cosmos
1. User cherche "Hop's Wooloo" dans "Explorer"
2. Voit badge "✨ Holo Cosmos" (indique version dispo)
3. Clique "Ajouter à ma collection"
4. Dans modal: voit checkbox "Version Holo Cosmos ✨"
5. Coche la case et ajoute
6. La carte dans collection a `is_cosmos_holo = true`
7. Badge spécial apparaît dans "Ma Collection"

## Filtres (future)
- Filtre "Holo Cosmos uniquement" dans Explore
- Filtre "Mes cartes cosmos" dans Collection
- Statistiques: "X cartes cosmos possédées"

## Migration des données
**Pas de migration nécessaire**:
- Colonne `has_cosmos_holo` a DEFAULT false
- Champ `is_cosmos_holo` ajouté dynamiquement dans collection

## Tests
1. ✅ SQL: Vérifier colonne créée
2. ✅ Admin: Marquer carte comme cosmos
3. ✅ Explore: Badge visible
4. ✅ Modal: Checkbox apparaît
5. ✅ Collection: Badge cosmos affiché
6. ✅ Update: Modifier statue cosmos d'un exemplaire

## Notes importantes
- **API Pokemon TCG**: Ne fournit PAS info holo cosmos (rareté = "Common")
- **Gestion manuelle**: Admin doit marquer cartes manuellement
- **Exemples connus**: Journey Together (sv9) contient cartes holo cosmos
- **Extension**: Hop's Wooloo #135, possiblement d'autres dans sv9
