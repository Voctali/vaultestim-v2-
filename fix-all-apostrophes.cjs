const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'trainerTranslations.js');

console.log('📖 Lecture du fichier...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 Correction des apostrophes dans les clés et valeurs...');

// Trouver toutes les lignes de traduction et les corriger
const lines = content.split('\n');
const fixedLines = lines.map((line, index) => {
  // Chercher les lignes avec format:  'key': 'value', // comment
  if (line.trim().startsWith("'") && line.includes("':") && line.includes(",")) {
    // Extraire les différentes parties
    const match = line.match(/^(\s+)'(.*)': '(.*)', (\/\/.*)$/);

    if (match) {
      const indent = match[1];
      const key = match[2];
      const value = match[3];
      const comment = match[4];

      // Échapper les apostrophes non échappées dans la clé
      const fixedKey = key.replace(/(?<!\\)'/g, "\\'");
      // Échapper les apostrophes non échappées dans la valeur
      const fixedValue = value.replace(/(?<!\\)'/g, "\\'");

      if (key !== fixedKey || value !== fixedValue) {
        console.log(`  Ligne ${index + 1}: corrigée`);
      }

      return `${indent}'${fixedKey}': '${fixedValue}', ${comment}`;
    }
  }

  return line;
});

console.log('💾 Écriture du fichier...');
fs.writeFileSync(filePath, fixedLines.join('\n'), 'utf8');

console.log('✅ Toutes les apostrophes ont été échappées !');
