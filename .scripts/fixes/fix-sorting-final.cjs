const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Collection.jsx');

console.log('📝 Lecture du fichier Collection.jsx...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Application des modifications manquantes...');

// 1. Ajouter l'état sortBy (ligne 28)
if (!content.includes('const [sortBy')) {
  content = content.replace(
    `  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const { collection, favorites, wishlist, toggleFavorite, toggleWishlist } = useCollection()`,
    `  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [sortBy, setSortBy] = useState('block') // 'date' | 'block' | 'value' | 'name'

  const { collection, favorites, wishlist, toggleFavorite, toggleWishlist } = useCollection()`
  );
  console.log('   ✓ État sortBy ajouté');
} else {
  console.log('   ⏭️ État sortBy existe déjà');
}

// 2. Ajouter la fonction sortCards avant filteredCards (après uniqueCards)
if (!content.includes('const sortCards =')) {
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
          return numA - numB

        case 'value':
          // Tri par valeur (plus cher en premier)
          const priceA = parseFloat(a.market_price || a.marketPrice || 0)
          const priceB = parseFloat(b.market_price || b.marketPrice || 0)
          return priceB - priceA

        case 'name':
          // Tri alphabétique par nom
          return a.name.localeCompare(b.name)

        case 'date':
        default:
          // Tri par date d'ajout (plus récent en premier)
          const dateA = new Date(a.date_added || a.dateAdded || 0)
          const dateB = new Date(b.date_added || b.dateAdded || 0)
          return dateB - dateA
      }
    })
  }

  const filteredCards = uniqueCards.filter(card => {`
  );
  console.log('   ✓ Fonction sortCards ajoutée');
} else {
  console.log('   ⏭️ Fonction sortCards existe déjà');
}

// 3. Ajouter la variable sortedCards après filteredCards
if (!content.includes('const sortedCards =')) {
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
  console.log('   ✓ Variable sortedCards ajoutée');
} else {
  console.log('   ⏭️ Variable sortedCards existe déjà');
}

// 4. Remplacer le texte statique par le sélecteur de tri
if (!content.includes('Trier par :')) {
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
  console.log('   ✓ Sélecteur de tri ajouté');
} else {
  console.log('   ⏭️ Sélecteur de tri existe déjà');
}

console.log('💾 Écriture des modifications...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Système de tri complet !');