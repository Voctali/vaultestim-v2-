# Fix - Édition des Produits Scellés

## Problème résolu

❌ **Avant** : Erreur lors de la modification d'un produit scellé
```
Could not find the 'cardmarketIdProduct' column of 'user_sealed_products' in the schema cache
```

✅ **Après** : Modification fonctionnelle + nouveaux champs disponibles

## Modifications apportées

### 1. Correction du mapping des colonnes (Bug principal)
**Problème** : La modale envoyait les données en camelCase mais Supabase attend du snake_case.

**Fichiers modifiés** :
- `src/components/features/admin/SealedProductModal.jsx` - Mapping corrigé dans `handleSubmit`
- `src/services/UserSealedProductsService.js` - Cohérence dans `addSealedProduct`

**Avant** :
```javascript
cardmarketIdProduct: formData.cardmarketIdProduct  // ❌ camelCase
```

**Après** :
```javascript
cardmarket_id_product: formData.cardmarketIdProduct  // ✅ snake_case
```

### 2. Nouveaux champs ajoutés (Demande utilisateur)

**Champs ajoutés dans la modale d'édition** :
1. **Nombre d'exemplaires** (`quantity`) - Avec boutons +/- pour ajuster facilement
2. **État du produit** (`condition`) - Select avec 3 options : Impeccable, Défaut léger, Abîmé
3. **Prix d'achat** (`purchase_price`) - Input optionnel en EUR

**Interface** :
- Contrôles intuitifs pour la quantité (boutons plus/moins)
- Dropdown pour l'état avec descriptions
- Champ prix avec icône Euro et placeholder

## Installation - IMPORTANT

### Étape 1 : Exécuter le script SQL dans Supabase

⚠️ **REQUIS** : Les nouvelles colonnes doivent être ajoutées à la table `user_sealed_products`

1. Ouvrir le SQL Editor de Supabase :
   ```
   https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new
   ```

2. Copier-coller le contenu du fichier `add-sealed-products-columns.sql`

3. Cliquer sur "Run" pour exécuter le script

4. Vérifier que les colonnes ont été ajoutées (le script affiche la structure finale)

### Étape 2 : Redémarrer le serveur de développement

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer
npm run dev
```

### Étape 3 : Tester

1. Se connecter à l'application
2. Aller dans "Collection" → "Produits Scellés"
3. Cliquer sur "Modifier" sur un produit existant
4. **Vérifier** :
   - ✅ La catégorie peut être modifiée
   - ✅ Le nombre d'exemplaires apparaît et peut être modifié
   - ✅ L'état du produit peut être sélectionné
   - ✅ Le prix d'achat peut être renseigné
   - ✅ La sauvegarde fonctionne sans erreur

## Structure des colonnes ajoutées

```sql
quantity         INTEGER       DEFAULT 1         NOT NULL
condition        TEXT          DEFAULT 'Impeccable'
purchase_price   DECIMAL(10,2)                   NULL
```

**Contraintes** :
- `quantity` doit être > 0
- `condition` doit être 'Impeccable', 'Défaut léger' ou 'Abîmé'

## En cas d'erreur

### Erreur : "column does not exist"

➡️ **Solution** : Le script SQL n'a pas été exécuté ou a échoué
- Vérifier les logs dans Supabase SQL Editor
- Re-exécuter le script
- Vérifier que vous êtes sur le bon projet Supabase

### Erreur : "constraint violation"

➡️ **Solution** : Valeur invalide pour `quantity` ou `condition`
- `quantity` doit être ≥ 1
- `condition` doit être une des 3 valeurs prédéfinies

## Fichiers modifiés

```
src/
├── components/features/admin/
│   └── SealedProductModal.jsx          # ✅ Correction mapping + nouveaux champs
├── services/
│   └── UserSealedProductsService.js     # ✅ Support snake_case + nouveaux champs
└── (Aucune autre modification nécessaire)
```

## Commit recommandé

Une fois testé et validé :

```bash
git add .
git commit -m "fix: Correction édition produits scellés + ajout champs quantity/condition/purchase_price

- Fix: Correction mapping camelCase → snake_case (cardmarketIdProduct)
- Feat: Ajout champ 'Nombre d'exemplaires' avec contrôles +/-
- Feat: Ajout champ 'État du produit' (Impeccable/Défaut léger/Abîmé)
- Feat: Ajout champ 'Prix d'achat' optionnel
- SQL: Script pour ajouter colonnes quantity, condition, purchase_price

Fixes #XX (si issue GitHub)
"
git push github main
```

## Support

Si le problème persiste après avoir suivi ces étapes :
1. Vérifier les logs de la console (F12)
2. Vérifier que le script SQL s'est bien exécuté
3. Vérifier que les colonnes existent dans Supabase Table Editor
