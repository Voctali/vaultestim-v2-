const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'DatabaseBackupService.js');

console.log('🔧 Correction des clés dans getBackupStats...');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Corriger les clés dans l'objet tables (lignes 440-441)
content = content.replace(
  '          sales: backup.data.user_sales?.length || 0,',
  '          user_sales: backup.data.user_sales?.length || 0,'
);
console.log('✅ Clé sales → user_sales');

content = content.replace(
  '          duplicate_lots: backup.data.duplicate_batches?.length || 0,',
  '          duplicate_batches: backup.data.duplicate_batches?.length || 0,'
);
console.log('✅ Clé duplicate_lots → duplicate_batches');

// Écrire le fichier modifié
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Stats corrigées avec succès!');
