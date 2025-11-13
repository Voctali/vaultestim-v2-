# Holo Cosmos - Tâches UI restantes

## ✅ Déjà fait (Partie 1)
- [x] SQL Supabase (colonne + index)
- [x] SupabaseService (whitelist + méthode update)
- [x] CosmosHoloBadge component créé
- [x] Documentation complète
- [x] Build vérifié ✅
- [x] Commit backend (v1.9.90)

## 🎯 À faire maintenant (Partie 2)

### 1. UI Admin - AdminDatabaseEditor.jsx

**Emplacement**: `src/pages/AdminDatabaseEditor.jsx`

**Ajouter après le champ "Rareté"** (ligne ~XXX):

```jsx
{/* Version Holo Cosmos */}
<div className="space-y-2">
  <label className="text-sm font-medium">Version Holo Cosmos</label>
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      id="has-cosmos-holo"
      checked={editingCard.has_cosmos_holo || false}
      onChange={(e) => setEditingCard({
        ...editingCard,
        has_cosmos_holo: e.target.checked
      })}
      className="h-4 w-4 rounded border-gray-300"
    />
    <label htmlFor="has-cosmos-holo" className="text-sm">
      Cette carte existe en version Holo Cosmos ✨
    </label>
  </div>
  <p className="text-xs text-muted-foreground">
    Cochez si cette carte existe avec une finition Holo Cosmos (motif cosmique spécial)
  </p>
</div>
```

**Sauvegarder** la valeur lors de l'update:
```jsx
// Dans la fonction handleSaveCard ou similaire
await SupabaseService.updateCardCosmosStatus(
  editingCard.id,
  editingCard.has_cosmos_holo
)
```

---

### 2. Modal Ajout - AddToCollectionModal.jsx

**Emplacement**: `src/components/features/collection/AddToCollectionModal.jsx`

**Importer le badge**:
```jsx
import { CosmosHoloBadge } from './CosmosHoloBadge'
```

**Ajouter state** (après les autres states):
```jsx
const [isCosmosHolo, setIsCosmosHolo] = useState(false)
```

**Afficher checkbox** (après quantity ou condition):
```jsx
{/* Version Holo Cosmos */}
{card.has_cosmos_holo && (
  <div className="space-y-2">
    <label className="text-sm font-medium">Version spéciale</label>
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id="cosmos-holo"
        checked={isCosmosHolo}
        onChange={(e) => setIsCosmosHolo(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300"
      />
      <label htmlFor="cosmos-holo" className="text-sm flex items-center gap-2">
        <CosmosHoloBadge card={{ has_cosmos_holo: true }} />
        Mon exemplaire est en Holo Cosmos
      </label>
    </div>
  </div>
)}
```

**Inclure dans l'objet** lors de l'ajout:
```jsx
// Dans handleAddToCollection
await addToCollection({
  ...card,
  quantity: quantity,
  is_cosmos_holo: isCosmosHolo, // ← AJOUTER CETTE LIGNE
  // ... autres propriétés
})
```

---

### 3. Affichage Badges

#### 3.1 Collection.jsx (`src/pages/Collection.jsx`)

**Importer**:
```jsx
import { CosmosHoloBadge } from '@/components/features/collection/CosmosHoloBadge'
```

**Afficher badge** (dans le rendu de chaque carte):
```jsx
{/* Près des autres badges (rareté, etc.) */}
<CosmosHoloBadge card={card} isUserCopy />
```

#### 3.2 Explore.jsx (`src/pages/Explore.jsx`)

**Importer**:
```jsx
import { CosmosHoloBadge } from '@/components/features/collection/CosmosHoloBadge'
```

**Afficher badge**:
```jsx
{/* Dans le rendu de carte */}
<CosmosHoloBadge card={card} />
```

#### 3.3 CardDetails (si modal détails existe)

Même pattern que ci-dessus.

---

## 🧪 Tests à effectuer

### Test 1: Marquer carte (Admin)
1. Aller dans Admin → Éditeur DB
2. Rechercher "Hop's Wooloo" (sv9-135)
3. Éditer la carte
4. Cocher "Cette carte existe en version Holo Cosmos ✨"
5. Sauvegarder
6. **Vérifier**: Badge apparaît dans "Explorer les séries"

### Test 2: Ajouter exemplaire cosmos
1. Aller dans "Explorer les séries"
2. Chercher la carte marquée (Wooloo)
3. **Vérifier**: Badge "✨ Holo Cosmos" visible
4. Cliquer "Ajouter à ma collection"
5. **Vérifier**: Checkbox "Version Holo Cosmos" apparaît
6. Cocher la case
7. Ajouter à la collection
8. **Vérifier**: Badge cosmos dans "Ma Collection"

### Test 3: Collection existante
1. Éditer une carte déjà dans collection
2. **Vérifier**: Peut marquer/démarquer comme cosmos
3. Sauvegarder
4. **Vérifier**: Badge mis à jour

---

## 📦 Déploiement

Une fois les changements UI terminés:

```bash
# Build
npm run build

# Commit
git add .
git commit -m "feat: Support Holo Cosmos - UI (v1.9.91) [2/2]"
git push github main
```

---

## 🎨 Style du badge

Le badge a été créé avec:
- Dégradé purple → pink → purple
- Animation pulse
- Texte "✨ Holo Cosmos"
- Border lumineux
- Shadow effet

Modification possible dans `CosmosHoloBadge.jsx` si besoin.

---

## 🔍 Debugging

### Badge n'apparaît pas?
- Vérifier `card.has_cosmos_holo === true` (console.log)
- Vérifier import du composant
- Vérifier que SQL a été exécuté

### Checkbox invisible?
- Vérifier `card.has_cosmos_holo` dans modal
- Vérifier condition `{card.has_cosmos_holo && ...}`

### Sauvegarde ne fonctionne pas?
- Vérifier `is_cosmos_holo` dans l'objet ajouté
- Vérifier logs Supabase

---

## 📝 Notes importantes

1. **Deux champs différents**:
   - `has_cosmos_holo` (discovered_cards): Carte existe en cosmos
   - `is_cosmos_holo` (collection): Mon exemplaire est cosmos

2. **Badge conditionnel**:
   - Base commune: `<CosmosHoloBadge card={card} />`
   - Ma collection: `<CosmosHoloBadge card={card} isUserCopy />`

3. **Stockage collection**:
   - Pas de nouvelle colonne SQL
   - Stocké dans l'objet JSONB existant
   - Même pattern que `quantity`, `condition`, etc.

---

## 🚀 Après déploiement

1. Tester en production
2. Marquer cartes Journey Together qui ont version cosmos
3. Documenter liste des cartes cosmos connues
4. Possibilité d'ajouter filtre "Holo Cosmos" plus tard

---

**Bon courage! Le backend est prêt, il ne reste que l'UI! 🎉**
