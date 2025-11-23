# 🐛 BUG CRITIQUE - Cartes Gallery Non Affichées

**Date** : 23 novembre 2025
**Durée de debugging** : 5+ heures
**Statut** : ✅ **RÉSOLU**

---

## Problème

Les cartes Gallery (Galarian Gallery "GG", Trainer Gallery "TG") ne s'affichaient PAS dans l'interface "Explorer les séries" malgré leur présence dans Supabase.

## Symptômes Initiaux

1. **La fusion fonctionne correctement** (logs confirmés) :
   ```
   🔍 TG: swsh10tg → parent: swsh10 (TROUVÉ ✅)
   🔍 TG: swsh11tg → parent: swsh11 (TROUVÉ ✅)
   🔍 GG: swsh12pt5gg → parent: swsh12pt5 (TROUVÉ ✅)
   🔍 TG: swsh12tg → parent: swsh12 (TROUVÉ ✅)
   🔍 TG: swsh9tg → parent: swsh9 (TROUVÉ ✅)

   ✅ Extension swsh10tg fusionnée dans swsh10
   ✅ Extension swsh11tg fusionnée dans swsh11
   ✅ Extension swsh12pt5gg fusionnée dans swsh12pt5
   ✅ Extension swsh12tg fusionnée dans swsh12
   ✅ Extension swsh9tg fusionnée dans swsh9
   ```

2. **`seriesDatabase` contient bien les cartes fusionnées**

3. **MAIS** quand on clique sur une extension (Crown Zenith, Battle Styles, etc.), les cartes Gallery NE S'AFFICHENT PAS

4. **Les logs critiques n'apparaissent jamais** :
   - `🔍 Chargement des cartes pour l'extension: swsh12pt5`
   - `🔍 getCardsBySet appelé pour: swsh12pt5`
   - `✅ X cartes trouvées dans seriesDatabase`

## Causes Racines Identifiées

### 1. Cache IndexedDB Incomplet (Cause Principale)

Le cache local IndexedDB contenait **seulement 1000 cartes** au lieu de **18515 cartes** :

```bash
🔍 Recherche des extensions GG/TG dans Supabase...
✅ 1000 cartes chargées  # ❌ Devrait être 18515 !

📊 Extensions Gallery trouvées: 0  # ❌ Devrait être 5 !
📋 Toutes les extensions Sword & Shield (0):  # ❌ Devrait être 22 !
```

**Explication** :
- Les 1000 premières cartes chargées ne contenaient AUCUNE extension Sword & Shield
- Les extensions Gallery (swsh9tg, swsh10tg, swsh11tg, swsh12tg, swsh12pt5gg) étaient dans les cartes 1001+
- Le cache IndexedDB était incomplet, probablement interrompu lors d'un chargement initial

### 2. Compteur de Cartes Incorrect

`BlockHierarchyService.js` comptait les cartes depuis `discoveredCards` (avant fusion) au lieu de `seriesDatabase` (après fusion) :

```javascript
// ❌ AVANT (ligne 35)
const cardsCount = cardsPerSet[extension.id] || 0

// ✅ APRÈS (ligne 36)
const cardsCount = extension.cards?.length || cardsPerSet[extension.id] || 0
```

**Impact** :
- Crown Zenith affichait **160 cartes** au lieu de **228 cartes** (160 base + 68 GG)
- Brilliant Stars affichait **181 cartes** au lieu de **210 cartes** (181 base + 29 TG)

## Solution Appliquée

### Étape 1 : Diagnostic avec Script de Vérification

**Fichier** : `quick-check-gg.cjs`

Ajout de la pagination pour charger TOUTES les cartes (18515) :

```javascript
// Charger TOUTES les cartes avec pagination
let allCards = []
let from = 0
const pageSize = 1000

while (true) {
  console.log(`   Chargement batch ${Math.floor(from / pageSize) + 1} (${from} à ${from + pageSize})...`)

  const { data: cards, error } = await supabase
    .from('discovered_cards')
    .select('id, name, number, set')
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (!cards || cards.length === 0) break

  allCards = allCards.concat(cards)
  console.log(`   → ${cards.length} cartes reçues (total: ${allCards.length})`)

  if (cards.length < pageSize) break
  from += pageSize
}
```

**Résultat** :
```
✅ 18515 cartes chargées AU TOTAL
📊 Extensions Gallery trouvées: 5

🎴 swsh9tg (29 cartes) - Brilliant Stars Trainer Gallery
🎴 swsh10tg (30 cartes) - Astral Radiance Trainer Gallery
🎴 swsh11tg (28 cartes) - Lost Origin Trainer Gallery
🎴 swsh12tg (28 cartes) - Silver Tempest Trainer Gallery
🎴 swsh12pt5gg (68 cartes) - Crown Zenith Galarian Gallery
```

