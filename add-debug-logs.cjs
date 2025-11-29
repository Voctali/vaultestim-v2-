const fs = require('fs');

const filePath = './src/hooks/useCardDatabase.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = `  console.log('🔗 Fusion des extensions Gallery avec leurs extensions parent...')

  const galleryExtensions = Object.keys(extensionGroups).filter(id => {
    // UNIQUEMENT les extensions Gallery : suffixe 'gg' (Galarian) ou 'tg' (Trainer)
    if (id.endsWith('gg')) {
      // Le parent est l'ID sans 'gg' (ex: swsh12pt5gg → swsh12pt5)
      const parentId = id.slice(0, -2)
      return extensionGroups[parentId] !== undefined
    }

    if (id.endsWith('tg')) {
      // Le parent est l'ID sans 'tg' (ex: swsh9tg → swsh9)
      const parentId = id.slice(0, -2)
      return extensionGroups[parentId] !== undefined
    }

    // NE PAS fusionner les extensions pt5 - ce sont des extensions indépendantes !
    return false
  })`;

const newCode = `  console.log('🔗 Fusion des extensions Gallery avec leurs extensions parent...')
  console.log(\`📊 Extensions disponibles AVANT fusion:\`, Object.keys(extensionGroups).filter(id => id.startsWith('swsh')).sort())

  const galleryExtensions = Object.keys(extensionGroups).filter(id => {
    // UNIQUEMENT les extensions Gallery : suffixe 'gg' (Galarian) ou 'tg' (Trainer)
    if (id.endsWith('gg')) {
      // Le parent est l'ID sans 'gg' (ex: swsh12pt5gg → swsh12pt5)
      const parentId = id.slice(0, -2)
      const found = extensionGroups[parentId] !== undefined
      console.log(\`🔍 GG: \${id} → parent: \${parentId} (\${found ? 'TROUVÉ ✅' : 'INTROUVABLE ❌'})\`)
      return found
    }

    if (id.endsWith('tg')) {
      // Le parent est l'ID sans 'tg' (ex: swsh9tg → swsh9)
      const parentId = id.slice(0, -2)
      const found = extensionGroups[parentId] !== undefined
      console.log(\`🔍 TG: \${id} → parent: \${parentId} (\${found ? 'TROUVÉ ✅' : 'INTROUVABLE ❌'})\`)
      return found
    }

    // NE PAS fusionner les extensions pt5 - ce sont des extensions indépendantes !
    return false
  })

  console.log(\`📋 \${galleryExtensions.length} extensions Gallery à fusionner:\`, galleryExtensions)`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Logs de debug ajoutés avec succès !');
console.log('📝 Rechargez la page "Explorer les séries" et regardez la console.');
