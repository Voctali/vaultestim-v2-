const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'trainerTranslations.js');

console.log('📖 Lecture du fichier...');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('🔍 Recherche des apostrophes non échappées...');
const fixedLines = lines.map((line, index) => {
  // Chercher les lignes avec des traductions (format: '...': '...', //)
  const match = line.match(/^(\s+)'([^']+)':\s+'([^']+)',\s*(\/\/.*)$/);

  if (match) {
    const indent = match[1];
    const key = match[2];
    const value = match[3];
    const comment = match[4];

    // Si la valeur contient une apostrophe non échappée
    if (value.includes("'") && !value.includes("\\'")) {
      const escapedValue = value.replace(/'/g, "\\'");
      const fixedLine = `${indent}'${key}': '${escapedValue}', ${comment}`;
      console.log(`  Ligne ${index + 1}: "${value}" → "${escapedValue}"`);
      return fixedLine;
    }
  }

  return line;
});

console.log('💾 Écriture du fichier...');
fs.writeFileSync(filePath, fixedLines.join('\n'), 'utf8');

console.log('✅ Toutes les apostrophes ont été échappées !');
