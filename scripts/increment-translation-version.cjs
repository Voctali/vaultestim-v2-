#!/usr/bin/env node

/**
 * Script pour incrémenter automatiquement la version des traductions
 * Usage: node scripts/increment-translation-version.js [pokemon|trainer|both]
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const POKEMON_FILE = path.join(__dirname, '../src/utils/pokemonTranslations.js');
const TRAINER_FILE = path.join(__dirname, '../src/utils/trainerTranslations.js');

/**
 * Incrémenter une version sémantique (MAJOR.MINOR.PATCH)
 * @param {string} version - Version actuelle (ex: "1.2.3")
 * @param {string} type - Type d'incrémentation: 'major', 'minor', 'patch'
 * @returns {string} Nouvelle version
 */
function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);

  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }

  return parts.join('.');
}

/**
 * Extraire la version actuelle d'un fichier
 * @param {string} filePath - Chemin du fichier
 * @param {string} versionConstName - Nom de la constante de version
 * @returns {string|null} Version actuelle ou null
 */
function extractVersion(filePath, versionConstName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp(`export const ${versionConstName} = ['"]([\\d.]+)['"]`);
  const match = content.match(regex);
  return match ? match[1] : null;
}

/**
 * Mettre à jour la version dans un fichier
 * @param {string} filePath - Chemin du fichier
 * @param {string} versionConstName - Nom de la constante de version
 * @param {string} newVersion - Nouvelle version
 * @param {string} incrementType - Type d'incrémentation
 * @returns {boolean} Succès ou échec
 */
function updateVersion(filePath, versionConstName, newVersion, incrementType) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Mettre à jour la version
    const versionRegex = new RegExp(
      `(export const ${versionConstName} = ['"])([\\d.]+)(['"] // Dernière mise à jour: )(\\d{4}-\\d{2}-\\d{2})`,
      'g'
    );

    const today = new Date().toISOString().split('T')[0];
    content = content.replace(
      versionRegex,
      `$1${newVersion}$3${today}`
    );

    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Fonction principale
 */
function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'both'; // pokemon, trainer, ou both
  const incrementType = args[1] || 'patch'; // major, minor, ou patch

  console.log('🔄 Incrémentation automatique des versions de traductions\n');

  let success = true;

  // Pokemon translations
  if (target === 'pokemon' || target === 'both') {
    const currentVersion = extractVersion(POKEMON_FILE, 'POKEMON_TRANSLATIONS_VERSION');
    if (currentVersion) {
      const newVersion = incrementVersion(currentVersion, incrementType);
      console.log(`🐾 Pokémon: ${currentVersion} → ${newVersion} (${incrementType})`);

      if (updateVersion(POKEMON_FILE, 'POKEMON_TRANSLATIONS_VERSION', newVersion, incrementType)) {
        console.log('✅ pokemonTranslations.js mis à jour');
      } else {
        success = false;
      }
    } else {
      console.error('❌ Version Pokémon introuvable');
      success = false;
    }
  }

  // Trainer translations
  if (target === 'trainer' || target === 'both') {
    const currentVersion = extractVersion(TRAINER_FILE, 'TRAINER_TRANSLATIONS_VERSION');
    if (currentVersion) {
      const newVersion = incrementVersion(currentVersion, incrementType);
      console.log(`👤 Dresseur: ${currentVersion} → ${newVersion} (${incrementType})`);

      if (updateVersion(TRAINER_FILE, 'TRAINER_TRANSLATIONS_VERSION', newVersion, incrementType)) {
        console.log('✅ trainerTranslations.js mis à jour');
      } else {
        success = false;
      }
    } else {
      console.error('❌ Version Dresseur introuvable');
      success = false;
    }
  }

  if (success) {
    console.log('\n✨ Versions incrémentées avec succès !');
    console.log('💡 N\'oubliez pas de commiter ces changements.');
  } else {
    console.error('\n❌ Erreur lors de l\'incrémentation des versions');
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { incrementVersion, extractVersion, updateVersion };
