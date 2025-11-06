const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'hooks', 'useCardDatabase.jsx');
console.log('📝 Application du fix await pour migration Supabase...');

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Trouver et remplacer les lignes 1839-1845
const targetLineIndex = 1838; // ligne 1839 (index 0-based)

// Vérifier qu'on est au bon endroit
if (lines[targetLineIndex].includes('SupabaseService.addDiscoveredCards')) {
  // Remplacer les 7 lignes par la nouvelle version
  const newLines = [
    '          // Sauvegarder dans Supabase (CRITIQUE: await ajouté pour garantir la sauvegarde)',
    '          try {',
    '            const addedCount = await SupabaseService.addDiscoveredCards(validResults)',
    '            console.log(`☁️ Supabase: ${addedCount} cartes avec attaques synchronisées`)',
    '          } catch (error) {',
    '            console.warn(\'⚠️ Erreur sauvegarde attaques dans Supabase:\', error)',
    '          }'
  ];

  // Supprimer les 7 anciennes lignes (1838-1845) et insérer les nouvelles
  lines.splice(1838, 7, ...newLines);

  // Sauvegarder
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

  console.log('✅ Fix appliqué avec succès !');
  console.log('📋 Modifications:');
  console.log('   - Ligne 1839: Suppression de .then() / .catch()');
  console.log('   - Ligne 1839: Ajout de await avant addDiscoveredCards()');
  console.log('   - Ligne 1839-1844: Structure try/catch synchrone');
  console.log('💡 Impact: Les attaques seront maintenant sauvées dans Supabase de manière fiable');
  console.log('🔄 Relancer la migration pour que les attaques soient enfin sauvées dans Supabase');
} else {
  console.log('❌ Ligne cible non trouvée');
  console.log('Ligne 1839:', lines[1838]);
}
