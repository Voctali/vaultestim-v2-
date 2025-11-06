const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Collection.jsx');

console.log('📝 Lecture du fichier Collection.jsx...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('➕ Ajout du tri hiérarchique...');

// 1. Ajouter l'état sortBy après les autres états (ligne ~25)
const oldStates = `  const [selectedCard, setSelectedCard] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const { collection, favorites, wishlist, toggleFavorite, toggleWishlist } = useCollection()`;

const newStates = `  const [selectedCard, setSelectedCard] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [sortBy, setSortBy] = useState('block') // 'date' | 'block' | 'value' | 'name'

  const { collection, favorites, wishlist, toggleFavorite, toggleWishlist } = useCollection()`;

content = content.replace(oldStates, newStates);

// 2. Ajouter la fonction de tri avant filteredCards (après uniqueCards, ligne ~55)
const oldFilter = `  // Convertir l'objet en tableau
  const uniqueCards = Object.values(groupedCards)

  const filteredCards = uniqueCards.filter(card => {`;

const newFilter = `  // Convertir l'objet en tableau
  const uniqueCards = Object.values(groupedCards)

  // Fonction de tri hiérarchique
  const sortCards = (cards, sortType) => {
    return [...cards].sort((a, b) => {
      switch (sortType) {
        case 'block':
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

  const filteredCards = uniqueCards.filter(card => {`;

content = content.replace(oldFilter, newFilter);

// 3. Appliquer le tri après le filtrage (ligne ~96)
const oldReturn = `    const matchesType = filters.type === 'all' || card.type === filters.type
    return matchesSearch && matchesRarity && matchesCondition && matchesType
  })

  return (`;

const newReturn = `    const matchesType = filters.type === 'all' || card.type === filters.type
    return matchesSearch && matchesRarity && matchesCondition && matchesType
  })

  // Appliquer le tri sélectionné
  const sortedCards = sortCards(filteredCards, sortBy)

  return (`;

content = content.replace(oldReturn, newReturn);

// 4. Utiliser sortedCards au lieu de filteredCards dans le rendu (ligne ~202)
content = content.replace('filteredCards.length > 0', 'sortedCards.length > 0');
content = content.replace('filteredCards.map((card)', 'sortedCards.map((card)');

// 5. Ajouter le sélecteur de tri dans l'interface (après les filtres, ligne ~188)
const oldSortOption = `      {/* Sort Option */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border border-primary rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-sm"></div>
          </div>
          <span>Cartes triées par bloc et série (du plus récent au plus ancien)</span>
        </div>
      </div>`;

const newSortOption = `      {/* Sort Option */}
      <div className="flex justify-center items-center gap-4">
        <label className="text-sm text-muted-foreground">Trier par :</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px] golden-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="block">📚 Bloc → Extension → N°</SelectItem>
            <SelectItem value="date">📅 Date d'ajout</SelectItem>
            <SelectItem value="value">💰 Valeur (décroissant)</SelectItem>
            <SelectItem value="name">🔤 Nom (A → Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>`;

content = content.replace(oldSortOption, newSortOption);

console.log('💾 Écriture des modifications...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Tri hiérarchique ajouté avec succès !');
console.log('📚 Options de tri disponibles :');
console.log('   - Bloc → Extension → Numéro (par défaut)');
console.log('   - Date d\'ajout');
console.log('   - Valeur');
console.log('   - Nom alphabétique');
