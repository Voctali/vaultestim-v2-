const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'cardMarketUrlBuilder.js');

console.log('📝 Lecture du fichier cardMarketUrlBuilder.js...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔄 Remplacement de la logique card.cardmarket.url...');

// Remplacer le bloc qui utilise card.cardmarket.url
const oldCode = `  // Priorité 1 : URL directe de l'API (TOUJOURS la plus rapide et précise)
  if (card.cardmarket?.url) {
    return card.cardmarket.url
  }

  // Si pas d'URL directe, construire une recherche optimisée`;

const newCode = `  // ❌ NE PAS UTILISER card.cardmarket.url de l'API Pokemon TCG !
  // Cette URL pointe vers prices.pokemontcg.io (agrégateur) au lieu du vrai CardMarket
  // Exemple : https://prices.pokemontcg.io/cardmarket/sv3pt5-97 (MAUVAIS)
  // Correct : https://www.cardmarket.com/fr/Pokemon/Products/Singles/151/Hypno-MEW097 (BON)
  // Solution : Toujours construire notre propre recherche vers www.cardmarket.com

  // Construire une recherche optimisée vers www.cardmarket.com`;

content = content.replace(oldCode, newCode);

// Aussi retirer la référence dans buildCardMarketFallbackUrls (lignes 124-132)
const oldFallback = `  // URL directe (si disponible)
  if (card.cardmarket?.url) {
    urls.push({
      url: card.cardmarket.url,
      strategy: 'direct',
      label: 'Lien direct API',
      speed: 'fast'
    })
  }`;

const newFallback = `  // ❌ Ne plus utiliser card.cardmarket.url (pointe vers prices.pokemontcg.io)`;

content = content.replace(oldFallback, newFallback);

// Et dans estimateCardMarketLoadTime (lignes 217-218)
const oldEstimate = `  // URL directe de l'API = rapide (page spécifique)
  if (card.cardmarket?.url) return 'fast'

  //`;

const newEstimate = `  //`;

content = content.replace(oldEstimate, newEstimate);

console.log('💾 Écriture des modifications...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fichier modifié avec succès !');
console.log('🔗 Les liens CardMarket pointent maintenant vers www.cardmarket.com');
