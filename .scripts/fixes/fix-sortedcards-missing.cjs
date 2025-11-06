const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Collection.jsx');

console.log('📝 Lecture du fichier Collection.jsx...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Ajout de la ligne sortedCards manquante...');

// Ajouter la ligne qui crée sortedCards après filteredCards
const oldCode = `    const matchesType = filters.type === 'all' || card.type === filters.type
    return matchesSearch && matchesRarity && matchesCondition && matchesType
  })

  return (`;

const newCode = `    const matchesType = filters.type === 'all' || card.type === filters.type
    return matchesSearch && matchesRarity && matchesCondition && matchesType
  })

  // Appliquer le tri sélectionné
  const sortedCards = sortCards(filteredCards, sortBy)

  return (`;

content = content.replace(oldCode, newCode);

console.log('💾 Écriture...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Ligne sortedCards ajoutée avec succès !');
