/**
 * Script d'incrémentation automatique de CACHE_VERSION
 *
 * Utilisation :
 *   npm run increment-cache-version        # Incrémente automatiquement
 *   npm run increment-cache-version major  # Incrémente la version majeure (1.0.0 → 2.0.0)
 *   npm run increment-cache-version minor  # Incrémente la version mineure (1.0.0 → 1.1.0) [défaut]
 *   npm run increment-cache-version patch  # Incrémente la version patch (1.0.0 → 1.0.1)
 */

const { getCacheVersion, updateCacheVersion } = require('./check-cache-version.cjs');

function incrementVersion(version, type = 'minor') {
  const parts = version.split('.');
  let [major, minor, patch] = parts.map(Number);

  switch (type) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
      patch += 1;
      break;
    default:
      throw new Error(`Type d'incrémentation invalide: ${type}`);
  }

  return `${major}.${minor}.${patch}`;
}

// Exécution
const currentVersion = getCacheVersion();
const incrementType = process.argv[2] || 'minor';

console.log(`📌 Version actuelle : ${currentVersion}`);

const newVersion = incrementVersion(currentVersion, incrementType);
console.log(`🔼 Nouvelle version : ${newVersion} (${incrementType})\n`);

updateCacheVersion(newVersion);

console.log('✅ Incrémentation terminée !');
console.log('💡 N\'oubliez pas de commiter ce changement avec vos autres modifications\n');
