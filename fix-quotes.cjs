const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'trainerTranslations.js');

console.log('📖 Lecture du fichier...');
let content = fs.readFileSync(filePath, 'utf8');

// Corriger les apostrophes non échappées dans les valeurs
content = content.replace(
  /  'médaille du héros': 'hero's medal',/g,
  "  'médaille du héros': 'hero\\'s medal',"
);

content = content.replace(
  /  'medaille du heros': 'hero's medal',/g,
  "  'medaille du heros': 'hero\\'s medal',"
);

console.log('💾 Écriture du fichier...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Apostrophes corrigées !');
