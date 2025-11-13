const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'DatabaseBackupService.js');

console.log('🔧 Suppression de discovered_sets (table inexistante)...\n');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// 1. Supprimer le bloc de backup (lignes ~116-125)
const backupBlock = `      // 9. Extensions découvertes
      console.log('📥 Backup discovered_sets...')
      const { data: sets, error: setsError } = await supabase
        .from('discovered_sets')
        .select('*')

      if (setsError) throw setsError
      backup.data.discovered_sets = sets
      console.log(\`✅ \${sets?.length || 0} extensions découvertes\`)

`;

if (content.includes(backupBlock)) {
  content = content.replace(backupBlock, '');
  console.log('✅ Bloc de backup supprimé');
}

// 2. Supprimer de results (ligne ~191)
content = content.replace(
  /        discovered_sets: 0,\n/,
  ''
);
console.log('✅ Clé results.discovered_sets supprimée');

// 3. Supprimer le bloc de restore (lignes ~386-401)
const restoreBlock = `      // 9. Restaurer discovered_sets
      if (backup.data.discovered_sets?.length > 0) {
        console.log(\`📥 Restauration de \${backup.data.discovered_sets.length} extensions...\`)
        try {
          const { error } = await supabase
            .from('discovered_sets')
            .upsert(backup.data.discovered_sets, { onConflict: 'id' })

          if (error) throw error
          results.discovered_sets = backup.data.discovered_sets.length
          console.log(\`✅ \${results.discovered_sets} extensions restaurées\`)
        } catch (error) {
          console.error('❌ Erreur discovered_sets:', error)
          results.errors.push({ table: 'discovered_sets', error: error.message })
        }
      }
      progress++
      onProgress?.(Math.round((progress / totalSteps) * 100))

`;

if (content.includes(restoreBlock)) {
  content = content.replace(restoreBlock, '');
  console.log('✅ Bloc de restore supprimé');
}

// 4. Réduire totalSteps de 9 à 8
content = content.replace(
  'const totalSteps = 9',
  'const totalSteps = 8'
);
console.log('✅ totalSteps: 9 → 8');

// 5. Supprimer de getBackupStats
content = content.replace(
  /          discovered_sets: backup\.data\.discovered_sets\?\.length \|\| 0\n/,
  ''
);
console.log('✅ Clé stats.discovered_sets supprimée');

// 6. Nettoyer les commentaires de numérotation (8. → 7., etc si nécessaire)
// Pas nécessaire car c'était le dernier (9.)

// Écrire le fichier modifié
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Table discovered_sets complètement retirée!');
console.log('🎯 Le backup n\'utilisera plus que 8 tables existantes');
