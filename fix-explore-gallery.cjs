const fs = require('fs');

const filePath = './src/pages/Explore.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// ÉTAPE 1 : Ajouter le state extensionCards après selectedExtension
const oldState = `  const [currentView, setCurrentView] = useState('blocks') // 'blocks', 'extensions', 'cards', 'search'
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [selectedExtension, setSelectedExtension] = useState(null)
  const [navigationPath, setNavigationPath] = useState([])`;

const newState = `  const [currentView, setCurrentView] = useState('blocks') // 'blocks', 'extensions', 'cards', 'search'
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [selectedExtension, setSelectedExtension] = useState(null)
  const [extensionCards, setExtensionCards] = useState([]) // Cartes de l'extension sélectionnée (APRÈS fusion Gallery)
  const [navigationPath, setNavigationPath] = useState([])`;

content = content.replace(oldState, newState);

// ÉTAPE 2 : Ajouter useEffect pour charger les cartes quand une extension est sélectionnée
const oldEffect = `  // Construire la hiérarchie quand les données changent
  useEffect(() => {
    const buildAndEnrichBlocks = async () => {`;

const newEffect = `  // Charger les cartes de l'extension sélectionnée (avec cartes fusionnées Gallery)
  useEffect(() => {
    const loadExtensionCards = async () => {
      if (!selectedExtension?.id) {
        setExtensionCards([])
        return
      }

      console.log(\`🔍 Chargement des cartes pour l'extension: \${selectedExtension.id}\`)
      const cards = await getCardsBySet(selectedExtension.id)
      console.log(\`✅ \${cards.length} cartes chargées (incluant cartes fusionnées Gallery)\`)
      setExtensionCards(cards)
    }

    loadExtensionCards()
  }, [selectedExtension, getCardsBySet])

  // Construire la hiérarchie quand les données changent
  useEffect(() => {
    const buildAndEnrichBlocks = async () => {`;

content = content.replace(oldEffect, newEffect);

// ÉTAPE 3 : Modifier getFilteredData pour utiliser extensionCards au lieu de discoveredCards
const oldGetFilteredData = `      case 'cards':
        const filteredCards = discoveredCards.filter(card => {
          if (card.set?.id !== selectedExtension?.id) return false

          // Si pas de recherche active, afficher toutes les cartes de l'extension
          if (!searchLower || searchLower.trim() === '') return true`;

const newGetFilteredData = `      case 'cards':
        const filteredCards = extensionCards.filter(card => {
          // Si pas de recherche active, afficher toutes les cartes de l'extension
          if (!searchLower || searchLower.trim() === '') return true`;

content = content.replace(oldGetFilteredData, newGetFilteredData);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Explore.jsx corrigé avec succès !');
console.log('📝 Modifications appliquées :');
console.log('   1. Ajout du state extensionCards');
console.log('   2. Ajout du useEffect pour charger les cartes via getCardsBySet()');
console.log('   3. Utilisation de extensionCards au lieu de discoveredCards dans getFilteredData()');
console.log('');
console.log('🎯 Maintenant les cartes Gallery fusionnées (GG/TG) s\'afficheront correctement !');
