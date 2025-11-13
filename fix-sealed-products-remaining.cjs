const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'DatabaseBackupService.js');

console.log('🔧 Correction des clés sealed_products restantes...');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer dans results object (ligne 187)
content = content.replace(
  '        sealed_products: 0,',
  '        user_sealed_products: 0,'
);
console.log('✅ Clé results.sealed_products corrigée');

// Remplacer dans le message d'erreur (ligne 307)
content = content.replace(
  "console.error('❌ Erreur sealed_products:', error)",
  "console.error('❌ Erreur user_sealed_products:', error)"
);
console.log('✅ Message erreur corrigé');

content = content.replace(
  "results.errors.push({ table: 'sealed_products', error: error.message })",
  "results.errors.push({ table: 'user_sealed_products', error: error.message })"
);
console.log('✅ Table erreur corrigée');

// Remplacer dans getBackupStats (ligne 439)
content = content.replace(
  '          sealed_products: backup.data.user_sealed_products?.length || 0,',
  '          user_sealed_products: backup.data.user_sealed_products?.length || 0,'
);
console.log('✅ Clé stats.sealed_products corrigée');

// Écrire le fichier modifié
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Toutes les corrections appliquées!');
console.log('🎯 DatabaseBackupService utilise maintenant user_sealed_products partout');
