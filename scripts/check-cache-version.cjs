/**
 * Script de vérification automatique des changements nécessitant une incrémentation de CACHE_VERSION
 *
 * Ce script analyse les fichiers modifiés et détecte si une incrémentation est nécessaire
 *
 * Cas détectés :
 * 1. Modification de CardCacheService.js (structure cache)
 * 2. Modification de SupabaseService.js avec ajout de colonnes
 * 3. Modification de useCardDatabase.jsx (structure données)
 * 4. Migrations SQL ajoutées
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Fichiers critiques à surveiller
const CRITICAL_FILES = [
  'src/services/CardCacheService.js',
  'src/services/SupabaseService.js',
  'src/hooks/useCardDatabase.jsx'
];

// Mots-clés indiquant un changement de structure
const CRITICAL_KEYWORDS = [
  'createObjectStore',
  'createIndex',
  'ADD COLUMN',
  'ALTER TABLE',
  'DROP COLUMN',
  'RENAME COLUMN',
  'JSONB',
  'migration'
];

function getCacheVersion() {
  const content = fs.readFileSync('src/services/CardCacheService.js', 'utf8');
  const match = content.match(/const CACHE_VERSION = ['"](.+?)['"]/);
  return match ? match[1] : null;
}

function incrementVersion(version) {
  const parts = version.split('.');
  const [major, minor, patch] = parts.map(Number);

  // Par défaut, incrémenter le minor (changement moyen)
  return `${major}.${minor + 1}.${patch}`;
}

function checkGitDiff() {
  try {
    // Récupérer les fichiers modifiés non commités
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    const unstagedFiles = execSync('git diff --name-only', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

    const allFiles = [...new Set([...stagedFiles, ...unstagedFiles])];

    if (allFiles.length === 0) {
      console.log('✅ Aucun fichier modifié détecté');
      return { shouldIncrement: false, reason: null };
    }

    // Vérifier les fichiers critiques
    const modifiedCriticalFiles = allFiles.filter(file =>
      CRITICAL_FILES.some(critical => file.includes(critical))
    );

    if (modifiedCriticalFiles.length === 0) {
      console.log('✅ Aucun fichier critique modifié');
      return { shouldIncrement: false, reason: null };
    }

    // Analyser le contenu des modifications
    for (const file of modifiedCriticalFiles) {
      try {
        const diff = execSync(`git diff HEAD ${file}`, { encoding: 'utf8' });

        // Chercher des mots-clés critiques dans le diff
        for (const keyword of CRITICAL_KEYWORDS) {
          if (diff.includes(keyword)) {
            return {
              shouldIncrement: true,
              reason: `Modification critique détectée dans ${file} : "${keyword}"`,
              file,
              keyword
            };
          }
        }
      } catch (error) {
        // Fichier nouvellement créé, vérifier s'il existe
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          for (const keyword of CRITICAL_KEYWORDS) {
            if (content.includes(keyword)) {
              return {
                shouldIncrement: true,
                reason: `Nouveau fichier critique créé ${file} : "${keyword}"`,
                file,
                keyword
              };
            }
          }
        }
      }
    }

    console.log('✅ Fichiers critiques modifiés mais sans changement de structure détecté');
    return { shouldIncrement: false, reason: null };

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse git:', error.message);
    return { shouldIncrement: false, reason: null };
  }
}

function updateCacheVersion(newVersion) {
  const filePath = 'src/services/CardCacheService.js';
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(
    /const CACHE_VERSION = ['"](.+?)['"](.*)/,
    `const CACHE_VERSION = '${newVersion}'$2`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ CACHE_VERSION mise à jour : ${newVersion}`);
}

// Exécution principale
if (require.main === module) {
  console.log('🔍 Vérification des changements nécessitant une incrémentation de CACHE_VERSION...\n');

  const currentVersion = getCacheVersion();
  console.log(`📌 Version actuelle : ${currentVersion}\n`);

  const result = checkGitDiff();

  if (result.shouldIncrement) {
    console.log('\n⚠️  INCRÉMENTATION RECOMMANDÉE !');
    console.log(`   Raison : ${result.reason}\n`);

    const newVersion = incrementVersion(currentVersion);
    console.log(`   Nouvelle version proposée : ${currentVersion} → ${newVersion}\n`);

    // En mode automatique, demander confirmation
    if (process.argv.includes('--auto')) {
      updateCacheVersion(newVersion);
      console.log('✅ Version incrémentée automatiquement\n');
      process.exit(0);
    } else {
      console.log('💡 Pour incrémenter automatiquement, relancez avec : npm run increment-cache-version\n');
      process.exit(1); // Exit code 1 pour signaler qu'une action est nécessaire
    }
  } else {
    console.log('✅ Aucune incrémentation nécessaire\n');
    process.exit(0);
  }
}

module.exports = { checkGitDiff, getCacheVersion, incrementVersion, updateCacheVersion };
