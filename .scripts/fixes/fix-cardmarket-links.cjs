const fs = require('fs');

const file = 'src/components/features/collection/CardMarketLinks.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Ajouter le state cardMarketData après cardMarketMatch
content = content.replace(
  'const [cardMarketMatch, setCardMarketMatch] = useState(null)',
  `const [cardMarketMatch, setCardMarketMatch] = useState(null)
  const [cardMarketData, setCardMarketData] = useState(null) // Infos complètes de la carte CardMarket`
);

// 2. Modifier le useEffect pour charger les infos complètes
content = content.replace(
  `        if (match) {
          setCardMarketMatch(match)
        }`,
  `        if (match) {
          setCardMarketMatch(match)

          // Charger les infos complètes de la carte CardMarket (idExpansion, name)
          if (match.cardmarket_id_product && !match.is_sealed_product) {
            const cardData = await CardMarketSupabaseService.getCardById(match.cardmarket_id_product)
            if (cardData) {
              setCardMarketData(cardData)
              console.log(\`📦 Infos CardMarket chargées: \${cardData.name} (expansion: \${cardData.id_expansion})\`)
            }
          }
        }`
);

// 3. Modifier l'appel à buildDirectUrl pour passer idExpansion
content = content.replace(
  `      'fr' // Langue française par défaut
    )`,
  `      'fr', // Langue française par défaut
      cardMarketData?.id_expansion // NOUVEAU : passer idExpansion pour URL complète
    )`
);

fs.writeFileSync(file, content, 'utf8');
console.log('✅ Fichier CardMarketLinks.jsx modifié avec succès');
