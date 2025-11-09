#!/usr/bin/env node
/**
 * Script pour ajouter des traductions dans trainerTranslations.js
 * Usage: node add-trainer-translation.cjs "nom français" "nom anglais" [--after "ligne de référence"]
 *
 * Exemples:
 * - node add-trainer-translation.cjs "gants excavateurs" "digging gloves"
 * - node add-trainer-translation.cjs "super objet" "super item" --after "gants devastateurs"
 */

const fs = require('fs');
const path = require('path');

// Récupérer les arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('❌ Usage: node add-trainer-translation.cjs "nom français" "nom anglais" [--after "ligne de référence"]');
  console.error('Exemple: node add-trainer-translation.cjs "gants excavateurs" "digging gloves"');
  process.exit(1);
}

const frenchName = args[0].toLowerCase();
const englishName = args[1].toLowerCase();
let afterLine = null;

// Chercher l'option --after
const afterIndex = args.indexOf('--after');
if (afterIndex !== -1 && args[afterIndex + 1]) {
  afterLine = args[afterIndex + 1].toLowerCase();
}

const filePath = path.join(__dirname, 'src', 'utils', 'trainerTranslations.js');

console.log(`📝 Ajout de la traduction: "${frenchName}" → "${englishName}"`);

// Lire le fichier
console.log('📖 Lecture du fichier...');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

let modified = false;
let versionUpdated = false;
const newLines = [];

// Fonction pour créer les lignes de traduction
function createTranslationLines(french, english, indent = '  ') {
  const frenchWithAccents = french;
  const frenchWithoutAccents = french
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')  // Gérer la ligature œ
    .replace(/Œ/g, 'Oe')  // Gérer la ligature Œ
    .replace(/æ/g, 'ae')  // Gérer la ligature æ
    .replace(/Æ/g, 'Ae'); // Gérer la ligature Æ

  // Échapper les apostrophes dans les clés et valeurs
  const escapedFrenchWithAccents = frenchWithAccents.replace(/'/g, "\\'");
  const escapedFrenchWithoutAccents = frenchWithoutAccents.replace(/'/g, "\\'");
  const escapedEnglish = english.replace(/'/g, "\\'");

  const lines = [];
  lines.push(`${indent}'${escapedFrenchWithAccents}': '${escapedEnglish}', // Objet Dresseur`);

  // Ajouter la variante sans accent seulement si différente
  if (frenchWithAccents !== frenchWithoutAccents) {
    lines.push(`${indent}'${escapedFrenchWithoutAccents}': '${escapedEnglish}', // Variante sans accent`);
  }

  return lines;
}

// Déterminer la ligne de référence (par défaut, chercher une ligne "gants" similaire)
if (!afterLine) {
  // Trouver la dernière ligne contenant "gants" pour insérer après
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes("'gants") && lines[i].includes("gloves")) {
      afterLine = lines[i].match(/'([^']+)':/)[1];
      console.log(`ℹ️  Insertion automatique après: "${afterLine}"`);
      break;
    }
  }
}

// Si toujours pas de ligne de référence, chercher "gants de chasse"
if (!afterLine) {
  afterLine = "gants de chasse";
  console.log(`ℹ️  Utilisation de la ligne de référence par défaut: "${afterLine}"`);
}

// Vérifier si la traduction existe déjà
const alreadyExists = lines.some(line => line.includes(`'${frenchName}':`));
if (alreadyExists) {
  console.log(`ℹ️  La traduction "${frenchName}" existe déjà dans le fichier`);
  process.exit(0);
}

// Parcourir les lignes et ajouter la traduction
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Mise à jour automatique de la version
  if (line.includes("TRAINER_TRANSLATIONS_VERSION = '1.9.") && !versionUpdated) {
    const currentVersion = line.match(/TRAINER_TRANSLATIONS_VERSION = '(\d+\.\d+\.\d+)'/)[1];
    const versionParts = currentVersion.split('.');
    versionParts[2] = String(parseInt(versionParts[2]) + 1);
    const newVersion = versionParts.join('.');

    const today = new Date().toISOString().split('T')[0];
    newLines.push(line.replace(
      /TRAINER_TRANSLATIONS_VERSION = '\d+\.\d+\.\d+' \/\/ .*/,
      `TRAINER_TRANSLATIONS_VERSION = '${newVersion}' // Dernière mise à jour: ${today} - Ajout "${englishName}"`
    ));
    console.log(`✅ Version mise à jour vers ${newVersion}`);
    versionUpdated = true;
    modified = true;
  }
  // Trouver la ligne de référence pour insérer après
  else if (line.includes(`'${afterLine}':`)) {
    newLines.push(line);

    // Chercher la ligne variante sans accent si elle existe
    let j = i + 1;
    while (j < lines.length && lines[j].includes("// Variante sans accent")) {
      newLines.push(lines[j]);
      i = j;
      j++;
    }

    // Insérer les nouvelles traductions
    const translationLines = createTranslationLines(frenchName, englishName);
    translationLines.forEach(tLine => newLines.push(tLine));

    console.log(`✅ Traduction "${frenchName}" → "${englishName}" ajoutée`);
    modified = true;
  }
  else {
    newLines.push(line);
  }
}

if (!modified) {
  console.log(`⚠️  Aucune modification effectuée. Ligne de référence "${afterLine}" non trouvée.`);
  process.exit(1);
}

// Écrire le fichier
console.log('💾 Écriture du fichier...');
fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');

console.log('✅ Terminé avec succès!');
console.log(`\n📊 Résumé:`);
console.log(`   Français: ${frenchName}`);
console.log(`   Anglais: ${englishName}`);
console.log(`   Position: après "${afterLine}"`);
