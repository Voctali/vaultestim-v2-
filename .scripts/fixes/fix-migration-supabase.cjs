const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'hooks', 'useCardDatabase.jsx');

console.log('🔧 Fix migration Supabase - Ajout await pour garantir la sauvegarde');
console.log('📁 Fichier:', filePath);

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern à remplacer
  const oldPattern = `          // Sauvegarder dans Supabase
          SupabaseService.addDiscoveredCards(validResults)
            .then((addedCount) => {
              console.log(\`☁️ Supabase: \${addedCount} cartes avec attaques synchronisées\`)
            })
            .catch((error) => {
              console.warn('⚠️ Erreur sauvegarde attaques dans Supabase:', error)
            })`;
  
  const newPattern = `          // Sauvegarder dans Supabase (CRITIQUE: ajouter await pour garantir la sauvegarde)
          try {
            const addedCount = await SupabaseService.addDiscoveredCards(validResults)
            console.log(\`☁️ Supabase: \${addedCount} cartes avec attaques synchronisées\`)
          } catch (error) {
            console.warn('⚠️ Erreur sauvegarde attaques dans Supabase:', error)
          }`;
  
  if (content.includes(oldPattern)) {
    content = content.replace(oldPattern, newPattern);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fix appliqué avec succès !');
    console.log('📝 Changement : Ajout await avant SupabaseService.addDiscoveredCards()');
    console.log('💡 Impact : Les attaques seront maintenant sauvées dans Supabase de manière fiable');
  } else {
    console.log('ℹ️ Le code a peut-être déjà été modifié ou le pattern ne correspond pas');
    console.log('⚠️ Vérifiez manuellement les lignes 1839-1846');
  }
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
