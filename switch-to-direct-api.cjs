const fs = require('fs');
const path = require('path');

console.log('🔄 Passage à l\'appel direct API Pokemon TCG (sans proxy Vercel)...\n');

const files = [
  {
    path: path.join(__dirname, 'src', 'services', 'SetImportService.js'),
    name: 'SetImportService.js'
  },
  {
    path: path.join(__dirname, 'src', 'services', 'TCGdxService.js'),
    name: 'TCGdxService.js'
  }
];

files.forEach(file => {
  console.log(`📝 Modification de ${file.name}...`);

  let content = fs.readFileSync(file.path, 'utf8');

  // Remplacer BASE_URL
  const oldBaseUrl = "const BASE_URL = '/api/pokemontcg/v2'";
  const newBaseUrl = `// Appel direct à l'API Pokemon TCG (pas de proxy Vercel) pour éviter timeout 10s
const BASE_URL = 'https://api.pokemontcg.io/v2'
const API_KEY = import.meta.env.VITE_POKEMON_TCG_API_KEY || ''`;

  if (content.includes(oldBaseUrl)) {
    content = content.replace(oldBaseUrl, newBaseUrl);
    console.log(`  ✅ BASE_URL modifié`);
  } else {
    console.log(`  ⚠️ BASE_URL déjà modifié ou non trouvé`);
  }

  // Ajouter header X-Api-Key si API_KEY présent
  // Pour fetch() dans getAllSets
  content = content.replace(
    /const response = await fetch\(url, \{ signal: controller\.signal \}\)/g,
    `const headers = API_KEY ? { 'X-Api-Key': API_KEY } : {}
        const response = await fetch(url, { signal: controller.signal, headers })`
  );

  // Pour fetch() dans importSetCards et getSetInfo (sans signal)
  content = content.replace(
    /const response = await fetch\(url\)(?!\,)/g,
    `const headers = API_KEY ? { 'X-Api-Key': API_KEY } : {}
        const response = await fetch(url, { headers })`
  );

  // Pour makeRequestWithRetry dans TCGdxService (cas spécial)
  content = content.replace(
    /const response = await fetch\(fullUrl\)/g,
    `const headers = API_KEY ? { 'X-Api-Key': API_KEY } : {}
          const response = await fetch(fullUrl, { headers })`
  );

  console.log(`  ✅ Headers X-Api-Key ajoutés`);

  fs.writeFileSync(file.path, content, 'utf8');
  console.log(`  ✅ ${file.name} modifié\n`);
});

console.log('✅ Tous les fichiers ont été modifiés!');
console.log('\n📋 Résumé:');
console.log('  • BASE_URL: https://api.pokemontcg.io/v2 (appel direct)');
console.log('  • Headers: X-Api-Key ajouté si VITE_POKEMON_TCG_API_KEY défini');
console.log('  • Timeout Vercel: N/A (plus de proxy)');
console.log('\n🎯 Avantages:');
console.log('  • Plus de timeout 10s Vercel');
console.log('  • Réponse directe de l\'API Pokemon TCG');
console.log('  • Contrôle total sur les timeouts (15s configurables)');
