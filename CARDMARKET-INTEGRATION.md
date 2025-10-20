# 🎯 Intégration CardMarket - Guide Complet

## 📋 Vue d'ensemble

Ce document explique comment intégrer les données CardMarket dans VaultEstim v2 pour obtenir des **liens directs** vers les cartes exactes et les **produits scellés**.

---

## 🏗️ Architecture

### Données publiques (Supabase)
- `cardmarket_singles` : 59,683 cartes Pokémon
- `cardmarket_nonsingles` : 4,527 produits scellés
- `cardmarket_prices` : 64,210 guides de prix (EUR)

### Données privées (Supabase + RLS)
- `user_cardmarket_matches` : Liens entre vos cartes et CardMarket

### Cache local (optionnel)
- IndexedDB pour accélérer les recherches répétées

---

## 📥 ÉTAPE 1 : Créer les tables Supabase

### 1. Ouvrir Supabase SQL Editor
URL : https://supabase.com/dashboard/project/ubphwlmnfjdaiarbihcx/sql/new

### 2. Copier-coller le contenu de `supabase-cardmarket-schema.sql`

Ce fichier contient :
- ✅ Création des 4 tables
- ✅ Index pour performance
- ✅ Row Level Security (RLS)
- ✅ Triggers et vues utiles

### 3. Exécuter le script SQL

Cliquez sur "Run" et vérifiez qu'il n'y a pas d'erreurs.

---

## 📂 ÉTAPE 2 : Importer les fichiers JSON

### Option A : Via l'interface d'administration (Recommandé)

1. Lancer l'application : `npm run dev`
2. Se connecter en tant qu'admin
3. Aller dans **Admin → Système**
4. Trouver la section "Import CardMarket"
5. Sélectionner les 3 fichiers JSON :
   - `products_singles_6.json`
   - `products_nonsingles_6.json`
   - `price_guide_6.json`
6. Cliquer sur "Importer"
7. Attendre la fin (environ 5-10 minutes)

### Option B : Via script Node.js

```javascript
import { CardMarketSupabaseService } from './src/services/CardMarketSupabaseService.js'

// Charger les fichiers
const singles = require('./path/to/products_singles_6.json')
const nonsingles = require('./path/to/products_nonsingles_6.json')
const prices = require('./path/to/price_guide_6.json')

// Importer
await CardMarketSupabaseService.importFromJSON({
  singles,
  nonsingles,
  prices
}, (progress) => {
  console.log(`${progress.step}: ${progress.percent}%`)
})
```

---

## 🔗 ÉTAPE 3 : Matcher vos cartes

### Matching automatique

Le système va automatiquement matcher vos cartes avec CardMarket lors de l'ajout :

```javascript
import { CardMarketMatchingService } from '@/services/CardMarketMatchingService'
import { useAuth } from '@/hooks/useAuth'

const { user } = useAuth()

// Quand vous ajoutez une carte
const card = {
  name: "Amoonguss",
  number: "11",
  set: { id: "bw4", name: "Boundaries Crossed" },
  attacks: [
    { name: "Sporprise" },
    { name: "Rising Lunge" }
  ]
}

// Matcher automatiquement
const result = await CardMarketMatchingService.matchCard(card, user.id, true)

console.log(`Match trouvé: ${result.match.name}`)
console.log(`Score: ${(result.score * 100).toFixed(1)}%`)
console.log(`URL: ${CardMarketSupabaseService.buildDirectUrl(result.match.id_product)}`)
```

### Matching manuel (correction)

Si le matching automatique se trompe :

```javascript
// 1. Rechercher manuellement
const candidates = await CardMarketSupabaseService.searchCardsByName("Amoonguss", 50)

// 2. Sélectionner la bonne carte
const correctCard = candidates.find(c => c.name.includes("Sporprise"))

// 3. Sauvegarder manuellement
await CardMarketSupabaseService.saveUserMatch(
  user.id,
  "bw4-11",              // ID de votre carte
  correctCard.id_product, // ID CardMarket
  1.0,                   // Score parfait
  'manual',              // Méthode manuelle
  false                  // Pas un produit scellé
)
```

---

## 🖥️ ÉTAPE 4 : Utiliser les liens directs

### Dans CardMarketLinks

Le composant `CardMarketLinks` va automatiquement utiliser les matchings :

```jsx
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { CardMarketSupabaseService } from '@/services/CardMarketSupabaseService'

// Dans votre composant
const { user } = useAuth()
const [cardMarketMatch, setCardMarketMatch] = useState(null)

useEffect(() => {
  async function loadMatch() {
    const match = await CardMarketSupabaseService.getUserMatch(user.id, card.id)
    if (match) {
      setCardMarketMatch(match)
    }
  }
  loadMatch()
}, [card.id, user.id])

// Afficher le lien
{cardMarketMatch && (
  <a href={CardMarketSupabaseService.buildDirectUrl(cardMarketMatch.cardmarket_id_product)}>
    Voir sur CardMarket (lien direct)
  </a>
)}
```

---

## 📦 ÉTAPE 5 : Gérer les produits scellés

### Ajouter un produit scellé à sa collection

```javascript
// 1. Rechercher le produit
const products = await CardMarketSupabaseService.searchSealedProducts(
  "Vivid Voltage Booster",
  52 // Catégorie 52 = Boosters
)

// 2. Sélectionner le produit
const booster = products[0]

// 3. Ajouter à sa collection (via un nouveau contexte ou service)
await addSealedProductToCollection({
  cardmarket_id: booster.id_product,
  name: booster.name,
  category: booster.category_name,
  quantity: 3
})

// 4. Sauvegarder le matching
await CardMarketSupabaseService.saveUserMatch(
  user.id,
  `sealed-${booster.id_product}`,
  booster.id_product,
  1.0,
  'manual',
  true // C'est un produit scellé
)
```

