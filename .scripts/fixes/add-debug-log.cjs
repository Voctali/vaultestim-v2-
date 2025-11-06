const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'cardMarketUrlBuilder.js');

console.log('📝 Lecture du fichier...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('➕ Ajout du log de debug...');

const oldCode = `  // Construire une recherche optimisée vers www.cardmarket.com
  const cleanName = cleanCardName(card.name)
  const setName = card.set?.name || card.extension || ''
  const number = card.number || ''

  // Stratégie automatique : choisir la meilleure approche`;

const newCode = `  // Construire une recherche optimisée vers www.cardmarket.com
  const cleanName = cleanCardName(card.name)
  const setName = card.set?.name || card.extension || ''
  const number = card.number || ''

  // Debug : afficher les infos de la carte
  console.log(\`🔍 [CardMarket URL] Carte: "\${card.name}" #\${number || 'N/A'} - Extension: \${setName || 'N/A'}\`)
  console.log(\`🔍 [CardMarket URL] card.number =\`, card.number, \`| card.set =\`, card.set)

  // Stratégie automatique : choisir la meilleure approche`;

content = content.replace(oldCode, newCode);

console.log('💾 Écriture...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Log de debug ajouté !');
