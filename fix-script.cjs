const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'add-trainer-translation.cjs');

console.log('📖 Lecture du fichier...');
let content = fs.readFileSync(filePath, 'utf8');

// Corriger la fonction createTranslationLines pour échapper les apostrophes
const oldFunction = `// Fonction pour créer les lignes de traduction
function createTranslationLines(french, english, indent = '  ') {
  const frenchWithAccents = french;
  const frenchWithoutAccents = french
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '');

  const lines = [];
  lines.push(\`\${indent}'\${frenchWithAccents}': '\${english}', // Objet Dresseur\`);

  // Ajouter la variante sans accent seulement si différente
  if (frenchWithAccents !== frenchWithoutAccents) {
    lines.push(\`\${indent}'\${frenchWithoutAccents}': '\${english}', // Variante sans accent\`);
  }

  return lines;
}`;

const newFunction = `// Fonction pour créer les lignes de traduction
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

content = content.replace(oldFunction, newFunction);

console.log('💾 Écriture du fichier...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Script mis à jour pour échapper automatiquement les apostrophes !');
