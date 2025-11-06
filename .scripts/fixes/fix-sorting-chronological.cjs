const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Collection.jsx');

console.log('📝 Lecture du fichier Collection.jsx...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔄 Modification du tri pour ordre chronologique inversé...');

// Remplacer la logique de tri 'block' pour utiliser les dates
const oldBlockSort = `        case 'block':
          // Tri par bloc → extension → numéro (comme un classeur)
          // 1. Par série/bloc (Scarlet & Violet, Sword & Shield, etc.)
          const seriesA = a.set?.series || a.series || ''
          const seriesB = b.set?.series || b.series || ''
          if (seriesA !== seriesB) return seriesA.localeCompare(seriesB)

          // 2. Par nom d'extension
          const setNameA = a.set?.name || a.extension || ''
          const setNameB = b.set?.name || b.extension || ''
          if (setNameA !== setNameB) return setNameA.localeCompare(setNameB)

          // 3. Par numéro de carte
          const numA = parseInt(a.number || '9999')
          const numB = parseInt(b.number || '9999')
          return numA - numB`;

const newBlockSort = `        case 'block':
          // Tri par bloc → extension → numéro (du plus récent au plus ancien)
          // 1. Par date de sortie de l'extension (plus récent en premier)
          const releaseDateA = new Date(a.set?.releaseDate || '1900-01-01')
          const releaseDateB = new Date(b.set?.releaseDate || '1900-01-01')
          if (releaseDateA.getTime() !== releaseDateB.getTime()) {
            return releaseDateB - releaseDateA // Inversé : plus récent en premier
          }

          // 2. Par série/bloc si même date (fallback)
          const seriesA = a.set?.series || a.series || ''
          const seriesB = b.set?.series || b.series || ''
          if (seriesA !== seriesB) return seriesB.localeCompare(seriesA) // Inversé

          // 3. Par nom d'extension (fallback)
          const setNameA = a.set?.name || a.extension || ''
          const setNameB = b.set?.name || b.extension || ''
          if (setNameA !== setNameB) return setNameB.localeCompare(setNameA) // Inversé

          // 4. Par numéro de carte (croissant dans l'extension)
          const numA = parseInt(a.number || '9999')
          const numB = parseInt(b.number || '9999')
          return numA - numB`;

content = content.replace(oldBlockSort, newBlockSort);

console.log('💾 Écriture des modifications...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Tri chronologique inversé appliqué !');
console.log('📅 Ordre de tri : Plus récent → Plus ancien → Numéro croissant');
