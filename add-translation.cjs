const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'trainerTranslations.js');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Ajouter la nouvelle traduction après "gants desherbants"
const searchText = `  'gants desherbants': 'weeding gloves', // Variante sans accent
  'recycleur d\\'énergie': 'energy recycler', // Objet`;

const replaceText = `  'gants desherbants': 'weeding gloves', // Variante sans accent
  'gants dévastateurs': 'crushing gloves', // Objet Dresseur
  'gants devastateurs': 'crushing gloves', // Variante sans accent
  'recycleur d\\'énergie': 'energy recycler', // Objet`;

content = content.replace(searchText, replaceText);

// Écrire le fichier
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Traduction "Gants Dévastateurs" ajoutée avec succès !');
