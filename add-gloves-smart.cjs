const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'trainerTranslations.js');

console.log('📖 Lecture du fichier...');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

let modified = false;
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Mise à jour de la version
  if (line.includes("TRAINER_TRANSLATIONS_VERSION = '1.9.2'")) {
    newLines.push(line.replace(
      "TRAINER_TRANSLATIONS_VERSION = '1.9.2' // Dernière mise à jour: 2025-01-07 - Ajout \"hunting gloves\"",
      "TRAINER_TRANSLATIONS_VERSION = '1.9.3' // Dernière mise à jour: 2025-01-09 - Ajout \"weeding gloves\", \"crushing gloves\""
    ));
    console.log('✅ Version mise à jour vers 1.9.3');
    modified = true;
  }
  // Si on trouve la ligne "gants de chasse" et que la ligne suivante n'est pas déjà "gants désherbants"
  else if (line.includes("'gants de chasse': 'hunting gloves'") && !lines[i + 1].includes("'gants désherbants'")) {
    newLines.push(line);
    newLines.push("  'gants désherbants': 'weeding gloves', // Objet Dresseur");
    newLines.push("  'gants desherbants': 'weeding gloves', // Variante sans accent");
    newLines.push("  'gants dévastateurs': 'crushing gloves', // Objet Dresseur");
    newLines.push("  'gants devastateurs': 'crushing gloves', // Variante sans accent");
    console.log('✅ Traductions "Gants Désherbants" et "Gants Dévastateurs" ajoutées');
    modified = true;
  }
  // Si on trouve "gants desherbants" et que la ligne suivante n'est pas "gants dévastateurs"
  else if (line.includes("'gants desherbants': 'weeding gloves'") && !lines[i + 1].includes("'gants dévastateurs'")) {
    newLines.push(line);
    newLines.push("  'gants dévastateurs': 'crushing gloves', // Objet Dresseur");
    newLines.push("  'gants devastateurs': 'crushing gloves', // Variante sans accent");
    console.log('✅ Traduction "Gants Dévastateurs" ajoutée');
    modified = true;
  }
  else {
    newLines.push(line);
  }
}

if (!modified) {
  console.log('ℹ️  Aucune modification nécessaire (traductions déjà présentes)');
} else {
  console.log('💾 Écriture du fichier...');
  fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
  console.log('✅ Terminé avec succès!');
}
