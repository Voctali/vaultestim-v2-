const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'DatabaseBackupService.js');

console.log('🔧 Correction de tous les noms de tables incorrects...\n');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Corrections à effectuer
const corrections = [
  {
    old: 'sales',
    new: 'user_sales',
    description: 'Table des ventes'
  },
  {
    old: 'duplicate_lots',
    new: 'duplicate_batches',
    description: 'Table des lots de doublons'
  }
];

corrections.forEach(correction => {
  console.log(`📝 ${correction.description}: ${correction.old} → ${correction.new}`);

  // Remplacer .from('xxx')
  const fromRegex = new RegExp(`\\.from\\('${correction.old}'\\)`, 'g');
  content = content.replace(fromRegex, `.from('${correction.new}')`);
  console.log(`  ✅ .from() corrigé`);

  // Remplacer backup.data.xxx
  const backupDataRegex = new RegExp(`backup\\.data\\.${correction.old}`, 'g');
  content = content.replace(backupDataRegex, `backup.data.${correction.new}`);
  console.log(`  ✅ backup.data.xxx corrigé`);

  // Remplacer results.xxx
  const resultsRegex = new RegExp(`results\\.${correction.old}`, 'g');
  content = content.replace(resultsRegex, `results.${correction.new}`);
  console.log(`  ✅ results.xxx corrigé`);

  // Remplacer les clés dans objects (xxx: 0,)
  const keyRegex = new RegExp(`        ${correction.old}: 0,`, 'g');
  content = content.replace(keyRegex, `        ${correction.new}: 0,`);
  console.log(`  ✅ Clé d'objet corrigée`);

  // Remplacer dans les console.log
  const logRegex = new RegExp(`'📥 Backup ${correction.old}...'`, 'g');
  content = content.replace(logRegex, `'📥 Backup ${correction.new}...'`);

  const restoreLogRegex = new RegExp(`backup\\.data\\.${correction.old}\\.length`, 'g');
  // Déjà couvert par backup.data ci-dessus

  // Remplacer dans les messages d'erreur
  const errorRegex = new RegExp(`'❌ Erreur ${correction.old}:'`, 'g');
  content = content.replace(errorRegex, `'❌ Erreur ${correction.new}:'`);

  const errorTableRegex = new RegExp(`table: '${correction.old}'`, 'g');
  content = content.replace(errorTableRegex, `table: '${correction.new}'`);
  console.log(`  ✅ Messages d'erreur corrigés`);

  console.log('');
});

// Écrire le fichier modifié
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Toutes les corrections appliquées avec succès!');
console.log('🎯 Tables corrigées:');
console.log('   - sales → user_sales');
console.log('   - duplicate_lots → duplicate_batches');
