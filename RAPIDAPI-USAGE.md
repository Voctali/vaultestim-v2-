# 📊 Guide d'Utilisation RapidAPI (100 req/jour)

## ✅ Configuration Activée

```env
VITE_USE_RAPIDAPI=true
VITE_RAPIDAPI_KEY=523ca9be5emsh10d5931a9d95b87p18cd5cjsn641503bb34b6
VITE_RAPIDAPI_HOST=cardmarket-api-tcg.p.rapidapi.com
VITE_RAPIDAPI_DAILY_QUOTA=100
```

## 🎯 Utilisation du Quota

### Catalogue Produits Scellés
- **Chargement initial** : 0 requête (données Supabase)
- **Recherche API** : 1 requête par terme recherché
- **Consommation estimée** : 5-10 requêtes/jour

### Images des Produits
- **RapidAPI actif** : Images depuis RapidAPI (pas de 403 Cloudflare)
- **Fallback Supabase** : Si quota épuisé → images CardMarket (peut avoir 403)

## 📈 Monitoring du Quota

### Dans l'Interface
- Badge "Quota" affiché sur chaque recherche
- Stats en temps réel : `X/100 requêtes utilisées`
- Réinitialisation automatique à minuit

### Dans la Console
```javascript
// Voir les stats
console.log('📊 Stats quota:', QuotaTracker.getStats())

// Résultat:
{
  used: 5,
  limit: 100,
  remaining: 95,
  percentUsed: 5,
  isExhausted: false,
  isNearLimit: false,
  resetAt: Date
}
```

## 🔄 Fallback Automatique

Le système bascule automatiquement vers Supabase CardMarket si :
1. Quota RapidAPI épuisé (100/100)
2. Erreur API RapidAPI
3. RapidAPI désactivé (`.env`)

## 💡 Bonnes Pratiques

### ✅ Recommandé
- Utiliser le **chargement initial** (Supabase, 0 requête)
- Recherche API pour des **produits spécifiques**
- Consulter le quota avant recherches massives

### ❌ À Éviter
- Recherches API répétitives du même terme (cache déjà actif)
- Tester avec 100 requêtes d'un coup
- Recherches vides ou trop génériques

## 🧪 Test de la Configuration

### 1. Vérifier que RapidAPI est actif
```bash
# Dans la console du navigateur sur /explorer/catalogue-produits-scelles
console.log('RapidAPI activé:', import.meta.env.VITE_USE_RAPIDAPI)
// Résultat attendu: "true"
```

### 2. Faire une recherche test
```
1. Aller sur /explorer/catalogue-produits-scelles
2. Recherche API : "booster"
3. Vérifier console :
   - ✅ "🚀 RapidAPI: Recherche produits..."
   - ✅ "✅ X produits trouvés"
   - ✅ Images qui s'affichent (pas d'icône cassée)
```

### 3. Vérifier les images
```
- Clic droit sur image → "Inspecter"
- Vérifier URL src (ne doit PAS être static.cardmarket.com)
- URL attendue : celle fournie par RapidAPI
```

## 🐛 Dépannage

### Images toujours cassées ?
1. Vérifier `.env` : `VITE_USE_RAPIDAPI=true`
2. Relancer serveur dev : `npm run dev`
3. Vider cache navigateur (Ctrl+Shift+R)
4. Vérifier console pour erreurs RapidAPI

### Quota épuisé ?
- Attendre minuit pour reset automatique
- Ou utiliser fallback Supabase (images peuvent avoir 403)

### Erreur "Invalid API Key" ?
- Vérifier `VITE_RAPIDAPI_KEY` dans `.env`
- Régénérer clé sur rapidapi.com si nécessaire

## 📋 Endpoints RapidAPI Disponibles

### Produits Scellés
```
/pokemon/products/search?search={term}&limit={limit}
→ Boosters, ETB, Decks, Cases

Retour: {
  data: [{
    id: number,
    name: string,
    image: string,        // ← URL IMAGE
    category: { id, name },
    prices: { cardmarket: {...} }
  }]
}
```

### Extensions
```
/pokemon/expansions
→ Liste complète des extensions Pokemon

/pokemon/products/expansion/{slug}
→ Produits d'une extension spécifique
```

## 🎯 Résumé

- **100 requêtes/jour** = Largement suffisant pour usage normal
- **Images RapidAPI** = Pas de blocage Cloudflare 403
- **Fallback intelligent** = Jamais bloqué, toujours fonctionnel
- **Monitoring intégré** = Visibilité totale sur consommation

---

**Dernière mise à jour** : 2025-01-14
