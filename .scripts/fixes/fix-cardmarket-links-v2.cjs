const fs = require('fs');

const file = 'src/components/features/collection/CardMarketLinks.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Supprimer le doublon de cardMarketData
content = content.replace(
  /  const \[cardMarketData, setCardMarketData\] = useState\(null\) \/\/ Infos complètes de la carte CardMarket\n  const \[cardMarketData, setCardMarketData\] = useState\(null\) \/\/ Infos complètes de la carte CardMarket/,
  '  const [cardMarketData, setCardMarketData] = useState(null) // Infos complètes de la carte CardMarket'
);

// Fix 2: Ajouter le console.log manquant
content = content.replace(
  '              console.log()',
  '              console.log(`📦 Infos CardMarket chargées: ${cardData.name} (expansion: ${cardData.id_expansion})`)'
);

// Fix 3: Corriger la syntaxe de buildDirectUrl (ajouter la parenthèse fermante manquante)
content = content.replace(
  /cardMarketData\?\.id_expansion \/\/ NOUVEAU : passer idExpansion pour URL complète\n    isDirect = true/,
  `cardMarketData?.id_expansion // NOUVEAU : passer idExpansion pour URL complète
    )
    isDirect = true`
);

fs.writeFileSync(file, content, 'utf8');
console.log('✅ Fichier CardMarketLinks.jsx corrigé avec succès');