---

## 📊 ÉTAPE 6 : Afficher les prix

### Récupérer le prix d'une carte

```javascript
const price = await CardMarketSupabaseService.getPriceForProduct(280234)

console.log(`Prix moyen: ${price.avg} EUR`)
console.log(`Prix min: ${price.low} EUR`)
console.log(`Tendance: ${price.trend} EUR`)
console.log(`Moyenne 7 jours: ${price.avg7} EUR`)
```

### Afficher dans l'interface

```jsx
{price && (
  <div>
    <div>Prix CardMarket (EUR):</div>
    <div>Moyenne: {price.avg?.toFixed(2)} €</div>
    <div>Minimum: {price.low?.toFixed(2)} €</div>
    <div>Tendance: {price.trend?.toFixed(2)} €</div>
  </div>
)}
```

---

## 🔄 Synchronisation Multi-Device

### Comment ça marche

1. **Appareil A** : Vous ajoutez Amoonguss → Matching automatique → Sauvegarde dans Supabase
2. **Appareil B** : Vous ouvrez l'app → Chargement automatique des matchings depuis Supabase
3. **Appareil C** : Les liens CardMarket sont immédiatement disponibles

### Charger les matchings au démarrage

```javascript
// Dans useCardDatabase ou équivalent
useEffect(() => {
  async function loadCardMarketMatches() {
    if (!user?.id) return

    const matches = await CardMarketSupabaseService.loadUserMatches(user.id)

    // Stocker dans le state
    setCardMarketMatches(matches)
  }

  loadCardMarketMatches()
}, [user?.id])
```

---

## 🧪 Tests et Validation

### Vérifier l'import

```javascript
const stats = await CardMarketSupabaseService.getStats()

console.log(`Singles: ${stats.total_singles}`)
console.log(`NonSingles: ${stats.total_nonsingles}`)
console.log(`Prix: ${stats.total_prices}`)
console.log(`Dernière MAJ prix: ${stats.last_price_update}`)
```

### Tester le matching

```javascript
const testCard = {
  name: "Pikachu VMAX",
  attacks: [
    { name: "Thunderbolt" },
    { name: "Max Lightning" }
  ]
}

const result = await CardMarketMatchingService.matchCard(testCard, user.id, false)

console.log(`Meilleur match: ${result.match.name}`)
console.log(`Score: ${(result.score * 100).toFixed(1)}%`)
console.log(`Top 5 candidats:`)
result.candidates.slice(0, 5).forEach(c => {
  console.log(`- ${c.name} (${(c.matchScore * 100).toFixed(1)}%)`)
})
```

---

## ⚠️ Limitations et Notes

### Matching basé sur les attaques

- **Précision** : ~70-95% selon la carte
- **Nécessite** : Les attaques doivent être présentes dans les données
- **Fallback** : Si pas d'attaques, matching par nom uniquement (~50-70%)

### Produits scellés

- **Pas de matching automatique** : Ajout manuel uniquement
- **Catégories** : Boosters (52), Decks, Elite Trainer Boxes, etc.

### Prix

- **Devise** : EUR uniquement (CardMarket Europe)
- **Mise à jour** : Manuelle (re-importer `price_guide_6.json`)
- **Disponibilité** : Certains produits n'ont pas de prix

### URLs directes

- **Format testé** : `https://www.cardmarket.com/en/Pokemon/Products/Singles?idProduct=280234`
- **Alternative** : `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=280234`
- **Note** : CardMarket peut changer leur structure d'URL

---

## 🔧 Maintenance

### Mettre à jour les prix

1. Télécharger le nouveau `price_guide_6.json` depuis CardMarket
2. Lancer l'import (uniquement pour `prices`)
3. Les anciens prix seront remplacés (upsert)

### Ajouter de nouvelles cartes

Si CardMarket ajoute de nouvelles cartes :
1. Télécharger le nouveau `products_singles_6.json`
2. Re-importer (upsert = pas de doublons)

### Nettoyer les données (DANGER!)

```javascript
// ATTENTION: Supprime TOUTES les données CardMarket
await CardMarketSupabaseService.clearAllData()
```

---

## 📚 Fichiers Créés

- ✅ `supabase-cardmarket-schema.sql` - Schéma des tables
- ✅ `src/services/CardMarketSupabaseService.js` - Service Supabase
- ✅ `src/services/CardMarketMatchingService.js` - Matching automatique
- ⏳ `src/pages/SealedProducts.jsx` - Page produits scellés
- ⏳ `src/components/features/admin/CardMarketImportPanel.jsx` - Interface d'import admin

---

## 🎯 Prochaines Étapes

1. ✅ Créer les tables Supabase
2. ✅ Importer les données JSON
3. ⏳ Tester le matching avec vos cartes existantes
4. ⏳ Intégrer les liens directs dans CardMarketLinks
5. ⏳ Créer la page Produits Scellés
6. ⏳ Tester la synchronisation multi-device

---

## 💡 Support

Si vous rencontrez des problèmes :
1. Vérifier les logs console (🔍, ✅, ❌, 💾, etc.)
2. Vérifier que les tables Supabase existent
3. Vérifier que les données sont bien importées (`getStats()`)
4. Vérifier les permissions RLS dans Supabase

---

**Bonne chance avec l'intégration ! 🚀**
