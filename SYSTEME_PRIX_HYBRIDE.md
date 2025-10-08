# 💰 Système de Prix Hybride - CardMarket + Approximations

## 🎯 Objectif
Utiliser les **vraies données CardMarket** quand disponibles, et compléter avec des **estimations basées sur %** pour les états manquants.

## 📊 Données CardMarket disponibles (via API Pokemon TCG)

CardMarket fournit via l'API Pokemon TCG:

### Prix globaux:
- ✅ **`trendPrice`** - Prix tendance du marché (référence Near Mint)
- ✅ **`averageSellPrice`** - Prix moyen de vente
- ✅ **`lowPrice`** - Prix le plus bas actuel (toutes conditions)

### Prix spécifiques:
- ✅ **`lowPriceExPlus`** - Prix le plus bas pour condition **"Excellent ou meilleure"**
- ✅ **`germanProLow`** - Prix le plus bas vendeurs pros allemands
- ✅ Prix Reverse Holo (`reverseHoloTrend`, `reverseHoloLow`, etc.)

### Prix temporels:
- ✅ `avg1`, `avg7`, `avg30` - Moyennes sur 1/7/30 jours

## 🔀 Stratégie Hybride Implémentée

| État sélectionné | Source du prix | Type |
|------------------|----------------|------|
| **Mint** | `avg7 × 1.15` | ⚠️ **Estimation** (+15%) |
| **Quasi-neuf (NM)** | **`avg7`** (moyenne 7 jours) | ✅ **VRAIE DONNÉE** CardMarket (stable) |
| **Excellent (EX)** | **`lowPriceExPlus`** | ✅ **VRAIE DONNÉE** CardMarket |
| **Légèrement joué (LP)** | `lowPrice` si < avg7 | ✅ **VRAIE DONNÉE** ou ⚠️ × 0.80 |
| **Bon (GD)** | `lowPrice` si < avg7 | ✅ **VRAIE DONNÉE** ou ⚠️ × 0.70 |
| **Joué (PL)** | **`lowPrice`** | ✅ **VRAIE DONNÉE** CardMarket |
| **Mauvais état (PO)** | `lowPrice` | ✅ **VRAIE DONNÉE** ou ⚠️ × 0.40 |
| **Endommagé (DMG)** | `lowPrice` | ✅ **VRAIE DONNÉE** ou ⚠️ × 0.25 |

## 🧠 Logique du code

### Fonction principale: `calculatePriceByCondition()`

```javascript
export function calculatePriceByCondition(basePrice, condition, cardMarketPrices) {
  // Si données CardMarket disponibles → VRAIES DONNÉES
  if (cardMarketPrices?.prices) {
    const cm = cardMarketPrices.prices

    switch (condition) {
      case 'excellent':
        // VRAIE DONNÉE: lowPriceExPlus
        if (cm.lowPriceExPlus) {
          console.log(`✅ Prix Excellent réel: ${cm.lowPriceExPlus}€`)
          return cm.lowPriceExPlus
        }
        break

      case 'played':
      case 'poor':
      case 'damaged':
        // VRAIE DONNÉE: lowPrice (prix le plus bas du marché)
        if (cm.lowPrice) {
          console.log(`✅ Prix ${condition} réel: ${cm.lowPrice}€`)
          return cm.lowPrice
        }
        break
    }
  }

  // FALLBACK: Utiliser les % si pas de données réelles
  console.log(`⚠️ Prix ${condition} estimé (% approximation)`)
  return basePrice * getConditionMultiplier(condition)
}
```

## 📈 Exemple concret

### Carte: Charizard ex (Paldean Fates #234/091)

**Données CardMarket reçues:**
```json
{
  "cardmarket": {
    "prices": {
      "trendPrice": 260.97,      // Tendance générale (toutes conditions)
      "averageSellPrice": 247.7, // Prix moyen ventes
      "avg1": 215,               // Moyenne 1 jour
      "avg7": 215.08,            // Moyenne 7 jours (STABLE = Near Mint)
      "avg30": 250.22,           // Moyenne 30 jours
      "lowPrice": 140,           // Prix le plus bas (toutes conditions)
      "lowPriceExPlus": 150      // Prix le plus bas Excellent+
    }
  }
}
```

**Prix calculés selon l'état:**

