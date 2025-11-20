# 🔧 PATCH: Pagination RapidAPI + Sauvegarde Automatique Supabase

**Date**: 15/11/2025
**Statut**: ✅ APPLIQUÉ ET FONCTIONNEL

---

## 🎯 Objectif

Récupérer automatiquement jusqu'à 1000 produits scellés via RapidAPI (au lieu de 20) et les sauvegarder dans Supabase pour consultation ultérieure sans consommer de quota API.

---

## ⚙️ Configuration Supabase Requise

### 1. Ajouter la colonne `image_url`

```sql
ALTER TABLE cardmarket_nonsingles
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### 2. Configurer les politiques RLS (Row-Level Security)

#### Pour `cardmarket_nonsingles`:
```sql
-- Autoriser l'insertion pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to insert products"
ON cardmarket_nonsingles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Autoriser la mise à jour pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to update products"
ON cardmarket_nonsingles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

#### Pour `cardmarket_prices`:
```sql
-- Autoriser l'insertion pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to insert prices"
ON cardmarket_prices
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Autoriser la mise à jour pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to update prices"
ON cardmarket_prices
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

---

## 1️⃣ Fichier: `src/services/RapidAPIService.js`

### ✅ APPLIQUÉ - Pagination automatique (ligne ~243-342)

**Changement clé**: Utiliser `page` au lieu de `offset` pour la pagination

```javascript
static async searchProducts(searchTerm, options = {}) {
  if (!this.isAvailable()) {
    throw new Error('RapidAPI non disponible')
  }

  try {
    const limit = options.limit || 50
    const sort = options.sort || 'episode_newest'

    console.log(`📦 RapidAPI: Recherche produits "${searchTerm}"...`)

    // Si limit <= 20, une seule requête suffit
    if (limit <= 20) {
      const params = new URLSearchParams({
        search: searchTerm,
        limit: limit.toString(),
        sort
      })

      const response = await fetch(`${this.BASE_URL}/pokemon/products/search?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ RapidAPI: ${data.data?.length || 0} produits trouvés`)

      return data
    }

    // Si limit > 20, pagination automatique
    console.log(`📄 Pagination activée (limit=${limit}, max 20/page)`)

    let allProducts = []
    let currentPage = 1
    const perPage = 20

    while (allProducts.length < limit) {
      const params = new URLSearchParams({
        search: searchTerm,
        limit: perPage.toString(),
        page: currentPage.toString(), // ⚠️ IMPORTANT: Utiliser 'page' et non 'offset'
        sort
      })

      console.log(`  📄 Page ${currentPage}...`)

      const response = await fetch(`${this.BASE_URL}/pokemon/products/search?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const pageData = await response.json()
      const products = pageData.data || []

      console.log(`  ✅ ${products.length} produits`)

      allProducts.push(...products)

      // Arrêter si moins de 20 résultats (dernière page)
      if (products.length < perPage) break

      currentPage++

      // Sécurité : max 50 pages (1000 produits)
      if (currentPage > 50) {
        console.warn(`⚠️ Limite sécurité atteinte (50 pages)`)
        break
      }
    }

    const finalProducts = allProducts.slice(0, limit)
    console.log(`✅ RapidAPI: ${finalProducts.length} produits total (${currentPage} pages)`)

    return {
      data: finalProducts,
      paging: {
        current: 1,
        total: Math.ceil(allProducts.length / perPage),
        per_page: perPage
      },
      results: allProducts.length
    }
  } catch (error) {
    console.error(`❌ RapidAPI: Erreur recherche produits "${searchTerm}":`, error)
    throw error
  }
}
```

---

## 2️⃣ Fichier: `src/services/CardMarketSupabaseService.js`

### ✅ APPLIQUÉ - Méthode `upsertSealedProductsFromRapidAPI` (ligne ~670-742)

**Changements appliqués**:
- ❌ Retrait de `expansion_name` (colonne inexistante)
- ✅ Ajout de `image_url` (après création colonne SQL)
- ❌ Retrait de `avg_7` et `avg_30` (colonnes inexistantes dans cardmarket_prices)

```javascript
/**
 * Sauvegarder/mettre à jour des produits scellés depuis RapidAPI dans Supabase
 * Upsert : met à jour si existe (même id_product), sinon insère
 *
 * @param {Array} products - Produits depuis RapidAPI formatés
 * @returns {Promise<number>} Nombre de produits sauvegardés
 */
static async upsertSealedProductsFromRapidAPI(products) {
  if (!products || products.length === 0) return 0

  console.log(`💾 Sauvegarde de ${products.length} produits RapidAPI dans Supabase...`)

  try {
    // Formater les produits pour Supabase
    const productsToUpsert = products.map(product => ({
      id_product: product.id_product,
      name: product.name,
      id_category: product.category_id || null,
      category_name: product.category_name || null,
      id_expansion: product.expansion_id || null,
      image_url: product.image_url || null, // ✅ Ajouté après création colonne SQL
      date_added: new Date().toISOString()
    }))

    // Upsert dans cardmarket_nonsingles (met à jour si id_product existe)
    const { data: upsertedProducts, error: upsertError } = await supabase
      .from('cardmarket_nonsingles')
      .upsert(productsToUpsert, {
        onConflict: 'id_product',
        ignoreDuplicates: false // Mettre à jour les existants
      })
      .select()

    if (upsertError) {
      console.error('❌ Erreur upsert produits:', upsertError)
      throw upsertError
    }

    console.log(`✅ ${upsertedProducts?.length || products.length} produits sauvegardés dans cardmarket_nonsingles`)

    // Sauvegarder les prix dans cardmarket_prices
    const pricesToUpsert = products
      .filter(p => p.price || p.priceDetails) // Seulement ceux avec prix
      .map(product => ({
        id_product: product.id_product,
        avg: product.priceDetails?.avg || product.price || null,
        low: product.priceDetails?.low || product.priceLow || null,
        trend: product.priceDetails?.trend || null,
        // ❌ avg_7 et avg_30 retirés (colonnes inexistantes)
        updated_at: new Date().toISOString()
      }))

    if (pricesToUpsert.length > 0) {
      const { data: upsertedPrices, error: pricesError } = await supabase
        .from('cardmarket_prices')
        .upsert(pricesToUpsert, {
          onConflict: 'id_product',
          ignoreDuplicates: false
        })
        .select()

      if (pricesError) {
        console.warn('⚠️ Erreur upsert prix:', pricesError)
      } else {
        console.log(`✅ ${upsertedPrices?.length || pricesToUpsert.length} prix sauvegardés dans cardmarket_prices`)
      }
    }

    return upsertedProducts?.length || products.length

  } catch (error) {
    console.error('❌ Erreur sauvegarde produits RapidAPI:', error)
    throw error
  }
}
```

---

## 3️⃣ Fichier: `src/services/HybridPriceService.js`

### ✅ APPLIQUÉ - Sauvegarde automatique (ligne ~311-320)

Ajouté après `console.log(\`✅ ${products.length} produits récupérés via RapidAPI\`)` :

```javascript
// Sauvegarder automatiquement dans Supabase
try {
  const { CardMarketSupabaseService } = await import('./CardMarketSupabaseService')
  await CardMarketSupabaseService.upsertSealedProductsFromRapidAPI(products)
} catch (saveError) {
  console.warn('⚠️ Impossible de sauvegarder dans Supabase:', saveError.message)
  // Ne pas bloquer si la sauvegarde échoue
}
```

---

---

## 📝 Résumé des changements

1. **RapidAPIService** :
   - ✅ Pagination automatique (jusqu'à 1000 produits, max 50 pages)
   - ✅ Utilise `page` au lieu de `offset` pour la pagination

2. **CardMarketSupabaseService** :
   - ✅ Nouvelle méthode `upsertSealedProductsFromRapidAPI`
   - ✅ Sauvegarde produits (sans expansion_name)
   - ✅ Sauvegarde images (après création colonne SQL)
   - ✅ Sauvegarde prix (sans avg_7 et avg_30)

3. **HybridPriceService** :
   - ✅ Sauvegarde automatique après chaque recherche RapidAPI

4. **Configuration Supabase** :
   - ✅ Colonne `image_url` ajoutée à `cardmarket_nonsingles`
   - ✅ Politiques RLS configurées pour `cardmarket_nonsingles`
   - ✅ Politiques RLS configurées pour `cardmarket_prices`

---

## ✅ Résultat Final

**Fonctionnel au 15/11/2025** :

Quand vous cherchez "booster" via l'API :
- 📦 Récupère jusqu'à 1000 produits (au lieu de 20)
- 💾 Les sauvegarde automatiquement dans Supabase
- 🔄 Met à jour les produits existants (si même id_product)
- ➕ Ajoute les nouveaux produits
- 🖼️ Sauvegarde les URLs des images
- 💰 Sauvegarde les prix EUR (avg, low, trend)

**Les produits sont ensuite disponibles dans le catalogue même sans quota RapidAPI !**

---

## 🚀 Utilisation

Dans `SealedProductsCatalog.jsx`, modifier la limite de recherche (ligne ~105) :

```javascript
// Limite par défaut : 100 produits
const results = await HybridPriceService.searchProducts(query, 100)

// Pour récupérer plus de produits (max recommandé : 1000)
const results = await HybridPriceService.searchProducts(query, 1000)
```

---

## 🐛 Problèmes Résolus

1. ✅ **Pagination ne fonctionnait pas** : Changé `offset` → `page`
2. ✅ **Colonne expansion_name manquante** : Retirée du mapping
3. ✅ **Colonne image_url manquante** : Ajoutée via SQL
4. ✅ **Colonnes avg_7 et avg_30 manquantes** : Retirées du mapping prix
5. ✅ **RLS policies bloquaient insertion** : Politiques ajoutées pour authenticated users
6. ✅ **Images non affichées** : Résolu après ajout colonne + réactivation sauvegarde
