const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'features', 'collection', 'AddToCollectionModal.jsx');

console.log('🔧 Correction du bug updateCardQuantity...');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Remplacement 1: Import du hook (ligne 19)
const oldImport = 'const { collection, updateCardQuantity, removeFromCollection } = useCollection()';
const newImport = 'const { collection, updateCardInCollection, removeFromCollection } = useCollection()';

if (content.includes(oldImport)) {
  content = content.replace(oldImport, newImport);
  console.log('✅ Import corrigé: updateCardQuantity → updateCardInCollection');
} else {
  console.log('⚠️ Import déjà corrigé ou pattern non trouvé');
}

// Remplacement 2: Utilisation dans handleIncreaseQuantity (ligne 85)
const oldIncrease = 'updateCardQuantity(matchingCards[0].id, (matchingCards[0].quantity || 1) + 1)';
const newIncrease = 'updateCardInCollection(matchingCards[0].id, { ...matchingCards[0], quantity: (matchingCards[0].quantity || 1) + 1 })';

if (content.includes(oldIncrease)) {
  content = content.replace(oldIncrease, newIncrease);
  console.log('✅ handleIncreaseQuantity corrigé');
} else {
  console.log('⚠️ handleIncreaseQuantity déjà corrigé ou pattern non trouvé');
}

// Remplacement 3: Utilisation dans handleDecreaseQuantity (ligne 106)
const oldDecrease = 'updateCardQuantity(matchingCards[0].id, newQuantity)';
const newDecrease = 'updateCardInCollection(matchingCards[0].id, { ...matchingCards[0], quantity: newQuantity })';

if (content.includes(oldDecrease)) {
  content = content.replace(oldDecrease, newDecrease);
  console.log('✅ handleDecreaseQuantity corrigé');
} else {
  console.log('⚠️ handleDecreaseQuantity déjà corrigé ou pattern non trouvé');
}

// Écrire le fichier modifié
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Corrections appliquées avec succès!');
console.log('🎯 Les boutons +/- devraient maintenant fonctionner sur mobile et desktop');
