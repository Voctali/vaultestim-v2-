# 💰 Système de Prix et Rareté - VaultEstim v2

## ✅ Fonctionnalités implémentées

### 1. **Prix basés sur CardMarket (EUR) en priorité**
- ✅ CardMarket (marché européen/français) utilisé en PRIORITÉ
- ✅ TCGPlayer (marché américain USD) en fallback
- ✅ Prix automatiquement en EUR pour les utilisateurs français
- ✅ Champs ajoutés aux cartes:
  - `marketPriceCurrency` - EUR ou USD
  - `marketPriceSource` - 'CardMarket' ou 'TCGPlayer'

### 2. **Prix selon la rareté exacte de la carte**
- ✅ Détection automatique de la rareté (Rare Holo, Reverse Holo, etc.)
- ✅ Mapping intelligent pour CardMarket:
  - Reverse Holo → Prix `reverseHoloTrend/reverseHoloSell`
  - Normale → Prix `trendPrice/averageSellPrice/lowPrice`
- ✅ Mapping intelligent pour TCGPlayer:
  - Reverse Holo → `reverseHolofoil` > `holofoil` > `normal`
  - Rare Holo → `holofoil` > `unlimitedHolofoil` > `1stEditionHolofoil`
  - Commune/Peu commune → `normal` > `unlimitedNormal`

### 3. **Prix selon l'état de la carte**
- ✅ 8 états disponibles avec multiplicateurs standard du marché:
  - **Mint** - 115% du prix (carte parfaite)
  - **Quasi-neuf (NM)** - 100% (référence)
  - **Excellent (EX)** - 85%
  - **Légèrement joué (LP)** - 80%
  - **Bon (GD)** - 70%
  - **Joué (PL)** - 60%
  - **Mauvais état (PO)** - 40%
  - **Endommagé (DMG)** - 25%

- ✅ Calcul automatique du prix ajusté
- ✅ Sélecteur d'état dans le modal d'ajout à la collection
- ✅ Affichage en temps réel du prix selon l'état sélectionné

### 4. **Traductions françaises**
- ✅ Raretés traduites automatiquement:
  - "Common" → "Commune"
  - "Rare Holo" → "Rare Holo"
  - "Rare Ultra" → "Ultra Rare"
  - "Rare Secret" → "Secret Rare"
  - etc. (40+ raretés)

- ✅ États traduits:
  - "Near Mint" → "Quasi-neuf (NM)"
  - "Lightly Played" → "Légèrement joué (LP)"
  - "Damaged" → "Endommagé (DMG)"
  - etc.

## 📂 Fichiers créés/modifiés

### Nouveaux fichiers:
- `src/utils/cardConditions.js` - Gestion états et traductions
- `src/utils/priceFormatter.js` - Formatage prix avec devise

### Fichiers modifiés:
- `src/services/TCGdxService.js` - Logique prix par rareté + traductions
- `src/components/features/collection/AddToCollectionModal.jsx` - Sélecteur d'état avec prix en temps réel
- `src/components/features/explore/CardSearchResults.jsx` - Affichage prix avec devise
- `src/components/features/collection/CardDetailsModal.jsx` - Affichage prix avec devise

## 🎯 Exemples de logs

```
💰 Prix pour Pikachu [Commune]: 0.50 EUR (CardMarket Normal)
💰 Prix pour Charizard [Rare Holo VMAX]: 150.00 EUR (CardMarket Normal)
💰 Prix pour Mew [Reverse Holo]: 8.99 EUR (CardMarket Reverse Holo)
💰 Prix pour Mewtwo [Ultra Rare]: 45.00 USD (TCGPlayer holofoil)
```

## 🖥️ Interface utilisateur

### Modal d'ajout à la collection:
1. **Sélecteur d'état** avec liste déroulante:
   - Mint (115%)
   - Quasi-neuf (NM) (100%) ← par défaut
   - Excellent (EX) (85%)
   - etc.

2. **Prix affiché en temps réel**:
   ```
   Prix marché (Near Mint): 12.50€
   
   État: [Sélecteur] Légèrement joué (LP) (80%)
   Prix selon état: 10.00€  ← Mis à jour automatiquement
   
   Rareté: Rare Holo  ← Traduit en français
   ```

## 🔧 Utilisation pour les développeurs

### Formater un prix avec état:
```javascript
import { formatCardPriceWithCondition } from '@/utils/priceFormatter'

// Prix ajusté selon l'état
const price = formatCardPriceWithCondition(card, 'light_played')
// Résultat: "10.00€" (si prix de base = 12.50€)
```

### Traduire une rareté:
```javascript
import { translateRarity } from '@/utils/cardConditions'

const rarityFr = translateRarity('Rare Holo')
// Résultat: "Rare Holo"

const rarityFr2 = translateRarity('Common')
// Résultat: "Commune"
```

### Obtenir le multiplicateur d'état:
```javascript
import { getConditionMultiplier } from '@/utils/cardConditions'

const multiplier = getConditionMultiplier('excellent')
// Résultat: 0.85 (85%)
```

## 📊 Structure des données carte

```javascript
{
  name: "Pikachu",
  rarity: "Rare Holo",              // Traduit en français
  rarityOriginal: "Rare Holo",      // Anglais (pour calculs)
  condition: "near_mint",            // État par défaut
  marketPrice: 12.50,                // Prix de base (Near Mint)
  marketPriceCurrency: "EUR",        // Devise
  marketPriceSource: "CardMarket",   // Source
  marketPriceDetails: {              // Détails complets
    amount: 12.50,
    currency: "EUR",
    source: "CardMarket",
    variant: "normal",
    low: 10.00,
    trend: 12.50,
    avg: 11.80
  }
}
```

## 🚀 Prochaines étapes possibles

- [ ] Ajouter historique des prix (graphique évolution)
- [ ] Importer prix depuis sources multiples (eBay, TCGPlayer direct)
- [ ] Système de notation (grading PSA, BGS)
- [ ] Calculateur de valeur totale de collection par état
- [ ] Export CSV avec prix selon état

---

**🎴 Fait avec ❤️ pour VaultEstim v2**
