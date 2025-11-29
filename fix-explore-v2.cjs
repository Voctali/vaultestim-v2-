const fs = require('fs');

const filePath = './src/pages/Explore.jsx';

// Attendre un peu pour que le serveur de dev se stabilise
setTimeout(() => {
  let content = fs.readFileSync(filePath, 'utf8');

  // ÉTAPE 1 : Ajouter le state extensionCards
  if (!content.includes('extensionCards')) {
    content = content.replace(
      /const \[selectedExtension, setSelectedExtension\] = useState\(null\)/,
      `const [selectedExtension, setSelectedExtension] = useState(null)
  const [extensionCards, setExtensionCards] = useState([]) // Cartes de l'extension sélectionnée (APRÈS fusion Gallery)`
    );
    console.log('✅ État extensionCards ajouté');
  } else {
    console.log('⏭️  État extensionCards déjà présent');
  }

  // ÉTAPE 2 : Ajouter useEffect pour charger les cartes
  if (!content.includes('Charger les cartes de l\'extension sélectionnée')) {
    const insertPoint = '  // Construire la hiérarchie quand les données changent';
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

  ${insertPoint}`;

    content = content.replace(insertPoint, newEffect);
    console.log('✅ useEffect de chargement ajouté');
  } else {
    console.log('⏭️  useEffect de chargement déjà présent');
  }

  // ÉTAPE 3 : Modifier getFilteredData pour utiliser extensionCards
  if (content.includes('discoveredCards.filter(card => {') &&
      content.includes('if (card.set?.id !== selectedExtension?.id) return false')) {
    content = content.replace(
      /case 'cards':\s+const filteredCards = discoveredCards\.filter\(card => \{\s+if \(card\.set\?\.id !== selectedExtension\?\.id\) return false\s+\/\/ Si pas de recherche active/,
      `case 'cards':
        const filteredCards = extensionCards.filter(card => {
          // Si pas de recherche active`
    );
    console.log('✅ Filtrage modifié pour utiliser extensionCards');
  } else {
    console.log('⏭️  Filtrage déjà modifié');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\n🎯 Explore.jsx corrigé avec succès !');
  console.log('📝 Rechargez la page et testez Crown Zenith');
}, 1000);
