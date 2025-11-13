const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'DatabaseBackupService.js');

console.log('🔧 Correction du nom de table sealed_products → user_sealed_products...');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer toutes les occurrences de 'sealed_products' par 'user_sealed_products'
// Attention à ne pas remplacer dans les commentaires ou la clé de données du backup
const replacements = [
  {
    old: ".from('sealed_products')",
    new: ".from('user_sealed_products')"
  },
  {
    old: 'console.log(\'📥 Backup sealed_products...\')',
    new: 'console.log(\'📥 Backup user_sealed_products...\')'
  },
  {
    old: 'console.log(`📥 Restauration de ${backup.data.sealed_products.length} produits scellés...`)',
    new: 'console.log(`📥 Restauration de ${backup.data.user_sealed_products.length} produits scellés...`)'
  }
];

let changeCount = 0;

// Remplacer dans le backup (ligne ~73-81)
if (content.includes("console.log('📥 Backup sealed_products...')")) {
  content = content.replace(
    "console.log('📥 Backup sealed_products...')",
    "console.log('📥 Backup user_sealed_products...')"
  );
  changeCount++;
}

if (content.includes("from('sealed_products')")) {
  // Remplacer les 2 occurrences (backup + restore)
  content = content.replace(/from\('sealed_products'\)/g, "from('user_sealed_products')");
  changeCount += 2;
}

// Remplacer les clés du backup object
content = content.replace(
  /backup\.data\.sealed_products/g,
  'backup.data.user_sealed_products'
);
changeCount += 4; // metadata result keys + autres références

// Remplacer les clés dans results
content = content.replace(
  /results\.sealed_products/g,
  'results.user_sealed_products'
);
changeCount += 2;

console.log(`✅ ${changeCount} remplacements effectués`);

// Écrire le fichier modifié
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Corrections appliquées avec succès!');
console.log('🎯 Le backup utilisera maintenant la table user_sealed_products');