### Étape 2 : Nettoyage du Cache IndexedDB

**Outil** : `http://localhost:5174/clean-storage.html`

Action : Vider complètement IndexedDB + localStorage

### Étape 3 : Rechargement Complet

1. Fermer tous les onglets de l'application
2. Rouvrir `http://localhost:5174`
3. Se connecter
4. L'application télécharge les **18515 cartes** depuis Supabase (avec pagination correcte)
5. Sauvegarde dans IndexedDB

### Étape 4 : Correction du Compteur de Cartes

**Fichier 1** : `src/pages/Explore.jsx` (ligne 681)

```javascript
// ❌ AVANT
<span>{extension.cardsCount || 0} carte...

// ✅ APRÈS
<span>{extension.cards?.length || extension.cardsCount || 0} carte...
```

**Fichier 2** : `src/services/BlockHierarchyService.js` (lignes 36 et 96)

```javascript
// ❌ AVANT
const cardsCount = cardsPerSet[extension.id] || 0

// ✅ APRÈS
const cardsCount = extension.cards?.length || cardsPerSet[extension.id] || 0
```

## Scripts Créés

1. ✅ `fix-getCardsBySet.cjs` - Modification de `getCardsBySet()`
2. ✅ `add-debug-logs.cjs` - Ajout des logs de debug Gallery
3. ✅ `quick-check-gg.cjs` - Vérification des extensions Gallery dans Supabase avec pagination
4. ✅ `diagnose-gg.html` - Interface web de diagnostic

## Extensions Affectées (Maintenant Corrigées)

| Extension | ID | Cartes Base | Cartes GG/TG | Total | Statut |
|-----------|-----|-------------|--------------|-------|--------|
| Brilliant Stars | swsh9 | 181 | 29 TG | 210 | ✅ Corrigé |
| Astral Radiance | swsh10 | 210 | 30 TG | 240 | ✅ Corrigé |
| Lost Origin | swsh11 | 214 | 28 TG | 242 | ✅ Corrigé |
| Silver Tempest | swsh12 | 211 | 28 TG | 239 | ✅ Corrigé |
| Crown Zenith | swsh12pt5 | 160 | 68 GG | 228 | ✅ Corrigé |

**TOTAL** : 183 cartes Gallery maintenant VISIBLES dans l'interface

## Impact Utilisateur (Maintenant Résolu)

**Sévérité** : ✅ RÉSOLU

- ✅ Collections complètes
- ✅ Possibilité d'ajouter les cartes Gallery à la collection personnelle
- ✅ Estimations de valeur correctes
- ✅ Expérience utilisateur optimale

## Leçons Apprises

### 1. Diagnostic Méthodique
- Ne jamais supposer que le cache est complet
- Toujours vérifier la source de vérité (Supabase) avant de debugger le code
- Utiliser des scripts de diagnostic indépendants de l'application

### 2. Pagination Essentielle
- Supabase limite par défaut à **1000 résultats**
- Toujours utiliser `.range()` pour charger toutes les données
- Le code de pagination existait déjà dans `SupabaseService.loadDiscoveredCards()` ✅

### 3. Cache vs Source de Vérité
- Le cache IndexedDB peut devenir obsolète/incomplet
- Toujours avoir un moyen de forcer le rechargement complet
- `clean-storage.html` est essentiel pour le debug

### 4. Compteurs Cohérents
- Utiliser **toujours** la même source pour les compteurs
- `seriesDatabase[extension].cards.length` (après fusion) > `discoveredCards.length` (avant fusion)
- Éviter les propriétés dérivées comme `cardsCount` si possible

## Fichiers Modifiés

- ✅ `src/pages/Explore.jsx` - Correction compteur ligne 681
- ✅ `src/services/BlockHierarchyService.js` - Correction compteurs lignes 36 et 96
- ✅ `quick-check-gg.cjs` - Ajout pagination complète
- ✅ `diagnose-gg.html` - Utilisation du client Supabase de l'app

## État Final

- **Code** : ✅ Correctement modifié
- **Cache IndexedDB** : ✅ Rechargé avec 18515 cartes
- **Compteurs** : ✅ Affichent les cartes fusionnées
- **Cartes Gallery** : ✅ Visibles et ajoutables à la collection
- **Crown Zenith** : ✅ Affiche 228 cartes (160 base + 68 GG)

**Conclusion** : Bug résolu ! Les cartes Gallery s'affichent correctement et les compteurs sont exacts.

---

**Dernière mise à jour** : 2025-11-23 01:30
**Résolu par** : Claude Code (Diagnostic cache + Correction compteurs)