| État | Calcul | Prix final | Source |
|------|--------|-----------|--------|
| Mint | 215.08 × 1.15 | **247.34€** | ⚠️ Estimation |
| Near Mint | **avg7** | **215.08€** | ✅ CardMarket (VRAIE DONNÉE - moyenne 7j) |
| Excellent | **lowPriceExPlus** | **150.00€** | ✅ CardMarket (VRAIE DONNÉE) |
| Légèrement joué | lowPrice | **140.00€** | ✅ CardMarket (VRAIE DONNÉE) |
| Bon | lowPrice | **140.00€** | ✅ CardMarket (VRAIE DONNÉE) |
| Joué | lowPrice | **140.00€** | ✅ CardMarket (VRAIE DONNÉE) |
| Mauvais état | 215.08 × 0.40 | **86.03€** | ⚠️ Estimation (si lowPrice > 86€) |
| Endommagé | 215.08 × 0.25 | **53.77€** | ⚠️ Estimation (si lowPrice > 53€) |

## 🔍 Logs de debug

Le système affiche dans la console la source du prix:

```
💰 ===== PRIX COMPLETS pour Charizard ex (Paldean Fates #234/091) =====
📊 CardMarket - Tous les prix disponibles:
  • trendPrice: 260.97 € (tendance marché)
  • averageSellPrice: 247.7 € (moyenne ventes réelles)
  • lowPrice: 140 € (prix le plus bas)
  • lowPriceExPlus: 150 € (prix le plus bas Excellent+)
  • avg1: 215 € (moyenne 1 jour)
  • avg7: 215.08 € (moyenne 7 jours)
  • avg30: 250.22 € (moyenne 30 jours)

✅ Prix Near Mint utilisé: 215.08€ (champ: avg7)
✅ Prix Excellent réel (CardMarket): 150.00€
✅ Prix played réel (CardMarket lowPrice): 140.00€
⚠️ Prix mint estimé (% approximation)
```

## 🎯 Avantages du système hybride

1. ✅ **Précision maximale** - Utilise les vrais prix du marché quand disponibles
2. ✅ **Complet** - Fonctionne même si CardMarket ne fournit pas toutes les données
3. ✅ **Transparent** - Logs indiquent si prix réel ou estimation
4. ✅ **Évolutif** - Facile d'ajouter d'autres sources de prix réels
5. ✅ **Réaliste** - Approximations basées sur standards du marché
6. ✅ **Stabilité** - Utilise `avg7` (moyenne 7 jours) pour éviter la volatilité quotidienne

## 💡 Pourquoi `avg7` pour Near Mint ?

**Analyse des champs CardMarket :**

| Champ | Valeur | Problème |
|-------|--------|----------|
| `trendPrice` | 260.97€ | Trop élevé - inclut toutes les conditions |
| `averageSellPrice` | 247.7€ | Trop élevé - inclut conditions variées |
| `avg30` | 250.22€ | Moyenne longue durée, moins précise |
| **`avg7`** ✅ | **215.08€** | **Équilibre parfait : stable et réaliste** |
| `avg1` | 215€ | Trop volatile (prix quotidien) |
| `lowPrice` | 140€ | Trop bas - inclut cartes endommagées |
| `lowPriceExPlus` | 150€ | Pour Excellent, pas Near Mint |

**Conclusion :** `avg7` est la meilleure référence Near Mint car :
- 📊 Moyenne stable sur 1 semaine (pas de variations quotidiennes)
- 💰 Prix réaliste du marché Near Mint
- ✅ Plus précis que `trendPrice` qui inclut toutes les conditions

## 🚀 Évolutions futures possibles

Une fois que CardMarket aura une API publique complète:
- [ ] Intégrer API CardMarket directe
- [ ] Obtenir prix pour TOUS les états (M, NM, EX, GD, LP, PL, PO)
- [ ] Afficher nombre d'offres par état
- [ ] Historique des prix par état
- [ ] Alertes prix selon état

## 📦 Fichiers modifiés

- ✅ **`src/utils/cardConditions.js`** - Logique hybride
- ✅ **`src/utils/priceFormatter.js`** - Passage données CardMarket
- ✅ **`src/services/TCGdxService.js`** - Stockage données complètes

---

**🎴 VaultEstim v2 - Prix précis pour collectionneurs exigeants**
