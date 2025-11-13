const fs = require('fs');
const path = require('path');

console.log('✨ Ajout des badges Holo Cosmos dans les vues...\n');

const modifications = [];

// 1. Collection.jsx - Ajouter import et badge
console.log('1️⃣ Collection.jsx - Ajout badge...');
const collectionPath = path.join(__dirname, 'src', 'pages', 'Collection.jsx');
let collectionContent = fs.readFileSync(collectionPath, 'utf8');

// Ajouter import CosmosHoloBadge
if (!collectionContent.includes('CosmosHoloBadge')) {
  collectionContent = collectionContent.replace(
    "import { CardDetailsModal } from '@/components/features/collection/CardDetailsModal'",
    `import { CardDetailsModal } from '@/components/features/collection/CardDetailsModal'
import { CosmosHoloBadge } from '@/components/features/collection/CosmosHoloBadge'`
  );
  console.log('   ✅ Import CosmosHoloBadge ajouté dans Collection.jsx');
  modifications.push('Collection.jsx: import CosmosHoloBadge');
} else {
  console.log('   ⚠️  Import déjà présent dans Collection.jsx');
}

// Ajouter badge après Badge rarity (ligne ~355-357)
const oldBadgeSection = `                        <div className="space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {card.rarity}
                          </Badge>
                          <p className="text-xs text-blue-500">{translateCondition(card.condition)}</p>
                        </div>`;

const newBadgeSection = `                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {card.rarity}
                            </Badge>
                            <CosmosHoloBadge card={card} isUserCopy />
                          </div>
                          <p className="text-xs text-blue-500">{translateCondition(card.condition)}</p>
                        </div>`;

if (!collectionContent.includes('CosmosHoloBadge card={card}')) {
  if (collectionContent.includes(oldBadgeSection)) {
    collectionContent = collectionContent.replace(oldBadgeSection, newBadgeSection);
    fs.writeFileSync(collectionPath, collectionContent, 'utf8');
    console.log('   ✅ Badge ajouté dans Collection.jsx');
    modifications.push('Collection.jsx: badge affiché');
  } else {
    console.log('   ⚠️  Pattern non trouvé, skip');
  }
} else {
  console.log('   ⚠️  Badge déjà présent dans Collection.jsx');
}

// 2. Explore.jsx - Ajouter import et badge
console.log('\n2️⃣ Explore.jsx - Ajout badge...');
const explorePath = path.join(__dirname, 'src', 'pages', 'Explore.jsx');
let exploreContent = fs.readFileSync(explorePath, 'utf8');

// Ajouter import CosmosHoloBadge
if (!exploreContent.includes('CosmosHoloBadge')) {
  exploreContent = exploreContent.replace(
    "import { formatCardPrice } from '@/utils/priceFormatter'",
    `import { formatCardPrice } from '@/utils/priceFormatter'
import { CosmosHoloBadge } from '@/components/features/collection/CosmosHoloBadge'`
  );
  console.log('   ✅ Import CosmosHoloBadge ajouté dans Explore.jsx');
  modifications.push('Explore.jsx: import CosmosHoloBadge');
} else {
  console.log('   ⚠️  Import déjà présent dans Explore.jsx');
}

// Ajouter badge après les types Pokémon (ligne ~806-814)
const oldExploreSection = `                    {/* Rareté */}
                    {card.rarity ? (
                      <p className="text-xs text-muted-foreground truncate" title={card.rarity}>
                        {card.rarity}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/40 italic">
                        Rareté inconnue
                      </p>
                    )}`;

const newExploreSection = `                    {/* Rareté */}
                    {card.rarity ? (
                      <p className="text-xs text-muted-foreground truncate" title={card.rarity}>
                        {card.rarity}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/40 italic">
                        Rareté inconnue
                      </p>
                    )}

                    {/* Badge Holo Cosmos */}
                    <CosmosHoloBadge card={card} />`;

if (!exploreContent.includes('CosmosHoloBadge card={card}')) {
  if (exploreContent.includes(oldExploreSection)) {
    exploreContent = exploreContent.replace(oldExploreSection, newExploreSection);
    fs.writeFileSync(explorePath, exploreContent, 'utf8');
    console.log('   ✅ Badge ajouté dans Explore.jsx');
    modifications.push('Explore.jsx: badge affiché');
  } else {
    console.log('   ⚠️  Pattern non trouvé, skip');
  }
} else {
  console.log('   ⚠️  Badge déjà présent dans Explore.jsx');
}

console.log('\n✅ Modifications badges appliquées!');
console.log('\n📋 Modifications:');
modifications.forEach((mod, i) => console.log(`   ${i + 1}. ${mod}`));

console.log('\n🎯 Ce qui a été fait:');
console.log('   • Collection.jsx: Badge visible si version = "Holo Cosmos"');
console.log('   • Explore.jsx: Badge visible si has_cosmos_holo = true');
console.log('   • Badge violet/rose avec ✨ et animation pulse');

console.log('\n🧪 Prochaines étapes:');
console.log('   1. Tester build: npm run build');
console.log('   2. Marquer une carte en admin (Wooloo #135 sv9)');
console.log('   3. Vérifier badge dans Explore');
console.log('   4. Ajouter à collection avec version "Holo Cosmos"');
console.log('   5. Vérifier badge dans Collection');
console.log('   6. Déployer!');
