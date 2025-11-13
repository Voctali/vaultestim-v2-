const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'add-trainer-translation.cjs');

console.log('📖 Lecture du fichier...');
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer la fonction createTranslationLines
const oldFunc = `// Fonction pour créer les lignes de traduction
function createTranslationLines(french, english, indent = '  ') {
  const frenchWithAccents = french;
  const frenchWithoutAccents = french
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '');

  // Échapper les apostrophes dans les valeurs anglaises
  const escapedEnglish = english.replace(/'/g, "\\\\'");

  const lines = [];
  lines.push(\`\${indent}'\${frenchWithAccents}': '\${escapedEnglish}', // Objet Dresseur\`);

  // Ajouter la variante sans accent seulement si différente
  if (frenchWithAccents !== frenchWithoutAccents) {
    lines.push(\`\${indent}'\${frenchWithoutAccents}': '\${escapedEnglish}', // Variante sans accent\`);
  }

  return lines;
}`;

const newFunc = `// Fonction pour créer les lignes de traduction
function createTranslationLines(french, english, indent = '  ') {
  const frenchWithAccents = french;
  const frenchWithoutAccents = french
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/œ/g, 'oe')  // Gérer la ligature œ
    .replace(/Œ/g, 'Oe')  // Gérer la ligature Œ
    .replace(/æ/g, 'ae')  // Gérer la ligature æ
    .replace(/Æ/g, 'Ae'); // Gérer la ligature Æ

  // Échapper les apostrophes dans les clés et valeurs
  const escapedFrenchWithAccents = frenchWithAccents.replace(/'/g, "\\\\'");
  const escapedFrenchWithoutAccents = frenchWithoutAccents.replace(/'/g, "\\\\'");
  const escapedEnglish = english.replace(/'/g, "\\\\'");

  const lines = [];
  lines.push(\`\${indent}'\${escapedFrenchWithAccents}': '\${escapedEnglish}', // Objet Dresseur\`);

  // Ajouter la variante sans accent seulement si différente
  if (frenchWithAccents !== frenchWithoutAccents) {
    lines.push(\`\${indent}'\${escapedFrenchWithoutAccents}': '\${escapedEnglish}', // Variante sans accent\`);
  }

  return lines;
}`;

content = content.replace(oldFunc, newFunc);

console.log('💾 Écriture du fichier...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Script mis à jour pour gérer les ligatures œ, æ et échapper les apostrophes dans les clés !');
