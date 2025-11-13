const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'trainerTranslations.js');

console.log('📖 Lecture du fichier...');
let content = fs.readFileSync(filePath, 'utf8');

// Mise à jour de la version si nécessaire
if (content.includes("TRAINER_TRANSLATIONS_VERSION = '1.9.2'")) {
  content = content.replace(
    "TRAINER_TRANSLATIONS_VERSION = '1.9.2' // Dernière mise à jour: 2025-01-07 - Ajout \"hunting gloves\"",
    "TRAINER_TRANSLATIONS_VERSION = '1.9.3' // Dernière mise à jour: 2025-01-09 - Ajout \"weeding gloves\", \"crushing gloves\""
  );
  console.log('✅ Version mise à jour vers 1.9.3');
}

// Ajouter les traductions après "gants de chasse"
const searchPattern = "  'gants de chasse': 'hunting gloves', // Objet Dresseur\n  'recycleur d\\'énergie': 'energy recycler', // Objet";

const replacement = "  'gants de chasse': 'hunting gloves', // Objet Dresseur\n  'gants désherbants': 'weeding gloves', // Objet Dresseur\n  'gants desherbants': 'weeding gloves', // Variante sans accent\n  'gants dévastateurs': 'crushing gloves', // Objet Dresseur\n  'gants devastateurs': 'crushing gloves', // Variante sans accent\n  'recycleur d\\'énergie': 'energy recycler', // Objet";

if (content.includes(searchPattern)) {
  content = content.replace(searchPattern, replacement);
  console.log('✅ Traductions "Gants Désherbants" et "Gants Dévastateurs" ajoutées');
} else if (content.includes("'gants désherbants'") && content.includes("'gants dévastateurs'")) {
  console.log('ℹ️  Les traductions sont déjà présentes');
} else if (content.includes("'gants désherbants'") && !content.includes("'gants dévastateurs'")) {
  // Ajouter seulement "gants dévastateurs"
  const partialSearch = "  'gants desherbants': 'weeding gloves', // Variante sans accent\n  'recycleur d\\'énergie': 'energy recycler', // Objet";
  const partialReplace = "  'gants desherbants': 'weeding gloves', // Variante sans accent\n  'gants dévastateurs': 'crushing gloves', // Objet Dresseur\n  'gants devastateurs': 'crushing gloves', // Variante sans accent\n  'recycleur d\\'énergie': 'energy recycler', // Objet";

  content = content.replace(partialSearch, partialReplace);
  console.log('✅ Traduction "Gants Dévastateurs" ajoutée');
} else {
  console.log('⚠️  Pattern de recherche non trouvé. Vérification manuelle requise.');
  process.exit(1);
}

console.log('💾 Écriture du fichier...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Terminé avec succès!');
