const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'SetImportService.js');

console.log('⚡ Optimisation SetImportService avec cache et timeout...\n');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// 1. Ajouter le cache avant la classe
console.log('1️⃣ Ajout système de cache...');
content = content.replace(
  "const BASE_URL = '/api/pokemontcg/v2'\n\nclass SetImportService {",
  `const BASE_URL = '/api/pokemontcg/v2'

// Cache simple pour éviter de recharger les extensions à chaque fois
let cachedSets = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

class SetImportService {`
);

// 2. Remplacer la fonction getAllSets complète
console.log('2️⃣ Ajout cache + timeout dans getAllSets...');
const oldGetAllSets = `  static async getAllSets(options = {}) {
    try {
      console.log('📚 Récupération de la liste des extensions...')

      // Construire la query si des filtres sont fournis
      let query = ''
      if (options.series) {
        query = \`series:"\${options.series}"\`
      }
      if (options.legalStandardOnly) {
        query += (query ? ' ' : '') + 'legalities.standard:legal'
      }

      const queryParam = query ? \`?q=\${encodeURIComponent(query)}&pageSize=250\` : '?pageSize=250'
      const url = \`\${BASE_URL}/sets\${queryParam}\`

      console.log(\`📡 URL: \${url}\`)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(\`Erreur HTTP \${response.status}: \${response.statusText}\`)
      }

      const result = await response.json()
      const sets = result.data || []

      // Trier par date de sortie (plus récentes en premier)
      sets.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))

      console.log(\`✅ \${sets.length} extensions trouvées\`)
      return sets
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des extensions:', error)
      throw error
    }
  }`;

const newGetAllSets = `  static async getAllSets(options = {}) {
    try {
      // Vérifier le cache si pas de filtres
      if (!options.series && !options.legalStandardOnly) {
        if (cachedSets && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
          console.log(\`✨ Utilisation du cache (\${cachedSets.length} extensions)\`)
          return cachedSets
        }
      }

      console.log('📚 Récupération de la liste des extensions depuis l\\'API...')

      // Construire la query si des filtres sont fournis
      let query = ''
      if (options.series) {
        query = \`series:"\${options.series}"\`
      }
      if (options.legalStandardOnly) {
        query += (query ? ' ' : '') + 'legalities.standard:legal'
      }

      const queryParam = query ? \`?q=\${encodeURIComponent(query)}&pageSize=250\` : '?pageSize=250'
      const url = \`\${BASE_URL}/sets\${queryParam}\`

      console.log(\`📡 URL: \${url}\`)

      // Fetch avec timeout de 15 secondes
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      try {
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(\`Erreur HTTP \${response.status}: \${response.statusText}\`)
        }

        const result = await response.json()
        const sets = result.data || []

        // Trier par date de sortie (plus récentes en premier)
        sets.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))

        // Sauvegarder dans le cache si pas de filtres
        if (!options.series && !options.legalStandardOnly) {
          cachedSets = sets
          cacheTimestamp = Date.now()
          console.log(\`✅ \${sets.length} extensions trouvées et mises en cache\`)
        } else {
          console.log(\`✅ \${sets.length} extensions trouvées\`)
        }

        return sets
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout: L\\'API met trop de temps à répondre (>15s). Utilisez la recherche par ID si vous connaissez l\\'extension.')
        }
        throw fetchError
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des extensions:', error)
      throw error
    }
  }`;

content = content.replace(oldGetAllSets, newGetAllSets);

console.log('\n✅ Optimisations appliquées:');
console.log('  ✓ Cache en mémoire (5 minutes)');
console.log('  ✓ Timeout de 15 secondes avec AbortController');
console.log('  ✓ Message d\'erreur clair si timeout');
console.log('\n📊 Avantages:');
console.log('  • Chargement instantané après 1ère fois (5 min)');
console.log('  • Évite les timeouts répétés');
console.log('  • Message d\'aide si timeout');

// Écrire le fichier
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Fichier optimisé!');
