const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'SetImportService.js');

console.log('⚡ Optimisation du chargement des extensions...\n');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// 1. Ajouter un système de cache simple
console.log('1️⃣ Ajout cache en mémoire...');
const cacheCode = `
// Cache simple pour éviter de recharger les extensions à chaque fois
let cachedSets = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

`;

content = content.replace(
  'class SetImportService {',
  cacheCode + 'class SetImportService {'
);

// 2. Utiliser le cache dans getAllSets
console.log('2️⃣ Utilisation du cache...');
content = content.replace(
  `  static async getAllSets(options = {}) {
    try {
      console.log('📚 Récupération de la liste des extensions...')

      // Construire la query si des filtres sont fournis`,
  `  static async getAllSets(options = {}) {
    try {
      // Vérifier le cache si pas de filtres
      if (!options.series && !options.legalStandardOnly) {
        if (cachedSets && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
          console.log('✨ Utilisation du cache (${cachedSets.length} extensions)')
          return cachedSets
        }
      }

      console.log('📚 Récupération de la liste des extensions depuis l\\'API...')

      // Construire la query si des filtres sont fournis`
);

// 3. Sauvegarder dans le cache après récupération
console.log('3️⃣ Sauvegarde dans le cache...');
content = content.replace(
  `      // Trier par date de sortie (plus récentes en premier)
      sets.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))

      console.log(\`✅ \${sets.length} extensions trouvées\`)
      return sets`,
  `      // Trier par date de sortie (plus récentes en premier)
      sets.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))

      // Sauvegarder dans le cache si pas de filtres
      if (!options.series && !options.legalStandardOnly) {
        cachedSets = sets
        cacheTimestamp = Date.now()
        console.log(\`✅ \${sets.length} extensions trouvées et mises en cache\`)
      } else {
        console.log(\`✅ \${sets.length} extensions trouvées\`)
      }

      return sets`
);

// 4. Ajouter un timeout plus court avec retry
console.log('4️⃣ Ajout timeout et retry...');
content = content.replace(
  `      console.log(\`📡 URL: \${url}\`)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(\`Erreur HTTP \${response.status}: \${response.statusText}\`)
      }`,
  `      console.log(\`📡 URL: \${url}\`)

      // Fetch avec timeout de 10 secondes
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      try {
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(\`Erreur HTTP \${response.status}: \${response.statusText}\`)
        }`
);

// Fermer le try
content = content.replace(
  `      console.log(\`✅ \${sets.length} extensions trouvées et mises en cache\`)
      } else {
        console.log(\`✅ \${sets.length} extensions trouvées\`)
      }

      return sets
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des extensions:', error)
      throw error
    }`,
  `      console.log(\`✅ \${sets.length} extensions trouvées et mises en cache\`)
      } else {
        console.log(\`✅ \${sets.length} extensions trouvées\`)
      }

      return sets
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout: L\\'API met trop de temps à répondre. Réessayez dans quelques secondes.')
        }
        throw fetchError
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des extensions:', error)
      throw error
    }
`
);

console.log('\n✅ Optimisations appliquées:');
console.log('  ✓ Cache en mémoire (5 minutes)');
console.log('  ✓ Timeout de 10 secondes');
console.log('  ✓ Message d\'erreur plus clair');
console.log('\n📊 Avantages:');
console.log('  • Chargement instantané après 1ère fois');
console.log('  • Évite les timeouts répétés');
console.log('  • Meilleure expérience utilisateur');

// Écrire le fichier modifié
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Fichier optimisé!');
