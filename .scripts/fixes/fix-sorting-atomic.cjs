const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Collection.jsx');
const backupPath = filePath + '.backup';

console.log('📝 Lecture du fichier Collection.jsx...');
let content = fs.readFileSync(filePath, 'utf8');

// Créer une sauvegarde
fs.writeFileSync(backupPath, content);
console.log('💾 Sauvegarde créée');

console.log('🔧 Application de toutes les modifications...');

// 1. Ajouter l'état sortBy
content = content.replace(
  `  const [selectedCard, setSelectedCard] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const { collection, favorites, wishlist, toggleFavorite, toggleWishlist } = useCollection()`,
  `  const [selectedCard, setSelectedCard] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [sortBy, setSortBy] = useState('block') // 'date' | 'block' | 'value' | 'name'

  const { collection, favorites, wishlist, toggleFavorite, toggleWishlist } = useCollection()`
);

// 2. Ajouter la fonction sortCards
content = content.replace(
  `  // Convertir l'objet en tableau
  const uniqueCards = Object.values(groupedCards)

  const filteredCards = uniqueCards.filter(card => {`,
  `  // Convertir l'objet en tableau
  const uniqueCards = Object.values(groupedCards)

  // Fonction de tri hiérarchique
  const sortCards = (cards, sortType) => {
    return [...cards].sort((a, b) => {
      switch (sortType) {
        case 'block':
          // Tri par bloc → extension → numéro (du plus récent au plus ancien)
          const releaseDateA = new Date(a.set?.releaseDate || '1900-01-01')
          const releaseDateB = new Date(b.set?.releaseDate || '1900-01-01')
          if (releaseDateA.getTime() !== releaseDateB.getTime()) {
            return releaseDateB - releaseDateA
          }

          const seriesA = a.set?.series || a.series || ''
          const seriesB = b.set?.series || b.series || ''
          if (seriesA !== seriesB) return seriesB.localeCompare(seriesA)

          const setNameA = a.set?.name || a.extension || ''
          const setNameB = b.set?.name || b.extension || ''
          if (setNameA !== setNameB) return setNameB.localeCompare(setNameA)

          const numA = parseInt(a.number || '9999')
          const numB = parseInt(b.number || '9999')
          return numA - numB

        case 'value':
          const priceA = parseFloat(a.market_price || a.marketPrice || 0)
          const priceB = parseFloat(b.market_price || b.marketPrice || 0)
          return priceB - priceA

        case 'name':
          return a.name.localeCompare(b.name)

        case 'date':
        default:
          const dateA = new Date(a.date_added || a.dateAdded || 0)
          const dateB = new Date(b.date_added || b.dateAdded || 0)
          return dateB - dateA
      }
    })
  }

  const filteredCards = uniqueCards.filter(card => {`
);

// 3. Ajouter sortedCards
content = content.replace(
  `    return matchesSearch && matchesRarity && matchesCondition && matchesType
  })

  return (`,
  `    return matchesSearch && matchesRarity && matchesCondition && matchesType
  })

  // Appliquer le tri sélectionné
  const sortedCards = sortCards(filteredCards, sortBy)

  return (`
);

// 4. Remplacer le sélecteur UI
content = content.replace(
  `      {/* Sort Option */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border border-primary rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-sm"></div>
          </div>
          <span>Cartes triées par bloc et série (du plus récent au plus ancien)</span>
        </div>
      </div>`,
  `      {/* Sort Option */}
      <div className="flex justify-center items-center gap-4">
        <label className="text-sm text-muted-foreground">Trier par :</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[220px] golden-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="block">📚 Bloc → Extension → N°</SelectItem>
            <SelectItem value="date">📅 Date d'ajout (récent)</SelectItem>
            <SelectItem value="value">💰 Valeur (décroissant)</SelectItem>
            <SelectItem value="name">🔤 Nom (A → Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>`
);

console.log('💾 Écriture atomique...');
// Écrire le fichier modifié en une seule opération
fs.writeFileSync(filePath, content, 'utf8');

// Vérifier que les modifications ont été appliquées
const verification = fs.readFileSync(filePath, 'utf8');
if (verification.includes('const [sortBy') && verification.includes('const sortCards =') && verification.includes('const sortedCards =')) {
  console.log('✅ Toutes les modifications appliquées avec succès !');
  console.log('📚 Le tri est maintenant fonctionnel avec 4 options');
  // Supprimer la sauvegarde si succès
  fs.unlinkSync(backupPath);
} else {
  console.error('❌ Échec de la vérification - restauration depuis la sauvegarde');
  fs.writeFileSync(filePath, fs.readFileSync(backupPath, 'utf8'));
  console.log('♻️ Fichier restauré. Réessayez après avoir arrêté Vite.');
}